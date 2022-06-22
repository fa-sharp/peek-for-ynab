import { useState } from "react";
import { Refresh } from "tabler-icons-react";

import { IconButton } from "~components";
import {
  AppProvider,
  useAuthContext,
  useStorageContext,
  useYNABContext
} from "~lib/context";

const OptionsComponent = () => (
  <AppProvider>
    <OptionsView />
  </AppProvider>
);

function OptionsView() {
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
        minWidth: "240px",
        width: "max-content"
      }}>
      {!loggedIn ? (
        <button
          disabled={loggingIn}
          onClick={async () => {
            setLoggingIn(true);
            await loginWithOAuth();
            setLoggingIn(false);
          }}>
          Login with YNAB
        </button>
      ) : (
        <>
          <button onClick={() => logout()}>Logout and clear all data</button>
          <button
            style={{ marginTop: 4 }}
            onClick={() => window.open(process.env.PLASMO_PUBLIC_DONATE_URL, "_blank")}>
            ☕ Buy me coffee and support my work!
          </button>
          <h3 className="heading-big" style={{ marginTop: "1rem" }}>
            Settings
          </h3>
          <label>
            Show accounts{" "}
            <input
              type="checkbox"
              checked={settings.showAccounts}
              onChange={(e) => changeSetting("showAccounts", e.target.checked)}
            />
          </label>
          <h3 className="heading-big" style={{ marginTop: 8 }}>
            Budgets
            <IconButton
              label="Refresh budgets"
              onClick={() => refreshBudgets()}
              icon={<Refresh />}
            />
          </h3>
          {cachedBudgets?.map((budget) => (
            <div key={budget.id}>
              {budget.name}{" "}
              <input
                type="checkbox"
                checked={budget.show}
                onChange={() => toggleShowBudget(budget.id)}
              />
            </div>
          ))}
        </>
      )}
    </section>
  );
}

export default OptionsComponent;
