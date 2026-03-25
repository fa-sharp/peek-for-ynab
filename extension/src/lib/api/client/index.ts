import createClient from "openapi-fetch";

import type { components, paths } from "./types";

export const apiClient = (accessToken: string) =>
  createClient<paths>({
    baseUrl: "https://api.ynab.com/v1",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

export type ApiSchemas = components["schemas"];

export type Account = ApiSchemas["Account"];
export type AccountType = ApiSchemas["AccountType"];
export type Category = ApiSchemas["Category"];
export type CategoryGroupWithCategories = ApiSchemas["CategoryGroupWithCategories"];
export type CurrencyFormat = NonNullable<ApiSchemas["CurrencyFormat"]>;
export type MonthDetail = ApiSchemas["MonthDetail"];
export type Payee = ApiSchemas["Payee"];
export type TransactionClearedStatus = ApiSchemas["TransactionClearedStatus"];
export type TransactionDetail = ApiSchemas["TransactionDetail"];
export type TransactionFlagColor = ApiSchemas["TransactionFlagColor"];
export type HybridTransaction = ApiSchemas["HybridTransaction"];
export type NewTransaction = ApiSchemas["NewTransaction"];
export type SubTransaction = ApiSchemas["SubTransaction"];

export enum TransactionFlags {
  Red = "red",
  Orange = "orange",
  Yellow = "yellow",
  Green = "green",
  Blue = "blue",
  Purple = "purple",
}
