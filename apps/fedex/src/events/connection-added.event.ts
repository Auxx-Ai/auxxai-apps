// src/events/connection-added.event.ts

import {
  type Connection,
  type ConnectionAddedResult,
  getOrganizationSetting,
} from '@auxx/sdk/server'
import { requestToken } from '../tools/shared/fedex-auth'

/**
 * Validate the submitted FedEx credentials by minting a token once — bad keys
 * fail at connect time, not on the first tool call. We don't cache this token
 * (the connection may not be KV-resolvable yet; the first tool call mints +
 * caches). Label the connection by account number so multiple FedEx accounts
 * in one org are tellable apart.
 */
export default async function connectionAdded({
  connection,
}: {
  connection: Connection
}): Promise<ConnectionAddedResult> {
  const fields = connection.fields ?? {}
  const clientId = fields.client_id
  const clientSecret = fields.client_secret
  const accountNumber = fields.account_number

  if (clientId && clientSecret) {
    const useTest = await getOrganizationSetting<boolean>('useTestEnvironment')
    const base = useTest ? 'https://apis-sandbox.fedex.com' : 'https://apis.fedex.com'
    // Throws ConnectionExpiredError on bad credentials, which surfaces to the admin.
    await requestToken(clientId, clientSecret, base)
  }

  return accountNumber ? { label: `FedEx ${accountNumber}` } : {}
}
