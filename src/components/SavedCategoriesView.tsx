import { Draggable, Droppable } from "@hello-pangea/dnd";

import { IconButton } from "~components";
import { CategoryView } from "~components/CategoriesView";
import { useStorageContext, useYNABContext } from "~lib/context";

import { AddTransactionIcon, PinnedItemIcon } from "./icons/ActionIcons";

/** View of user's saved categories with balances */
export default function SavedCategoriesView() {
  const { removeCategory, settings, popupState, setPopupState } = useStorageContext();
  const { selectedBudgetData, savedCategoriesData } = useYNABContext();

  if (
    !selectedBudgetData ||
    !savedCategoriesData ||
    !settings ||
    savedCategoriesData.length === 0
  )
    return null;

  const { currencyFormat } = selectedBudgetData;

  return (
    <Droppable droppableId="savedCategories" isDropDisabled={!popupState.editMode}>
      {(provided) => (
        <ul
          {...provided.droppableProps}
          ref={provided.innerRef}
          aria-label="Saved categories"
          className="list">
          {savedCategoriesData.map((category, idx) => (
            <Draggable
              draggableId={category.id}
              key={category.id}
              index={idx}
              isDragDisabled={!popupState.editMode}>
              {(provided) => (
                <li
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
                          onClick={() => removeCategory(category.id)}
                          icon={<PinnedItemIcon />}
                        />
                      )
                    }
                    actionElementsRight={
                      <aside className="balance-actions" aria-label="actions">
                        <IconButton
                          rounded
                          accent
                          icon={<AddTransactionIcon />}
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
                </li>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </ul>
      )}
    </Droppable>
  );
}
