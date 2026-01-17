import { buildApp } from "./app.js";
import { config } from "./config.js";

const app = await buildApp();

try {
  await app.listen({ port: config.port, host: "0.0.0.0" });
  app.log.info(`Backend listening on http://localhost:${config.port}`);
} catch (err) {
  app.log.error({ err }, "Failed to start server");
  process.exit(1);
}

// Handle Vite HMR (Hot Module Replacement) - only in development
if ((import.meta as any).hot) {
  (import.meta as any).hot.on("vite:beforeFullReload", async () => {
    app.log.info("Closing server before HMR reload...");
    await app.close();
  });

  (import.meta as any).hot.dispose(async () => {
    app.log.info("Closing server on HMR dispose...");
    await app.close();
  });
}
