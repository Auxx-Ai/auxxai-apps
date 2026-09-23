// apps/quickbooks/tests/company-settings.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/blocks/quickbooks/shared/quickbooks-api', () => ({
  quickbooksApi: vi.fn(),
}))
vi.mock('../src/tools/shared/connection', () => ({
  getQuickbooksConnection: vi.fn(async () => ({
    credential: 'token',
    realmId: 'company-A',
    sandbox: true,
  })),
}))

import { quickbooksApi } from '../src/blocks/quickbooks/shared/quickbooks-api'
import getCompanySettings from '../src/tools/get-quickbooks-company-settings.tool.server'
import { mapCompanySettings } from '../src/tools/shared/map-company-settings'

// Shapes per Intuit's v3 schema (Finance.xsd: CompanyInfo, CompanyAccountingPrefs, CurrencyPrefs,
// ReportPrefs); not captured from a live sandbox call.
const COMPANY_INFO = {
  CompanyInfo: {
    Id: '1',
    CompanyName: 'Sandbox Company_US_1',
    Country: 'US',
    FiscalYearStartMonth: 'April',
    CompanyStartDate: '2024-01-01',
  },
  time: '2026-09-23T10:00:00.000-07:00',
}

const PREFERENCES = {
  Preferences: {
    AccountingInfoPrefs: {
      FirstMonthOfFiscalYear: 'April',
      BookCloseDate: '2025-12-31',
      TrackDepartments: false,
    },
    CurrencyPrefs: { MultiCurrencyEnabled: true, HomeCurrency: { value: 'USD' } },
    ReportPrefs: { ReportBasis: 'Cash', CalcAgingReportFromTxnDate: false },
    Id: '1',
    SyncToken: '3',
  },
  time: '2026-09-23T10:00:00.000-07:00',
}

beforeEach(() => vi.clearAllMocks())

describe('mapCompanySettings', () => {
  it('maps a fully populated company', () => {
    expect(mapCompanySettings(COMPANY_INFO, PREFERENCES)).toEqual({
      companyName: 'Sandbox Company_US_1',
      fiscalYearStartMonth: 4,
      country: 'US',
      homeCurrency: 'USD',
      multiCurrencyEnabled: true,
      bookCloseDate: '2025-12-31',
      reportBasis: 'Cash',
    })
  })

  it('answers null for an unset closing date, basis and currency, and false for multicurrency', () => {
    const mapped = mapCompanySettings(COMPANY_INFO, {
      Preferences: { AccountingInfoPrefs: {}, CurrencyPrefs: {}, ReportPrefs: {} },
    })
    expect(mapped).toMatchObject({
      bookCloseDate: null,
      reportBasis: null,
      homeCurrency: null,
      multiCurrencyEnabled: false,
    })
  })

  it('falls back to AccountingInfoPrefs.FirstMonthOfFiscalYear', () => {
    const info = { CompanyInfo: { ...COMPANY_INFO.CompanyInfo, FiscalYearStartMonth: undefined } }
    expect(mapCompanySettings(info, PREFERENCES).fiscalYearStartMonth).toBe(4)
  })

  it('answers null when no fiscal year month is recognisable', () => {
    const info = { CompanyInfo: { ...COMPANY_INFO.CompanyInfo, FiscalYearStartMonth: 'Smarch' } }
    expect(mapCompanySettings(info, { Preferences: {} }).fiscalYearStartMonth).toBeNull()
  })

  it('keeps only the date of a closing date carrying a time', () => {
    const prefs = {
      Preferences: { AccountingInfoPrefs: { BookCloseDate: '2025-06-30T00:00:00-07:00' } },
    }
    expect(mapCompanySettings(COMPANY_INFO, prefs).bookCloseDate).toBe('2025-06-30')
  })
})

describe('get_quickbooks_company_settings', () => {
  it('reads companyinfo and preferences on the connection realm and environment', async () => {
    vi.mocked(quickbooksApi).mockImplementation(async (_realmId, path) =>
      path === '/preferences' ? PREFERENCES : COMPANY_INFO
    )

    const settings = await getCompanySettings()

    expect(quickbooksApi).toHaveBeenCalledWith('company-A', '/companyinfo/company-A', 'token', {
      sandbox: true,
    })
    expect(quickbooksApi).toHaveBeenCalledWith('company-A', '/preferences', 'token', {
      sandbox: true,
    })
    expect(settings.fiscalYearStartMonth).toBe(4)
    expect(settings.reportBasis).toBe('Cash')
  })
})
