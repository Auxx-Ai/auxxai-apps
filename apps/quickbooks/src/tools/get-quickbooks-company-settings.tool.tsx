// src/tools/get-quickbooks-company-settings.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import getQuickbooksCompanySettingsExecute from './get-quickbooks-company-settings.tool.server'

/** Platform-called read of the company settings accounting setup derives (fiscal year, currency, close date). */
export const getQuickbooksCompanySettingsTool = defineTool({
  id: 'get_quickbooks_company_settings',
  name: 'Get QuickBooks company settings',
  description:
    'Read the QuickBooks company settings accounting setup needs: fiscal year start month, country, home currency, multicurrency, books closing date and report basis. Used by the platform accounting setup - it is not meant for chat agents.',
  icon: quickbooksIcon,
  inputs: z.object({}),
  outputs: z.object({
    companyName: z.string().nullable(),
    fiscalYearStartMonth: z.number().int().min(1).max(12).nullable().describe('1 = January.'),
    country: z.string().nullable().describe('CompanyInfo.Country as QuickBooks returns it.'),
    homeCurrency: z.string().nullable().describe('ISO code, e.g. "USD".'),
    multiCurrencyEnabled: z.boolean(),
    bookCloseDate: z
      .string()
      .nullable()
      .describe('YYYY-MM-DD books closing date, or null when none is set.'),
    reportBasis: z.enum(['Accrual', 'Cash']).nullable(),
  }),
  exampleOutput: {
    companyName: 'Sandbox Company_US_1',
    fiscalYearStartMonth: 1,
    country: 'US',
    homeCurrency: 'USD',
    multiCurrencyEnabled: false,
    bookCloseDate: null,
    reportBasis: 'Accrual',
  },
  config: {
    requiresConnection: true,
    timeout: 20000,
  },
  execute: getQuickbooksCompanySettingsExecute,
  // No `agent` and no `action` key: the platform invokes it by id (see toolsets.ts).
})
