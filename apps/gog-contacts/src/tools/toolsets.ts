// src/tools/toolsets.ts

import type { Toolset } from '@auxx/sdk/tools'

/**
 * Toolsets exposed by gog-contacts. Read/write split per
 * plans/kopilot/apps/gog-contacts-overhaul.md §5 — even though Google
 * contact writes are recoverable, the split lets a triage agent get
 * `contacts.read` without arming it to mutate the org address book.
 *
 * `list_google_contact_groups` is intentionally toolset-less — the
 * platform bridge auto-attaches it when any other `gog-contacts.*`
 * toolset is enabled (same pattern as `list_my_calendars` /
 * `list_shopify_stores`).
 */
export const gogContactsToolsets: Toolset[] = [
  {
    id: 'gog-contacts.contacts.read',
    name: 'Google contacts (read)',
    description: 'Find, search, and inspect Google contacts on the connected account. Read-only.',
    tools: ['find_google_contact', 'get_google_contact', 'search_google_contacts'],
  },
  {
    id: 'gog-contacts.contacts.write',
    name: 'Google contacts (write)',
    description:
      'Create new Google contacts and update existing ones. Enable only for agents you trust to mutate the org address book.',
    tools: ['create_google_contact', 'update_google_contact'],
  },
]
