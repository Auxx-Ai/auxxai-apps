// src/tools/internal/employee-create.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../../assets/icon.png'
import employeeCreateExecute from './employee-create.tool.server'

export const quickbooksEmployeeCreateTool = defineTool({
  id: 'block_quickbooks_employee_create',
  name: 'QuickBooks: create employee (block-internal)',
  description: 'Internal tool backing the QuickBooks workflow block. Not exposed to agents.',
  icon: quickbooksIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 30000 },
  execute: employeeCreateExecute,
})
