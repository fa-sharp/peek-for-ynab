import { useMemo } from "react";

import { useNotificationsContext, useStorageContext, useYNABContext } from "~lib/context";
import { parseTxInput } from "~lib/omnibox";
import useTransaction from "~lib/useTransaction";
import { searchWithinString } from "~lib/utils";

import OmniboxFiltered from "./OmniboxFiltered";
import OmniboxTransaction from "./OmniboxTransaction";

export default function Omnibox() {
  const { budgetSettings, settings, setPopupState, omniboxInput, setOmniboxInput } =
    useStorageContext();
  const { currentAlerts } = useNotificationsContext();
  const { selectedBudgetData, budgetMainData } = useYNABContext();
  const { formState, handlers, onSaveTransaction, isSaving } = useTransaction();

  /** Parsed search terms for each transaction field */
  const parsedQuery = useMemo(() => {
    if (omniboxInput.startsWith("add") || omniboxInput.startsWith("transfer"))
      return parseTxInput(omniboxInput);
    return null;
  }, [omniboxInput]);

  /** Filtered categories and accounts (if not entering a transaction) */
  const filtered = useMemo(() => {
    if (parsedQuery || !budgetMainData || !omniboxInput) return null;
    return {
      accounts: budgetMainData.accountsData.filter((a) =>
        searchWithinString(a.name, omniboxInput)
      ),
      categories: budgetMainData.categoriesData
        .filter((c) => c.category_group_name !== "Internal Master Category")
        .filter((c) => searchWithinString(c.name, omniboxInput))
    };
  }, [budgetMainData, parsedQuery, omniboxInput]);

  if (!selectedBudgetData || !budgetMainData || !settings) return null;

  return (
    <form className="mb-lg flex-col" onSubmit={onSaveTransaction}>
      <label className="form-input">
        <input
          placeholder="🪄 filter or type 'add', 'transfer'..."
          value={omniboxInput}
          onChange={(e) => setOmniboxInput(e.target.value)}
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
            openTxForm: (txAddState) => {
              setPopupState({ view: "txAdd", txAddState });
              setOmniboxInput("");
            }
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
            openTxForm: (txAddState) => {
              setPopupState({ view: "txAdd", txAddState });
              setOmniboxInput("");
            }
          }}
        />
      ) : null}
    </form>
  );
}
