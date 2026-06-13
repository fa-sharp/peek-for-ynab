import { DELTA_REQUEST_TIME, IS_DEV } from "~lib/constants";
import { apiClient, type Category, type MoneyMovement } from "./client";

export async function moveMoneyInBudget(
  token: string,
  budgetId: string,
  amountInMillis: number,
  fromCategory?: Category,
  toCategory?: Category
) {
  const client = apiClient(token);

  return await Promise.all([
    fromCategory
      ? client.PATCH("/plans/{plan_id}/months/{month}/categories/{category_id}", {
          params: {
            path: { plan_id: budgetId, category_id: fromCategory.id, month: "current" },
          },
          body: { category: { budgeted: fromCategory.budgeted - amountInMillis } },
        })
      : Promise.resolve("No 'from' category"),
    toCategory
      ? client.PATCH("/plans/{plan_id}/months/{month}/categories/{category_id}", {
          params: {
            path: { plan_id: budgetId, category_id: toCategory.id, month: "current" },
          },
          body: { category: { budgeted: toCategory.budgeted + amountInMillis } },
        })
      : Promise.resolve("No 'to' category"),
  ]);
}

export const moneyMovesQuery = (budgetId: string) => ({
  queryKey: ["moneyMoves", { budgetId }],
});

export async function fetchMoneyMovesForBudget(
  token: string,
  budgetId: string,
  cache?: {
    data?: {
      serverKnowledge: number;
      moneyMoves: MoneyMovement[];
    };
    dataUpdatedAt: number;
  }
) {
  const usingDeltaRequest =
    !!cache?.data && cache.dataUpdatedAt > Date.now() - DELTA_REQUEST_TIME;
  const { data, error } = await apiClient(token).GET(
    "/plans/{plan_id}/months/{month}/money_movements",
    {
      params: {
        path: { plan_id: budgetId, month: "current" },
        //@ts-expect-error `last_knowledge_of_server` query missing in API definition
        query: {
          last_knowledge_of_server: usingDeltaRequest
            ? cache.data?.serverKnowledge
            : undefined,
        },
      },
    }
  );
  if (error) throw error;

  let moneyMoves: MoneyMovement[];
  if (usingDeltaRequest && cache.data) {
    moneyMoves = mergeMoneyMovesFromDelta(
      cache.data.moneyMoves,
      data.data.money_movements
    );
  } else {
    moneyMoves = data.data.money_movements;
  }

  moneyMoves.sort((a, b) =>
    !a.moved_at || !b.moved_at ? 0 : a.moved_at <= b.moved_at ? 1 : -1
  );
  IS_DEV &&
    console.log("Fetched money moves!", {
      moneyMoves,
      usingDeltaRequest,
      serverKnowledge: data.data.server_knowledge,
    });
  return { moneyMoves, serverKnowledge: data.data.server_knowledge };
}

function mergeMoneyMovesFromDelta(
  existingData: MoneyMovement[],
  deltaResponse: MoneyMovement[]
): MoneyMovement[] {
  const moneyMoves = [...existingData];
  for (const newMove of deltaResponse) {
    const moveIdx = moneyMoves.findIndex((m) => m.id === newMove.id);
    if (moveIdx === -1) {
      moneyMoves.push(newMove); // new money move
    } else {
      moneyMoves.splice(moveIdx, 1, newMove); // updated money move
    }
  }
  return moneyMoves;
}
