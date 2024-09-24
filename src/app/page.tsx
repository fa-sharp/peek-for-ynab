import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Peek for YNAB"
};

function IndexPage() {
  return (
    <>
      <h3>A Chrome extension to quickly check on your spending plan</h3>
      <div className="flex-row gap-lg">
        <Image
          src="/img/screenshots/light-pinned.png"
          alt={"Extension screenshot in light mode"}
          className="screenshot"
          width={380}
          height={300}
          priority
        />
        <Image
          src="/img/screenshots/dark-pinned.png"
          alt={"Extension screenshot in dark mode"}
          className="screenshot"
          width={380}
          height={300}
          priority
        />
      </div>
      <div className="browser-logos">
        <a
          href="https://chromewebstore.google.com/detail/peek-for-ynab/oakibhlecegcmjcjppmjkiaeedoljbmk?hl=en"
          target="_blank"
          rel="noreferrer"
          title="Go to Chrome Web Store">
          <Image
            src="/img/chromelogo.png"
            alt="Chrome Web Store logo"
            width={248}
            height={75}
          />
        </a>
      </div>
      <h2>Features</h2>
      <ul>
        <li>View your current category and account balances</li>
        <li>Pin your favorite categories and accounts</li>
        <li>Add transactions directly from the extension</li>
        <li>
          Customizable alerts for overspending, new imports, and reconciliation reminders
        </li>
        <li>Support for split transactions</li>
        <li>Support for multiple budgets</li>
        <li>Dark mode</li>
      </ul>
    </>
  );
}

export default IndexPage;
