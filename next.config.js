//@ts-check

/** @type {import("next").NextConfig} */
const config = {
  output: "standalone",
  experimental: {
    serverComponentsExternalPackages: ["pino"]
  },
  headers: async () => {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            // eslint-disable-next-line no-undef
            value: process.env.EXTENSION_ORIGIN || "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
};

export default config;