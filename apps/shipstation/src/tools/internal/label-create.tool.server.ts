// src/tools/internal/label-create.tool.server.ts

import { executeLabel } from '../../blocks/shipstation/resources/label/label-execute.server'

export default async function labelCreateExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeLabel('create', input)
}
