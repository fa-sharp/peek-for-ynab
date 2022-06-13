import { useStorage } from "@plasmohq/storage";
import { useState } from "react"
import type { CategoryGroupWithCategories, Category } from "ynab";
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
      <h4 style={{ margin: 4 }}>{categoryGroup.name}
        <button onClick={() => setExpanded(!expanded)}>{!expanded ? "Expand" : "Collapse"}</button></h4>
      {expanded &&
        categoryGroup.categories.map(category =>
          <div key={category.id}>{category.name}: {formatCurrency(category.balance)}
            <button onClick={() => onAddCategory(category.id)}>Add</button></div>
        )}
    </>
  )
}

function MainView() {
  const { budgets, categories, selectedBudget, setSelectedBudget } = useYNAB();
  const [savedCategories, setSavedCategories] = useStorage<SavedCategory[]>("savedCategories", []);

  const onAddCategory = (category: SavedCategory) => setSavedCategories([...savedCategories, category])

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: 16
      }}>
      <h1>
        Welcome to your <a href="https://www.plasmo.com">Plasmo</a> Extension!
      </h1>
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
    </div>
  )
}

function IndexPopup() {

  return (
    <YNABProvider>
      <MainView />
    </YNABProvider>
  )
}

export default IndexPopup
