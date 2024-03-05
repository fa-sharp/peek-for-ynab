import { Draggable, Droppable } from "@hello-pangea/dnd";
import { List } from "tabler-icons-react";

import { AccountView, IconButton } from "~components";
import { useStorageContext, useYNABContext } from "~lib/context";

import { AddTransactionIcon, PinnedItemIcon } from "../../icons/ActionIcons";

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
                          icon={
                            <List size={"1.3rem"} color="var(--action)" strokeWidth={1} />
                          }
                          label={`List transactions in '${account.name}'`}
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
