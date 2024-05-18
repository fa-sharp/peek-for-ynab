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
            For your categories, the extension displays the Available amount in the
            current month. For your accounts, the extension displays the current Working
            Balance. Keep in mind the extension reflects what your budget looks like in
            YNAB <i>right now</i> - e.g. if transactions have not imported from your bank
            yet, they will not be reflected in the extension.
          </p>
        </li>
        <li>
          <h3>How do I pin/unpin or re-arrange my categories and accounts?</h3>
          <p>
            If you have already pinned some items, you will need to click the edit button
            in the upper right in order to show the pin and unpin buttons next to each
            category and account. You can also then drag and drop your pinned items to
            re-arrange them how you like.
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
          <h3>Are there keyboard shortcuts to open/use the extension?</h3>
          <p>
            Yes! The default shortcut to open the popup is <kbd>Alt/Option+Shift+Y</kbd>{" "}
            (you can change this by heading over to{" "}
            <code>chrome://extensions/shortcuts</code> in your browser). From there, you
            can use the <kbd>Tab</kbd>, <kbd>Shift+Tab</kbd>, <kbd>Space</kbd>, and{" "}
            <kbd>Enter</kbd> keys to navigate the extension.
          </p>
        </li>
        <li>
          <h3>
            I use Direct Import (linked accounts) in YNAB. How will that work with
            transactions I enter via the extension?
          </h3>
          <p>
            The transactions will behave just as if you manually entered them in YNAB. If
            the transaction later imports from your bank, and it matches the transaction
            you entered, you will be prompted to approve that match in YNAB.
          </p>
        </li>
        <li>
          <h3>I do not use Direct Import in YNAB. Should I change any settings?</h3>
          <p>
            If you will enter a lot of your transactions using the extension, you may want
            to leave them Unapproved so that you will be prompted to double-check and
            Approve the transactions in YNAB. In the settings page, click the gear ⚙️ icon
            next to the budget name, and then uncheck the <b>Approved</b> setting.
          </p>
        </li>
        <li>
          <h3>What does the icon in the upper left corner represent?</h3>
          <ul>
            <li>
              <Check color="var(--success)" />
              &nbsp;Category and account data has been successfully retrieved from YNAB.
            </li>
            <li>
              <AlertTriangle color="var(--stale)" />
              &nbsp;There was an error fetching data from YNAB, and/or the data is out of
              date. Close and re-open the extension to retry.
            </li>
            <li>
              <Refresh />
              &nbsp;Data is being retrieved/refreshed from YNAB.
            </li>
          </ul>
        </li>
        <li>
          <h3>I have an issue, bug report, or further questions.</h3>
          <p>Please contact the developer at hello (at) fasharp (dot) io.</p>
        </li>
      </ul>
    </WebLayout>
  );
}

export default HelpPage;
