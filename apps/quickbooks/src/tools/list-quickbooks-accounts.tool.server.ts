// src/tools/list-quickbooks-accounts.tool.server.ts

import { quickbooksQuery } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection } from './shared/connection'
import { mapAccount, type MappedAccount } from './shared/map-account'

interface ListQuickbooksAccountsOutput {
  accounts: MappedAccount[]
}

export default async function listQuickbooksAccounts(): Promise<ListQuickbooksAccountsOutput> {
  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await quickbooksQuery<any>(realmId, 'Account', credential, {
    returnAll: true,
    sandbox,
  })

  return { accounts: raw.map(mapAccount) }
}
