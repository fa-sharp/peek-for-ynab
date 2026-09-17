import { RestrictToVerticalAxis } from "@dnd-kit/abstract/modifiers";
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { isSortable } from "@dnd-kit/react/sortable";
import { useCallback } from "react";

import { AccountView, IconButton, Toolbar } from "~components";
import { useNotificationsContext, useStorageContext, useYNABContext } from "~lib/context";
import {
  AddTransactionIcon,
  DetailIcon,
  DragItemIcon,
  PinnedItemIcon,
} from "../../icons/ActionIcons";
import SavedDraggableItem from "./SavedDraggableItem";

/** View of user's saved accounts with balances */
export default function SavedAccountsView() {
  const { selectedBudgetData, savedAccountsData, addedTransaction } = useYNABContext();
  const { toggleAccount, editingItems, settings, setPopupState, setAccounts } =
    useStorageContext();
  const { currentAlerts } = useNotificationsContext();

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (!editingItems || !savedAccountsData || !isSortable(event.operation.source))
        return;

      const savedAccountIds = savedAccountsData.map((a) => a.id);
      const [accountId] = savedAccountIds.splice(event.operation.source.initialIndex, 1);
      savedAccountIds.splice(event.operation.source.index, 0, accountId);

      setAccounts(savedAccountIds);
    },
    [editingItems, savedAccountsData, setAccounts]
  );

  if (!savedAccountsData || !selectedBudgetData || savedAccountsData.length === 0)
    return null;

  const { id: budgetId, currencyFormat } = selectedBudgetData;

  return (
    <DragDropProvider modifiers={[RestrictToVerticalAxis]} onDragEnd={onDragEnd}>
      <ul aria-label="Pinned accounts" className="list mb-lg">
        {savedAccountsData.map((account, idx) => (
          <SavedDraggableItem
            key={account.id}
            id={account.id}
            index={idx}
            isDragDisabled={!editingItems}>
            {(handleRef) => (
              <AccountView
                key={account.id}
                account={account}
                alerts={currentAlerts?.[budgetId]?.accounts[account.id]}
                currencyFormat={currencyFormat}
                settings={settings}
                addedTransaction={addedTransaction}
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
                        onClick={() => toggleAccount(account.id)}
                        icon={<PinnedItemIcon />}
                      />
                    </div>
                  )
                }
                actionElementsRight={
                  <Toolbar className="list flex-row gap-sm" aria-label="actions">
                    <IconButton
                      rounded
                      accent
                      icon={<AddTransactionIcon />}
                      label="Add transaction"
                      onClick={() =>
                        setPopupState({
                          view: "txAdd",
                          txState: { accountId: account.id },
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
                          detailState: { type: "account", id: account.id },
                        })
                      }
                    />
                  </Toolbar>
                }
              />
            )}
          </SavedDraggableItem>
        ))}
      </ul>
    </DragDropProvider>
  );
}
