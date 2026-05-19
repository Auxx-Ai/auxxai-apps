// src/tools/toolsets.ts

import type { Toolset } from '@auxx/sdk/tools'

/**
 * Toolsets exposed by gog-calendar. The platform projects each `id` into the
 * runtime slug namespace as `app:gog-calendar:<localId>` for agent-side
 * filtering. See plans/kopilot/apps/README.md §4.4 and
 * plans/kopilot/apps/gog-calendar-overhaul.md §5.
 *
 * No `isDefault` flag — admins pick each toolset deliberately, which doubles
 * as the write-approval gate.
 */
export const calendarToolsets: Toolset[] = [
  {
    id: 'gog-calendar.availability',
    name: 'Calendar availability',
    description: 'Read-only availability queries against Google Calendar.',
    tools: ['check_calendar_availability', 'scan_calendar_busy'],
  },
  {
    id: 'gog-calendar.events',
    name: 'Calendar events',
    description: 'Create, update, delete, search, and inspect Google Calendar events.',
    tools: [
      'list_my_calendars',
      'search_calendar_events',
      'get_calendar_event',
      'create_calendar_event',
      'update_calendar_event',
      'delete_calendar_event',
    ],
  },
]
