import type { Metadata } from "next";
import { AlertTriangle, Check, Refresh } from "tabler-icons-react";

export const metadata: Metadata = {
  title: "Help | Peek for YNAB"
};

function HelpPage() {
  return (
    <>
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
            If you have already pinned some items, you will need to access the menu by
            clicking the hamburger icon at the top right, and then selecting{" "}
            <b>Edit pinned items</b>. This will show the pin and unpin buttons next to
            each category and account. You can also then drag and drop your pinned items
            to re-arrange them how you like.
          </p>
        </li>
        <li>
          <h3>I started a new budget in YNAB, but it is not showing up.</h3>
          <p>
            After you have added a new budget or made a Fresh Start, access the settings
            page (click the hamburger icon at the top right and select <b>Settings</b>).
            Select <b>Refresh budgets</b> at the bottom of the settings page, and then
            select the checkmark next to your new budget in the list.
          </p>
        </li>
        <li>
          <h3>Are there keyboard shortcuts to open/use the extension?</h3>
          <p>
            Yes! The default shortcut to open the popup is <kbd>Alt/Option+Shift+Y</kbd>{" "}
            (you can change this by heading over to{" "}
            <code>chrome://extensions/shortcuts</code> in your browser). From there, you
            can use the <kbd>Tab</kbd>, <kbd>Shift+Tab</kbd>, <kbd>Space</kbd>,{" "}
            <kbd>Enter</kbd>, and arrow keys to navigate the extension.
          </p>
        </li>
        <li>
          <h3>
            I have enabled system notifications in the settings, but they are not showing
            up on my device.
          </h3>
          <p>
            You may need to enable notifications in your system settings: here are the
            instructions to access those settings on{" "}
            <a href="https://support.microsoft.com/en-us/windows/change-notification-settings-in-windows-8942c744-6198-fe56-4639-34320cf9444e">
              Windows
            </a>{" "}
            and{" "}
            <a href="https://support.apple.com/en-sa/guide/mac-help/mh40583/mac">Mac</a>.
            Look for your browser and make sure notifications are enabled. Keep in mind
            that this is currently an experimental feature and may not work as expected.
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
          <p>
            Please keep in mind that Peek for YNAB is a third-party extension, and is not
            officialy supported by YNAB (i.e. please <b>do not</b> reach out to their
            support team for bug reports or feature requests). You may contact the
            developer at peek (at) fasharp (dot) io.
          </p>
        </li>
      </ul>
    </>
  );
}

export default HelpPage;
