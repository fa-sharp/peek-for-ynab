import { RestrictToVerticalAxis } from "@dnd-kit/abstract/modifiers";
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { isSortable } from "@dnd-kit/react/sortable";
import { useCallback } from "react";

import { CategoryView, IconButton, Toolbar } from "~components";
import { useNotificationsContext, useStorageContext, useYNABContext } from "~lib/context";
import { findCCAccount, millisToStringValue } from "~lib/utils";
import {
  AddCCPaymentIcon,
  AddTransactionIcon,
  DetailIcon,
  DragItemIcon,
  PinnedItemIcon,
} from "../../icons/ActionIcons";
import SavedDraggableItem from "./SavedDraggableItem";

/** View of user's saved categories with balances */
export default function SavedCategoriesView() {
  const { toggleCategory, settings, editingItems, setCategories } = useStorageContext();
  const {
    accountsData,
    selectedBudgetData,
    savedCategoriesData,
    addedTransaction,
    movedTransaction,
  } = useYNABContext();
  const { setPopupState } = useStorageContext();
  const { currentAlerts } = useNotificationsContext();

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (!editingItems || !savedCategoriesData || !isSortable(event.operation.source))
        return;

      const savedCategoryIds = savedCategoriesData.map((c) => c.id);
      const [categoryId] = savedCategoryIds.splice(
        event.operation.source.initialIndex,
        1
      );
      savedCategoryIds.splice(event.operation.source.index, 0, categoryId);

      setCategories(savedCategoryIds);
    },
    [editingItems, savedCategoriesData, setCategories]
  );

  if (!selectedBudgetData || !savedCategoriesData || savedCategoriesData.length === 0)
    return null;

  const { id: budgetId, currencyFormat } = selectedBudgetData;

  return (
    <DragDropProvider modifiers={[RestrictToVerticalAxis]} onDragEnd={onDragEnd}>
      <ul aria-label="Pinned categories" className="list mb-lg">
        {savedCategoriesData.map((category, idx) => {
          // The corresponding credit card account, if this is a CCP category
          const ccAccount =
            category.category_group_name === "Credit Card Payments" && accountsData
              ? findCCAccount(accountsData, category.name)
              : undefined;

          return (
            <SavedDraggableItem
              key={category.id}
              id={category.id}
              index={idx}
              isDragDisabled={!editingItems}>
              {(handleRef) => (
                <CategoryView
                  categoryData={category}
                  currencyFormat={currencyFormat}
                  alerts={currentAlerts?.[budgetId]?.cats[category.id]}
                  settings={settings}
                  addedTransaction={addedTransaction}
                  moved={movedTransaction}
                  actionElementsLeft={
                    !editingItems ? null : (
                      <div className="flex-row gap-sm">
                        <IconButton
                          ref={handleRef}
                          label="Move"
                          className="cursor-grab"
                          icon={<DragItemIcon />}
                        />
                        <IconButton
                          label="Unpin"
                          onClick={() => toggleCategory(category.id)}
                          icon={<PinnedItemIcon />}
                        />
                      </div>
                    )
                  }
                  actionElementsRight={
                    <Toolbar className="list flex-row gap-sm" aria-label="actions">
                      {!ccAccount ? (
                        <>
                          <IconButton
                            rounded
                            accent
                            icon={<AddTransactionIcon />}
                            label="Add transaction"
                            onClick={() =>
                              setPopupState({
                                view: "txAdd",
                                txState: { categoryId: category.id },
                              })
                            }
                          />
                          <IconButton
                            accent
                            rounded
                            icon={<DetailIcon />}
                            label="Details/Activity"
                            onClick={() =>
                              setPopupState({
                                view: "detail",
                                detailState: {
                                  type: "category",
                                  id: category.id,
                                },
                              })
                            }
                          />
                        </>
                      ) : (
                        <IconButton
                          rounded
                          accent
                          icon={<AddCCPaymentIcon />}
                          label="Add credit card payment"
                          onClick={() =>
                            ccAccount.transfer_payee_id &&
                            setPopupState({
                              view: "txAdd",
                              txState: {
                                isTransfer: true,
                                amount:
                                  category.balance >= 0
                                    ? millisToStringValue(
                                        category.balance,
                                        currencyFormat
                                      )
                                    : undefined,
                                amountType: "Inflow",
                                accountId: ccAccount.id,
                              },
                            })
                          }
                        />
                      )}
                    </Toolbar>
                  }
                />
              )}
            </SavedDraggableItem>
          );
        })}
      </ul>
    </DragDropProvider>
  );
}
