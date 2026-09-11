// src/tools/internal/label-get-many.tool.server.ts

import { executeLabel } from '../../blocks/shipstation/resources/label/label-execute.server'

export default async function labelGetManyExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeLabel('getMany', input)
}
