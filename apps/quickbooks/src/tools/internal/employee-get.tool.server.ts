// src/tools/internal/employee-get.tool.server.ts

import { executeEmployee } from '../../blocks/quickbooks/resources/employee/employee-execute.server'

export default async function employeeGet(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeEmployee('get', input as Record<string, any>)
}
