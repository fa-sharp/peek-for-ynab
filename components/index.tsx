import { MouseEventHandler, ReactElement, useState } from "react"
import { formatCurrency } from "~lib/utils"
import type { SavedCategory } from "~lib/storageContext"
import type { Category, CategoryGroupWithCategories } from "ynab"
import { ChevronDown, ChevronUp, CircleMinus, CirclePlus } from "tabler-icons-react"

/** View of user's saved categories with balances */
export function SavedCategoriesView({ savedCategories, categoryData, currentBudgetId, removeCategory }: {
    savedCategories: SavedCategory[]
    removeCategory: (savedCategory: SavedCategory) => void
    currentBudgetId: string
    /** Flattened list of user's categories */
    categoryData: Category[]
}) {
    return (
        <section style={{
            display: "flex",
            flexDirection: "column",
            gap: "2px"
        }}>
            {savedCategories.map(savedCategory => {
                // Skip if saved category not in current budget
                if (savedCategory.budgetId !== currentBudgetId) return null;

                // Find the category data
                const category = categoryData.find(category => category.id === savedCategory.categoryId);
                if (!category) return null; // skip if category not found

                return (
                    <div key={category.id} style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: 'center'
                    }}>
                        <div>{category.name}: {formatCurrency(category.balance)}</div>
                        <IconButton label="Remove" onClick={() => removeCategory(savedCategory)} 
                            icon={<CircleMinus size={24} color='gray' strokeWidth={1} />} />
                    </div>)
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

    // skip Ready to Assign category group
    if (categoryGroup.name === "Internal Master Category")
        return null;
        // <div>{categoryGroup.categories[0].name}: {categoryGroup.categories[1].balance}</div>

    return (
        <>
            <h4 style={{
                marginBlock: 4,
                display: "flex",
                justifyContent: "space-between",
                alignItems: 'center'
            }}>
                {categoryGroup.name}
                <IconButton label={expanded ? "Collapse" : "Expand"}
                    onClick={() => setExpanded(!expanded)}
                    icon={expanded ? <ChevronUp size={24} color='gray' strokeWidth={1} />
                        : <ChevronDown size={24} color='gray' strokeWidth={1} />} />
            </h4>
            {expanded &&
                categoryGroup.categories.map(category =>
                    <div key={category.id} style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: 'center'
                    }}>
                        {category.name}: {formatCurrency(category.balance)}
                        <IconButton label="Add" onClick={() => onAddCategory(category.id)} 
                            icon={<CirclePlus size={24} color='gray' strokeWidth={1} />} />
                    </div>
                )}
        </>
    )
}

export function IconButton({ icon, onClick, label }: {
    label: string
    onClick: MouseEventHandler
    icon: ReactElement
}) {
    return (
        <button aria-label={label} title={label} onClick={onClick}
            style={{
                background: 'none',
                border: 'none',
                lineHeight: 0,
                cursor: 'pointer'
            }}>
            {icon}
        </button>
    )
}