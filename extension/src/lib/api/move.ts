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
