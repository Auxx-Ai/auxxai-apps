// src/blocks/authorize-net/authorize-net-tool-map.ts

// A plain `.ts`, not the `.workflow.tsx`, so the server dispatcher can import it without
// the React surface; the build extractor reads this literal at compile time. Every pair
// is reachable by Kopilot without the panel, which is safe only while all four are reads
// — a write operation (build plan §7) needs a permission check in the dispatcher.

export const authorizeNetToolMap = {
  'batch.getMany': 'list_authorize_net_batches',
  'batch.getTransactions': 'list_authorize_net_batch_transactions',
  'transaction.get': 'get_authorize_net_transaction',
  'transaction.getUnsettled': 'list_authorize_net_unsettled',
} as const

export type AuthorizeNetToolMap = typeof authorizeNetToolMap
