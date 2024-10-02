import { clsx } from "clsx";
import { useEffect, useId, useState } from "react";
import { Settings } from "tabler-icons-react";

import { IconButton } from "~components";
import { useStorageContext } from "~lib/context";
import type { CachedBudget } from "~lib/types";

import ConfettiSettings from "./ConfettiSettings";
import NotificationSettings from "./NotificationSettings";
import TransactionSettings from "./TransactionSettings";

export default function BudgetSettings({ budget }: { budget: CachedBudget }) {
  const { popupState, shownBudgetIds, toggleShowBudget } = useStorageContext();
  const [showSettings, setShowSettings] = useState(false);

  const controlsId = useId();

  // auto-open budget settings if it's the currently selected budget
  useEffect(() => {
    if (budget.id === popupState?.budgetId) setShowSettings(true);
  }, [budget.id, popupState?.budgetId]);

  // hide budget settings if budget has been hidden by user
  useEffect(() => {
    if (shownBudgetIds && !shownBudgetIds.includes(budget.id)) setShowSettings(false);
  }, [budget.id, shownBudgetIds]);

  return (
    <li>
      <div className="flex-row">
        <label
          className={clsx("flex-row", {
            "heading-medium": shownBudgetIds?.includes(budget.id)
          })}>
          <input
            type="checkbox"
            checked={shownBudgetIds?.includes(budget.id)}
            onChange={() => toggleShowBudget(budget.id)}
          />
          {budget.name}
        </label>
        {shownBudgetIds?.includes(budget.id) && (
          <IconButton
            aria-controls={controlsId}
            aria-expanded={showSettings}
            icon={<Settings size={18} aria-hidden />}
            label={!showSettings ? "Show budget settings" : "Hide budget settings"}
            onClick={() => setShowSettings((prev) => !prev)}
          />
        )}
      </div>
      {showSettings && <BudgetSettingsDetail id={controlsId} budget={budget} />}
    </li>
  );
}

function BudgetSettingsDetail({ id, budget }: { id: string; budget: CachedBudget }) {
  return (
    <fieldset
      id={id}
      className="flex-col gap-sm rounded mt-sm"
      style={{
        marginLeft: "1.8em",
        padding: "0 1em 0.5em",
        maxWidth: "15rem"
      }}>
      <legend>Budget settings</legend>
      <TransactionSettings budget={budget} />
      <NotificationSettings budget={budget} />
      <ConfettiSettings budget={budget} />
    </fieldset>
  );
}
