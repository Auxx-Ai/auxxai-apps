// src/template.connector.ts
//
// EXAMPLE: replace with a real integration, or delete this file (and its
// `.server.ts` pair) if your app doesn't sync external records. One stream
// with two mappings, showing both mapping kinds:
//
//   - an OWNED mapping onto `templateItems` (declared in entities.ts): its
//     fields bind by `key` onto fields already declared on that entity;
//     type/name/identity are inherited, never redeclared here.
//   - a CONTRIBUTING mapping onto the platform's own `contact`: its fields
//     bind either onto a `defineFields` app field (`appField`) or a native
//     attribute (`target`), and `match: true` lets a second run adopt an
//     existing contact by email instead of creating a duplicate.
//
// Before declaring your own fields, entities, or a connector, read
// docs/app-fields-and-entities-guide.md in the main platform repo
// (/Users/mklooth/Sites/auxxai).

import { defineDataConnector } from '@auxx/sdk/data-connectors'
import { z } from '@auxx/sdk/tools'
import { templateItems } from './entities'
import templateSync from './template.connector.server'

export const templateConnector = defineDataConnector({
  id: 'template.core',
  label: 'Template Source',
  description: 'Example connector; replace with a real integration.',
  requiresConnection: false,
  config: z.object({}),
  streams: [
    {
      key: 'item',
      syncMode: 'incremental',
      exampleRecord: {
        id: '1',
        name: 'Example item',
        customer: { id: 'cust_1', email: 'jane@example.com' },
      },
      mappings: [
        // OWNED: writes the `items` entity declared in entities.ts.
        {
          rootPath: '',
          target: { entityKey: templateItems.key },
          fields: [
            { key: 'externalId', sourcePath: 'id' },
            { key: 'name', sourcePath: 'name' },
          ],
        },
        // CONTRIBUTING: enriches the platform's own `contact`. `owner` is
        // the RELATIONSHIP field declared on the owned entity above (the
        // installer already created it), so `relationshipFieldKey` names it
        // bare (no `system:` prefix; that's only for a field pre-existing
        // on a contributing PARENT def).
        {
          rootPath: 'customer',
          relationshipFieldKey: 'owner',
          target: { entityKind: 'contact' },
          fields: [
            { sourcePath: 'id', appField: 'externalCustomerId' },
            { sourcePath: 'email', target: 'primary_email', match: true },
          ],
        },
      ],
    },
  ],
  execute: templateSync,
})
