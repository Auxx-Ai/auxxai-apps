// src/blocks/google-contacts/google-contacts-tool-map.ts
//
// Dispatch table — maps `${resource}.${operation}` keys from the block
// schema to the tool id that executes the op. Lives in a plain .ts file
// (not the .workflow.tsx) so the server-side dispatcher can import it
// without dragging in the React/client surface. See plans/kopilot/agents/
// triggers/app-surface-per-app-migration.md §2.5.

export const googleContactsToolMap = {
  'contact.create': 'gog_contacts_block_create_contact',
  'contact.delete': 'gog_contacts_block_delete_contact',
  'contact.get': 'gog_contacts_block_get_contact',
  'contact.getMany': 'gog_contacts_block_get_many_contacts',
  'contact.update': 'gog_contacts_block_update_contact',
} as const

export type GoogleContactsToolMap = typeof googleContactsToolMap
