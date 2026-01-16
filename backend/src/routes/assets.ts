import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { extractBrandAssets, type BrandAssets } from "../lib/stagehandExtractor.js";
import { AssetClassifier } from "../lib/assetClassifier.js";

const AssetsBodySchema = z.object({
  url: z.string().url(),
  classify: z.boolean().optional().default(true),
  maxClassifyImages: z.number().int().positive().optional().default(10)
});

interface RouteOptions {
  classifier: AssetClassifier;
}

export const assetsRoutes: FastifyPluginAsync<RouteOptions> = async (app, options) => {
  app.post("/assets", async (request, reply) => {
    const { url, classify, maxClassifyImages } = AssetsBodySchema.parse(request.body);

    try {
      // Step 1: Extract brand assets using Stagehand
      request.log.info({ url }, "Starting brand asset extraction with Stagehand");
      
      const assets = await extractBrandAssets(url);

      // Step 2: If classify is enabled, use Claude to further classify images
      if (classify && assets.images && assets.images.length > 0) {
        request.log.info(
          { imageCount: assets.images.length },
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

        return reply.send({
          ok: true,
          data: {
            page_title: assets.page_title,
            meta_description: assets.meta_description,
            brand_mood: assets.brand_mood,
            
            // Organized brand assets
            brand_summary: classified.brand_summary,
            logo_usage: {
              extracted: assets.logos,
              classified: classified.logo_usage
            },
            color_palette: {
              extracted: assets.colors,
              classified: classified.color_palette
            },
            typography: {
              extracted: assets.typography,
              classified: classified.typography
            },
            components: {
              extracted: assets.components,
              classified: classified.components
            },
            landing_hero: {
              extracted: assets.hero,
              classified: classified.landing_hero
            },
            brand_assets: classified.brand_assets,
            
            // Additional info
            social_links: assets.social_links,
            contact_info: assets.contact_info,
            
            // All images with classification
            all_images: classified.all_images
          }
        });
      }

      // Return without image classification
      return reply.send({
        ok: true,
        data: {
          page_title: assets.page_title,
          meta_description: assets.meta_description,
          brand_mood: assets.brand_mood,
          logos: assets.logos,
          colors: assets.colors,
          typography: assets.typography,
          components: assets.components,
          hero: assets.hero,
          images: assets.images,
          social_links: assets.social_links,
          contact_info: assets.contact_info
        }
      });
    } catch (err) {
      request.log.error({ err }, "Asset extraction failed");
      return reply.code(500).send({
        ok: false,
        error: err instanceof Error ? err.message : "Unknown error"
      });
    }
  });
};
