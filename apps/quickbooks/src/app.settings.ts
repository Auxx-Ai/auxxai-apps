import type { SettingsSchema } from '@auxx/sdk'

/**
 * QuickBooks declares no app settings.
 *
 * `sandbox` used to live here and was moved to a CHECKBOX **connection variable**
 * on the connect method. An app setting is scoped to the INSTALLATION and can be
 * flipped at any time with nothing reacting, while the environment is a property
 * of one CONNECTION: the token, the API host and every stored QuickBooks id
 * belong to a single company. Flipping the setting repointed the host while the
 * token, the label and the `qbo*Id` field values stayed put, which silently
 * reinterpreted them against the other environment.
 *
 * As a connection variable it is captured on the connect form beside the OAuth
 * button, arrives on `connection.fields`, and cannot drift afterwards — an OAuth
 * reconnect never re-opens the form. It also lets one org hold a sandbox and a
 * production company side by side, which one installation-wide boolean could
 * never express.
 */
export const appSettingsSchema = {
  organization: {},
  user: {},
} satisfies SettingsSchema

export default appSettingsSchema
