import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { Express } from "express";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
let createApp: (options?: { serverless?: boolean }) => Promise<{ app: Express }>;

try {
  ({ createApp } = require("../dist/server/app.cjs") as {
    createApp: (options?: { serverless?: boolean }) => Promise<{ app: Express }>;
  });
} catch {
  ({ createApp } = require("../server/app") as {
    createApp: (options?: { serverless?: boolean }) => Promise<{ app: Express }>;
  });
}

const appPromise = createApp({ serverless: true }).then((result) => result.app);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await appPromise;
  return app(req, res);
}
