// src/tools/internal/employee-create.tool.server.ts

import { executeEmployee } from '../../blocks/quickbooks/resources/employee/employee-execute.server'

export default async function employeeCreate(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeEmployee('create', input as Record<string, any>)
}
