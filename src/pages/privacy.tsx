import Head from "next/head";
import Link from "next/link";
import packageJson from "package.json";

const { displayName: APP_NAME } = packageJson;

function IndexPage() {
  return (
    <main>
      <Head>
        <title>{APP_NAME} - Privacy Policy</title>
      </Head>
      <h1>{APP_NAME} - Privacy Policy</h1>
      <Link href="/">Home</Link>
      <p>
        {APP_NAME} follows the{" "}
        <Link href="https://api.youneedabudget.com/#terms">
          YNAB API Terms of Service
        </Link>
        . When you authorize the extension with your YNAB account, {APP_NAME + " "}
        communicates directly with YNAB through their API to access your budget data -
        including your budgets, budget settings, categories, accounts, payees, and
        balances. {APP_NAME} cannot access your YNAB login credentials, nor any
        credentials to your financial institution accounts. You must login to YNAB through
        their website in order to authorize {APP_NAME} for use with your account.
      </p>
      <p>
        {APP_NAME} stores some information in your browser&apos;s local storage, including
        your extension settings and the list of categories and accounts you choose to pin.{" "}
        {APP_NAME} also caches data from your budget, which allows the extension to fetch
        and display your data quickly and efficiently. This cached data is stored locally
        in your browser and is never sent to a third-party. All data is immediately
        deleted if you logout and/or uninstall the extension.
      </p>
      <p>
        {APP_NAME} does not share data with any third-party and/or analytics services.
      </p>
      <p>
        This privacy policy may be updated periodically to reflect changes in the
        extension&apos;s functionality and data practices. This website will show the
        latest version of the policy.
      </p>
      <br />
      <p style={{ color: "gray" }}>
        <em>Last updated: Jan 20, 2023</em>
      </p>
    </main>
  );
}

export default IndexPage;
