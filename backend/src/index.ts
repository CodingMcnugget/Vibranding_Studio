import { buildApp } from "./app.js";
import { config } from "./config.js";

const app = buildApp();

try {
  await app.listen({ port: config.port, host: "0.0.0.0" });
  app.log.info(`Backend listening on http://localhost:${config.port}`);
} catch (err) {
  app.log.error({ err }, "Failed to start server");
  process.exit(1);
}
