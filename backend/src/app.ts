import Fastify from "fastify";
import { config } from "./config.js";
import { assetsRoutes } from "./routes/assets.js";
import { AssetClassifier } from "./lib/assetClassifier.js";

export const buildApp = () => {
  const app = Fastify({
    logger: true,
    bodyLimit: 1_000_000
  });

  const classifier = new AssetClassifier(config.anthropicApiKey);

  app.register(assetsRoutes, { classifier });

  app.get("/health", async () => ({ ok: true }));

  return app;
};
