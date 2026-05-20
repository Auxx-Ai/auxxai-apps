// src/tools/internal/employee-update.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../../assets/icon.png'
import employeeUpdateExecute from './employee-update.tool.server'

export const quickbooksEmployeeUpdateTool = defineTool({
  id: 'block_quickbooks_employee_update',
  name: 'QuickBooks: update employee (block-internal)',
  description: 'Internal tool backing the QuickBooks workflow block. Not exposed to agents.',
  icon: quickbooksIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 30000 },
  execute: employeeUpdateExecute,
})
