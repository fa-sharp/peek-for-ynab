import { Draggable, Droppable } from "@hello-pangea/dnd";

import { CategoryView, IconButton, Toolbar } from "~components";
import { useNotificationsContext, useStorageContext, useYNABContext } from "~lib/context";
import { findCCAccount, millisToStringValue } from "~lib/utils";
import {
  AddCCPaymentIcon,
  AddTransactionIcon,
  DetailIcon,
  PinnedItemIcon,
} from "../../icons/ActionIcons";

/** View of user's saved categories with balances */
export default function SavedCategoriesView() {
  const { toggleCategory, settings, editingItems } = useStorageContext();
  const {
    accountsData,
    selectedBudgetData,
    savedCategoriesData,
    addedTransaction,
    moved,
  } = useYNABContext();
  const { setPopupState } = useStorageContext();
  const { currentAlerts } = useNotificationsContext();

  if (!selectedBudgetData || !savedCategoriesData || savedCategoriesData.length === 0)
    return null;

  const { id: budgetId, currencyFormat } = selectedBudgetData;

  return (
    <Droppable droppableId="savedCategories" isDropDisabled={!editingItems}>
      {(provided) => (
        <ul
          {...provided.droppableProps}
          ref={provided.innerRef}
          aria-label="Pinned categories"
          className="list mb-lg">
          {savedCategoriesData.map((category, idx) => {
            /** The corresponding credit card account, if this is a CCP category */
            const ccAccount =
              category.category_group_name === "Credit Card Payments" && accountsData
                ? findCCAccount(accountsData, category.name)
                : undefined;
            return (
              <Draggable
                draggableId={category.id}
                key={category.id}
                index={idx}
                isDragDisabled={!editingItems}>
                {(provided) => (
                  <li
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={provided.draggableProps.style}>
                    <CategoryView
                      categoryData={category}
                      currencyFormat={currencyFormat}
                      alerts={currentAlerts?.[budgetId]?.cats[category.id]}
                      settings={settings}
                      addedTransaction={addedTransaction}
                      moved={moved}
                      actionElementsLeft={
                        !editingItems ? null : (
                          <IconButton
                            label="Unpin"
                            onClick={() => toggleCategory(category.id)}
                            icon={<PinnedItemIcon />}
                          />
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
                  </li>
                )}
              </Draggable>
            );
          })}
          {provided.placeholder}
        </ul>
      )}
    </Droppable>
  );
}
