// src/app.settings.ts

import { Settings, type SettingsSchema } from '@auxx/sdk'

export const appSettingsSchema = {
  organization: {
    chatChannelId: Settings.string({
      label: 'Chat channel',
      description:
        'Auxx chat channel that powers the storefront widget. Auto-bound on install when the org has a single chat channel.',
      optional: true,
    }),
  },
  user: {},
} satisfies SettingsSchema

export default appSettingsSchema
