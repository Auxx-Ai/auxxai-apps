// src/tools/internal/label-cancel-refund.tool.server.ts

import { executeLabel } from '../../blocks/shipstation/resources/label/label-execute.server'

export default async function labelCancelRefundExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeLabel('cancelRefund', input)
}
