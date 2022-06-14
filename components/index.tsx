import { useState } from "react"
import { formatCurrency } from "~lib/utils"

import type { CategoryGroupWithCategories } from "ynab"
import type { SavedCategory } from "~popup"
import { CircleMinus } from "tabler-icons-react"

/** View of user's saved categories with balances */
export function SavedCategoriesView({ savedCategories, categoryData, currentBudgetId, removeCategory }: {
    savedCategories: SavedCategory[]
    removeCategory: (savedCategory: SavedCategory) => void
    currentBudgetId: string
    categoryData: CategoryGroupWithCategories[]
}) {
    return (
        <section style={{
            display: "flex",
            flexDirection: "column",
            gap: "2px"
        }}>
            {savedCategories.map(savedCategory => {
                if (savedCategory.budgetId !== currentBudgetId)
                    return null;
                
                const categoryGroup = categoryData.find(categoryGroup => categoryGroup.id === savedCategory.categoryGroupId);
                const category = categoryGroup?.categories.find(category => category.id === savedCategory.categoryId);

                return !category ?
                    <div>"Category not found!"</div>
                    : <div key={category.id} style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: 'center'
                    }}>
                        <div>{category.name}: {formatCurrency(category.balance)}</div>
                        <button aria-label="Remove" onClick={() => removeCategory(savedCategory)}
                            style={{
                                background: 'none',
                                border: 'none',
                                lineHeight: 0,
                                cursor: 'pointer'
                            }}>
                            <CircleMinus size={24} color='gray' strokeWidth={1} />
                        </button>
                    </div>
            })}
        </section>
    )
}

/** View of a category group - can expand to show all categories and balances */
export function CategoryGroupView({ categoryGroup, onAddCategory }: {
    categoryGroup: CategoryGroupWithCategories,
    onAddCategory: (categoryId: string) => void
}) {
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