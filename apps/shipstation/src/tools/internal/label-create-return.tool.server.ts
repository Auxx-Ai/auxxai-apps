// src/tools/internal/label-create-return.tool.server.ts

import { executeLabel } from '../../blocks/shipstation/resources/label/label-execute.server'

export default async function labelCreateReturnExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeLabel('createReturn', input)
}
