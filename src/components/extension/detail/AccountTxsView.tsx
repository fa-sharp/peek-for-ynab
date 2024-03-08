import React, { useCallback, useMemo, useState } from "react";
import { ArrowBack, ExternalLink } from "tabler-icons-react";
import { AccountType } from "ynab";

import { CurrencyView, IconButton, TransactionView } from "~components";
import {
  AddCCPaymentIcon,
  AddTransactionIcon,
  AddTransferIcon
} from "~components/icons/ActionIcons";
import { useStorageContext, useYNABContext } from "~lib/context";
import { millisToStringValue } from "~lib/utils";

const dateFormatter = new Intl.DateTimeFormat("default", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC"
});

const AccountTxsView = () => {
  const { settings, selectedBudgetId, popupState, setPopupState } = useStorageContext();
  const { accountsData, categoriesData, selectedBudgetData } = useYNABContext();

  const account = useMemo(
    () => accountsData?.find((a) => a.id === popupState.detailState?.id),
    [accountsData, popupState.detailState?.id]
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
    <section style={{ minWidth: 280 }}>
      <div className="flex-row justify-between mb-sm">
        <h2 className="heading-big">
          {account.name}
          <IconButton
            label="Open this account in YNAB"
            onClick={openAccount}
            icon={<ExternalLink />}
          />
        </h2>
        <IconButton
          icon={<ArrowBack />}
          label="Back to main view"
          onClick={() => setPopupState({ view: "main" })}
        />
      </div>
      <div className="flex-col gap-sm mb-lg">
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
            <div>{dateFormatter.format(new Date(account.last_reconciled_at))}</div>
          </div>
        )}
      </div>
      <div className="flex-row mb-lg">
        <button
          className="button rounded accent flex-row"
          onClick={() =>
            setPopupState({
              view: "txAdd",
              txAddState: {
                accountId: account.id,
                returnTo: {
                  view: "detail",
                  detailState: {
                    type: "account",
                    id: account.id
                  }
                }
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
                  returnTo: {
                    view: "detail",
                    detailState: {
                      type: "account",
                      id: account.id
                    }
                  }
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
                  returnTo: {
                    view: "detail",
                    detailState: {
                      type: "account",
                      id: account.id
                    }
                  }
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
                  returnTo: {
                    view: "detail",
                    detailState: {
                      type: "account",
                      id: account.id
                    }
                  }
                }
              })
            }>
            <AddTransferIcon /> Transfer
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
                detailLeft="category"
                detailLeftOnClick={() =>
                  tx.category_id
                    ? setPopupState({
                        view: "detail",
                        detailState: { id: tx.category_id, type: "category" }
                      })
                    : tx.transfer_account_id
                      ? setPopupState({
                          view: "detail",
                          detailState: { id: tx.transfer_account_id, type: "account" }
                        })
                      : undefined
                }
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
