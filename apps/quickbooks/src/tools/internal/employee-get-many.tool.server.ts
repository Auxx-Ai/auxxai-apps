// src/tools/internal/employee-get-many.tool.server.ts

import { executeEmployee } from '../../blocks/quickbooks/resources/employee/employee-execute.server'

export default async function employeeGetMany(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeEmployee('getMany', input as Record<string, any>)
}
