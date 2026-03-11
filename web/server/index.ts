import { createServer } from "./server.ts";

// Start the server
const app = await createServer();
await app.listen({ host: process.env.HOST, port: +(process.env.PORT || 4321) });
