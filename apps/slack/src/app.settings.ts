// src/app.settings.ts

import { type SettingsSchema, Settings } from '@auxx/sdk'

/**
 * Slack App Settings Schema
 *
 * Settings can be accessed in your app using:
 * - getOrganizationSetting(key) - Get organization-level setting
 * - setOrganizationSetting(key, value) - Update organization setting
 */
export const appSettingsSchema = {
  organization: {
    signingSecret: Settings.string({
      label: 'Signing Secret',
      description:
        'Found in your Slack app\'s "Basic Information" page under "App Credentials". Used to verify incoming webhook requests from Slack.',
      minLength: 1,
    }),
  },

  user: {},
} satisfies SettingsSchema

export default appSettingsSchema
