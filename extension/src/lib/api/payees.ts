import { DELTA_REQUEST_TIME, IS_DEV, ONE_DAY_IN_MILLIS } from "~lib/constants";
import type { CachedPayee } from "~lib/types";
import { apiClient, type Payee } from "./client";

export const payeesQuery = (budgetId: string) => ({
  queryKey: ["payees", { budgetId }],
  staleTime: ONE_DAY_IN_MILLIS,
});

const payeeCollator = Intl.Collator();

/** Fetch payees for this budget from the YNAB API */
export async function fetchPayeesForBudget(
  token: string,
  selectedBudgetId: string,
  cache?: {
    data?: {
      serverKnowledge: number;
      payees: CachedPayee[];
    };
    dataUpdatedAt: number;
  }
) {
  const usingDeltaRequest =
    !!cache?.data && cache.dataUpdatedAt > Date.now() - DELTA_REQUEST_TIME;

  const { data: response, error } = await apiClient(token).GET(
    "/plans/{plan_id}/payees",
    {
      params: {
        path: {
          plan_id: selectedBudgetId,
        },
        query: {
          last_knowledge_of_server: usingDeltaRequest
            ? cache.data?.serverKnowledge
            : undefined,
        },
      },
    }
  );
  if (error) throw error;

  let payees: CachedPayee[];
  if (usingDeltaRequest && cache.data) {
    payees = mergePayeesDataFromDelta(cache.data.payees, response.data.payees);
  } else {
    payees = response.data.payees
      .map(formatPayee)
      .sort((a, b) => payeeCollator.compare(a.name, b.name));
  }

  IS_DEV &&
    console.log("Fetched payees!", {
      payees,
      usingDeltaRequest,
      serverKnowledge: response.data.server_knowledge,
    });
  return { payees, serverKnowledge: response.data.server_knowledge };
}

export function mergePayeesDataFromDelta(
  existingData: CachedPayee[],
  deltaResponse: Payee[]
) {
  const payees = [...existingData];
  for (const payeeDelta of deltaResponse) {
    const payeeIdx = payees.findIndex((p) => p.id === payeeDelta.id);
    if (payeeIdx === -1) {
      const sortedIdx = findSortedIndex(payees, payeeDelta, (a, b) =>
        payeeCollator.compare(a.name, b.name)
      );
      payees.splice(sortedIdx, 0, formatPayee(payeeDelta)); // new payee
    } else if (payeeDelta.deleted) {
      payees.splice(payeeIdx, 1); // deleted payee
    } else {
      payees.splice(payeeIdx, 1, formatPayee(payeeDelta)); // update existing payee
    }
  }
  return payees;
}

export function formatPayee(payee: Payee): CachedPayee {
  return {
    id: payee.id,
    name: payee.name,
    ...(payee.transfer_account_id && { transferId: payee.transfer_account_id }),
  };
}

function findSortedIndex<T>(array: T[], value: T, compare: (x: T, y: T) => number) {
  let low = 0;
  let high = array.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (compare(array[mid], value) < 0) low = mid + 1;
    else high = mid;
  }
  return low;
}
