import { Draggable, Droppable } from "@hello-pangea/dnd";
import { Pinned, Plus } from "tabler-icons-react";

import { IconButton } from "~components";
import { AccountView } from "~components/AccountsView";
import { useStorageContext, useYNABContext } from "~lib/context";

/** View of user's saved accounts with balances */
export default function SavedAccountsView() {
  const { selectedBudgetData, savedAccountsData } = useYNABContext();
  const { removeAccount, setPopupState, popupState, settings } = useStorageContext();

  if (!savedAccountsData || !selectedBudgetData || savedAccountsData.length === 0)
    return null;

  return (
    <Droppable droppableId="savedAccounts" isDropDisabled={!popupState.editMode}>
      {(provided) => (
        <section
          {...provided.droppableProps}
          ref={provided.innerRef}
          aria-label="Saved accounts"
          className="mt-md">
          {savedAccountsData.map((account, idx) => (
            <Draggable
              draggableId={account.id}
              key={account.id}
              index={idx}
              isDragDisabled={!popupState.editMode}>
              {(provided) => (
                <div
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
                          onClick={() =>
                            removeAccount({
                              accountId: account.id,
                              budgetId: selectedBudgetData.id
                            })
                          }
                          icon={
                            <Pinned
                              size="1.2rem"
                              fill="var(--action)"
                              color="var(--action)"
                              strokeWidth={1}
                            />
                          }
                        />
                      )
                    }
                    actionElementsRight={
                      <aside className="balance-actions" aria-label="actions">
                        <IconButton
                          rounded
                          accent
                          icon={
                            <Plus size="1.2rem" color="var(--action)" strokeWidth={1} />
                          }
                          label="Add transaction"
                          onClick={() =>
                            setPopupState({
                              view: "txAdd",
                              txAddState: { accountId: account.id }
                            })
                          }
                        />
                      </aside>
                    }
                  />
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </section>
      )}
    </Droppable>
  );
}
