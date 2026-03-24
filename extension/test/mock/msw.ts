import { randomUUID } from "node:crypto";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";

import { accounts, category_groups, month, payees, plans } from "./ynabApiData";

const API_BASE = `${process.env.PUBLIC_MAIN_URL}/api`;
const YNAB_BASE = "https://api.ynab.com/v1";

/** A mock API server for testing. */
export const mockServer = setupServer(
  http.post(
    `${API_BASE}/token`,
    withAuth(() => {
      return HttpResponse.json({ accessToken: randomUUID() });
    })
  ),
  http.get(
    `${YNAB_BASE}/plans`,
    withAuth(() => {
      return HttpResponse.json({ data: { plans } });
    })
  ),
  http.get(
    `${YNAB_BASE}/plans/:planId/categories`,
    withAuth(() => {
      return HttpResponse.json({
        data: {
          category_groups,
          server_knowledge: 1000,
        },
      });
    })
  ),
  http.get(
    `${YNAB_BASE}/plans/:planId/months/current`,
    withAuth(() => {
      return HttpResponse.json({
        data: {
          month,
        },
      });
    })
  ),
  http.get(
    `${YNAB_BASE}/plans/:planId/accounts`,
    withAuth(() => {
      return HttpResponse.json({
        data: {
          accounts,
          server_knowledge: 1000,
        },
      });
    })
  ),
  http.get(
    `${YNAB_BASE}/plans/:planId/payees`,
    withAuth(() => {
      return HttpResponse.json({
        data: {
          payees,
          server_knowledge: 1000,
        },
      });
    })
  )
);

//@ts-expect-error don't know what TS wants here, and it's not important
function withAuth(resolver) {
  //@ts-expect-error don't know what TS wants here, and it's not important
  return (input) => {
    const { request } = input;
    if (!request.headers.get("Authorization")) {
      return HttpResponse.json(
        {
          error: {
            id: "errorId",
            name: "invalidToken",
            detail: "Invalid token",
          },
        },
        { status: 401 }
      );
    }
    return resolver(input);
  };
}
