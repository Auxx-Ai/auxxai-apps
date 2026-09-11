// src/tools/internal/rate-get-many.tool.server.ts

import { executeRate } from '../../blocks/shipstation/resources/rate/rate-execute.server'

export default async function rateGetManyExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeRate('getMany', input)
}
