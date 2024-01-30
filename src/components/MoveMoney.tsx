import { type FormEventHandler, useCallback, useState } from "react";
import { SwitchVertical } from "tabler-icons-react";

import { useStorageContext, useYNABContext } from "~lib/context";
import { millisToStringValue } from "~lib/utils";

import CategorySelect from "./CategorySelect";
import CurrencyView from "./CurrencyView";
import IconButton from "./IconButton";

/** Form that lets user budget funds to/from category, or between categories */
export default function MoveMoney() {
  const { popupState, setPopupState } = useStorageContext();
  const { categoriesData, monthData, selectedBudgetData, moveMoney } = useYNABContext();

  const [amount, setAmount] = useState(popupState.moveMoneyState?.amount || "");
  const [fromCategory, setFromCategory] = useState(() => {
    if (!popupState.moveMoneyState?.fromCategoryId) return null;
    return (
      categoriesData?.find((c) => c.id === popupState.moveMoneyState?.fromCategoryId) ||
      null
    );
  });
  const [toCategory, setToCategory] = useState(() => {
    if (!popupState.moveMoneyState?.toCategoryId) return null;
    return (
      categoriesData?.find((c) => c.id === popupState.moveMoneyState?.toCategoryId) ||
      null
    );
  });

  const switchToFromCategories = useCallback(() => {
    const newFromCategory = toCategory;
    setToCategory(fromCategory);
    setFromCategory(newFromCategory);
  }, [fromCategory, toCategory]);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const onMoveMoney: FormEventHandler = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    if (!fromCategory && !toCategory) {
      setErrorMessage("Please select either a 'from' or 'to' category!");
      return;
    }
    setIsSaving(true);
    try {
      await moveMoney({
        amountInMillis: Math.round(+amount * 1000),
        subtractFromCategoryId: fromCategory?.id,
        addToCategoryId: toCategory?.id
      });
      setPopupState({ view: "main" });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Error while moving money: ", err);
      setErrorMessage("Error moving money! " + (err?.error?.detail || ""));
    }
    setIsSaving(false);
  };

  return (
    <section>
      <div className="heading-big">
        <div role="heading">Move money</div>
      </div>
      <form className="flex-col" onSubmit={onMoveMoney}>
        <label className="form-input">
          Amount
          <input
            id="amount-input"
            required
            autoFocus
            aria-label="Amount"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.001"
            placeholder="0.00"
            autoComplete="off"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isSaving}
          />
        </label>
        <CategorySelect
          label="From"
          movingMoney
          categories={categoriesData}
          currentCategory={fromCategory}
          selectCategory={setFromCategory}
        />
        {!fromCategory && monthData ? (
          <div>
            Ready to Assign:{" "}
            <button
              type="button"
              className="button rounded gray"
              onClick={() => {
                if (monthData.to_be_budgeted < 0) return;
                setAmount(
                  millisToStringValue(
                    monthData.to_be_budgeted,
                    selectedBudgetData?.currencyFormat
                  )
                );
              }}>
              <CurrencyView
                colorsEnabled
                milliUnits={monthData.to_be_budgeted}
                currencyFormat={selectedBudgetData?.currencyFormat}
              />
            </button>
          </div>
        ) : fromCategory ? (
          <div>
            Available:{" "}
            <button
              type="button"
              className="button rounded gray"
              onClick={() => {
                if (fromCategory.balance < 0) return;
                setAmount(
                  millisToStringValue(
                    fromCategory.balance,
                    selectedBudgetData?.currencyFormat
                  )
                );
              }}>
              <CurrencyView
                colorsEnabled
                milliUnits={fromCategory.balance}
                currencyFormat={selectedBudgetData?.currencyFormat}
              />
            </button>
          </div>
        ) : null}
        <div className="flex-row">
          <IconButton
            icon={<SwitchVertical />}
            label="Switch 'To' and 'From' categories"
            onClick={switchToFromCategories}
          />
        </div>
        <CategorySelect
          label="To"
          movingMoney
          categories={categoriesData}
          currentCategory={toCategory}
          selectCategory={setToCategory}
        />

        <div className="error-message">{errorMessage}</div>
        <div className="flex-row flex-row-reverse">
          <button
            type="submit"
            className="button rounded accent mt-lg flex-1"
            disabled={isSaving}>
            {isSaving ? "Moving..." : "Move"}
          </button>
          <button
            type="button"
            className="button gray rounded mt-lg flex-1"
            onClick={() => setPopupState({ view: "main" })}
            disabled={isSaving}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
