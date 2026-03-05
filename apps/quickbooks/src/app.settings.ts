import { type SettingsSchema, Settings } from '@auxx/sdk'

export const appSettingsSchema = {
  organization: {
    sandbox: Settings.boolean({
      label: 'Sandbox Mode',
      description: 'Use QuickBooks sandbox environment for testing',
      default: false,
    }),
  },
  user: {},
} satisfies SettingsSchema

export default appSettingsSchema
