// src/app.settings.ts

import { Settings, type SettingsSchema } from '@auxx/sdk'

export const appSettingsSchema = {
  organization: {
    useTestEnvironment: Settings.boolean({
      label: 'Use FedEx sandbox environment',
      description:
        'Route API calls to apis-sandbox.fedex.com. Requires sandbox API credentials on the connection; sandbox returns canned data for FedEx test tracking numbers only.',
      isOptional: true,
    }),
  },
  user: {},
} satisfies SettingsSchema

export default appSettingsSchema
