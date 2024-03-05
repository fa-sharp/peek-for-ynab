import { Draggable, Droppable } from "@hello-pangea/dnd";

import { AccountView, IconButton } from "~components";
import { useStorageContext, useYNABContext } from "~lib/context";

import { AddTransactionIcon, DetailIcon, PinnedItemIcon } from "../../icons/ActionIcons";

/** View of user's saved accounts with balances */
export default function SavedAccountsView() {
  const { selectedBudgetData, savedAccountsData } = useYNABContext();
  const { removeAccount, setPopupState, popupState, settings } = useStorageContext();

  if (
    !savedAccountsData ||
    !selectedBudgetData ||
    !settings ||
    savedAccountsData.length === 0
  )
    return null;

  return (
    <Droppable droppableId="savedAccounts" isDropDisabled={!popupState.editMode}>
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
              isDragDisabled={!popupState.editMode}>
              {(provided) => (
                <li
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  style={provided.draggableProps.style}>
                  <AccountView
                    key={account.id}
                    account={account}
                    currencyFormat={selectedBudgetData?.currencyFormat}
                    settings={settings}
                    actionElementsLeft={
                      !popupState.editMode ? null : (
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
                            setPopupState({
                              view: "txAdd",
                              txAddState: { accountId: account.id }
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
                              detailState: { type: "account", id: account.id }
                            })
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
