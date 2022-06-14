import * as ynab from 'ynab'

export const IS_PRODUCTION = (process.env.NODE_ENV === 'production')

export const formatCurrency = (millis: number) => 
    '$' + ynab.utils.convertMilliUnitsToCurrencyAmount(millis)

