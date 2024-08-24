import { Draggable, Droppable } from "@hello-pangea/dnd";

import { CategoryView, IconButton } from "~components";
import { useNotificationsContext, useStorageContext, useYNABContext } from "~lib/context";
import { findCCAccount, millisToStringValue } from "~lib/utils";

import {
  AddCCPaymentIcon,
  AddTransactionIcon,
  DetailIcon,
  PinnedItemIcon
} from "../../icons/ActionIcons";

/** View of user's saved categories with balances */
export default function SavedCategoriesView() {
  const { removeCategory, settings, popupState, setPopupState } = useStorageContext();
  const { accountsData, selectedBudgetData, savedCategoriesData } = useYNABContext();
  const { currentAlerts } = useNotificationsContext();

  if (
    !selectedBudgetData ||
    !savedCategoriesData ||
    !settings ||
    savedCategoriesData.length === 0
  )
    return null;

  const { currencyFormat } = selectedBudgetData;

  return (
    <Droppable droppableId="savedCategories" isDropDisabled={!popupState.editMode}>
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
                isDragDisabled={!popupState.editMode}>
                {(provided) => (
                  <li
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={provided.draggableProps.style}>
                    <CategoryView
                      categoryData={category}
                      currencyFormat={currencyFormat}
                      alerts={currentAlerts?.[selectedBudgetData.id]?.cats[category.id]}
                      settings={settings}
                      actionElementsLeft={
                        !popupState.editMode ? null : (
                          <IconButton
                            label="Unpin"
                            onClick={() => removeCategory(category.id)}
                            icon={<PinnedItemIcon />}
                          />
                        )
                      }
                      actionElementsRight={
                        <aside className="flex-row gap-xs" aria-label="actions">
                          {!ccAccount ? (
                            <IconButton
                              rounded
                              accent
                              icon={<AddTransactionIcon />}
                              label="Add transaction"
                              onClick={() =>
                                setPopupState({
                                  view: "txAdd",
                                  txAddState: { categoryId: category.id }
                                })
                              }
                            />
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
                                  txAddState: {
                                    isTransfer: true,
                                    amount:
                                      category.balance >= 0
                                        ? millisToStringValue(
                                            category.balance,
                                            currencyFormat
                                          )
                                        : undefined,
                                    amountType: "Inflow",
                                    accountId: ccAccount.id
                                  }
                                })
                              }
                            />
                          )}
                          {category.category_group_name !== "Credit Card Payments" && (
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
                                    id: category.id
                                  }
                                })
                              }
                            />
                          )}
                        </aside>
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
