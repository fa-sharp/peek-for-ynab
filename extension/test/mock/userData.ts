import { randomUUID } from "crypto";

import type { TokenData } from "~lib/types";

export const validToken: TokenData = {
  accessToken: randomUUID(),
  refreshToken: randomUUID(),
  expires: Date.now() + 60 * 60 * 1000,
};

export const savedCategories = [
  "de6859dd-20ef-49db-85ce-762a58bb92b6", // Groceries
  "a4fce314-115c-44ed-ae05-d2cdf62eee03", // Gifts
];

export const savedAccounts = [
  "b04cde9d-a0f7-4ed0-bf82-b44a3c4de92e", // Checking
];
