// src/tools/internal/label-void.tool.server.ts

import { executeLabel } from '../../blocks/shipstation/resources/label/label-execute.server'

export default async function labelVoidExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeLabel('void', input)
}
