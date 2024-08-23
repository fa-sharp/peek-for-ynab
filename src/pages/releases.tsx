import Head from "next/head";
import Image from "next/image";

import WebLayout from "~components/website/WebLayout";

function IndexPage() {
  return (
    <WebLayout>
      <Head>
        <title>Peek for YNAB - Release Notes</title>
      </Head>
      <h1>Peek for YNAB</h1>
      <h2>Release Notes</h2>
      <h3>0.20.0 - Aug 23, 2024</h3>
      <ul>
        <li>
          Setup customizable notifications and alerts in your settings! See the cool GIF
          below.
        </li>
        <li>
          Choose a default account, or remember the last account used for transactions.
        </li>
        <li>
          The OAuth token now refreshes in the background, which should improve loading
          times.
        </li>
        <li>Website migrated from Vercel to Fly.io</li>
      </ul>
      <h3>0.19.1 - Apr 12, 2024</h3>
      <ul>
        <li>Split transaction support!</li>
        <li>Open extension in a separate popup window</li>
        <li>Small bugfixes</li>
      </ul>
    </WebLayout>
  );
}

export default IndexPage;
