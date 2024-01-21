import { Draggable, Droppable } from "@hello-pangea/dnd";

import { IconButton } from "~components";
import { CategoryView } from "~components/CategoriesView";
import { useStorageContext, useYNABContext } from "~lib/context";
import { findCCAccount, millisToStringValue } from "~lib/utils";

import {
  AddCCPaymentIcon,
  AddTransactionIcon,
  PinnedItemIcon
} from "./icons/ActionIcons";

/** View of user's saved categories with balances */
export default function SavedCategoriesView() {
  const { removeCategory, settings, popupState, setPopupState } = useStorageContext();
  const { accountsData, selectedBudgetData, savedCategoriesData } = useYNABContext();

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
          className="list">
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
                        <aside className="balance-actions" aria-label="actions">
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
                                    amount: millisToStringValue(
                                      category.balance,
                                      currencyFormat
                                    ),
                                    payee: {
                                      id: ccAccount.transfer_payee_id,
                                      name: ccAccount.name,
                                      transferId: ccAccount.id
                                    }
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
