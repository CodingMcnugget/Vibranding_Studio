import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "./config.js";
import { assetsRoutes } from "./routes/assets.js";
import { brandingRoutes } from "./routes/branding.js";
import { slidesRoutes } from "./routes/slides.js";
import { AssetClassifier } from "./lib/assetClassifier.js";

export const buildApp = () => {
  const app = Fastify({
    logger: true,
    bodyLimit: 1_000_000
  });

  // Enable CORS for frontend
  app.register(cors, {
    origin: true, // Allow all origins in dev, configure for production
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  });

  const classifier = new AssetClassifier(config.anthropicApiKey);

  app.register(assetsRoutes, { classifier });
  app.register(brandingRoutes, { classifier });
  app.register(slidesRoutes);

  app.get("/health", async () => ({ ok: true }));

  return app;
};
