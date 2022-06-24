import Cors from "cors";
import type { NextApiRequest, NextApiResponse } from "next";

const cors = Cors({
  methods: ["GET", "POST", "HEAD"],
  origin: [`chrome-extension://${process.env.NEXT_PUBLIC_EXTENSION_ID}`]
});

/** Adds CORS headers to Next.js API routes */
export const corsMiddleware = (req: NextApiRequest, res: NextApiResponse) =>
  new Promise((resolve, reject) => {
    cors(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
