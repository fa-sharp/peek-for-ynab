import { useMemo } from "react";

import { useNotificationsContext, useStorageContext, useYNABContext } from "~lib/context";
import { parseTxInput } from "~lib/omnibox";
import useTransaction from "~lib/useTransaction";
import { searchWithinString } from "~lib/utils";

import OmniboxFiltered from "./OmniboxFiltered";
import OmniboxTransaction from "./OmniboxTransaction";

export default function Omnibox() {
  const { budgetSettings, settings, popupState, setPopupState } = useStorageContext();
  const { currentAlerts } = useNotificationsContext();
  const { selectedBudgetData, budgetMainData } = useYNABContext();
  const { formState, handlers, onSaveTransaction, isSaving } = useTransaction();

  /** Parsed search terms for each transaction field */
  const parsedQuery = useMemo(() => {
    if (
      popupState.omnibox &&
      (popupState.omnibox.startsWith("add") || popupState.omnibox.startsWith("transfer"))
    )
      return parseTxInput(popupState.omnibox);
    return null;
  }, [popupState.omnibox]);

  /** Filtered categories and accounts (if not entering a transaction) */
  const filtered = useMemo(() => {
    if (parsedQuery || !budgetMainData || !popupState.omnibox) return null;
    return {
      accounts: budgetMainData.accountsData.filter((a) =>
        searchWithinString(a.name, popupState.omnibox!)
      ),
      categories: budgetMainData.categoriesData.filter((c) =>
        searchWithinString(c.name, popupState.omnibox!)
      )
    };
  }, [budgetMainData, parsedQuery, popupState.omnibox]);

  if (!selectedBudgetData || !budgetMainData || !settings) return null;

  return (
    <form
      className="mb-lg flex-col"
      onSubmit={parsedQuery ? onSaveTransaction : (e) => e.preventDefault()}>
      <label className="form-input">
        <input
          placeholder="🪄 filter or type 'add', 'transfer'..."
          value={popupState.omnibox || ""}
          onChange={(e) => setPopupState({ view: "main", omnibox: e.target.value })}
          disabled={isSaving}
        />
      </label>
      {filtered ? (
        <OmniboxFiltered
          {...{
            budget: selectedBudgetData,
            budgetMainData,
            filtered,
            settings,
            currentAlerts,
            openTxForm: (txAddState) => setPopupState({ view: "txAdd", txAddState })
          }}
        />
      ) : parsedQuery ? (
        <OmniboxTransaction
          {...{
            budget: selectedBudgetData,
            budgetMainData,
            formState,
            handlers,
            isSaving,
            parsedQuery,
            defaultAccountId: budgetSettings?.transactions.defaultAccountId,
            openTxForm: (txAddState) => setPopupState({ view: "txAdd", txAddState })
          }}
        />
      ) : null}
    </form>
  );
}
