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
      <h1>Privacy Policy</h1>
      <p>
        {APP_NAME} follows the{" "}
        <Link href="https://api.youneedabudget.com/#terms">
          YNAB API Terms of Service
        </Link>
        . When you authorize the extension with your YNAB account, {APP_NAME + " "}
        communicates directly with YNAB through their API to access your budget
        information - including your budgets, budget settings, categories, and category
        balances - from your YNAB account. {APP_NAME} cannot access your YNAB login
        credentials, nor any credentials to your financial institution accounts. You must
        login to YNAB through their website in order to authorize {APP_NAME} for use with
        your account.
      </p>
      <p>
        {APP_NAME} stores some information in your browser, including a list of your
        budget names, budget settings, and the categories and accounts which you choose to
        save and pin in the extension. This data is stored locally in your browser and is
        never sent to a third-party. The data is deleted immediately if you logout of the
        extension.
      </p>
      <p>
        {APP_NAME} does not share data with any third-party and/or analytics services.
      </p>
    </main>
  );
}

export default IndexPage;
