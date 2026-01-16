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

// Handle Vite HMR (Hot Module Replacement)
if (import.meta.hot) {
  import.meta.hot.on("vite:beforeFullReload", async () => {
    app.log.info("Closing server before HMR reload...");
    await app.close();
  });

  import.meta.hot.dispose(async () => {
    app.log.info("Closing server on HMR dispose...");
    await app.close();
  });
}
