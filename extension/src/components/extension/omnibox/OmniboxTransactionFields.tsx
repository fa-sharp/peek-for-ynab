import type { Account } from "ynab";

import { RadioButton, RadioButtonGroup } from "~components";
import type { ParsedTxQuery, ParsedTxResults } from "~lib/omnibox";
import { useTxStore } from "~lib/state";
import type { TransactionFormDispatch } from "~lib/useTransaction";

interface Props {
  parsedQuery: ParsedTxQuery;
  results: ParsedTxResults;
  dispatch: TransactionFormDispatch;
  defaultAccount?: Account;
}

export default function OmniboxTransactionFields({
  parsedQuery,
  results,
  dispatch,
  defaultAccount,
}: Props) {
  const { payee, categoryId, accountId } = useTxStore((state) => ({
    payee: state.payee,
    categoryId: state.categoryId,
    accountId: state.accountId,
  }));

  return (
    <>
      {parsedQuery.payeeQuery && (
        <RadioButtonGroup
          label="Payee:"
          className="flex-row gap-sm flex-wrap"
          value={payee && "id" in payee ? payee.id : null}
          onChange={(id) =>
            dispatch({
              type: "setPayee",
              payee: results.payeeResults.find((p) => p.id === id) || null,
            })
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
          value={categoryId || null}
          onChange={(id) =>
            dispatch({
              type: "setCategory",
              categoryId: results.categoryResults.find((c) => c.id === id)?.id || null,
            })
          }>
          {results.categoryResults.map((category) => (
            <RadioButton key={category.id} value={category.id}>
              {category.name}
            </RadioButton>
          ))}
        </RadioButtonGroup>
      )}
      {(parsedQuery.accountQuery || defaultAccount) && (
        <RadioButtonGroup
          label="Account:"
          className="flex-row gap-sm flex-wrap"
          value={accountId || null}
          onChange={(id) =>
            dispatch({
              type: "setAccount",
              accountId: results.accountResults.find((a) => a.id === id)?.id || null,
            })
          }>
          {!parsedQuery.accountQuery &&
            defaultAccount &&
            accountId === defaultAccount.id && (
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
      )}
    </>
  );
}
