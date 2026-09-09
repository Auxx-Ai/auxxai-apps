// src/app.settings.ts

import { type SettingsSchema } from '@auxx/sdk'

/**
 * Slack declares no app settings.
 *
 * `signingSecret` used to live here and is now a `secret: true` **connection
 * variable**. App settings are plaintext `jsonb` with no secret type, so the
 * sanctioned home for a Slack signing secret was a clear-text row beside the
 * encrypted credential store built for exactly that. As a connection variable it
 * is encrypted, captured on the connect form, and reaches the events webhook on
 * `connection.fields`.
 */
export const appSettingsSchema = {
  organization: {},
  user: {},
} satisfies SettingsSchema

export default appSettingsSchema
