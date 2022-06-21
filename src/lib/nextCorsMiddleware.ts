import Cors from "cors";
import type { NextApiRequest, NextApiResponse } from "next";

const { CHROME_EXTENSION_ID } = process.env;

const cors = Cors({
  methods: ["GET", "HEAD"],
  origin: [`chrome-extension://${CHROME_EXTENSION_ID}`]
});

// Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware
export default function initCorsMiddleware() {
  return (req: NextApiRequest, res: NextApiResponse) =>
    new Promise((resolve, reject) => {
      cors(req, res, (result) => {
        if (result instanceof Error) {
          return reject(result);
        }
        return resolve(result);
      });
    });
}
