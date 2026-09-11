// src/tools/internal/label-get.tool.server.ts

import { executeLabel } from '../../blocks/shipstation/resources/label/label-execute.server'

export default async function labelGetExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeLabel('get', input)
}
