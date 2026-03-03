// src/app.settings.ts

import { type SettingsSchema, Settings } from '@auxx/sdk'

export const appSettingsSchema = {
  organization: {
    accountSid: Settings.string({
      label: 'Account SID',
      description:
        'Your Twilio Account SID (starts with AC). Found in the Twilio Console under "Account Info".',
      placeholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    }),
  },
  user: {},
} satisfies SettingsSchema

export default appSettingsSchema
