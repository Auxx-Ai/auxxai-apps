// src/app.settings.ts

import { type SettingsSchema } from '@auxx/sdk'

export const appSettingsSchema = {
  organization: {},
  user: {},
} satisfies SettingsSchema

export default appSettingsSchema
