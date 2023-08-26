import { useState } from "react";
import { CircleC, InfoCircle, Refresh } from "tabler-icons-react";

import {
  AppProvider,
  useAuthContext,
  useStorageContext,
  useYNABContext
} from "~lib/context";
import { removeCurrentTabPermissions, requestCurrentTabPermissions } from "~lib/utils";

import "./global.css";

const OptionsWrapper = () => (
  <AppProvider>
    <OptionsView />
  </AppProvider>
);

export function OptionsView() {
  const { settings, changeSetting, shownBudgetIds, toggleShowBudget } =
    useStorageContext();
  const { budgetsData, refreshBudgets, isRefreshingBudgets } = useYNABContext();
  const { loginWithOAuth, loggedIn, logout } = useAuthContext();

  const [loggingIn, setLoggingIn] = useState(false);

  return (
    <section
      style={{
        padding: "0 16px 16px",
        maxWidth: "700px",
        width: "max-content"
      }}>
      {!loggedIn ? (
        <>
          <h1>Peek for YNAB</h1>
          <button
            className={"button rounded accent"}
            disabled={loggingIn}
            onClick={async () => {
              setLoggingIn(true);
              await loginWithOAuth();
              setLoggingIn(false);
            }}>
            🔑 Login to YNAB
          </button>
        </>
      ) : (
        <>
          <h1>Peek for YNAB</h1>
          <h3 className="heading-big" style={{ marginTop: "0" }}>
            Settings
          </h3>
          <label className="flex-row mb-small">
            <input
              type="checkbox"
              checked={settings.showAccounts}
              onChange={(e) => changeSetting("showAccounts", e.target.checked)}
            />
            💲 Show accounts
          </label>
          <label
            className="flex-row mb-small"
            title="Sync pinned categories/accounts/budgets to your browser profile">
            <input
              type="checkbox"
              checked={settings.sync}
              onChange={(e) => {
                const confirmMessage = settings.sync
                  ? "Are you sure? This will reset your pinned categories, accounts, etc. and stop syncing with your browser profile."
                  : "Are you sure? This will reset any currently pinned categories, accounts, etc. and start syncing with your browser profile.";
                const confirmed = confirm(confirmMessage);
                if (confirmed) {
                  changeSetting("sync", e.target.checked);
                  location.reload();
                }
              }}
            />
            🔄 Sync with browser profile
          </label>
          <label
            className="flex-row mb-small"
            title="Only display balances when you hover over them with your mouse">
            <input
              type="checkbox"
              checked={settings.privateMode}
              onChange={(e) => changeSetting("privateMode", e.target.checked)}
            />
            🕶️ Show balances on hover
          </label>
          <label
            className="flex-row mb-small"
            title="Display category/account names as emojis only">
            <input
              type="checkbox"
              checked={settings.emojiMode}
              onChange={(e) => changeSetting("emojiMode", e.target.checked)}
            />
            😉 Emoji-only mode
          </label>
          <h3 className="heading-big" style={{ marginTop: "1.2rem" }}>
            Transaction entry
          </h3>
          <label className="flex-row mb-small">
            <input
              type="checkbox"
              checked={settings.txEnabled}
              onChange={(e) => changeSetting("txEnabled", e.target.checked)}
            />
            💸 Enable transaction entry
          </label>
          {settings.txEnabled && (
            <>
              <div>Transaction defaults:</div>
              <label
                className="flex-row gap-xs mb-small mt-small"
                title="Mark transactions as Cleared by default">
                <input
                  type="checkbox"
                  checked={settings.txCleared}
                  onChange={(e) => changeSetting("txCleared", e.target.checked)}
                />
                <CircleC stroke="white" fill="var(--currency-green)" size={20} />
                Cleared
              </label>
              <label
                className="flex-row gap-xs mb-small"
                title="Mark transactions as Unapproved by default">
                <input
                  type="checkbox"
                  checked={!settings.txApproved}
                  onChange={(e) => changeSetting("txApproved", !e.target.checked)}
                />
                <InfoCircle stroke="#2ea1be" fill="white" size={20} />
                Unapproved
              </label>
            </>
          )}
          <h3 className="heading-big" style={{ marginTop: "1.2rem" }}>
            Extra features
          </h3>
          <label className="flex-row mb-small">
            <input
              type="checkbox"
              checked={settings.currentTabAccess}
              onChange={async (e) => {
                if (e.target.checked) {
                  if (await requestCurrentTabPermissions())
                    changeSetting("currentTabAccess", true);
                } else {
                  await removeCurrentTabPermissions();
                  changeSetting("currentTabAccess", false);
                }
              }}
            />
            Allow access to the currently open tab for these features:
          </label>
          <ul style={{ marginBlock: 0, fontSize: ".9em" }}>
            <li>Automatically copy the selected amount into the transaction form</li>
            <li>Detect transaction amounts on the page</li>
          </ul>

          <h3 className="heading-big" style={{ marginTop: "1.2rem" }}>
            Show/hide budgets
          </h3>
          {budgetsData?.map((budget) => (
            <label key={budget.id} className="flex-row mb-small">
              <input
                type="checkbox"
                checked={shownBudgetIds?.includes(budget.id)}
                onChange={() => toggleShowBudget(budget.id)}
              />
              {budget.name}
            </label>
          ))}
          <button
            title="Refresh the list of budgets from YNAB"
            className={"button rounded accent flex-row mb-small"}
            style={{ width: "fit-content", marginBlock: 8 }}
            onClick={() => refreshBudgets()}
            disabled={isRefreshingBudgets}>
            <Refresh size={14} />
            {isRefreshingBudgets ? "Refreshing..." : "Refresh budgets"}
          </button>
          <button
            style={{ marginTop: 12 }}
            className="button rounded warn"
            onClick={() => {
              const confirmed = confirm(
                "Are you sure? Logging out will clear all settings and data stored in your browser. It will NOT erase any settings synced to your browser profile."
              );
              if (confirmed) logout();
            }}>
            Logout
          </button>
        </>
      )}
    </section>
  );
}

export default OptionsWrapper;
