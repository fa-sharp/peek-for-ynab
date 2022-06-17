import Head from "next/head";
import Link from "next/link";

function IndexPage() {
  return (
    <main>
      <Head>
        <title>At a Glance for YNAB</title>
      </Head>
      <h1>Welcome!</h1>
      <Link href="/privacy">Privacy Policy</Link>
    </main>
  );
}

export default IndexPage;
