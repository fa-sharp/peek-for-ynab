import { clsx } from "clsx";
import { useEffect, useState } from "react";
import { Settings } from "tabler-icons-react";

import { IconButton } from "~components";
import { useStorageContext } from "~lib/context";
import type { BudgetSettings } from "~lib/context/storageContext";
import type { CachedBudget } from "~lib/context/ynabContext";

import NotificationSettings from "./NotificationSettings";
import TransactionSettings from "./TransactionSettings";

export default function BudgetSettings({ budget }: { budget: CachedBudget }) {
  const { shownBudgetIds, toggleShowBudget } = useStorageContext();
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (!shownBudgetIds?.includes(budget.id)) setShowSettings(false);
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
            icon={<Settings size={18} aria-hidden />}
            label={!showSettings ? "Show budget settings" : "Hide budget settings"}
            onClick={() => setShowSettings((prev) => !prev)}
          />
        )}
      </div>
      {showSettings && <BudgetSettingsDetail budget={budget} />}
    </li>
  );
}

function BudgetSettingsDetail({ budget }: { budget: CachedBudget }) {
  return (
    <div
      style={{
        marginLeft: "2rem",
        maxWidth: "15rem"
      }}>
      <TransactionSettings budget={budget} />
      <NotificationSettings budget={budget} />
    </div>
  );
}
