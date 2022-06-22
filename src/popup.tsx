import { ExternalLink, Settings } from "tabler-icons-react";

import { BudgetSelect, IconButton, SavedCategoriesView } from "~components";
import { CategoriesView } from "~components";
import AccountsView from "~components/AccountsView";
import {
  AppProvider,
  useAuthContext,
  useStorageContext,
  useYNABContext
} from "~lib/context";

function PopupComponent() {
  return (
    <AppProvider>
      <PopupView />
    </AppProvider>
  );
}

function PopupView() {
  const { loggedIn, loginWithOAuth } = useAuthContext();
  const { categoryGroupsData, accountsData, savedCategoriesData } = useYNABContext();
  const {
    cachedBudgets,
    selectedBudgetId,
    setSelectedBudgetId,
    selectedBudgetData,
    savedCategories,
    saveCategory,
    removeCategory
  } = useStorageContext();

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
          <div
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
          </div>

          {selectedBudgetData && savedCategoriesData && (
            <SavedCategoriesView
              savedCategoryData={savedCategoriesData}
              budgetData={selectedBudgetData}
              removeCategory={removeCategory}
            />
          )}

          {selectedBudgetData && categoryGroupsData && (
            <CategoriesView
              categoryGroupsData={categoryGroupsData}
              savedCategories={savedCategories}
              selectedBudgetData={selectedBudgetData}
              saveCategory={saveCategory}
            />
          )}

          {selectedBudgetData && accountsData && (
            <AccountsView
              accountsData={accountsData}
              selectedBudgetData={selectedBudgetData}
            />
          )}
        </>
      )}
    </div>
  );
}

export default PopupComponent;
