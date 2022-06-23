import { ArrowsDownUp, ExternalLink, Settings } from "tabler-icons-react";

import { BudgetSelect, IconButton } from "~components";
import { useStorageContext } from "~lib/context";

export default function PopupNav() {
  const { cachedBudgets, selectedBudgetId, setSelectedBudgetId } = useStorageContext();

  if (!cachedBudgets) return null;

  const shownBudgets = cachedBudgets.filter((b) => b.show);

  return (
    <nav
      style={{
        marginBottom: 8,
        display: "flex",
        justifyContent: "space-between"
      }}>
      <BudgetSelect
        shownBudgets={shownBudgets}
        selectedBudgetId={selectedBudgetId}
        setSelectedBudgetId={setSelectedBudgetId}
      />
      <IconButton
        label="Change budget"
        onClick={() => {
          const currIndex = shownBudgets.findIndex((b) => b.id === selectedBudgetId);
          if (currIndex === shownBudgets.length - 1)
            setSelectedBudgetId(shownBudgets[0].id);
          else setSelectedBudgetId(shownBudgets[currIndex + 1].id);
        }}
        icon={<ArrowsDownUp />}
      />
      <IconButton
        label="Open budget in YNAB"
        onClick={() =>
          window.open(
            `https://app.youneedabudget.com/${selectedBudgetId}/budget`,
            "_blank"
          )
        }
        icon={<ExternalLink />}
      />
      <IconButton
        label="Settings"
        onClick={() => chrome?.runtime?.openOptionsPage()}
        icon={<Settings />}
      />
    </nav>
  );
}
