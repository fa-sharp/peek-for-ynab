import React, { useCallback, useMemo, useState } from "react";
import { ArrowBack, ExternalLink } from "tabler-icons-react";
import { AccountType } from "ynab";

import { CurrencyView, IconButton, TransactionView } from "~components";
import {
  AddCCPaymentIcon,
  AddTransactionIcon,
  AddTransferIcon
} from "~components/icons/ActionIcons";
import { ImportErrorIcon, ReconcileAlertIcon } from "~components/icons/AlertIcons";
import { useNotificationsContext, useStorageContext, useYNABContext } from "~lib/context";
import type { TxAddInitialState } from "~lib/types";
import { millisToStringValue } from "~lib/utils";

const dateFormatter = new Intl.DateTimeFormat("default", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC"
});

const AccountTxsView = () => {
  const { settings, budgetSettings, selectedBudgetId, popupState, setPopupState } =
    useStorageContext();
  const { accountsData, categoriesData, selectedBudgetData } = useYNABContext();
  const { currentAlerts } = useNotificationsContext();

  const account = useMemo(
    () => accountsData?.find((a) => a.id === popupState.detailState?.id),
    [accountsData, popupState.detailState?.id]
  );

  const hasReconcileAlert = useMemo(
    () => account && currentAlerts?.[selectedBudgetId]?.accounts?.[account.id]?.reconcile,
    [account, currentAlerts, selectedBudgetId]
  );

  const hasImportError = useMemo(
    () =>
      account && currentAlerts?.[selectedBudgetId]?.accounts?.[account.id]?.importError,
    [account, currentAlerts, selectedBudgetId]
  );

  /** The corresponding CCP categoroy, if this is a credit card account */
  const ccpCategory = useMemo(
    () =>
      categoriesData?.find(
        (c) =>
          c.category_group_name === "Credit Card Payments" && c.name === account?.name
      ),
    [account?.name, categoriesData]
  );

  /** The state to return to after entering a transaction */
  const returnTo = useMemo<TxAddInitialState["returnTo"]>(
    () =>
      account && {
        view: "detail",
        detailState: {
          type: "account",
          id: account.id
        }
      },
    [account]
  );

  /** Open account in YNAB */
  const openAccount = useCallback(
    () =>
      account &&
      window.open(
        `https://app.ynab.com/${selectedBudgetId}/accounts/${account.id}`,
        "_blank"
      ),
    [account, selectedBudgetId]
  );

  if (!account || !selectedBudgetData) return <div>Loading...</div>;

  return (
    <section>
      <div className="flex-row justify-between mb-sm">
        <h2 className="heading-big">
          {account.name}
          <IconButton
            label="Open this account in YNAB"
            onClick={openAccount}
            icon={<ExternalLink aria-hidden />}
          />
        </h2>
        <IconButton
          icon={<ArrowBack aria-hidden />}
          label="Back to main view"
          onClick={() => setPopupState({ view: "main" })}
        />
      </div>
      <div className="flex-col gap-sm mb-lg">
        {hasImportError && (
          <div className="flex-row">
            <ImportErrorIcon />
            Import issue/error!
          </div>
        )}
        <div className="balance-display heading-medium">
          Working Balance:
          <CurrencyView
            key={`working-${account.id}`}
            milliUnits={account.balance}
            currencyFormat={selectedBudgetData.currencyFormat}
            colorsEnabled
            animationEnabled={settings?.animations}
          />
        </div>
        {(account.type === AccountType.CreditCard ||
          account.type === AccountType.LineOfCredit) &&
          ccpCategory && (
            <div className="balance-display heading-medium">
              Payment Category:
              <CurrencyView
                key={`ccp-${account.id}`}
                milliUnits={ccpCategory.balance}
                currencyFormat={selectedBudgetData.currencyFormat}
                colorsEnabled
                animationEnabled={settings?.animations}
              />
            </div>
          )}
        <div className="balance-display">
          Cleared Balance:
          <CurrencyView
            key={`cleared-${account.id}`}
            milliUnits={account.cleared_balance}
            currencyFormat={selectedBudgetData.currencyFormat}
            colorsEnabled
            animationEnabled={settings?.animations}
          />
        </div>
        <div className="balance-display">
          Uncleared Balance:
          <CurrencyView
            key={`uncleared-${account.id}`}
            milliUnits={account.uncleared_balance}
            currencyFormat={selectedBudgetData.currencyFormat}
            colorsEnabled
            animationEnabled={settings?.animations}
          />
        </div>
        {account.last_reconciled_at && (
          <div className="balance-display">
            Last Reconciled:
            <div className="flex-row">
              {hasReconcileAlert && (
                <IconButton
                  noAction
                  disabled
                  label={`Reconciled more than ${budgetSettings?.notifications.reconcileAlerts[account.id]} days ago!`}
                  icon={<ReconcileAlertIcon />}
                />
              )}
              {dateFormatter.format(new Date(account.last_reconciled_at))}
            </div>
          </div>
        )}
      </div>
      <div className="flex-row gap-lg mb-lg">
        <button
          className="button rounded accent flex-row"
          onClick={() =>
            setPopupState({
              view: "txAdd",
              txAddState: {
                accountId: account.id,
                returnTo
              }
            })
          }>
          <AddTransactionIcon /> Transaction
        </button>
        {account.type === AccountType.CreditCard ||
        account.type === AccountType.LineOfCredit ? (
          <button
            className="button rounded accent flex-row"
            onClick={() =>
              setPopupState({
                view: "txAdd",
                txAddState: {
                  amountType: "Inflow",
                  amount:
                    ccpCategory && ccpCategory.balance >= 0
                      ? millisToStringValue(ccpCategory.balance)
                      : undefined,
                  accountId: account.id,
                  isTransfer: true,
                  returnTo
                }
              })
            }>
            <AddCCPaymentIcon /> Payment
          </button>
        ) : account.type === AccountType.AutoLoan ||
          account.type === AccountType.MedicalDebt ||
          account.type === AccountType.Mortgage ||
          account.type === AccountType.OtherDebt ||
          account.type === AccountType.PersonalLoan ||
          account.type === AccountType.StudentLoan ? (
          <button
            className="button rounded accent flex-row"
            onClick={() =>
              account.transfer_payee_id &&
              setPopupState({
                view: "txAdd",
                txAddState: {
                  isTransfer: true,
                  amountType: "Outflow",
                  payee: {
                    id: account.transfer_payee_id,
                    name: account.name,
                    transferId: account.id
                  },
                  returnTo
                }
              })
            }>
            <AddTransferIcon /> Payment/transfer
          </button>
        ) : (
          <button
            className="button rounded accent flex-row"
            onClick={() =>
              setPopupState({
                view: "txAdd",
                txAddState: {
                  accountId: account.id,
                  isTransfer: true,
                  returnTo
                }
              })
            }>
            <AddTransferIcon aria-label="Add" /> Transfer
          </button>
        )}
      </div>
      <AccountActivityView key={account.id} accountId={account.id} />
    </section>
  );
};

