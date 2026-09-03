// src/entities.ts
//
// EXAMPLE: replace with your app's own entity, or delete this file if your
// app only adds fields to existing entities (see `fields.ts`) or has no
// entity system footprint at all. `defineEntity` declares a whole new
// definition this app owns end to end (fields, display fields,
// relationships), provisioned on install behind the same consent flow the
// platform's entity-template installer already uses.
//
// Before declaring your own fields, entities, or a connector, read
// docs/app-fields-and-entities-guide.md in the main platform repo
// (/Users/mklooth/Sites/auxxai).

import { defineEntity } from '@auxx/sdk/entities'

/**
 * A definition this app owns end to end. `externalId` is the record's
 * external-system id (`identity: true`, at most one per entity); `owner` is
 * a RELATIONSHIP to the platform's own `contact` kind; the installer
 * creates the inverse field (`inverseName`) on `contact` automatically.
 *
 * Registered on `app.entities` in `app.tsx`. `template.connector.ts`'s owned
 * mapping writes `externalId` / `name`; its contributing mapping resolves
 * `owner` from the same source record.
 */
export const templateItems = defineEntity({
  key: 'items',
  apiSlug: 'template_items',
  singular: 'Template Item',
  plural: 'Template Items',
  primaryDisplayField: 'name',
  fields: [
    {
      key: 'externalId',
      type: 'TEXT',
      name: 'External ID',
      identity: true,
      capabilities: { hidden: true },
    },
    { key: 'name', type: 'TEXT', name: 'Name' },
    {
      key: 'owner',
      type: 'RELATIONSHIP',
      name: 'Owner',
      relationship: {
        target: { entityKind: 'contact' },
        cardinality: 'belongs_to',
        inverseName: 'Template Items',
      },
    },
  ],
})
