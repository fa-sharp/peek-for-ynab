import { useStorage } from "@plasmohq/storage";
import { useState } from "react"
import type { CategoryGroupWithCategories } from "ynab";
import { AuthProvider, useAuth } from "~lib/authContext";
import { formatCurrency } from "~lib/utils";
import { useYNAB, YNABProvider } from "~lib/ynabContext"

interface SavedCategory {
  budgetId: string
  categoryGroupId: string
  categoryId: string
}

function CategoryGroupView({ categoryGroup, onAddCategory }: { categoryGroup: CategoryGroupWithCategories, onAddCategory: (categoryId: string) => void }) {

  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <h4 style={{ margin: 4 }}>
        {categoryGroup.name}
        <button onClick={() => setExpanded(!expanded)}>
          {expanded ? "Collapse" : "Expand"}
        </button>
      </h4>
      {expanded &&
        categoryGroup.categories.map(category =>
          <div key={category.id}>
            {category.name}: {formatCurrency(category.balance)}
            <button onClick={() => onAddCategory(category.id)}>Add</button>
          </div>
        )}
    </>
  )
}

function MainView() {
  const { login, logout, authenticated } = useAuth();
  const { budgets, categories, selectedBudget, setSelectedBudget } = useYNAB();

  const [savedCategories, setSavedCategories] = useStorage<SavedCategory[]>("savedCategories", []);
  const onAddCategory = (category: SavedCategory) =>
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
      <h1>
        YNAB Chrome Widget
      </h1>
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
          {savedCategories.map(savedCategory => {
            const categoryGroup = categories?.find(categoryGroup => categoryGroup.id === savedCategory.categoryGroupId);
            const category = categoryGroup?.categories.find(category => category.id === savedCategory.categoryId);
            if (!category) return (<div>"Category not found!"</div>)

            return (
              <div key={category.id}>{category.name}: {formatCurrency(category.balance)}</div>
            )
          })}
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
                  onAddCategory={(id) => onAddCategory({ categoryId: id, budgetId: selectedBudget, categoryGroupId: categoryGroup.id })} />
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
