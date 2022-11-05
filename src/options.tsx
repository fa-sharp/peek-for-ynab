import { useState } from "react";
import { Refresh } from "tabler-icons-react";

import {
  AppProvider,
  useAuthContext,
  useStorageContext,
  useYNABContext
} from "~lib/context";

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
        display: "flex",
        flexDirection: "column",
        padding: "0 16px 16px",
        maxWidth: "700px",
        width: "max-content"
      }}>
      {!loggedIn ? (
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
      ) : (
        <>
          <h3 className="heading-big" style={{ marginTop: "1rem" }}>
            Settings
          </h3>
          <label className="flex-row mb-small" title="Show and pin your accounts in YNAB">
            <input
              type="checkbox"
              checked={settings.showAccounts}
              onChange={(e) => changeSetting("showAccounts", e.target.checked)}
            />
            Show accounts
          </label>
          <label className="flex-row mb-small">
            <input
              type="checkbox"
              checked={settings.transactions}
              onChange={(e) => changeSetting("transactions", e.target.checked)}
            />
            Add transactions
          </label>
          <label className="flex-row mb-small">
            <input
              type="checkbox"
              checked={settings.privateMode}
              onChange={(e) => changeSetting("privateMode", e.target.checked)}
            />
            Privacy mode
          </label>
          <label className="flex-row">
            <input
              type="checkbox"
              checked={settings.emojiMode}
              onChange={(e) => changeSetting("emojiMode", e.target.checked)}
            />
            Emoji mode
          </label>
          <h3 className="heading-big" style={{ marginTop: "1rem" }}>
            Budgets
          </h3>
          <button
            title="Refresh the list of budgets from YNAB"
            className={"button rounded accent flex-row"}
            style={{ width: "fit-content", marginBottom: 8 }}
            onClick={() => refreshBudgets()}
            disabled={isRefreshingBudgets}>
            <Refresh size={14} />
            {isRefreshingBudgets ? "Refreshing..." : "Refresh budgets"}
          </button>
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
            style={{ marginTop: 12 }}
            className="button rounded warn"
            onClick={() => logout()}>
            Logout and clear all data
          </button>
        </>
      )}
    </section>
  );
}

export default OptionsWrapper;
