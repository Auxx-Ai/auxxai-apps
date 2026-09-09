// src/app.settings.ts

import { type SettingsSchema } from '@auxx/sdk'

/**
 * FedEx declares no app settings.
 *
 * `useTestEnvironment` used to live here and is now the `test_environment`
 * CHECKBOX **connection variable**, beside the client id and secret it belongs
 * with. An app setting is scoped to the INSTALLATION, so it repointed the host
 * while the sandbox keys on the connection stayed put; the environment is a
 * property of one CONNECTION.
 */
export const appSettingsSchema = {
  organization: {},
  user: {},
} satisfies SettingsSchema

export default appSettingsSchema
