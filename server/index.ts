import { createApp, log } from "./app";

(async () => {
  const { httpServer } = await createApp();
  const port = parseInt(process.env.PORT || "5000", 10);
  const host =
    process.env.HOST ||
    (process.env.REPL_ID || process.env.REPLIT_DEV_DOMAIN ? "0.0.0.0" : "127.0.0.1");

  httpServer.listen(
    {
      port,
      host,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
