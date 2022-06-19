import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { ExternalLink, Logout } from "tabler-icons-react";

import { BudgetSelect, IconButton, SavedCategoriesView } from "~components";
import { CategoriesView } from "~components";
import { AuthProvider, useAuth } from "~lib/authContext";
import { StorageProvider, useStorageContext } from "~lib/storageContext";
import { YNABProvider, useYNAB } from "~lib/ynabContext";

const PopupComponent = () => (
  <StorageProvider>
    <AuthProvider>
      <YNABProvider>
        <PopupView />
      </YNABProvider>
    </AuthProvider>
  </StorageProvider>
);

function PopupView() {
  const router = useRouter();
  const { login, logout, authenticated } = useAuth();
  const { categoryGroupsData, savedCategoriesData, refreshBudgets } = useYNAB();
  const {
    cachedBudgets,
    selectedBudgetId,
    setSelectedBudgetId,
    selectedBudgetData,
    savedCategories,
    saveCategory,
    removeCategory
  } = useStorageContext();

  /** Automatically fetch budgets from API if there is no cached budget data */
  useEffect(() => {
    if (authenticated && !cachedBudgets) refreshBudgets();
  }, [authenticated, cachedBudgets, refreshBudgets]);

  const [tokenInput, setTokenInput] = useState("");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: 16,
        minWidth: "240px",
        width: "max-content"
      }}>
      {!authenticated ? (
        <div>
          <label>Token: </label>
          <input value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} />
          <button
            onClick={() =>
              login({
                accessToken: tokenInput,
                expires: Date.now() + 525000 * 60 * 1000,
                refreshToken: ""
              })
            }>
            Login
          </button>
          <button
            onClick={() =>
              router.push(
                `https://app.youneedabudget.com/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_YNAB_CLIENT_ID}&redirect_uri=${process.env.NEXT_PUBLIC_TEST_REDIRECT_URI}&response_type=code`
              )
            }>
            OAuth
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
            <IconButton label="Logout" onClick={logout} icon={<Logout />} />
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
        </>
      )}
    </div>
  );
}

export default PopupComponent;
