import pino, { type Logger } from "pino";

export const logger: Logger =
  process.env["NODE_ENV"] === "production"
    ? pino({ level: "info" })
    : pino({
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true
          }
        },
        level: "debug"
      });
