import { IS_DEV } from "~lib/constants";
import { apiClient } from "./client";

export const currentMonthQuery = (budgetId: string) => ({
  queryKey: ["currentMonth", budgetId],
});

export async function fetchCurrentMonthForBudget(token: string, budgetId: string) {
  const { data, error } = await apiClient(token).GET("/plans/{plan_id}/months/{month}", {
    params: {
      path: {
        plan_id: budgetId,
        month: "current",
      },
    },
  });
  if (error) throw error;

  IS_DEV && console.log("Fetched month data!", data.data.month);
  return data.data.month;
}
