import { IS_DEV } from "~lib/constants";
import { apiClient, type Category } from "./client";

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

export async function fetchMoneyMovesForBudget(token: string, budgetId: string) {
  const { data, error } = await apiClient(token).GET(
    "/plans/{plan_id}/months/{month}/money_movements",
    {
      params: { path: { plan_id: budgetId, month: "current" } },
    }
  );
  if (error) throw error;

  data.data.money_movements.sort((a, b) =>
    !a.moved_at || !b.moved_at ? 0 : a.moved_at <= b.moved_at ? 1 : -1
  );
  IS_DEV && console.log("Fetched money moves!", data.data.money_movements);
  return data.data.money_movements;
}
