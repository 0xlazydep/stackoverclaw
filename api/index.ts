import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { createApp } = require("../dist/server/app.cjs");

const appPromise = createApp({ serverless: true }).then(({ app }) => app);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await appPromise;
  return app(req, res);
}
