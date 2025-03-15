import type { Metadata } from "next";
import Link from "next/link";
import packageJson from "package.json";

export const metadata: Metadata = {
  title: "Privacy Policy | Peek for YNAB"
};

const { displayName: APP_NAME } = packageJson;

function PrivacyPage() {
  return (
    <>
      <h2>Privacy Policy</h2>
      <p>
        {APP_NAME} follows the{" "}
        <Link href="https://api.ynab.com/#terms">YNAB API Terms of Service</Link>. When
        you login to YNAB via the extension, {APP_NAME} will communicate directly with
        YNAB through their API to access your budget data - including your budgets, budget
        settings, categories, accounts, payees, and balances. {APP_NAME} cannot access
        your YNAB login credentials, nor any credentials to your financial institution
        accounts. The extension also communicates with a separate authentication server in
        order to retrieve and exchange OAuth tokens from YNAB to keep the user logged in.
        No other data is passed to the authentication server.
      </p>
      <p>
        We are not affiliated, associated, or in any way officially connected with YNAB,
        or any of its subsidiaries or its affiliates. We are fans of YNAB and we wanted a
        quick way to view your budget and add transactions, so we created this extension.
        The official YNAB website can be found at{" "}
        <a href="https://www.ynab.com" target="_blank" rel="noopener noreferrer">
          https://www.ynab.com
        </a>
        . The names YNAB and You Need A Budget as well as related names, marks, emblems
        and images are registered trademarks of YNAB.
      </p>
      <p>
        {APP_NAME} stores some information in your browser&apos;s local storage, including
        your extension settings and the list of categories and accounts you choose to pin.
        The extension also caches some data from your budgets, which allows the extension
        to fetch and display your data quickly and efficiently. This cached data is only
        stored locally in your browser, and all cached data is immediately deleted if you
        logout and/or uninstall the extension.
      </p>
      <p>
        If you enable the sync option in the extension settings, {APP_NAME} will save your
        settings and your pinned items to your browser profile, in order to sync them to
        your other devices.
      </p>
      <p>
        If tab access is allowed in the settings, {APP_NAME} will be able to read the
        current tab upon opening the extension, in order to enable additional features.
        This data is only processed locally in your browser. The extension will not access
        the current tab unless you enable this setting.
      </p>
      <p>
        This privacy policy may be updated periodically to reflect changes in the
        extension&apos;s functionality and data practices. This website will show the
        latest version of the policy.
      </p>
      <br />
      <p style={{ color: "gray" }}>
        <em>Last updated: Mar 15, 2025</em>
      </p>
    </>
  );
}

export default PrivacyPage;
