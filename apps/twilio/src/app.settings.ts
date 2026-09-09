// src/app.settings.ts

import { type SettingsSchema } from '@auxx/sdk'

/**
 * Twilio declares no app settings.
 *
 * `accountSid` used to live here, one org-wide row away from the Auth Token it is
 * the username for. Both are now connection variables on the same connect method,
 * so a second Twilio account is a second connection rather than a setting that
 * silently repairs the pairing for everyone.
 */
export const appSettingsSchema = {
  organization: {},
  user: {},
} satisfies SettingsSchema

export default appSettingsSchema
