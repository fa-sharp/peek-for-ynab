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

  return data.data.money_movements;
}
