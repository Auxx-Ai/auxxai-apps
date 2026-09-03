// src/template.connector.server.ts
//
// EXAMPLE server handler for `template.connector.ts`. Runs inside the
// app-runtime sandbox. Replace the hard-coded record with a real fetch
// against your provider, following the pagination contract:
// return ONE page of records plus `nextState.cursor`; the platform
// re-invokes with `state.cursor` set to it until you return
// `nextState.backfillComplete: true` (or omit the cursor).

import type {
  ConnectorExecuteArgs,
  ConnectorFetchResult,
  ConnectorRecord,
} from '@auxx/sdk/data-connectors'

export default async function templateSync(
  args: ConnectorExecuteArgs
): Promise<ConnectorFetchResult> {
  const { streamKey } = args

  if (streamKey !== 'item') {
    throw new Error(`template.core: unknown stream "${streamKey}"`)
  }

  // Replace with a real fetch. This example always returns the same single
  // record and reports the backfill complete on the first call.
  const record: ConnectorRecord = {
    streamKey: 'item',
    externalId: '1',
    displayName: 'Example item',
    fields: {
      id: '1',
      name: 'Example item',
      customer: { id: 'cust_1', email: 'jane@example.com' },
    },
  }

  return {
    records: [record],
    nextState: { backfillComplete: true },
  }
}
