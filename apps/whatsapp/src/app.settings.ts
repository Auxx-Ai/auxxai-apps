// src/app.settings.ts

import { type SettingsSchema } from '@auxx/sdk'

/**
 * WhatsApp declares no app settings.
 *
 * `businessAccountId`, `appId` and `appSecret` used to live here, the last of them
 * in plaintext because app settings have no secret type. All three are now
 * connection variables beside the access token: the token is minted for one Meta
 * app against one business account, so held apart they could name a different Meta
 * app than the one whose webhooks the secret verifies.
 */
export const appSettingsSchema = {
  organization: {},
  user: {},
} satisfies SettingsSchema

export default appSettingsSchema
