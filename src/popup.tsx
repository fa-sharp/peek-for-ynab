import { ExternalLink, Settings } from "tabler-icons-react";

import { BudgetSelect, IconButton, SavedCategoriesView } from "~components";
import { CategoriesView } from "~components";
import AccountsView from "~components/AccountsView";
import SavedAccountsView from "~components/SavedAccountsView";
import { AppProvider, useAuthContext, useStorageContext } from "~lib/context";

function PopupComponent() {
  return (
    <AppProvider>
      <PopupView />
    </AppProvider>
  );
}

function PopupView() {
  const { loggedIn, loginWithOAuth } = useAuthContext();
  const { cachedBudgets, selectedBudgetId, setSelectedBudgetId } = useStorageContext();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: 16,
        minWidth: "240px",
        width: "max-content",
        maxWidth: "330px"
      }}>
      {!loggedIn ? (
        <div>
          <button
            onClick={
              chrome?.runtime
                ? () => chrome.runtime.openOptionsPage()
                : () => loginWithOAuth()
            }>
            Login via Settings page
          </button>
        </div>
      ) : (
        <>
          <nav
            style={{
              marginBottom: 8,
              display: "flex",
              justifyContent: "space-between"
            }}>
            {cachedBudgets && (
              <BudgetSelect
                budgets={cachedBudgets}
                selectedBudgetId={selectedBudgetId}
                setSelectedBudgetId={setSelectedBudgetId}
              />
            )}
            {selectedBudgetId && (
              <IconButton
                label="Open budget in YNAB"
                onClick={() =>
                  window.open(
                    `https://app.youneedabudget.com/${selectedBudgetId}/budget`,
                    "_blank"
                  )
                }
                icon={<ExternalLink />}
              />
            )}
            <IconButton
              label="Settings"
              onClick={() => chrome?.runtime.openOptionsPage()}
              icon={<Settings />}
            />
          </nav>

          <SavedCategoriesView />
          <SavedAccountsView />

          <CategoriesView />
          <AccountsView />
        </>
      )}
    </div>
  );
}

export default PopupComponent;
