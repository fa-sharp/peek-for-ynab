import type { AppProps } from "next/app";
import "src/global.css";
import "src/web.css";

export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
