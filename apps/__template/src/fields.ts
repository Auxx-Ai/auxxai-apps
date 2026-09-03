// src/fields.ts
//
// EXAMPLE: replace with your app's own fields, or delete this file if your
// app doesn't need any. `defineFields` adds fields to an EXISTING platform
// entity (here, `contact`); it does not declare a new entity. For that, see
// `entities.ts`.
//
// Before declaring your own fields, entities, or a connector, read
// docs/app-fields-and-entities-guide.md in the main platform repo
// (/Users/mklooth/Sites/auxxai).

import { defineFields } from '@auxx/sdk/fields'

/**
 * One field on `contact`: the external customer id this app's connector
 * writes at sync time (see `template.connector.ts`'s contributing mapping).
 * `identity: true` marks it as the value that IS the external-system id;
 * the platform mirrors it into `RecordIdentity` so re-syncs adopt the same
 * contact instead of creating duplicates. `scope: 'connection'` because the
 * id is per connected account, not shared across every install.
 */
export const templateFields = defineFields([
  {
    key: 'externalCustomerId',
    type: 'TEXT',
    name: 'Template customer ID',
    targetEntity: 'contact',
    scope: 'connection',
    identity: true,
    capabilities: { hidden: true, updatable: false, creatable: false },
  },
])
