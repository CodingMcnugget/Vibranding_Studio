import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { extractBrandAssets, type BrandAssets, type ExtractionSession } from "../lib/stagehandExtractor.js";
import { AssetClassifier, type ClassifiedAssets } from "../lib/assetClassifier.js";

const BrandingBodySchema = z.object({
  product: z.string().min(1, "Product description is required"),
  urls: z.array(z.string().url()).min(1, "At least one URL is required"),
  classify: z.boolean().optional().default(true),
  maxClassifyImages: z.number().int().positive().optional().default(10)
});

interface RouteOptions {
  classifier: AssetClassifier;
}

export interface BrandingResult {
  url: string;
  success: boolean;
  session?: ExtractionSession;
  data?: ClassifiedAssets | BrandAssets;
  error?: string;
}

export interface BrandingResponse {
  ok: boolean;
  product: string;
  results: BrandingResult[];
  summary?: {
    total_urls: number;
    successful: number;
    failed: number;
  };
}

export const brandingRoutes: FastifyPluginAsync<RouteOptions> = async (app, options) => {
  // Regular POST endpoint
  app.post("/branding", async (request, reply) => {
    const parseResult = BrandingBodySchema.safeParse(request.body);
    
    if (!parseResult.success) {
      return reply.code(400).send({
        ok: false,
        error: "Validation failed",
        details: parseResult.error.flatten()
      });
    }

    const { product, urls, classify, maxClassifyImages } = parseResult.data;

    request.log.info({ product, urlCount: urls.length }, "Starting branding extraction");

    const results: BrandingResult[] = [];

    // Process each URL
    for (const url of urls) {
      try {
        request.log.info({ url }, "Extracting brand assets");
        
        // Step 1: Extract brand assets using Stagehand
        const { session, assets } = await extractBrandAssets(url);

        // Step 2: If classify is enabled, use Claude to classify images
        if (classify && assets.images && assets.images.length > 0) {
          request.log.info(
            { url, imageCount: assets.images.length },
            "Classifying images with Claude"
          );

          const imageUrls = assets.images
            .filter(img => img.url)
            .map(img => ({
              url: img.url,
              alt: img.alt,
              width: null,
              height: null
            }));

          const classified = await options.classifier.classifyAssets(imageUrls, {
            maxImages: maxClassifyImages
          });

          results.push({
            url,
            success: true,
            session,
            data: {
              ...classified,
              // Include extracted metadata
              page_title: assets.page_title,
              meta_description: assets.meta_description,
              brand_mood: assets.brand_mood,
              social_links: assets.social_links,
              contact_info: assets.contact_info
            } as ClassifiedAssets & Partial<BrandAssets>
          });
        } else {
          // Return without image classification
          results.push({
            url,
            success: true,
            session,
            data: assets
          });
        }
      } catch (err) {
        request.log.error({ url, err }, "Failed to extract assets from URL");
        results.push({
          url,
          success: false,
          error: err instanceof Error ? err.message : "Unknown error"
        });
      }
    }

    const successful = results.filter(r => r.success).length;

    return reply.send({
      ok: successful > 0,
      product,
      results,
      summary: {
        total_urls: urls.length,
        successful,
        failed: urls.length - successful
      }
    } satisfies BrandingResponse);
  });

  // Server-Sent Events endpoint for live preview
  app.post("/branding/stream", async (request, reply) => {
    const parseResult = BrandingBodySchema.safeParse(request.body);
    
    if (!parseResult.success) {
      return reply.code(400).send({
        ok: false,
        error: "Validation failed",
        details: parseResult.error.flatten()
      });
    }

    const { product, urls, classify, maxClassifyImages } = parseResult.data;

    // Set up SSE headers
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });

    const sendEvent = (event: string, data: unknown) => {
      reply.raw.write(`event: ${event}\n`);
      reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    request.log.info({ product, urlCount: urls.length }, "Starting streaming branding extraction");

    sendEvent("start", { product, totalUrls: urls.length });

    const results: BrandingResult[] = [];

    // Process each URL
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      
      try {
        sendEvent("url_start", { url, index: i, total: urls.length });
        
        // Extract with session callback for live preview
        const { session, assets } = await extractBrandAssets(url, (sessionInfo) => {
          // Send session info as soon as it's available
          sendEvent("session_ready", { 
            url, 
            index: i,
            session: sessionInfo 
          });
        });

        sendEvent("extraction_complete", { url, index: i });

        // Step 2: If classify is enabled, use Claude to classify images
        if (classify && assets.images && assets.images.length > 0) {
          sendEvent("classifying", { url, index: i, imageCount: assets.images.length });

          const imageUrls = assets.images
            .filter(img => img.url)
            .map(img => ({
              url: img.url,
              alt: img.alt,
              width: null,
              height: null
            }));

          const classified = await options.classifier.classifyAssets(imageUrls, {
            maxImages: maxClassifyImages
          });

          results.push({
            url,
            success: true,
            session,
            data: {
              ...classified,
              page_title: assets.page_title,
              meta_description: assets.meta_description,
              brand_mood: assets.brand_mood,
              social_links: assets.social_links,
              contact_info: assets.contact_info
            } as ClassifiedAssets & Partial<BrandAssets>
          });
        } else {
          results.push({
            url,
            success: true,
            session,
            data: assets
          });
        }

        sendEvent("url_complete", { url, index: i, success: true });
      } catch (err) {
        request.log.error({ url, err }, "Failed to extract assets from URL");
        results.push({
          url,
          success: false,
          error: err instanceof Error ? err.message : "Unknown error"
        });
        sendEvent("url_complete", { 
          url, 
          index: i, 
          success: false, 
          error: err instanceof Error ? err.message : "Unknown error" 
        });
      }
    }

    const successful = results.filter(r => r.success).length;

    // Send final result
    sendEvent("complete", {
      ok: successful > 0,
      product,
      results,
      summary: {
        total_urls: urls.length,
        successful,
        failed: urls.length - successful
      }
    });

    reply.raw.end();
  });
};
