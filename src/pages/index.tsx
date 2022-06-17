import Head from "next/head";
import Link from "next/link";

function IndexPage() {
  return (
    <body>
      <Head>
        <title>At a Glance for YNAB</title>
      </Head>
      <main>
        <h1>Welcome!</h1>
        <Link href="/privacy">Privacy Policy</Link>
      </main>
    </body>
  );
}

export default IndexPage;
