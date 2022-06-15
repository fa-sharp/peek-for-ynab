import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Logout } from "tabler-icons-react";
import type { Category } from "ynab";

import {
  BudgetSelect,
  CategoryGroupView,
  IconButton,
  SavedCategoriesView
} from "~components";
import { AuthProvider, useAuth } from "~lib/authContext";
import { SavedCategory, StorageProvider, useStorageContext } from "~lib/storageContext";
import { YNABProvider, useYNAB } from "~lib/ynabContext";

function MainView() {
  const { login, logout, authenticated } = useAuth();
  const { budgets, categories, categoryGroups } = useYNAB();
  const { savedCategories, setSavedCategories, selectedBudget, setSelectedBudget } =
    useStorageContext();

  /** Data of saved categories in the currently selected budget */
  const savedCategoryData = useMemo(
    () =>
      savedCategories?.reduce<Category[]>((newArray, savedCategory) => {
        if (savedCategory.budgetId === selectedBudget) {
          const categoryData = categories?.find(
            (category) => category.id === savedCategory.categoryId
          );
          if (categoryData) newArray.push(categoryData);
        }
        return newArray;
      }, []),
    [categories, savedCategories, selectedBudget]
  );

  const saveCategory = (categoryToSave: SavedCategory) => {
    const foundDuplicate = savedCategories.find(
      (savedCategory) => savedCategory.categoryId === categoryToSave.categoryId
    );
    if (!foundDuplicate) setSavedCategories([...savedCategories, categoryToSave]);
  };
  const removeCategory = (categoryIdToRemove: string) => {
    setSavedCategories(
      savedCategories.filter(
        (savedCategory) => savedCategory.categoryId !== categoryIdToRemove
      )
    );
  };

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
            {budgets && (
              <BudgetSelect
                budgets={budgets}
                selectedBudget={selectedBudget}
                setSelectedBudget={setSelectedBudget}
              />
            )}
            <IconButton label="Logout" onClick={logout} icon={<Logout />} />
          </div>

          {categories && (
            <SavedCategoriesView
              savedCategoryData={savedCategoryData}
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
            All Categories
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
            categoryGroups &&
            categoryGroups.map((categoryGroup) => (
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
