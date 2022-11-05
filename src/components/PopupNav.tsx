import { ArrowsDownUp, ExternalLink, Settings } from "tabler-icons-react";

import { BudgetSelect, IconButton } from "~components";
import { useStorageContext, useYNABContext } from "~lib/context";

export default function PopupNav() {
  const { selectedBudgetId, setSelectedBudgetId } = useStorageContext();
  const { shownBudgetsData } = useYNABContext();

  if (!shownBudgetsData) return <p>Loading budgets...</p>;

  return (
    <nav
      style={{
        marginBottom: 8,
        display: "flex",
        justifyContent: "space-between",
        gap: 3
      }}>
      <BudgetSelect
        shownBudgets={shownBudgetsData}
        selectedBudgetId={selectedBudgetId}
        setSelectedBudgetId={setSelectedBudgetId}
      />
      <IconButton
        label="Change budget"
        onClick={() => {
          const currIndex = shownBudgetsData.findIndex((b) => b.id === selectedBudgetId);
          if (currIndex === shownBudgetsData.length - 1)
            setSelectedBudgetId(shownBudgetsData[0].id);
          else setSelectedBudgetId(shownBudgetsData[currIndex + 1].id);
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
