// src/app.settings.ts

import { type SettingsSchema } from '@auxx/sdk'

/**
 * UPS declares no app settings.
 *
 * `useTestEnvironment` used to live here and is now the `test_environment`
 * CHECKBOX **connection variable**. An app setting is scoped to the INSTALLATION
 * and could be flipped under a live connection with nothing reacting; which
 * environment a connection talks to is a property of that connection alone.
 */
export const appSettingsSchema = {
  organization: {},
  user: {},
} satisfies SettingsSchema

export default appSettingsSchema
