import Head from "next/head";
import Image from "next/image";
import Link from "next/link";

function IndexPage() {
  return (
    <main>
      <Head>
        <title>Peek for YNAB</title>
      </Head>
      <h1>Peek for YNAB</h1>
      <Link href="/privacy">Privacy Policy</Link>
      <h2>Features</h2>
      <ul>
        <li>View all your current category and account balances at a glance</li>
        <li>Pin your favorite categories and accounts</li>
        <li>Add transactions directly from the extension</li>
        <li>Quickly switch between your budgets</li>
        <li>Sync your pinned categories, accounts, and budgets to your Chrome profile</li>
        <li>Fully keyboard accessible</li>
      </ul>
      <h2>Coming soon!</h2>
      <ul>
        <li>Multi-browser support</li>
      </ul>
      <h2>Screenshots</h2>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <Image src="/screenshots/collapsed-view.png" width={300} height={250} />
        <Image src="/screenshots/expanded-view.png" width={300} height={500} />
      </div>
    </main>
  );
}

export default IndexPage;
