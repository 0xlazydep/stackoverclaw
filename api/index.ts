import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createApp } from "../server/app";

const appPromise = createApp({ serverless: true }).then(({ app }) => app);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await appPromise;
  return app(req, res);
}
