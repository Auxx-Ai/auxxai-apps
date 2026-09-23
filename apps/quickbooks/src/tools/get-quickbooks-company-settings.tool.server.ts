// src/tools/get-quickbooks-company-settings.tool.server.ts

import { quickbooksApi } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection } from './shared/connection'
import { mapCompanySettings, type QuickbooksCompanySettings } from './shared/map-company-settings'

/** Read `CompanyInfo` and `Preferences` and return the facts accounting setup needs. */
export default async function getQuickbooksCompanySettings(): Promise<QuickbooksCompanySettings> {
  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  const [companyInfo, preferences] = await Promise.all([
    quickbooksApi<Record<string, unknown>>(realmId, `/companyinfo/${realmId}`, credential, {
      sandbox,
    }),
    quickbooksApi<Record<string, unknown>>(realmId, '/preferences', credential, { sandbox }),
  ])

  return mapCompanySettings(companyInfo, preferences)
}
