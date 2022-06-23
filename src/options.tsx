import { useState } from "react";
import { Refresh } from "tabler-icons-react";

import {
  AppProvider,
  useAuthContext,
  useStorageContext,
  useYNABContext
} from "~lib/context";

import * as styles from "./components/styles.module.css";

const OptionsWrapper = () => (
  <AppProvider>
    <OptionsView />
  </AppProvider>
);

export function OptionsView() {
  const { settings, changeSetting, cachedBudgets, toggleShowBudget } =
    useStorageContext();
  const { refreshBudgets } = useYNABContext();
  const { loginWithOAuth, loggedIn, logout } = useAuthContext();

  const [loggingIn, setLoggingIn] = useState(false);

  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        padding: 16,
        maxWidth: "700px",
        width: "max-content"
      }}>
      {!loggedIn ? (
        <button
          className={`${styles.button} ${styles.rounded} ${styles.accent}`}
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
          <button
            className={`${styles.button} ${styles.rounded} ${styles.accent}`}
            style={{ marginTop: 4 }}
            onClick={() => window.open(process.env.NEXT_PUBLIC_DONATE_URL, "_blank")}>
            ☕ Support the extension!
          </button>
          <h3 className={styles["heading-big"]} style={{ marginTop: "1rem" }}>
            Settings
          </h3>
          <label className={styles.flexRow}>
            Show accounts{" "}
            <input
              type="checkbox"
              checked={settings.showAccounts}
              onChange={(e) => changeSetting("showAccounts", e.target.checked)}
            />
          </label>
          <h3 className={styles["heading-big"]} style={{ marginTop: "1rem" }}>
            Budgets
          </h3>
          <button
            title="Refresh the list of budgets from YNAB"
            className={`${styles.button} ${styles.rounded} ${styles.accent} ${styles.flexRow}`}
            style={{ width: "fit-content", marginBottom: 8 }}
            onClick={() => refreshBudgets()}>
            <Refresh size={18} />
            Refresh budgets
          </button>
          {cachedBudgets?.map((budget) => (
            <label key={budget.id} className={styles.flexRow} style={{ marginBottom: 4 }}>
              <input
                type="checkbox"
                checked={budget.show}
                onChange={() => toggleShowBudget(budget.id)}
              />
              {budget.name}
            </label>
          ))}
          <button
            style={{ marginTop: 12 }}
            className={`${styles.button} ${styles.rounded} ${styles.warn}`}
            onClick={() => logout()}>
            Logout and clear all data
          </button>
        </>
      )}
    </section>
  );
}

export default OptionsWrapper;
