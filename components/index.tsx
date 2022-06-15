import { MouseEventHandler, ReactElement, useState } from "react"
import { formatCurrency } from "~lib/utils"
import type { BudgetSummary, Category, CategoryGroupWithCategories } from "ynab"
import { ChevronDown, ChevronUp, CircleMinus, CirclePlus } from "tabler-icons-react"

/** View of user's saved categories with balances */
export function SavedCategoriesView({ savedCategoryData, removeCategory }: {
    savedCategoryData: Category[]
    removeCategory: (categoryId: string) => void
}) {
    return (
        <section aria-label="Saved categories" style={{
            display: "flex",
            flexDirection: "column",
            gap: "2px"
        }}>
            {savedCategoryData.map(category =>
                <div key={category.id} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: 'center'
                }}>
                    <div>{category.name}: {formatCurrency(category.balance)}</div>
                    <IconButton label="Remove" onClick={() => removeCategory(category.id)}
                        icon={<CircleMinus size={24} color='gray' strokeWidth={1} />} />
                </div>)
            }
        </section>
    )
}

/** View of a category group - can expand to show all categories and balances */
export function CategoryGroupView({ categoryGroup, onAddCategory }: {
    categoryGroup: CategoryGroupWithCategories,
    onAddCategory: (categoryId: string) => void
}) {
    const [expanded, setExpanded] = useState(false)

    // skip Ready to Assign category group <div>{categoryGroup.categories[0].name}: {categoryGroup.categories[1].balance}</div>
    if (categoryGroup.name === "Internal Master Category")
        return null;

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

/** Dropdown that lets the user select a budget to view */
export function BudgetSelect({ budgets, selectedBudget, setSelectedBudget }: {
    budgets: BudgetSummary[]
    selectedBudget: string
    setSelectedBudget: (budgetId: string) => void
}) {
    return (
        <select value={selectedBudget} onChange={e => setSelectedBudget(e.target.value)}>
            {budgets.map(budget => 
                <option key={budget.id} value={budget.id}>
                    {budget.name}
                </option>)}
        </select>
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