// src/tools/internal/employee-get-many.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../../assets/icon.png'
import employeeGetManyExecute from './employee-get-many.tool.server'

export const quickbooksEmployeeGetManyTool = defineTool({
  id: 'block_quickbooks_employee_get_many',
  name: 'QuickBooks: get many employees (block-internal)',
  description: 'Internal tool backing the QuickBooks workflow block. Not exposed to agents.',
  icon: quickbooksIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 30000 },
  execute: employeeGetManyExecute,
})
