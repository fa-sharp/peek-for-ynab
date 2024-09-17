/* eslint-disable no-undef */
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
  redirects: async () => [
    {
      source: '/:path*',
      has: [{ type: 'host', value: `www.${process.env.WEBSITE_DOMAIN || "peekforynab.com"}` }],
      destination: `https://${process.env.WEBSITE_DOMAIN || "peekforynab.com"}/:path*`,
      permanent: true
    }
  ]
};

export default config;