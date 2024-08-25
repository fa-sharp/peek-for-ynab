import Head from "next/head";
import Image from "next/image";
import Link from "next/link";

import WebLayout from "~components/website/WebLayout";

function IndexPage() {
  return (
    <WebLayout>
      <Head>
        <title>Peek for YNAB - Release Notes</title>
      </Head>
      <h1>Peek for YNAB</h1>
      <h2>Release Notes</h2>
      <h3>0.20.0 - Aug 24, 2024</h3>
      <ul>
        <li>
          Setup customizable notifications and alerts in your settings! See the cool GIF
          below. Alerts will show up at the top of the extension popup window, as well as
          when you hover over the extension icon (inspired by other extensions like the
          awesome{" "}
          <a href="https://jasonsavard.com/Checker-Plus-for-Google-Calendar">
            Checker Plus
          </a>
          ). You can also optionally enable system notifications (currently an
          experimental feature).
        </li>
        <li>
          Choose a default account, or remember the last account used for transactions.
        </li>
        <li>
          The OAuth token now refreshes in the background, which should improve loading
          times.
        </li>
        <li>
          <Link href="/privacy">Privacy policy</Link> has been updated to clarify the role
          of the website/authentication server.
        </li>
      </ul>
      <Image
        src="/screenshots/notification-settings.gif"
        alt={"Demo of notification settings"}
        className="screenshot"
        width={220}
        height={240}
        unoptimized
      />
      <h3>0.19.1 - Apr 12, 2024</h3>
      <ul>
        <li>Split transaction support!</li>
        <li>New button to open extension in a separate popup window</li>
        <li>Small bugfixes</li>
      </ul>
    </WebLayout>
  );
}

export default IndexPage;