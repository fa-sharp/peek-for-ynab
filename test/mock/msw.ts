import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";

import { accounts, budgets, category_groups, payees } from "./ynabApiData";

const BASE_URL = "https://api.ynab.com";

export const mockServer = setupServer(
  http.get(BASE_URL + "/v1/budgets", () => {
    return HttpResponse.json({ data: { budgets } });
  }),
  http.get(BASE_URL + "/v1/budgets/:budgetId/categories", () => {
    return HttpResponse.json({
      data: {
        category_groups
      }
    });
  }),
  http.get(BASE_URL + "/v1/budgets/:budgetId/accounts", () => {
    return HttpResponse.json({
      data: {
        accounts
      }
    });
  }),
  http.get(BASE_URL + "/v1/budgets/:budgetId/payees", () => {
    return HttpResponse.json({
      data: {
        payees
      }
    });
  })
);
