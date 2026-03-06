import { useSetAtom } from "jotai";
import { useMemo } from "react";

import { useNotificationsContext, useStorageContext, useYNABContext } from "~lib/context";
import { parseTxInput } from "~lib/omnibox";
import { popupStateAtom } from "~lib/state";
import useTransaction from "~lib/useTransaction";
import { searchWithinString } from "~lib/utils";
import OmniboxFiltered from "./OmniboxFiltered";
import OmniboxTransaction from "./OmniboxTransaction";

export default function Omnibox() {
  const {
    budgetSettings,
    settings,
    omniboxInput,
    setOmniboxInput,
    editingItems,
    saveAccount,
    saveCategory,
    savedAccounts,
    savedCategories,
  } = useStorageContext();
  const { currentAlerts } = useNotificationsContext();
  const { selectedBudgetData, budgetMainData } = useYNABContext();
  const { dispatch, onSaveTransaction, isSaving } = useTransaction();
  const setPopupState = useSetAtom(popupStateAtom);

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
        searchWithinString(a.name, omniboxInput),
      ),
      categories: budgetMainData.categoriesData
        .filter((c) => c.category_group_name !== "Internal Master Category")
        .filter((c) => searchWithinString(c.name, omniboxInput)),
    };
  }, [budgetMainData, parsedQuery, omniboxInput]);

  if (!selectedBudgetData || !budgetMainData || !settings) return null;

  return (
    <form className="flex-col mb-md" onSubmit={onSaveTransaction}>
      <label className="form-input">
        <input
          placeholder="search, 'add', 'transfer'..."
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
            openTxForm: (txState) => {
              setPopupState({ view: "txAdd", txState });
              setOmniboxInput("");
            },
            editingItems,
            savedAccounts: savedAccounts?.[selectedBudgetData.id],
            savedCategories: savedCategories?.[selectedBudgetData.id],
            onPinItem: (type, id) =>
              type === "account" ? saveAccount(id) : saveCategory(id),
          }}
        />
      ) : parsedQuery ? (
        <OmniboxTransaction
          {...{
            budget: selectedBudgetData,
            budgetMainData,
            dispatch,
            isSaving,
            parsedQuery,
            defaultAccountId: budgetSettings?.transactions.defaultAccountId,
            openTxForm: () => {
              setPopupState({ view: "txAdd" });
              setOmniboxInput("");
            },
          }}
        />
      ) : null}
    </form>
  );
}
