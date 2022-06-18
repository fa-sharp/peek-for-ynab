import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, Logout } from "tabler-icons-react";

import {
  BudgetSelect,
  CategoryGroupView,
  IconButton,
  SavedCategoriesView
} from "~components";
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
  const { login, logout, authenticated } = useAuth();
  const { categoriesData, categoryGroupsData, savedCategoriesData, refreshBudgets } =
    useYNAB();
  const {
    cachedBudgets,
    selectedBudgetId,
    setSelectedBudgetId,
    selectedBudgetData,
    saveCategory,
    removeCategory
  } = useStorageContext();

  /** Automatically fetch budgets from API if there is no cached budget data */
  useEffect(() => {
    if (authenticated && !cachedBudgets) refreshBudgets();
  }, [authenticated, cachedBudgets, refreshBudgets]);

  const [tokenInput, setTokenInput] = useState("");
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);

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
          <button onClick={() => login(tokenInput)}>Login</button>
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

          {categoriesData && selectedBudgetData && (
            <SavedCategoriesView
              savedCategoryData={savedCategoriesData}
              budgetData={selectedBudgetData}
              removeCategory={removeCategory}
            />
          )}

          <h3
            style={{
              marginTop: 8,
              marginBottom: 4,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
            Categories
            <IconButton
              label={categoriesExpanded ? "Collapse" : "Expand"}
              onClick={() => setCategoriesExpanded(!categoriesExpanded)}
              icon={
                categoriesExpanded ? (
                  <ChevronUp size={24} color="black" strokeWidth={2} />
                ) : (
                  <ChevronDown size={24} color="black" strokeWidth={2} />
                )
              }
            />
          </h3>
          {categoriesExpanded &&
            categoryGroupsData &&
            selectedBudgetData &&
            categoryGroupsData.map((categoryGroup) => (
              <CategoryGroupView
                key={categoryGroup.id}
                categoryGroup={categoryGroup}
                budgetData={selectedBudgetData}
                onAddCategory={(id) =>
                  saveCategory({ categoryId: id, budgetId: selectedBudgetId })
                }
              />
            ))}
        </>
      )}
    </div>
  );
}

export default PopupComponent;
