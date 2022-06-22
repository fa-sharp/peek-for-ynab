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
  const { cachedBudgets, toggleShowBudget } = useStorageContext();
  const { refreshBudgets } = useYNABContext();
  const { loginWithOAuth, loggedIn, logout } = useAuthContext();

  const [loggingIn, setLoggingIn] = useState(false);

  return (
    <section
      aria-label="Settings"
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
          <h3
            style={{
              display: "flex",
              alignItems: "center"
            }}>
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
