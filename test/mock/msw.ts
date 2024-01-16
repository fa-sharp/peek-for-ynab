import { HttpResponse, type PathParams, http } from "msw";
import type { HttpRequestResolverExtras } from "msw/lib/core/handlers/HttpHandler";
import type { ResponseResolverInfo } from "msw/lib/core/handlers/RequestHandler";
import { setupServer } from "msw/node";

import { accounts, budgets, category_groups, payees } from "./ynabApiData";

const BASE_URL = "https://api.ynab.com/v1";

export const mockServer = setupServer(
  http.get(
    BASE_URL + "/budgets",
    withAuth(() => {
      return HttpResponse.json({ data: { budgets } });
    })
  ),
  http.get(
    BASE_URL + "/budgets/:budgetId/categories",
    withAuth(() => {
      return HttpResponse.json({
        data: {
          category_groups
        }
      });
    })
  ),
  http.get(
    BASE_URL + "/budgets/:budgetId/accounts",
    withAuth(() => {
      return HttpResponse.json({
        data: {
          accounts
        }
      });
    })
  ),
  http.get(
    BASE_URL + "/budgets/:budgetId/payees",
    withAuth(() => {
      return HttpResponse.json({
        data: {
          payees
        }
      });
    })
  )
);

//@ts-expect-error don't know what TS wants here, and it's not important
function withAuth(resolver) {
  return (
    input: ResponseResolverInfo<HttpRequestResolverExtras<PathParams>, HttpResponse>
  ) => {
    const { request } = input;
    if (!request.headers.get("Authorization")) {
      return HttpResponse.json(
        {
          error: {
            id: "errorId",
            name: "invalidToken",
            detail: "Invalid token"
          }
        },
        { status: 401 }
      );
    }
    return resolver(input);
  };
}
