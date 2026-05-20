// src/tools/internal/transaction-get-report.tool.server.ts

import { executeTransaction } from '../../blocks/quickbooks/resources/transaction/transaction-execute.server'

export default async function transactionGetReport(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeTransaction('getReport', input as Record<string, any>)
}
