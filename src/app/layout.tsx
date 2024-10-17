import type { Metadata } from "next";
import Script from "next/script";
import "src/styles/global.css";
import "src/styles/main.scss";
import "src/styles/web.css";

import WebLayout from "~components/website/WebLayout";

export const metadata: Metadata = {
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/img/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/img/favicon-32x32.png", sizes: "32x32", type: "image/png" }
    ],
    apple: {
      url: "/img/apple-touch-icon.png",
      sizes: "180x180"
    }
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Script src="scripts/theme.js" strategy="beforeInteractive"></Script>
        <WebLayout>{children}</WebLayout>
      </body>
    </html>
  );
}
