import { Draggable, Droppable } from "@hello-pangea/dnd";
import { Fragment } from "react";
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
      {(provided, snapshot) => (
        <section
          {...provided.droppableProps}
          ref={provided.innerRef}
          aria-label="Saved categories">
          {savedCategoriesData.map((category, idx) => (
            <Fragment key={category.id}>
              <Draggable
                draggableId={category.id}
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
                                size={"1.3rem"}
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
                              <Plus
                                size={"1.3rem"}
                                color="var(--action)"
                                strokeWidth={1}
                              />
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
              {idx !== savedCategoriesData.length - 1 && (
                <div
                  className={`sep-line-h ${
                    snapshot.isDraggingOver ? "transparent" : ""
                  }`}></div>
              )}
            </Fragment>
          ))}
          {provided.placeholder}
        </section>
      )}
    </Droppable>
  );
}
