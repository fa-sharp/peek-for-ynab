import { useState } from "react";
import { ChevronDown, ChevronUp, Logout } from "tabler-icons-react";

import {
  BudgetSelect,
  CategoryGroupView,
  IconButton,
  SavedCategoriesView
} from "~components";
import { AuthProvider, useAuth } from "~lib/authContext";
import { StorageProvider, useStorageContext } from "~lib/storageContext";
import { YNABProvider, useYNAB } from "~lib/ynabContext";

function MainView() {
  const { login, logout, authenticated } = useAuth();
  const { budgetsData, categoriesData, categoryGroupsData, savedCategoriesData } =
    useYNAB();
  const { saveCategory, removeCategory, selectedBudget, setSelectedBudget } =
    useStorageContext();

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
            {budgetsData && (
              <BudgetSelect
                budgets={budgetsData}
                selectedBudget={selectedBudget}
                setSelectedBudget={setSelectedBudget}
              />
            )}
            <IconButton label="Logout" onClick={logout} icon={<Logout />} />
          </div>

          {categoriesData && (
            <SavedCategoriesView
              savedCategoryData={savedCategoriesData}
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
            categoryGroupsData.map((categoryGroup) => (
              <CategoryGroupView
                key={categoryGroup.id}
                categoryGroup={categoryGroup}
                onAddCategory={(id) =>
                  saveCategory({ categoryId: id, budgetId: selectedBudget })
                }
              />
            ))}
        </>
      )}
    </div>
  );
}

function IndexPopup() {
  return (
    <StorageProvider>
      <AuthProvider>
        <YNABProvider>
          <MainView />
        </YNABProvider>
      </AuthProvider>
    </StorageProvider>
  );
}

export default IndexPopup;
