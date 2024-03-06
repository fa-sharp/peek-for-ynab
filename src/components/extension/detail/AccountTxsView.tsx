import React, { useCallback, useMemo } from "react";
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
  const { useGetAccountTxs, accountsData, categoriesData, selectedBudgetData } =
    useYNABContext();

  const account = useMemo(
    () => accountsData?.find((a) => a.id === popupState.detailState?.id),
    [accountsData, popupState.detailState?.id]
  );
  const { data: accountTxs } = useGetAccountTxs(popupState.detailState?.id);

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
    <div>
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
      <div className="flex-row justify-between gap-lg mb-lg">
        <h3 className="heading-medium">Activity</h3>
        <div className="flex-row">
          Actions:
          <IconButton
            rounded
            accent
            label="Add transaction"
            icon={<AddTransactionIcon />}
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
            }
          />
          {account.type === AccountType.CreditCard ||
          account.type === AccountType.LineOfCredit ? (
            <IconButton
              rounded
              accent
              label="Add credit card payment"
              icon={<AddCCPaymentIcon />}
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
              }
            />
          ) : account.type === AccountType.AutoLoan ||
            account.type === AccountType.MedicalDebt ||
            account.type === AccountType.Mortgage ||
            account.type === AccountType.OtherDebt ||
            account.type === AccountType.PersonalLoan ||
            account.type === AccountType.StudentLoan ? (
            <IconButton
              rounded
              accent
              label="Add payment/transfer"
              icon={<AddTransferIcon />}
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
              }
            />
          ) : (
            <IconButton
              rounded
              accent
              label="Add transfer"
              icon={<AddTransferIcon />}
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
              }
            />
          )}
        </div>
      </div>
      {!accountTxs ? (
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
    </div>
  );
};

export default AccountTxsView;
