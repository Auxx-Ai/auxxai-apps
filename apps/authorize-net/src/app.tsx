// src/app.tsx

// Batches settle gross: the acquirer bills card fees on a monthly statement, so no
// figure here has one deducted. Read-only — writes wait on refund ownership (build
// plan §7).

import { TextBlock } from '@auxx/sdk/client'
import { authorizeNetConnector } from './authorize-net.connector'
import { authorizeNetBlock } from './blocks/authorize-net/authorize-net.workflow'
import { getAuthorizeNetTransactionTool } from './tools/get_authorize_net_transaction.tool'
import { listAuthorizeNetBatchTransactionsTool } from './tools/list_authorize_net_batch_transactions.tool'
import { listAuthorizeNetBatchesTool } from './tools/list_authorize_net_batches.tool'
import { listAuthorizeNetUnsettledTool } from './tools/list_authorize_net_unsettled.tool'
import { authorizeNetToolsets } from './tools/toolsets'

export const app = {
  dataConnectors: [authorizeNetConnector],
  workflow: { blocks: [authorizeNetBlock] },
  tools: [
    listAuthorizeNetBatchesTool,
    listAuthorizeNetBatchTransactionsTool,
    getAuthorizeNetTransactionTool,
    listAuthorizeNetUnsettledTool,
  ],
  toolsets: authorizeNetToolsets,
}

export function App() {
  return (
    <>
      <TextBlock align="center">Authorize.net</TextBlock>
      <TextBlock align="left">
        Authorize.net is the gateway in front of your card processor. At the end of each day it
        closes a batch, and your bank receives one deposit for it. This app syncs those settled
        batches and the individual charges and refunds inside them, so a line on the bank statement
        can be matched to the orders that produced it.
      </TextBlock>
      <TextBlock align="left">
        The deposits arrive in full. Card fees are not taken out of them — your processor bills
        those on a monthly statement instead, which arrives as a separate bill. So nothing here
        shows a fee, and no figure in this app has one deducted.
      </TextBlock>
      <TextBlock align="left">
        Staff and internal agents can also look up one transaction: the batch it settled in, the
        invoice number it carries, the authorisation code and the masked card. That invoice number
        is how a settled payment is tied back to a Shopify order. They can also see what has been
        captured but has not yet settled — money on its way, not money in the bank.
      </TextBlock>
      <TextBlock align="left">
        Everything here is read-only. Nothing in this app captures, refunds or voids a payment.
      </TextBlock>
      <TextBlock align="left">
        Connect with the API Login ID and Transaction Key from the Merchant Interface, under Account
        → Settings → Security Settings → API Credentials &amp; Keys, and choose whether this
        connection points at your live account or the sandbox. The Transaction Details API may need
        to be enabled on the same Security Settings screen before the reporting calls return
        anything; if batches come back empty on a working connection, check that first.
      </TextBlock>
    </>
  )
}
