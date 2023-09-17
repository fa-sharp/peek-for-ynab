import { Draggable, Droppable } from "@hello-pangea/dnd";
import { Pinned, Plus } from "tabler-icons-react";

import { IconButton } from "~components";
import { CategoryView } from "~components/CategoriesView";
import { useStorageContext, useYNABContext } from "~lib/context";

/** View of user's saved categories with balances */
export default function SavedCategoriesView() {
  const { removeCategory, settings, popupState, setPopupState } = useStorageContext();
  const { selectedBudgetData, savedCategoriesData } = useYNABContext();

  if (!selectedBudgetData || !savedCategoriesData || savedCategoriesData.length === 0)
    return null;

  const { currencyFormat } = selectedBudgetData;

  return (
    <Droppable droppableId="savedCategories" isDropDisabled={!popupState.editMode}>
      {(provided) => (
        <section
          {...provided.droppableProps}
          ref={provided.innerRef}
          aria-label="Saved categories">
          {savedCategoriesData.map((category, idx) => (
            <Draggable
              draggableId={category.id}
              key={category.id}
              index={idx}
              isDragDisabled={!popupState.editMode}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  style={provided.draggableProps.style}>
                  <CategoryView
                    categoryData={category}
                    currencyFormat={currencyFormat}
                    settings={settings}
                    actionElementsLeft={
                      !popupState.editMode ? null : (
                        <IconButton
                          label="Unpin"
                          onClick={() =>
                            removeCategory({
                              categoryId: category.id,
                              budgetId: selectedBudgetData.id
                            })
                          }
                          icon={
                            <Pinned
                              size={"1.2rem"}
                              fill="var(--action)"
                              color="var(--action)"
                              strokeWidth={1}
                            />
                          }
                        />
                      )
                    }
                    actionElementsRight={
                      <aside className="balance-actions" aria-label="actions">
                        <IconButton
                          rounded
                          accent
                          icon={
                            <Plus size={"1.2rem"} color="var(--action)" strokeWidth={1} />
                          }
                          label="Add transaction"
                          onClick={() =>
                            setPopupState({
                              view: "txAdd",
                              txAddState: { categoryId: category.id }
                            })
                          }
                        />
                      </aside>
                    }
                  />
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </section>
      )}
    </Droppable>
  );
}
