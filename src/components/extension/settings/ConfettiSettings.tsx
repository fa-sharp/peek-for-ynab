import { type FormEventHandler, useId, useMemo, useRef, useState } from "react";
import { Help, Plus, X } from "tabler-icons-react";

import { CategorySelect, Dialog, IconButton, Tooltip } from "~components";
import { CollapseListIcon, ExpandListIcon } from "~components/icons/ActionIcons";
import { DEFAULT_BUDGET_SETTINGS } from "~lib/constants";
import { useStorageContext, useYNABContext } from "~lib/context";
import type { BudgetSettings, CachedBudget } from "~lib/types";
import { findEmoji } from "~lib/utils";

export default function ConfettiSettings({ budget }: { budget: CachedBudget }) {
  const { useBudgetSettings } = useStorageContext();
  const { useGetCategoryGroupsForBudget } = useYNABContext();

  const { data: categoryGroupsData } = useGetCategoryGroupsForBudget(budget.id);
  const [settings, setSettings] = useBudgetSettings(budget.id);

  const [expanded, setExpanded] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);
  const [addingEmoji, setAddingEmoji] = useState(false);
  const controlsId = useId();

  const categoriesData = useMemo(
    () => categoryGroupsData?.flatMap((cg) => cg.categories),
    [categoryGroupsData]
  );
  const categoriesToAdd = useMemo(
    () =>
      categoriesData?.filter(
        (c) => !settings?.confetti || !settings.confetti.categories.includes(c.id)
      ),
    [categoriesData, settings?.confetti]
  );
  const categoryRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLInputElement>(null);

  const changeConfettiSetting = <K extends keyof NonNullable<BudgetSettings["confetti"]>>(
    key: K,
    value: NonNullable<BudgetSettings["confetti"]>[K]
  ) =>
    setSettings((prev) => {
      if (!prev) return undefined;
      return {
        ...prev,
        confetti: {
          ...(prev.confetti || DEFAULT_BUDGET_SETTINGS.confetti!),
          [key]: value
        }
      };
    });

  const onAddEmoji: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    setAddingEmoji(false);
    const input = new FormData(e.currentTarget).get("emoji");
    const emoji = findEmoji(input?.toString() || "");
    if (emoji) {
      changeConfettiSetting("emojis", [
        ...(settings?.confetti?.emojis || []),
        emoji.toString()
      ]);
    }
  };

  const setConfettiCategory = (categoryId: string, enabled: boolean) => {
    if (!settings || !categoriesData) return;
    let newConfettiCategories = [...(settings.confetti?.categories || [])];
    if (enabled) newConfettiCategories.push(categoryId);
    else newConfettiCategories = newConfettiCategories.filter((id) => categoryId !== id);

    // clean up categories that have been deleted or hidden
    for (const categoryId of newConfettiCategories) {
      if (!categoriesData.find((c) => c.id === categoryId))
        newConfettiCategories = newConfettiCategories.filter((id) => id !== categoryId);
    }
    changeConfettiSetting("categories", newConfettiCategories);
  };

  if (!settings) return null;

  return (
    <div>
      <h3
        aria-labelledby="confetti-heading"
        className="heading-small cursor-pointer"
        onClick={() => setExpanded(!expanded)}>
        <span id="confetti-heading">Confetti</span>
        <Tooltip label="More info" icon={<Help size={18} aria-hidden />} placement="top">
          <Dialog>
            Enable confetti celebrations after adding a transaction. You can enable them
            for specific categories that you choose, or for all categories. You can also
            add your favorite emojis to the confetti.
          </Dialog>
        </Tooltip>
        <IconButton
          aria-controls={controlsId}
          aria-expanded={expanded}
          label={expanded ? "Collapse" : "Expand"}
          icon={expanded ? <CollapseListIcon /> : <ExpandListIcon />}
          onClick={() => setExpanded(!expanded)}
        />
      </h3>
      {expanded && (
        <div id={controlsId} className="flex-col gap-sm">
          <label className="flex-row gap-xs">
            <input
              type="checkbox"
              checked={settings?.confetti?.allCategories ?? false}
              onChange={(e) => changeConfettiSetting("allCategories", e.target.checked)}
            />
            Enable for all categories
          </label>
          {!settings?.confetti?.allCategories && (
            <div className="flex-col gap-sm">
              <h4 className="heading-small">Categories:</h4>
              <ul className="list flex-col gap-sm">
                {settings.confetti?.categories
                  .map((categoryId) => categoriesData?.find((c) => c.id === categoryId))
                  .filter((c) => !!c)
                  .map((category) => (
                    <li key={category.id} className="flex-row gap-xs">
                      {category.name}
                      <IconButton
                        label="Disable"
                        icon={<X size={16} aria-hidden />}
                        onClick={() => setConfettiCategory(category.id, false)}
                      />
                    </li>
                  ))}
              </ul>

              <div>
                {!addingCategory ? (
                  <button
                    className="button flex-row gap-xs accent rounded"
                    onClick={() => {
                      setAddingCategory(true);
                      setTimeout(() => categoryRef.current?.focus(), 50);
                    }}>
                    <Plus aria-label="Add" size={18} /> Category
                  </button>
                ) : !categoriesToAdd || !categoryGroupsData ? (
                  <div>Loading categories...</div>
                ) : (
                  <CategorySelect
                    ref={categoryRef}
                    currentCategory={null}
                    categories={categoriesToAdd}
                    categoryGroupsData={categoryGroupsData}
                    placeholder="Add category"
                    selectCategory={(category) => {
                      if (category) {
                        setConfettiCategory(category.id, true);
                        setAddingCategory(false);
                      }
                    }}
                  />
                )}
              </div>
            </div>
          )}
          <div className="flex-row">
            <h4 className="heading-small">Emojis:</h4>
            {!settings.confetti || settings.confetti.emojis.length === 0 ? (
              "(None selected)"
            ) : (
              <ul className="list flex-row flex-wrap">
                {settings.confetti.emojis.map((emoji, idx) => (
                  <li key={idx}>
                    <button
                      className="icon-button font-big"
                      title="Click to remove"
                      onClick={() => {
                        if (!settings.confetti) return;
                        const newEmojis = [...settings.confetti.emojis];
                        newEmojis.splice(idx, 1);
                        changeConfettiSetting("emojis", newEmojis);
                      }}>
                      {emoji}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            {addingEmoji ? (
              <form className="form-input" onSubmit={onAddEmoji}>
                <input
                  ref={emojiRef}
                  name="emoji"
                  minLength={1}
                  maxLength={12}
                  placeholder="Enter a single emoji and press enter"
                />
              </form>
            ) : (
              <button
                className="button flex-row gap-xs accent rounded"
                onClick={() => {
                  setAddingEmoji(true);
                  setTimeout(() => emojiRef.current?.focus(), 50);
                }}>
                <Plus aria-label="Add" size={18} /> Emoji
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
