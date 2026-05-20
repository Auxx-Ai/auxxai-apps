// src/tools/internal/transaction-get-report.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../../assets/icon.png'
import transactionGetReportExecute from './transaction-get-report.tool.server'

export const quickbooksTransactionGetReportTool = defineTool({
  id: 'block_quickbooks_transaction_get_report',
  name: 'QuickBooks: get transaction report (block-internal)',
  description: 'Internal tool backing the QuickBooks workflow block. Not exposed to agents.',
  icon: quickbooksIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 30000 },
  execute: transactionGetReportExecute,
})
