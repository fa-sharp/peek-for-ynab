import type { AppProps } from "next/app";
import "src/styles/global.css";
import "src/styles/web.css";

export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
