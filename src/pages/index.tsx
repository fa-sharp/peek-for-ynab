import Head from "next/head";
import Image from "next/image";

import WebLayout from "~components/website/WebLayout";

function IndexPage() {
  return (
    <WebLayout>
      <Head>
        <title>Peek for YNAB</title>
      </Head>
      <h1>Peek for YNAB</h1>
      <h3>A Chrome extension to quickly check on your budget*</h3>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <Image src="/screenshots/light-pinned.png" width={400} height={330} />
        <Image src="/screenshots/dark-pinned.png" width={400} height={330} />
      </div>
      <div className="browser-logos">
        <a
          href="https://chromewebstore.google.com/detail/peek-for-ynab/oakibhlecegcmjcjppmjkiaeedoljbmk?hl=en"
          target="_blank"
          rel="noreferrer"
          title="Go to Chrome Web Store">
          <Image
            src="/chromelogo.png"
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
        <li>Support for multiple budgets</li>
        <li>Dark mode</li>
      </ul>

      <h2>Coming soon!</h2>
      <ul>
        <li>Multi-browser support</li>
      </ul>
      <br />
      <p>* (before those midnight impulse purchases 😉)</p>
    </WebLayout>
  );
}

export default IndexPage;
