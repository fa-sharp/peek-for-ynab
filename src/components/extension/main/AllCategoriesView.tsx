import { useId, useState } from "react";
import type { Account, CategoryGroupWithCategories } from "ynab";

import { CategoryView, IconButton, IconSpan } from "~components";
import { useNotificationsContext, useStorageContext, useYNABContext } from "~lib/context";
import type { CategoryAlerts } from "~lib/notifications";
import type { AppSettings, CachedBudget, TxAddInitialState } from "~lib/types";
import { findCCAccount, millisToStringValue } from "~lib/utils";

import {
  AddCCPaymentIcon,
  AddTransactionIcon,
  CollapseListIcon,
  CollapseListIconBold,
  ExpandListIcon,
  ExpandListIconBold,
  PinItemIcon,
  PinnedItemIcon
} from "../../icons/ActionIcons";

/** View of all categories in a budget, grouped by category groups */
function CategoriesView() {
  const {
    savedCategories,
    saveCategory,
    setPopupState,
    setTxState,
    popupState,
    editingItems,
    settings
  } = useStorageContext();
  const { selectedBudgetData, accountsData, categoryGroupsData } = useYNABContext();
  const { currentAlerts } = useNotificationsContext();

  const [expanded, setExpanded] = useState(false);
  const controlsId = useId();

  if (
    !popupState ||
    !selectedBudgetData ||
    !categoryGroupsData ||
    !savedCategories ||
    !settings
  )
    return null;

  return (
    <>
      <div
        className="heading-medium cursor-pointer"
        onClick={() => setExpanded(!expanded)}>
        <IconButton
          aria-expanded={expanded}
          aria-controls={controlsId}
          label={expanded ? "Collapse" : "Expand"}
          onClick={() => setExpanded(!expanded)}
          icon={expanded ? <CollapseListIconBold /> : <ExpandListIconBold />}
        />
        <div role="heading">Categories</div>
      </div>
      {expanded && (
        <ul id={controlsId} className="list">
          {categoryGroupsData.map((categoryGroup) => (
            <CategoryGroupView
              key={categoryGroup.id}
              categoryGroup={categoryGroup}
              categoryAlerts={currentAlerts?.[selectedBudgetData.id]?.cats}
              budgetData={selectedBudgetData}
              accountsData={accountsData}
              savedCategories={savedCategories[selectedBudgetData.id]}
              editMode={editingItems}
              settings={settings}
              onSaveCategory={(categoryId) => saveCategory(categoryId)}
              onAddTx={async (txAddState) => {
                await setTxState(txAddState);
                setPopupState({ view: "txAdd" });
              }}
            />
          ))}
        </ul>
      )}
    </>
  );
}

/** View of a category group - can expand to show all categories and balances */
export function CategoryGroupView({
  categoryGroup,
  categoryAlerts,
  budgetData,
  accountsData,
  savedCategories,
  onSaveCategory,
  editMode,
  settings,
  onAddTx
}: {
  categoryGroup: CategoryGroupWithCategories;
  categoryAlerts?: CategoryAlerts;
  accountsData?: Account[];
  budgetData: CachedBudget;
  savedCategories?: string[];
  onSaveCategory: (categoryId: string) => void;
  editMode?: boolean;
  settings: AppSettings;
  onAddTx: (initialState: TxAddInitialState) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const controlsId = useId();

  // Skip Ready to Assign category group
  if (categoryGroup.name === "Internal Master Category") return null;

  return (
    <li>
      <div
        className="heading-small heading-bordered cursor-pointer"
        onClick={() => setExpanded(!expanded)}>
        <IconButton
          aria-controls={controlsId}
          aria-expanded={expanded}
          label={expanded ? "Collapse" : "Expand"}
          onClick={() => setExpanded(!expanded)}
          icon={expanded ? <CollapseListIcon /> : <ExpandListIcon />}
        />
        <div role="heading">{categoryGroup.name}</div>
      </div>
      {expanded && (
        <ul id={controlsId} className="list">
          {categoryGroup.categories.map((category) => {
            /** The corresponding credit card account, if this is a CCP category */
            const ccAccount =
              categoryGroup.name === "Credit Card Payments" && accountsData
                ? findCCAccount(accountsData, category.name)
                : undefined;
            return (
              <li key={category.id}>
                <CategoryView
                  categoryData={category}
                  currencyFormat={budgetData.currencyFormat}
                  alerts={categoryAlerts?.[category.id]}
                  settings={settings}
                  actionElementsLeft={
                    !editMode ? null : savedCategories?.some(
                        (id) => id === category.id
                      ) ? (
                      <IconSpan icon={<PinnedItemIcon />} label="Pinned" />
                    ) : (
                      <IconButton
                        icon={<PinItemIcon />}
                        label="Pin"
                        onClick={() => onSaveCategory(category.id)}
                      />
                    )
                  }
                  actionElementsRight={
                    <aside className="balance-actions" aria-label="actions">
                      {!ccAccount ? (
                        <IconButton
                          rounded
                          accent
                          icon={<AddTransactionIcon />}
                          label="Add transaction"
                          onClick={() => onAddTx({ categoryId: category.id })}
                        />
                      ) : (
                        <IconButton
                          rounded
                          accent
                          icon={<AddCCPaymentIcon />}
                          label="Add credit card payment"
                          onClick={() =>
                            ccAccount.transfer_payee_id &&
                            onAddTx({
                              isTransfer: true,
                              amount:
                                category.balance >= 0
                                  ? millisToStringValue(
                                      category.balance,
                                      budgetData.currencyFormat
                                    )
                                  : undefined,
                              amountType: "Inflow",
                              accountId: ccAccount.id
                            })
                          }
                        />
                      )}
                    </aside>
                  }
                />
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

export default CategoriesView;