export default AccountTxsView;

const AccountActivityView = ({ accountId }: { accountId: string }) => {
  const { setPopupState } = useStorageContext();
  const { useGetAccountTxs, selectedBudgetData } = useYNABContext();

  const [sinceDaysAgo, setSinceDaysAgo] = useState(15);
  const { data: accountTxs, isFetching: isFetchingTxs } = useGetAccountTxs(
    accountId,
    sinceDaysAgo
  );

  return (
    <>
      <h3 className="heading-medium mb-sm">Transactions</h3>
      {!accountTxs || !selectedBudgetData ? (
        <div>Loading transactions...</div>
      ) : (
        <ul className="list flex-col gap-sm">
          {accountTxs.map((tx) => (
            <li key={tx.id}>
              <TransactionView
                tx={tx}
                goToDetailView={(detailState) =>
                  setPopupState({ view: "detail", detailState })
                }
                detailLeft="category"
                currencyFormat={selectedBudgetData.currencyFormat}
              />
            </li>
          ))}
        </ul>
      )}
      {accountTxs && (
        <div className="flex-row font-small mt-md">
          {sinceDaysAgo !== 31 ? (
            <>
              <div>(Showing up to 15 days ago)</div>
              <button className="button gray rounded" onClick={() => setSinceDaysAgo(31)}>
                Show more
              </button>
            </>
          ) : sinceDaysAgo === 31 && isFetchingTxs ? (
            <div>(Loading more...)</div>
          ) : null}
        </div>
      )}
    </>
  );
};
