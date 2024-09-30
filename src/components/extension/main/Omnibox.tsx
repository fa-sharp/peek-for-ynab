import { Fragment, useMemo, useState } from "react";
import { Help, Pencil, Wand } from "tabler-icons-react";

import { CurrencyView, RadioButton, RadioButtonGroup } from "~components";
import { useStorageContext, useYNABContext } from "~lib/context";
import {
  getPossibleTransferFieldsFromParsedInput,
  getPossibleTxFieldsFromParsedInput,
  parseTxInput
} from "~lib/omnibox";
import useTransaction from "~lib/useTransaction";
import { stringValueToMillis } from "~lib/utils";

const txFields = [
  { idx: 0, prefix: "", label: "amount" },
  { idx: 2, prefix: "at", label: "payee" },
  { idx: 3, prefix: "for", label: "category" },
  { idx: 4, prefix: "on", label: "account" },
  { idx: 5, prefix: "memo", label: "memo" }
];
const transferFields = [
  { idx: 0, prefix: "", label: "amount" },
  { idx: 2, prefix: "to/from", label: "account" },
  { idx: 3, prefix: "to/from", label: "account" },
  { idx: 4, prefix: "for", label: "category" },
  { idx: 5, prefix: "memo", label: "memo" }
];

export default function Omnibox() {
  const { budgetSettings, popupState, setPopupState } = useStorageContext();
  const { budgetMainData } = useYNABContext();
  const { formState, handlers, onSaveTransaction, isSaving } = useTransaction();

  const parsedQuery = useMemo(() => {
    if (
      popupState.omnibox &&
      (popupState.omnibox.startsWith("add") || popupState.omnibox.startsWith("transfer"))
    )
      return parseTxInput(popupState.omnibox);
    return null;
  }, [popupState.omnibox]);

  const defaultAccount = useMemo(() => {
    if (!budgetMainData || !budgetSettings?.transactions.defaultAccountId) return;
    return budgetMainData.accountsData.find(
      (a) => a.id === budgetSettings.transactions.defaultAccountId
    );
  }, [budgetMainData, budgetSettings?.transactions.defaultAccountId]);

  const results = useMemo(() => {
    if (!parsedQuery || !budgetMainData) return null;
    handlers.setAmount(parsedQuery.amount);
    handlers.setAmountType("Outflow");
    handlers.setMemo(parsedQuery.memo);
    if (parsedQuery.type === "tx") {
      handlers.setIsTransfer(false);
      const results = getPossibleTxFieldsFromParsedInput(parsedQuery, budgetMainData);
      handlers.setPayee(results.payeeResults[0] || null);
      handlers.setCategory(results.categoryResults[0] || null);
      handlers.setAccount(
        !parsedQuery.accountQuery && defaultAccount
          ? defaultAccount
          : results.accountResults[0] || null
      );
      return results;
    } else {
      handlers.setIsTransfer(true);
      const results = getPossibleTransferFieldsFromParsedInput(
        parsedQuery,
        budgetMainData
      );
      if (results.toAccountResults[0] && results.toAccountResults[0].transfer_payee_id)
        handlers.setPayee({
          id: results.toAccountResults[0].transfer_payee_id,
          name: results.toAccountResults[0].name,
          transferId: results.toAccountResults[0].id
        });
      else handlers.setPayee(null);
      handlers.setAccount(results.fromAccountResults[0] || null);
      handlers.setCategory(results.categoryResults[0] || null);
      return results;
    }
  }, [budgetMainData, defaultAccount, handlers, parsedQuery]);

  return (
    <form className="mb-lg flex-col" onSubmit={onSaveTransaction}>
      <label className="form-input">
        <input
          placeholder="🪄 filter or type 'add', 'transfer'..."
          value={popupState.omnibox || ""}
          onChange={(e) => setPopupState({ view: "main", omnibox: e.target.value })}
          disabled={isSaving}
        />
      </label>
      {parsedQuery && (
        <>
          <div style={{ fontSize: ".95em", padding: "2px" }}>
            <Help size={16} style={{ verticalAlign: "bottom" }} />
            {` `}
            {parsedQuery.type === "tx" ? "add " : "transfer "}
            {(parsedQuery.type === "tx" ? txFields : transferFields).map((field) => (
              <Fragment key={field.idx}>
                {parsedQuery.lastParsedIdx === field.idx ? (
                  <b>{`${field.prefix ? field.prefix + " " : ""}{${field.label}} `}</b>
                ) : (
                  `${field.prefix ? field.prefix + " " : ""}{${field.label}} `
                )}
              </Fragment>
            ))}
          </div>
          <h2 className="heading-big flex-row">
            {parsedQuery.type === "tx" ? "Add Transaction" : "Add Transfer/Payment"}
          </h2>
          <div className="flex-col">
            {formState.amount && (
              <div className="flex-row gap-sm">
                Amount:
                <CurrencyView
                  milliUnits={stringValueToMillis(
                    formState.amount,
                    parsedQuery.type === "tx" ? "Outflow" : "Inflow"
                  )}
                />
              </div>
            )}
            {parsedQuery?.type === "tx" && results && "payeeResults" in results && (
              <>
                {parsedQuery.payeeQuery && (
                  <RadioButtonGroup
                    label="Payee:"
                    className="flex-row gap-sm flex-wrap"
                    value={
                      formState.payee && "id" in formState.payee
                        ? formState.payee?.id || null
                        : null
                    }
                    onChange={(id) =>
                      handlers.setPayee(
                        results.payeeResults.find((p) => p.id === id) || null
                      )
                    }>
                    {results.payeeResults.map((payee) => (
                      <RadioButton key={payee.id} value={payee.id}>
                        {payee.name}
                      </RadioButton>
                    ))}
                  </RadioButtonGroup>
                )}
                {parsedQuery.categoryQuery && (
                  <RadioButtonGroup
                    label="Category:"
                    className="flex-row gap-sm flex-wrap"
                    value={formState.category?.id || null}
                    onChange={(id) =>
                      handlers.setCategory(
                        results.categoryResults.find((c) => c.id === id) || null
                      )
                    }>
                    {results.categoryResults.map((category) => (
                      <RadioButton key={category.id} value={category.id}>
                        {category.name}
                      </RadioButton>
                    ))}
                  </RadioButtonGroup>
                )}
                <RadioButtonGroup
                  label="Account:"
                  className="flex-row gap-sm flex-wrap"
                  value={formState.account?.id || null}
                  onChange={(id) =>
                    handlers.setAccount(
                      results.accountResults.find((a) => a.id === id) || null
                    )
                  }>
                  {!parsedQuery.accountQuery && defaultAccount && (
                    <RadioButton key={defaultAccount.id} value={defaultAccount.id}>
                      {defaultAccount.name}
                    </RadioButton>
                  )}
                  {results.accountResults.map((account) => (
                    <RadioButton key={account.id} value={account.id}>
                      {account.name}
                    </RadioButton>
                  ))}
                </RadioButtonGroup>
              </>
            )}
            {parsedQuery?.type === "transfer" &&
              results &&
              "fromAccountResults" in results && (
                <>
                  {parsedQuery.fromAccountQuery && (
                    <RadioButtonGroup
                      label="From:"
                      className="flex-row gap-sm flex-wrap"
                      value={formState.account?.id || null}
                      onChange={(id) =>
                        handlers.setAccount(
                          results.fromAccountResults.find((a) => a.id === id) || null
                        )
                      }>
                      {results.fromAccountResults.map((account) => (
                        <RadioButton key={account.id} value={account.id}>
                          {account.name}
                        </RadioButton>
                      ))}
                    </RadioButtonGroup>
                  )}
                  {parsedQuery.toAccountQuery && (
                    <RadioButtonGroup
                      label="To:"
                      className="flex-row gap-sm flex-wrap"
                      value={
                        formState.payee && "transferId" in formState.payee
                          ? formState.payee?.transferId || null
                          : null
                      }
                      onChange={(id) => {
                        const account = results.toAccountResults.find((a) => a.id === id);
                        if (!account || !account.transfer_payee_id)
                          handlers.setPayee(null);
                        else
                          handlers.setPayee({
                            id: account.transfer_payee_id,
                            name: account.name,
                            transferId: account.id
                          });
                      }}>
                      {results.toAccountResults.map((account) => (
                        <RadioButton key={account.id} value={account.id}>
                          {account.name}
                        </RadioButton>
                      ))}
                    </RadioButtonGroup>
                  )}
                  {parsedQuery.categoryQuery && (
                    <RadioButtonGroup
                      label="Category:"
                      className="flex-row gap-sm flex-wrap"
                      value={formState.category?.id || null}
                      onChange={(id) =>
                        handlers.setCategory(
                          results.categoryResults.find((c) => c.id === id) || null
                        )
                      }>
                      {results.categoryResults.map((category) => (
                        <RadioButton key={category.id} value={category.id}>
                          {category.name}
                        </RadioButton>
                      ))}
                    </RadioButtonGroup>
                  )}
                </>
              )}
            {formState.memo && (
              <div className="flex-row gap-sm">Memo: {formState.memo}</div>
            )}
            <div className="flex-row mt-lg">
              <button
                type="submit"
                className="flex-1 flex-row justify-center button accent rounded"
                disabled={
                  isSaving || !formState.amount || !formState.payee || !formState.account
                }>
                <Wand aria-hidden size={18} /> Save now
              </button>
              <button
                type="button"
                className="flex-1 flex-row justify-center button accent rounded"
                onClick={() =>
                  setPopupState({
                    view: "txAdd",
                    txAddState: {
                      amount: formState.amount,
                      amountType: formState.amountType,
                      accountId: formState.account?.id,
                      categoryId: formState.category?.id,
                      payee:
                        formState.payee && "id" in formState.payee
                          ? formState.payee
                          : undefined,
                      isTransfer: formState.isTransfer,
                      memo: formState.memo
                    }
                  })
                }
                disabled={isSaving}>
                <Pencil aria-hidden size={19} /> Edit and save
              </button>
            </div>
          </div>
        </>
      )}
    </form>
  );
}
