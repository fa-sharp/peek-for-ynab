import { useStorage } from "@plasmohq/storage";
import { useState } from "react"
import { CategoryGroupView, SavedCategoryView } from "~components";
import { AuthProvider, useAuth } from "~lib/authContext";
import { useYNAB, YNABProvider } from "~lib/ynabContext"

export interface SavedCategory {
  budgetId: string
  categoryGroupId: string
  categoryId: string
}

function MainView() {
  const { login, logout, authenticated } = useAuth();
  const { budgets, categories, selectedBudget, setSelectedBudget } = useYNAB();

  const [savedCategories, setSavedCategories] = useStorage<SavedCategory[]>("savedCategories", []);
  const saveCategory = (category: SavedCategory) =>
    setSavedCategories([...savedCategories, category])

  const [tokenInput, setTokenInput] = useState("");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: 16,
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
          <h3>Saved Categories</h3>
          {!categories ? "Loading..."
            : <SavedCategoryView categoryData={categories} savedCategories={savedCategories} />
          }

          <h3>Budgets</h3>
          {!budgets ? "Loading..." :
            budgets.map(budget =>
              <div key={budget.id}>{budget.name} <button onClick={() => setSelectedBudget(budget.id)}>Select</button></div>
            )
          }
          <h3>Categories</h3>
          {categories &&
            categories.map((categoryGroup, idx) =>
              idx === 0 ?
                <div>{categoryGroup.categories[0].name}: {categoryGroup.categories[1].balance}</div>
                : <CategoryGroupView key={categoryGroup.id} categoryGroup={categoryGroup}
                  onAddCategory={(id) => saveCategory({ categoryId: id, budgetId: selectedBudget, categoryGroupId: categoryGroup.id })} />
            )}
        </>}
    </div>
  )
}

function IndexPopup() {

  return (
    <AuthProvider>
      <YNABProvider>
        <MainView />
      </YNABProvider>
    </AuthProvider>
  )
}

export default IndexPopup
