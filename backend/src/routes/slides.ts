import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { ClaudeClient, type GeneratedSlides } from "../lib/claudeClient.js";
import { config } from "../config.js";

const SlidesBodySchema = z.object({
  product: z.string().min(1, "Product description is required"),
  brandData: z.record(z.unknown()),
  sourceUrls: z.array(z.string()).default([])
});

export interface SlidesResponse {
  ok: boolean;
  slides?: GeneratedSlides;
  error?: string;
}

export const slidesRoutes: FastifyPluginAsync = async (app) => {
  const claudeClient = new ClaudeClient(config.anthropicApiKey);

  app.post("/generate-slides", async (request, reply) => {
    const parseResult = SlidesBodySchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.code(400).send({
        ok: false,
        error: "Validation failed",
        details: parseResult.error.flatten()
      });
    }

    const { product, brandData, sourceUrls } = parseResult.data;

    request.log.info({ product, sourceUrls }, "Generating personalized slides with Claude");

    try {
      const slides = await claudeClient.generateSlides(product, brandData, sourceUrls);

      return reply.send({
        ok: true,
        slides
      } satisfies SlidesResponse);
    } catch (err) {
      request.log.error({ err }, "Slide generation failed");
      return reply.code(500).send({
        ok: false,
        error: err instanceof Error ? err.message : "Slide generation failed"
      } satisfies SlidesResponse);
    }
  });
};
