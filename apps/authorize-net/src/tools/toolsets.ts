// src/tools/toolsets.ts

// A tool with an `agent` key must name a `toolsetSlug` matching an id here, or it is
// filed under `app:unknown:default` and never reaches the agent picker. No write toolset
// — build plan §7 keeps writes out until refund ownership is decided.

import type { Toolset } from '@auxx/sdk/tools'

export const authorizeNetToolsets: Toolset[] = [
  {
    id: 'authorize_net.settlements',
    name: 'Authorize.net settlements and transactions',
    description:
      'Read Authorize.net settled batches, the transactions inside them, one transaction’s ' +
      'detail, and what is captured but not yet settled. READ-ONLY: nothing here captures, ' +
      'refunds or voids anything. STAFF ONLY: grant this to an internal agent, never to a ' +
      'customer-facing chat or email agent — it can enumerate any customer’s card payment.',
    tools: [
      'list_authorize_net_batches',
      'list_authorize_net_batch_transactions',
      'get_authorize_net_transaction',
      'list_authorize_net_unsettled',
    ],
  },
]
