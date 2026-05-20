// src/tools/internal/employee-update.tool.server.ts

import { executeEmployee } from '../../blocks/quickbooks/resources/employee/employee-execute.server'

export default async function employeeUpdate(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeEmployee('update', input as Record<string, any>)
}
