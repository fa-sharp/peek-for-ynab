import { DELTA_REQUEST_TIME, IS_DEV } from "~lib/constants";
import { type ApiSchemas, apiClient } from "./client";

export const categoryGroupsQuery = (budgetId: string) => ({
  queryKey: ["categoryGroups", { budgetId }],
});

/** Fetch category groups for this budget from the YNAB API */
export async function fetchCategoryGroupsForBudget(
  token: string,
  selectedBudgetId: string,
  cache?: {
    data?: {
      serverKnowledge: number;
      categoryGroups: ApiSchemas["CategoryGroupWithCategories"][];
    };
    dataUpdatedAt: number;
  }
) {
  const usingDeltaRequest =
    !!cache?.data && cache.dataUpdatedAt > Date.now() - DELTA_REQUEST_TIME;

  const { data: response, error } = await apiClient(token).GET(
    "/plans/{plan_id}/categories",
    {
      params: {
        path: { plan_id: selectedBudgetId },
        query: {
          last_knowledge_of_server: usingDeltaRequest
            ? cache.data?.serverKnowledge
            : undefined,
        },
      },
    }
  );
  if (error) throw error;

  let categoryGroups: ApiSchemas["CategoryGroupWithCategories"][];
  if (usingDeltaRequest && cache.data) {
    categoryGroups = mergeCategoryGroupsDataFromDelta(
      cache.data.categoryGroups,
      response.data.category_groups
    );
  } else {
    categoryGroups = response.data.category_groups;
  }

  // filter out hidden groups and categories
  categoryGroups = categoryGroups.filter((group) => !group.hidden);
  categoryGroups.forEach(
    (cg) => (cg.categories = cg.categories.filter((c) => !c.hidden))
  );
  IS_DEV &&
    console.log("Fetched categories!", {
      categoryGroups,
      usingDeltaRequest,
      serverKnowledge: response.data.server_knowledge,
    });
  return { categoryGroups, serverKnowledge: response.data.server_knowledge };
}

export function mergeCategoryGroupsDataFromDelta(
  existingData: ApiSchemas["CategoryGroupWithCategories"][],
  deltaResponse: ApiSchemas["CategoryGroupWithCategories"][]
) {
  let categoryGroups = structuredClone(existingData);
  for (const categoryGroupDelta of deltaResponse) {
    if (categoryGroupDelta.deleted) {
      categoryGroups = categoryGroups.filter((cg) => cg.id !== categoryGroupDelta.id);
      continue;
    }

    const categoryGroupIdx = categoryGroups.findIndex(
      (cg) => cg.id === categoryGroupDelta.id
    );
    if (categoryGroupIdx === -1) {
      categoryGroups.push(categoryGroupDelta); // new category group
    } else {
      // update existing category group
      categoryGroups[categoryGroupIdx].name = categoryGroupDelta.name;
      categoryGroups[categoryGroupIdx].hidden = categoryGroupDelta.hidden;

      const categories = categoryGroups[categoryGroupIdx].categories;
      for (const categoryDelta of categoryGroupDelta.categories) {
        const categoryIdx = categories.findIndex((c) => c.id === categoryDelta.id);
        if (categoryIdx === -1) {
          categories.push(categoryDelta); // new category
        } else if (categoryDelta.deleted) {
          categories.splice(categoryIdx, 1); // deleted category
        } else {
          categories.splice(categoryIdx, 1, categoryDelta); // update existing category
        }
      }
    }
  }
  return categoryGroups;
}
