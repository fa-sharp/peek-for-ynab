import { RadioButton, RadioButtonGroup } from "~components";
import type { ParsedTransferQuery, ParsedTransferResults } from "~lib/omnibox";
import type { TransactionFormHandlers, TransactionFormState } from "~lib/useTransaction";

interface Props {
  parsedQuery: ParsedTransferQuery;
  results: ParsedTransferResults;
  formState: TransactionFormState;
  handlers: TransactionFormHandlers;
}

export default function OmniboxTransfer({
  parsedQuery,
  results,
  formState,
  handlers
}: Props) {
  return (
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
            if (!account || !account.transfer_payee_id) handlers.setPayee(null);
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
            handlers.setCategory(results.categoryResults.find((c) => c.id === id) || null)
          }>
          {results.categoryResults.map((category) => (
            <RadioButton key={category.id} value={category.id}>
              {category.name}
            </RadioButton>
          ))}
        </RadioButtonGroup>
      )}
    </>
  );
}
