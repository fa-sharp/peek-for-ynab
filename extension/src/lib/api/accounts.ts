import { DELTA_REQUEST_TIME, IS_DEV } from "~lib/constants";
import { type ApiSchemas, apiClient } from "./client";

export const accountsQuery = (budgetId: string) => ({
  queryKey: ["accounts", { budgetId }],
});

/** Fetch accounts for this budget from the YNAB API */
export async function fetchAccountsForBudget(
  token: string,
  selectedBudgetId: string,
  cache?: {
    data?: {
      serverKnowledge: number;
      accounts: ApiSchemas["Account"][];
    };
    dataUpdatedAt: number;
  }
) {
  const usingDeltaRequest =
    !!cache?.data && cache.dataUpdatedAt > Date.now() - DELTA_REQUEST_TIME;

  const { data: response, error } = await apiClient(token).GET(
    "/plans/{plan_id}/accounts",
    {
      params: {
        path: { plan_id: selectedBudgetId },
        query: {
          last_knowledge_of_server: usingDeltaRequest
            ? cache.data?.serverKnowledge
            : undefined,
        },
      },
    }
  );
  if (error) throw error;

  let accounts: ApiSchemas["Account"][];
  if (usingDeltaRequest && cache.data) {
    accounts = mergeAccountsDataFromDelta(cache.data.accounts, response.data.accounts);
  } else {
    accounts = response.data.accounts;
  }

  // filter out closed accounts, and sort with Budget accounts first
  accounts = accounts
    .filter((a) => a.closed === false)
    .sort((a, b) =>
      a.on_budget && !b.on_budget ? -1 : !a.on_budget && b.on_budget ? 1 : 0
    );
  IS_DEV &&
    console.log("Fetched accounts!", {
      accounts,
      usingDeltaRequest,
      serverKnowledge: response.data.server_knowledge,
    });
  return { accounts, serverKnowledge: response.data.server_knowledge };
}

export function mergeAccountsDataFromDelta(
  existingData: ApiSchemas["Account"][],
  deltaResponse: ApiSchemas["Account"][]
) {
  const accounts = [...existingData];
  for (const accountDelta of deltaResponse) {
    const accountIdx = accounts.findIndex((a) => a.id === accountDelta.id);
    if (accountIdx === -1) {
      accounts.push(accountDelta); // new account
    } else if (accountDelta.deleted) {
      accounts.splice(accountIdx, 1); // deleted account
    } else {
      accounts.splice(accountIdx, 1, accountDelta); // update existing account
    }
  }
  return accounts;
}
