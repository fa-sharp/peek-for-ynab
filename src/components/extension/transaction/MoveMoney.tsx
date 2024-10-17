import { type FormEventHandler, useCallback, useRef, useState } from "react";
import { SwitchVertical } from "tabler-icons-react";
import type { MonthDetail } from "ynab";

import { CategorySelect, CurrencyView, IconButton } from "~components";
import { useStorageContext, useYNABContext } from "~lib/context";
import type { BudgetMainData, CachedBudget, PopupState } from "~lib/types";
import { millisToStringValue, stringValueToMillis } from "~lib/utils";

/** Form that lets user move money to/from category, or between categories */
export default function MoveMoneyWrapper() {
  const { selectedBudgetData, budgetMainData, monthData, moveMoney } = useYNABContext();
  const { popupState, setPopupState } = useStorageContext();

  return (
    <section>
      <div className="heading-big">
        <div role="heading">Move money</div>
      </div>
      <div className="mt-lg mb-lg">
        ⚠️ Money moves made here will not show up in the &ldquo;Recent Moves&rdquo;
        section in YNAB.
      </div>
      {!budgetMainData || !selectedBudgetData || !popupState ? (
        <div>Loading...</div>
      ) : (
        <MoveMoneyInner
          budgetMainData={budgetMainData}
          selectedBudgetData={selectedBudgetData}
          monthData={monthData}
          moveMoney={moveMoney}
          popupState={popupState}
          resetPopupState={() => {
            setPopupState({
              ...(popupState?.moveMoneyState?.returnTo || { view: "main" }),
              moveMoneyState: undefined
            });
          }}
        />
      )}
    </section>
  );
}

interface Props {
  selectedBudgetData: CachedBudget;
  budgetMainData: BudgetMainData;
  monthData?: MonthDetail;
  popupState: PopupState;
  moveMoney: (data: {
    subtractFromCategoryId?: string;
    addToCategoryId?: string;
    amountInMillis: number;
  }) => Promise<void>;
  resetPopupState: () => void;
}

export function MoveMoneyInner({
  selectedBudgetData,
  budgetMainData,
  monthData,
  moveMoney,
  popupState,
  resetPopupState
}: Props) {
  const [amount, setAmount] = useState(popupState.moveMoneyState?.amount || "");
  const [fromCategory, setFromCategory] = useState(() => {
    if (!popupState.moveMoneyState?.fromCategoryId) return null;
    return (
      budgetMainData.categoriesData.find(
        (c) => c.id === popupState?.moveMoneyState?.fromCategoryId
      ) || null
    );
  });
  const [toCategory, setToCategory] = useState(() => {
    if (!popupState.moveMoneyState?.toCategoryId) return null;
    return (
      budgetMainData.categoriesData.find(
        (c) => c.id === popupState.moveMoneyState?.toCategoryId
      ) || null
    );
  });

  const amountRef = useRef<HTMLInputElement>(null);
  const fromCategoryRef = useRef<HTMLInputElement>(null);
  const toCategoryRef = useRef<HTMLInputElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);

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
    if (fromCategory?.id === toCategory?.id) {
      setErrorMessage("Can't move money to the same category!");
      return;
    }
    setIsSaving(true);
    try {
      await moveMoney({
        amountInMillis: stringValueToMillis(amount, "Inflow"),
        subtractFromCategoryId: fromCategory?.id,
        addToCategoryId: toCategory?.id
      });
      resetPopupState();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Error while moving money: ", err);
      setErrorMessage("Error moving money! " + (err?.error?.detail || ""));
    }
    setIsSaving(false);
  };

  return (
    <form className="flex-col" onSubmit={onMoveMoney}>
      <label className="form-input">
        Amount
        <input
          ref={amountRef}
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
        ref={fromCategoryRef}
        movingMoney
        label="From"
        placeholder="(Blank to move from Ready to Assign)"
        categories={budgetMainData.categoriesData}
        categoryGroupsData={budgetMainData.categoryGroupsData}
        currentCategory={fromCategory}
        selectCategory={(selectedCategory) => {
          setFromCategory(selectedCategory);
          if (selectedCategory) {
            if (!toCategory) toCategoryRef.current?.focus();
            else if (!amount) amountRef.current?.focus();
            else saveButtonRef.current?.focus();
          }
        }}
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
          label="Switch 'From' and 'To' categories"
          onClick={switchToFromCategories}
        />
      </div>
      <CategorySelect
        ref={toCategoryRef}
        movingMoney
        label="To"
        placeholder="(Blank to move to Ready to Assign)"
        categories={budgetMainData.categoriesData}
        categoryGroupsData={budgetMainData.categoryGroupsData}
        currentCategory={toCategory}
        selectCategory={(selectedCategory) => {
          setToCategory(selectedCategory);
          if (selectedCategory) {
            if (!amount) amountRef.current?.focus();
            else if (!fromCategory) fromCategoryRef.current?.focus();
            else saveButtonRef.current?.focus();
          }
        }}
      />
      {[fromCategory?.category_group_name, toCategory?.category_group_name].includes(
        "Credit Card Payments"
      ) && (
        <div>
          ⚠️ You are moving money to/from a Credit Card Payment category! Did you mean to
          make a payment instead?
        </div>
      )}
      <div className="text-error">{errorMessage}</div>
      <div className="flex-row flex-row-reverse">
        <button
          ref={saveButtonRef}
          type="submit"
          className="button rounded accent mt-lg flex-1"
          disabled={isSaving}>
          {isSaving ? "Moving..." : "Move"}
        </button>
        <button
          type="button"
          className="button gray rounded mt-lg flex-1"
          onClick={() => resetPopupState()}
          disabled={isSaving}>
          Cancel
        </button>
      </div>
    </form>
  );
}
