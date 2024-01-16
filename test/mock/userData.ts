import { randomUUID } from "crypto";

import type { TokenData } from "~lib/context/storageContext";

export const validToken: TokenData = {
  accessToken: randomUUID(),
  refreshToken: randomUUID(),
  expires: Date.now() + 60 * 60 * 1000
};

export const savedCategories = {
  // Personal budget
  "97b0a016-a8c1-490c-a33c-cc06940d3d80": [
    "de6859dd-20ef-49db-85ce-762a58bb92b6", // Groceries
    "a4fce314-115c-44ed-ae05-d2cdf62eee03" // Gifts
  ]
};

export const savedAccounts = {
  // Personal budget
  "97b0a016-a8c1-490c-a33c-cc06940d3d80": [
    "b04cde9d-a0f7-4ed0-bf82-b44a3c4de92e" // Checking
  ]
};
