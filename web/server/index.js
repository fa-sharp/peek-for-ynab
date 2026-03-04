//@ts-check
import { createServer } from "./server.js";

// Start the server
const app = createServer();
await app.listen({ host: process.env.HOST, port: +(process.env.PORT || 4321) });
