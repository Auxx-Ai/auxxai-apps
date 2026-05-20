// src/tools/internal/task-delete.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import msTeamsIcon from '../../assets/icon.png'
import taskDeleteExecute from './task-delete.tool.server'

export const taskDeleteTool = defineTool({
  id: 'block_ms_teams_task_delete',
  name: 'Microsoft Teams: delete Planner task (block-internal)',
  description: 'Internal tool backing the Microsoft Teams workflow block. Not exposed to agents.',
  icon: msTeamsIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: taskDeleteExecute,
})
