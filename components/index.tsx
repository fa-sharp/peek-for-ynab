import { useState } from "react"
import { formatCurrency } from "~lib/utils"

import type { CategoryGroupWithCategories } from "ynab"
import type { SavedCategory } from "~popup"

/** View of user's saved categories with balances */
export function SavedCategoryView({ savedCategories, categoryData }: {
    savedCategories: SavedCategory[]
    categoryData: CategoryGroupWithCategories[]
}) {
    return (
        <>
            {savedCategories.map(savedCategory => {
                const categoryGroup = categoryData.find(categoryGroup => categoryGroup.id === savedCategory.categoryGroupId);
                const category = categoryGroup?.categories.find(category => category.id === savedCategory.categoryId);

                return !category ?
                    <div>"Category not found!"</div>
                    : <div key={category.id}>{category.name}: {formatCurrency(category.balance)}</div>
            })}
        </>
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