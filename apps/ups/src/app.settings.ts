// src/app.settings.ts

import { Settings, type SettingsSchema } from '@auxx/sdk'

export const appSettingsSchema = {
  organization: {
    useTestEnvironment: Settings.boolean({
      label: 'Use UPS test environment (CIE)',
      description:
        'Route API calls to wwwcie.ups.com. Returns canned responses for UPS test tracking numbers only. The OAuth connection still points at production.',
      isOptional: true,
    }),
  },
  user: {},
} satisfies SettingsSchema

export default appSettingsSchema
