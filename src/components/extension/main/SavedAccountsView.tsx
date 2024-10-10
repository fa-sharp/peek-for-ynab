import { Draggable, Droppable } from "@hello-pangea/dnd";

import { AccountView, IconButton } from "~components";
import { useNotificationsContext, useStorageContext, useYNABContext } from "~lib/context";

import { AddTransactionIcon, DetailIcon, PinnedItemIcon } from "../../icons/ActionIcons";

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
                      <menu className="list flex-row gap-sm" aria-label="actions">
                        <li className="flex-row">
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
                        </li>
                        <li className="flex-row">
                          <IconButton
                            accent
                            rounded
                            icon={<DetailIcon />}
                            label="Details/Activity"
                            onClick={() =>
                              setPopupState({
                                view: "detail",
                                detailState: { type: "account", id: account.id }
                              })
                            }
                          />
                        </li>
                      </menu>
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
