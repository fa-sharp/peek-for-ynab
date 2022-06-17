import Head from "next/head";
import Link from "next/link";

const APP_NAME = "'At a Glance for YNAB'";

function IndexPage() {
  return (
    <main>
      <Head>
        <title>At a Glance for YNAB - Privacy Policy</title>
      </Head>
      <h1>Privacy Policy</h1>
      <p>
        We follow the{" "}
        <Link href="https://api.youneedabudget.com/#terms">
          YNAB API Terms of Service
        </Link>
        . When you authorize our extension with your YNAB account, {APP_NAME + " "}
        communicates directly with YNAB through their API to access your budget
        information - including your budgets, budget settings, categories, and category
        balances - from your YNAB account. We cannot access your YNAB login credentials,
        nor any credentials to your financial institution accounts. You must login to YNAB
        through their website in order to authorize {APP_NAME} for use with your account.
      </p>
      <p>
        {APP_NAME} stores some information in your browser, including the currently
        selected budget, and the categories which you choose to save and pin in the
        extension. This data is deleted if you logout of the extension.
      </p>
    </main>
  );
}

export default IndexPage;
