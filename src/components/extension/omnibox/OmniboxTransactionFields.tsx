import type { Account } from "ynab";

import { RadioButton, RadioButtonGroup } from "~components";
import type { ParsedTxQuery, ParsedTxResults } from "~lib/omnibox";
import type { TransactionFormHandlers, TransactionFormState } from "~lib/useTransaction";

interface Props {
  parsedQuery: ParsedTxQuery;
  results: ParsedTxResults;
  formState: TransactionFormState;
  handlers: TransactionFormHandlers;
  defaultAccount?: Account;
}

export default function OmniboxTransactionFields({
  parsedQuery,
  results,
  formState,
  handlers,
  defaultAccount
}: Props) {
  return (
    <>
      {parsedQuery.payeeQuery && (
        <RadioButtonGroup
          label="Payee:"
          className="flex-row gap-sm flex-wrap"
          value={formState.payee && "id" in formState.payee ? formState.payee.id : null}
          onChange={(id) =>
            handlers.setPayee(results.payeeResults.find((p) => p.id === id) || null)
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
            handlers.setCategory(results.categoryResults.find((c) => c.id === id) || null)
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
          value={formState.account?.id || null}
          onChange={(id) =>
            handlers.setAccount(results.accountResults.find((a) => a.id === id) || null)
          }>
          {!parsedQuery.accountQuery &&
            defaultAccount &&
            formState.account?.id === defaultAccount.id && (
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
