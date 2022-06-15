import { useState } from "react"
import { CategoryGroupView, SavedCategoriesView } from "~components";
import { AuthProvider, useAuth } from "~lib/authContext";
import { SavedCategory, StorageProvider, useStorageContext } from "~lib/storageContext";
import { useYNAB, YNABProvider } from "~lib/ynabContext"


function MainView() {
  const { login, logout, authenticated } = useAuth();
  const { budgets, categories, categoryGroups } = useYNAB();
  const { savedCategories, setSavedCategories, selectedBudget, setSelectedBudget } = useStorageContext();

  const saveCategory = (categoryToSave: SavedCategory) => {
    const foundDuplicate = savedCategories.find(savedCategory => savedCategory.categoryId === categoryToSave.categoryId)
    if (!foundDuplicate) setSavedCategories([...savedCategories, categoryToSave])
  }
  const removeCategory = (categoryToRemove: SavedCategory) => {
    setSavedCategories(savedCategories.filter(savedCategory =>
      savedCategory.categoryId !== categoryToRemove.categoryId));
  }

  const [tokenInput, setTokenInput] = useState("");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: 16,
        minWidth: '240px',
        width: 'max-content'
      }}>
      {!authenticated ?
        <div>
          <label>Token: </label>
          <input value={tokenInput} onChange={e => setTokenInput(e.target.value)} />
          <button onClick={() => login(tokenInput)}>Login</button>
        </div>
        :
        <>
          <button onClick={logout}>Logout</button>
          {categories &&
            <SavedCategoriesView
              currentBudgetId={selectedBudget}
              categoryData={categories}
              savedCategories={savedCategories}
              removeCategory={removeCategory} />
          }

          <h3>Budgets</h3>
          {!budgets ? "Loading..." :
            budgets.map(budget =>
              <div key={budget.id}>{budget.name} <button onClick={() => setSelectedBudget(budget.id)}>Select</button></div>
            )
          }
          <h3>Categories</h3>
          {categoryGroups &&
            categoryGroups.map((categoryGroup) =>
              <CategoryGroupView key={categoryGroup.id}
                categoryGroup={categoryGroup}
                onAddCategory={(id) => saveCategory({ categoryId: id, budgetId: selectedBudget })} />
            )}
        </>}
    </div>
  )
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
  )
}

export default IndexPopup
