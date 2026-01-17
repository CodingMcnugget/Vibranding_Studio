import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "./config.js";
import { assetsRoutes } from "./routes/assets.js";
import { brandingRoutes } from "./routes/branding.js";
import { slidesRoutes } from "./routes/slides.js";
import { AssetClassifier } from "./lib/assetClassifier.js";

export const buildApp = async () => {
  const app = Fastify({
    logger: true,
    bodyLimit: 1_000_000
  });

  // 注册 CORS 支持前后端分离部署
  await app.register(cors, {
    origin: [
      /\.vercel\.app$/,  // 允许所有 Vercel 域名
      /\.elasticbeanstalk\.com$/,  // 允许 AWS EB 域名
      'http://localhost:3000',  // 本地开发 - 前端
      'http://localhost:3001'   // 本地开发 - 后端
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  });

  const classifier = new AssetClassifier(config.anthropicApiKey);

  app.register(assetsRoutes, { classifier });
  app.register(brandingRoutes, { classifier });
  app.register(slidesRoutes);

  app.get("/health", async () => ({ ok: true }));

  return app;
};
