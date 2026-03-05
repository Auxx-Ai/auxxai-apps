// src/app.settings.ts

import { type SettingsSchema, Settings } from '@auxx/sdk'

export const appSettingsSchema = {
  organization: {
    businessAccountId: Settings.string({
      label: 'Business Account ID',
      description: 'WhatsApp Business Account ID',
    }),
    appId: Settings.string({
      label: 'Meta App ID',
      description: 'Meta App ID (from developers.facebook.com)',
    }),
    appSecret: Settings.string({
      label: 'Meta App Secret',
      description: 'Meta App Secret (for webhook signature verification)',
    }),
  },
  user: {},
} satisfies SettingsSchema

export default appSettingsSchema
