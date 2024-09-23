import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Release Notes | Peek for YNAB"
};

function IndexPage() {
  return (
    <>
      <h1>Peek for YNAB</h1>
      <h2>Release Notes</h2>
      <h3>0.21.0 - Sep 24, 2024</h3>
      <ul>
        <li>
          New navigation menu at the top of the extension popup, with quick links to add a
          transaction, edit pinned items, and more. Menu is keyboard navigable thanks to
          the awesome open-source{" "}
          <a href="https://react-spectrum.adobe.com/react-aria/index.html">React Aria</a>{" "}
          library 🙏. See demo below.
        </li>
        <li>
          New button to copy the current website title into the memo field of a
          transaction (button only appears if you give permission to access the current
          tab in the settings 😉)
        </li>
        <li>
          Now using YNAB&apos;s{" "}
          <a href="https://api.ynab.com/#deltas" target="_blank" rel="noreferrer">
            delta requests
          </a>{" "}
          under the hood, for fast and efficient data fetching
        </li>
      </ul>
      <Image
        src="/img/screenshots/nav-menu.gif"
        alt="Demo of navigation menu"
        className="screenshot"
        width={301}
        height={207}
        unoptimized
      />
      <h3>0.20.1 - Sep 20, 2024</h3>
      <ul>
        <li>The current budget settings are expanded when opening the settings page</li>
        <li>Small performance and accessibility improvements</li>
      </ul>
      <h3>0.20.0 - Sep 17, 2024</h3>
      <ul>
        <li>
          Setup customizable notifications and alerts in your settings! Alerts will show
          up at the top of the extension popup window, as well as when you hover over the
          extension icon (inspired by other extensions like the awesome{" "}
          <a
            href="https://jasonsavard.com/Checker-Plus-for-Google-Calendar"
            target="_blank"
            rel="noreferrer">
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
        src="/img/screenshots/notification-settings.gif"
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
    </>
  );
}

export default IndexPage;
