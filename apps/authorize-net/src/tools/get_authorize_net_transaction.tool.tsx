// src/tools/get_authorize_net_transaction.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import authorizeNetIcon from '../assets/authorize-net.png'
import getAuthorizeNetTransactionExecute from './get_authorize_net_transaction.tool.server'
import { exampleTransactionDetail, transactionDetailSchema } from './shared/schemas'

export const getAuthorizeNetTransactionTool = defineTool({
  id: 'get_authorize_net_transaction',
  name: 'Get Authorize.net transaction',
  description:
    'Fetch one Authorize.net transaction by its transId, with the batch it settled in, its ' +
    'order invoice number, its authorisation code and the masked card. The invoice number is ' +
    'how a settled transaction is tied back to the order that produced it. No fee is reported ' +
    'because none exists on the transaction — the acquirer bills card fees on a monthly ' +
    'statement. Returns NO customer name, email or address. READ-ONLY.',
  icon: authorizeNetIcon,
  inputs: z.object({
    transId: z.string().describe('The Authorize.net transaction id, e.g. 2149186960.'),
  }),
  outputs: transactionDetailSchema.extend({
    summary: z.string().describe('Readable rollup. Safe to quote directly when answering.'),
  }),
  exampleOutput: {
    summary:
      'Authorize.net transaction 12345, authOnlyTransaction, status settledSuccessfully, ' +
      'settled 2.00 USD in batch 12345 (settledSuccessfully). Invoice INV00001. Visa XXXX1111. ' +
      'No fee is stated on a transaction — card fees arrive on the acquirer’s monthly statement.',
    ...exampleTransactionDetail,
  },
  config: { requiresConnection: true, idempotent: true, timeout: 20000 },
  execute: getAuthorizeNetTransactionExecute,
  agent: {
    toolsetSlug: 'authorize_net.settlements',
    idempotent: true,
    surfaces: ['internal', 'builder'],
  },
})
