import Link from "next/link";

function IndexPage() {
  return (
    <main>
      <h1>Welcome!</h1>
      <Link href="/privacy">Privacy Policy</Link>
    </main>
  );
}

export default IndexPage;
