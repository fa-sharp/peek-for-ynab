//@ts-check

/** @type {import("next").NextConfig} */
const config = {
  output: "standalone",
  experimental: {
    serverComponentsExternalPackages: ["pino"]
  },
  redirects: async () => [
    {
      source: "/:path*",
      has: [
        { type: "host", value: `www.${process.env.WEBSITE_DOMAIN || "peekforynab.com"}` }
      ],
      destination: `https://${process.env.WEBSITE_DOMAIN || "peekforynab.com"}/:path*`,
      permanent: true
    }
  ]
};

export default config;
