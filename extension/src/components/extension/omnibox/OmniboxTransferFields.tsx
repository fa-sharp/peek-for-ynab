import { RadioButton, RadioButtonGroup } from "~components";
import type { ParsedTransferQuery, ParsedTransferResults } from "~lib/omnibox";
import { useTxStore } from "~lib/state";
import type { TransactionFormDispatch } from "~lib/useTransaction";

interface Props {
  parsedQuery: ParsedTransferQuery;
  results: ParsedTransferResults;
  dispatch: TransactionFormDispatch;
}

export default function OmniboxTransferFields({ parsedQuery, results, dispatch }: Props) {
  const { payee, accountId, categoryId } = useTxStore((state) => ({
    payee: state.payee,
    categoryId: state.categoryId,
    accountId: state.accountId,
  }));

  return (
    <>
      {parsedQuery.fromAccountQuery && (
        <RadioButtonGroup
          label="From:"
          className="flex-row gap-sm flex-wrap"
          value={accountId || null}
          onChange={(id) =>
            dispatch({
              type: "setAccount",
              accountId: results.fromAccountResults.find((a) => a.id === id)?.id || null,
            })
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
          value={payee && "transferId" in payee ? payee?.transferId || null : null}
          onChange={(id) => {
            const account = results.toAccountResults.find((a) => a.id === id);
            if (!account || !account.transfer_payee_id)
              dispatch({ type: "setPayee", payee: null });
            else
              dispatch({
                type: "setPayee",
                payee: {
                  id: account.transfer_payee_id,
                  name: account.name,
                  transferId: account.id,
                },
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
    </>
  );
}
