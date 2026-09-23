// src/tools/shared/map-company-settings.ts

/* eslint-disable @typescript-eslint/no-explicit-any */

/** The company facts accounting setup derives instead of asking. */
export interface QuickbooksCompanySettings {
  companyName: string | null
  /** 1-12, or null when QuickBooks names no month this recognises. */
  fiscalYearStartMonth: number | null
  country: string | null
  homeCurrency: string | null
  multiCurrencyEnabled: boolean
  /** YYYY-MM-DD, or null when the company has no closing date set. */
  bookCloseDate: string | null
  reportBasis: 'Accrual' | 'Cash' | null
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function monthNumber(value: unknown): number | null {
  if (typeof value !== 'string') return null
  const index = MONTHS.indexOf(value)
  return index === -1 ? null : index + 1
}

function nonEmpty(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null
}

/**
 * Map a `/companyinfo/{realmId}` body and a `/preferences` body into one
 * {@link QuickbooksCompanySettings}.
 */
export function mapCompanySettings(companyInfo: any, preferences: any): QuickbooksCompanySettings {
  const info = companyInfo?.CompanyInfo ?? {}
  const prefs = preferences?.Preferences ?? {}
  const accounting = prefs.AccountingInfoPrefs ?? {}
  const currency = prefs.CurrencyPrefs ?? {}

  // CompanyInfo is the documented source; AccountingInfoPrefs carries the same fact.
  const fiscalYearStartMonth =
    monthNumber(info.FiscalYearStartMonth) ?? monthNumber(accounting.FirstMonthOfFiscalYear)

  // xs:date; slice defends against a time or offset suffix.
  const bookClose = nonEmpty(accounting.BookCloseDate)
  const reportBasis = prefs.ReportPrefs?.ReportBasis

  return {
    companyName: nonEmpty(info.CompanyName),
    fiscalYearStartMonth,
    country: nonEmpty(info.Country),
    homeCurrency: nonEmpty(currency.HomeCurrency?.value),
    multiCurrencyEnabled: currency.MultiCurrencyEnabled === true,
    bookCloseDate: bookClose ? bookClose.slice(0, 10) : null,
    reportBasis: reportBasis === 'Accrual' || reportBasis === 'Cash' ? reportBasis : null,
  }
}
