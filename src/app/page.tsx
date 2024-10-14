import type { Metadata } from "next";
import Image from "next/image";
import {
  ArrowsSplit,
  Bell,
  CurrencyPound,
  Eye,
  Pin,
  Plus,
  Sunglasses
} from "tabler-icons-react";

export const metadata: Metadata = {
  title: "Peek for YNAB"
};

function IndexPage() {
  return (
    <>
      <h2 className="heading-big mb-lg">
        A Chrome extension to quickly check on your spending plan
      </h2>
      <div className="flex-row gap-lg">
        <Image
          src="/img/screenshots/popup-light.png"
          alt={"Extension screenshot in light mode"}
          className="screenshot"
          width={300}
          height={310}
          priority
        />
        <Image
          src="/img/screenshots/popup-dark.png"
          alt={"Extension screenshot in dark mode"}
          className="screenshot"
          width={300}
          height={310}
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
      <h2 className="heading-big">Features</h2>
      <ul className="list divide-y">
        <li className="flex-row py-xs">
          <Eye aria-hidden /> View your current category and account balances
        </li>
        <li className="flex-row py-xs">
          <Pin aria-hidden /> Pin your favorite categories and accounts
        </li>
        <li className="flex-row py-xs">
          <Plus aria-hidden /> Add transactions directly from the extension
        </li>
        <li className="flex-row py-xs">
          <Bell aria-hidden /> Customizable alerts for overspending, new imports, and
          reconciliation reminders
        </li>
        <li className="flex-row py-xs">
          <ArrowsSplit aria-hidden />
          Support for split transactions
        </li>
        <li className="flex-row py-xs">
          <CurrencyPound aria-hidden /> Support for multiple budgets and currencies
        </li>
        <li className="flex-row py-xs">
          <Sunglasses aria-hidden /> Dark mode
        </li>
      </ul>
    </>
  );
}

export default IndexPage;
