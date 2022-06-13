import * as ynab from 'ynab'

export const formatCurrency = (millis: number) => 
    '$' + ynab.utils.convertMilliUnitsToCurrencyAmount(millis)