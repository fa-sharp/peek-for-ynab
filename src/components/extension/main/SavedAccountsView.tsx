import { Draggable, Droppable } from "@hello-pangea/dnd";

import { AccountView, IconButton } from "~components";
import { useNotificationsContext, useStorageContext, useYNABContext } from "~lib/context";

import { AddTransactionIcon, PinnedItemIcon } from "../../icons/ActionIcons";

/** View of user's saved accounts with balances */
export default function SavedAccountsView() {
  const { selectedBudgetData, savedAccountsData, addedTransaction } = useYNABContext();
  const { removeAccount, setPopupState, popupState, editingItems, settings, setTxState } =
    useStorageContext();
  const { currentAlerts } = useNotificationsContext();

  if (
    !popupState ||
    !savedAccountsData ||
    !selectedBudgetData ||
    !settings ||
    savedAccountsData.length === 0
  )
    return null;

  return (
    <Droppable droppableId="savedAccounts" isDropDisabled={!editingItems}>
      {(provided) => (
        <ul
          {...provided.droppableProps}
          ref={provided.innerRef}
          aria-label="Pinned accounts"
          className="list mb-lg">
          {savedAccountsData.map((account, idx) => (
            <Draggable
              draggableId={account.id}
              key={account.id}
              index={idx}
              isDragDisabled={!editingItems}>
              {(provided) => (
                <li
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  style={provided.draggableProps.style}>
                  <AccountView
                    key={account.id}
                    account={account}
                    alerts={currentAlerts?.[selectedBudgetData.id]?.accounts[account.id]}
                    currencyFormat={selectedBudgetData?.currencyFormat}
                    settings={settings}
                    addedTransaction={addedTransaction}
                    actionElementsLeft={
                      !editingItems ? null : (
                        <IconButton
                          label="Unpin"
                          onClick={() => removeAccount(account.id)}
                          icon={<PinnedItemIcon />}
                        />
                      )
                    }
                    actionElementsRight={
                      <aside className="balance-actions" aria-label="actions">
                        <IconButton
                          rounded
                          accent
                          icon={<AddTransactionIcon />}
                          label="Add transaction"
                          onClick={() =>
                            setTxState({ accountId: account.id }).then(() =>
                              setPopupState({ view: "txAdd" })
                            )
                          }
                        />
                      </aside>
                    }
                  />
                </li>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </ul>
      )}
    </Droppable>
  );
}
