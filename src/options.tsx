import { useState } from "react";
import { CircleC, InfoCircle, Refresh } from "tabler-icons-react";

import {
  AppProvider,
  useAuthContext,
  useStorageContext,
  useYNABContext
} from "~lib/context";
import {
  removeCurrentTabPermissions,
  requestCurrentTabPermissions,
  useSetColorTheme
} from "~lib/utils";

import "./global.css";

const OptionsWrapper = () => (
  <AppProvider>
    <OptionsView />
  </AppProvider>
);

export function OptionsView() {
  const { settings, syncEnabled, changeSetting, shownBudgetIds, toggleShowBudget } =
    useStorageContext();
  const { budgetsData, refreshBudgets, isRefreshingBudgets } = useYNABContext();
  const { loginWithOAuth, loggedIn, logout } = useAuthContext();

  useSetColorTheme();

  const [loggingIn, setLoggingIn] = useState(false);

  if (!settings) return null;

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
            {!loggingIn ? "🔑 Login to YNAB" : "🔑 Logging in..."}
          </button>
        </>
      ) : (
        <>
          <h1>Peek for YNAB</h1>
          <h3 className="heading-big" style={{ marginTop: "0" }}>
            Settings
          </h3>
          <label
            className="flex-row mb-small"
            title="Sync settings and pinned categories/accounts to your browser profile">
            <input
              type="checkbox"
              checked={syncEnabled}
              onChange={(e) => {
                const confirmMessage = syncEnabled
                  ? "Are you sure? This will reset your pinned categories, accounts, & budgets and stop syncing with your browser profile."
                  : "Are you sure? This will reset any currently pinned categories, accounts, & budgets and start syncing with your browser profile.";
                const confirmed = confirm(confirmMessage);
                if (confirmed) {
                  changeSetting("sync", e.target.checked);
                  location.reload();
                }
              }}
            />
            🔄 Sync settings
          </label>
          <label
            className="flex-row mb-small"
            title="Only display balances when you hover over them with your mouse">
            <input
              type="checkbox"
              checked={settings.privateMode}
              onChange={(e) => changeSetting("privateMode", e.target.checked)}
            />
            🕶️ Show balances on hover only
          </label>
          <label
            className="flex-row mb-small"
            title="Display category/account names as emojis only">
            <input
              type="checkbox"
              checked={settings.emojiMode}
              onChange={(e) => changeSetting("emojiMode", e.target.checked)}
            />
            😉 Emoji mode
          </label>
          <label className="flex-row mb-small">
            Theme:
            <select
              className="select rounded"
              value={settings.theme || "auto"}
              onChange={(e) =>
                changeSetting("theme", e.target.value as "dark" | "light" | "auto")
              }>
              <option value="auto">Auto</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <h3 className="heading-big" style={{ marginTop: "1.2rem" }}>
            Transaction defaults
          </h3>
          <label
            className="flex-row gap-xs mb-small"
            title="Set transactions as Approved (uncheck this if you want to double-check and Approve them in YNAB)">
            <input
              type="checkbox"
              checked={settings.txApproved}
              onChange={(e) => changeSetting("txApproved", e.target.checked)}
            />
            <InfoCircle fill="#2ea1be" stroke="white" size={20} />
            Approved
          </label>
          <label
            className="flex-row gap-xs mb-small mt-small"
            title="Set transactions as Cleared by default">
            <input
              type="checkbox"
              checked={settings.txCleared}
              onChange={(e) => changeSetting("txCleared", e.target.checked)}
            />
            <CircleC stroke="white" fill="var(--currency-green)" size={20} />
            Cleared
          </label>
          <h3 className="heading-big" style={{ marginTop: "1.2rem" }}>
            Permissions
          </h3>
          <label className="flex-row mb-small">
            <input
              type="checkbox"
              checked={settings.currentTabAccess}
              onChange={async (e) => {
                if (e.target.checked) {
                  const granted = await requestCurrentTabPermissions();
                  if (granted) changeSetting("currentTabAccess", true);
                } else {
                  await removeCurrentTabPermissions();
                  changeSetting("currentTabAccess", false);
                }
              }}
            />
            Allow access to the currently open tab, to enable these features:
          </label>
          <ul style={{ marginBlock: 0, fontSize: ".9em" }}>
            <li>Automatically copy the selected amount into the transaction form</li>
            <li>Copy the current URL into the memo field of the transaction</li>
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
            onClick={async () => {
              const confirmed = confirm(
                "Are you sure? Logging out will clear all settings and data stored in your browser."
              );
              if (confirmed) {
                await logout();
                location.reload();
              }
            }}>
            Logout
          </button>
        </>
      )}
    </section>
  );
}

export default OptionsWrapper;
