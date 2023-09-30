import Head from "next/head";
import { AlertTriangle, Check, Refresh } from "tabler-icons-react";

import WebLayout from "~components/website/WebLayout";

function HelpPage() {
  return (
    <WebLayout>
      <Head>
        <title>Peek for YNAB - Help</title>
      </Head>
      <h1>Peek for YNAB</h1>
      <h2>Help/FAQ</h2>
      <ul>
        <li>
          <h3>Which balances are displayed in the extension?</h3>
          <p>
            For your categories, the extension displays the Available Balance in the
            current month. For your accounts, the extension displays the current Working
            Balance. Keep in mind the extension reflects what your budget looks like in
            YNAB <i>right now</i> - e.g. if transactions have not imported from your bank
            yet, they will not be reflected in the extension.
          </p>
        </li>
        <li>
          <h3>I added a new budget in YNAB, but it is not showing up.</h3>
          <p>
            After you have added a new budget, make sure to click <b>Refresh budgets</b>{" "}
            at the bottom of the settings page, and then select the checkmark next to your
            new budget in the list.
          </p>
        </li>
        <li>
          <h3>
            I use bank imports in YNAB. How will that work with transactions I enter via
            the extension?
          </h3>
          <p>
            The transactions will behave just as if you manually entered them in YNAB. If
            the transaction later imports from the bank, and it matches the transaction
            you entered, you will be prompted to approve that match in YNAB.
          </p>
        </li>
        <li>
          <h3>I do not use bank imports in YNAB. Should I change any settings?</h3>
          <p>
            If you usually enter transactions as Cleared in YNAB, you will want to check
            the <b>Cleared</b> setting under <b>Transaction defaults</b>. This way, all
            transactions entered via the extension will be marked as Cleared by default.
          </p>
        </li>
        <li>
          <h3>How do I get dark mode?</h3>
          <p>
            Dark mode is activated based on your system theme. This varies depending on
            your OS: here are the instructions for{" "}
            <a href="https://support.microsoft.com/en-us/windows/change-colors-in-windows-d26ef4d6-819a-581c-1581-493cfcc005fe">
              Windows
            </a>{" "}
            and <a href="https://support.apple.com/en-us/HT208976">Mac</a>.
          </p>
        </li>
        <li>
          <h3>What does the icon in the upper left corner represent?</h3>
          <ul>
            <li>
              <Check color="var(--success)" />
              &nbsp;Category and account data has been updated within the last 4 minutes.
            </li>
            <li>
              <AlertTriangle color="var(--stale)" />
              &nbsp;Category & account balances/data may be out of date, as they have not
              been updated within the last 4 minutes. Close and re-open the extension to
              refresh data.
            </li>
            <li>
              <Refresh />
              &nbsp;Data is being refreshed from YNAB. Balances may be out of date until
              refreshing is complete.
            </li>
          </ul>
        </li>
      </ul>
    </WebLayout>
  );
}

export default HelpPage;
