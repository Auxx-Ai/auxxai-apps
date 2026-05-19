// src/app.settings.ts

import { type SettingsSchema, Settings } from '@auxx/sdk'

/**
 * Supabase requires two pieces of info: the Service Role key (stored on
 * the connection) and the Project URL (stored here, one per org).
 *
 * For orgs with multiple Supabase projects, the AppAccountPicker on
 * agents/workflows binds a credId — but projectUrl is shared across all
 * connections in the org for now. See plans/kopilot/apps/supabase-overhaul.md
 * §8 Q1 for the followup that moves projectUrl onto the connection.
 */
export const appSettingsSchema = {
  organization: {
    projectUrl: Settings.string({
      label: 'Supabase Project URL',
      description:
        'Your Supabase project URL. Find it in your Supabase dashboard under Settings → API → Project URL.',
      placeholder: 'https://your-project.supabase.co',
    }),
  },
  user: {},
} satisfies SettingsSchema

export default appSettingsSchema
