// src/app.settings.ts

import { type SettingsSchema } from '@auxx/sdk'

/**
 * Supabase declares no app settings.
 *
 * `projectUrl` used to live here, shared across every Supabase connection in the
 * org. It is now a connection variable beside the Service Role key it belongs
 * with: a service_role key is only meaningful against the project that issued it,
 * and one org-wide URL made a second project point the first project's key at the
 * wrong host. This is the followup recorded in
 * plans/kopilot/apps/supabase-overhaul.md §8 Q1.
 */
export const appSettingsSchema = {
  organization: {},
  user: {},
} satisfies SettingsSchema

export default appSettingsSchema
