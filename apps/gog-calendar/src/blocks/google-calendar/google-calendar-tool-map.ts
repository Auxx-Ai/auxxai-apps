// src/blocks/google-calendar/google-calendar-tool-map.ts
//
// Dispatch table — maps `${resource}.${operation}` keys from the block
// schema to the tool id that executes the op. Lives in a plain .ts file
// (not the .workflow.tsx) so the server-side dispatcher can import it
// without dragging in the React/client surface. See plans/kopilot/agents/
// triggers/app-surface-per-app-migration.md §2.5.

export const googleCalendarToolMap = {
  'calendar.checkAvailability': 'gcal_block_check_availability',
  'event.create': 'gcal_block_create_event',
  'event.delete': 'gcal_block_delete_event',
  'event.get': 'gcal_block_get_event',
  'event.getMany': 'gcal_block_get_many_events',
  'event.update': 'gcal_block_update_event',
} as const

export type GoogleCalendarToolMap = typeof googleCalendarToolMap
