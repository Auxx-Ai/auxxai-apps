// src/shopify-customers.connector.ts
//
// Shopify Customers data connector — syncs storefront customers into the system
// `contact` def (contributing mode, merge on email). This is the app's first
// data connector: one `customer` stream whose `execute` pages the REST
// /customers.json endpoint, returning ONE page + a cursor per call. The platform
// loops `execute` (Step 11), validates each record against the stream schema,
// maps it onto `contact`, and writes — the app never sees target defs or writes
// entities.
//
// Contributing into the EXISTING system contact def (no owned entity) sidesteps
// owned-mode materialization. External id = Shopify customer id (primary key);
// `email` is the secondary identity-match key so an imported customer merges into
// an existing contact on first link.

import { defineDataConnector } from '@auxx/sdk/data-connectors'
import { z } from '@auxx/sdk/tools'
import shopifyCustomersSync from './shopify-customers.connector.server'

export const shopifyCustomersConnector = defineDataConnector({
  id: 'shopify.customers',
  label: 'Shopify Customers',
  requiresConnection: true,
  iconKey: 'users',
  // No toggles for v1 — still required by defineDataConnector.
  config: z.object({}),
  streams: [
    {
      key: 'customer',
      // Guests/phone-only customers have no name → email is the safe display
      // (ConnectorRecord.displayName falls back defensively in the handler).
      displayFieldKey: 'email',
      // SOURCE schema (Layer A) — one fetched customer. PII flags are surfaced +
      // default-excluded in the mapping UI.
      fields: {
        id: { type: 'TEXT', name: 'Shopify Customer ID', sourcePath: 'id' },
        email: { type: 'EMAIL', name: 'Email', sourcePath: 'email', pii: true },
        firstName: { type: 'TEXT', name: 'First Name', sourcePath: 'first_name', pii: true },
        lastName: { type: 'TEXT', name: 'Last Name', sourcePath: 'last_name', pii: true },
        phone: { type: 'TEXT', name: 'Phone', sourcePath: 'phone', pii: true },
        ordersCount: { type: 'NUMBER', name: 'Orders', sourcePath: 'orders_count' },
        totalSpent: { type: 'CURRENCY', name: 'Total Spent', sourcePath: 'total_spent' },
        createdAt: { type: 'DATETIME', name: 'Shopify Created', sourcePath: 'created_at' },
      },
      // Contributing into the SYSTEM contact def — merge on email, Shopify
      // customer id stays the primary (external) key.
      defaultMappings: [
        {
          rootPath: '',
          target: { mode: 'contributing', entityKind: 'contact', matchFieldKeys: ['email'] },
        },
      ],
      exampleRecord: {
        id: 'gid://shopify/Customer/207119551',
        email: 'jane@example.com',
        first_name: 'Jane',
        last_name: 'Doe',
        phone: '+15555550123',
        orders_count: 4,
        total_spent: '210.00',
        created_at: '2024-02-11T10:00:00Z',
      },
    },
  ],
  execute: shopifyCustomersSync,
})
