import { Head, Html, Main, NextScript } from "next/document";
import Script from "next/script";

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <Script src="scripts/theme.js" strategy="beforeInteractive"></Script>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
