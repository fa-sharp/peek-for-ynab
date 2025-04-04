import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Release Notes | Peek for YNAB"
};

function IndexPage() {
  return (
    <>
      <h2>Release Notes</h2>
      <h3>0.23.0 - Mar 7, 2025</h3>
      <ul>
        <li>
          Detail views of categories and accounts, to see additional balances and recent
          transactions
        </li>
        <li>
          Ability to quickly move money between categories and to/from Ready To Assign
          (due to YNAB API limitations, these moves will <b>not</b> appear in Recent Moves
          in YNAB)
        </li>
        <li>Security updates</li>
      </ul>
      <h3>0.22.1 - Oct 15, 2024</h3>
      Minor fixes and security updates
      <h3>0.22.0 - Oct 9, 2024</h3>
      <ul>
        <li>
          🔎 A new search bar to quickly filter your categories and accounts (inspired by{" "}
          <a
            href="https://github.com/toolkit-for-ynab/toolkit-for-ynab"
            target="_blank"
            rel="noreferrer">
            Toolkit for YNAB
          </a>
          ). You can also enter transactions directly from the search bar by typing{" "}
          <code>add</code> or <code>transfer</code>.
        </li>
        <li>
          🎉 Optionally enable confetti celebrations after adding a transaction! You can
          set this up for categories that you choose in the settings page.
        </li>
        <li>
          🪄 The transaction form is restored if you close the popup in the middle of
          adding a transaction, or if you open the form in a new window.
        </li>
        <li>
          ❓ Some helpful tooltips are added in the settings page to explain all the
          options.
        </li>
      </ul>
      <div className="flex-row">
        <Image
          src="/img/screenshots/search-bar-add.png"
          alt={"Adding transaction via the search bar"}
          className="screenshot"
          width={250}
          height={250}
        />
        <Image
          src="/img/screenshots/search-bar-filter.png"
          alt={"Filtering categories via the search bar"}
          className="screenshot"
          width={250}
          height={125}
        />
      </div>
      <h3>0.21.0 - Sep 24, 2024</h3>
      <ul>
        <li>
          Redesigned navigation at the top of the popup window, with quick links to add a
          transaction, edit pinned items, and more. The dropdown menus are accessible and
          keyboard navigable thanks to the awesome open-source{" "}
          <a
            href="https://react-spectrum.adobe.com/react-aria/index.html"
            target="_blank"
            rel="noreferrer">
            React Aria
          </a>{" "}
          library 🙏.
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
