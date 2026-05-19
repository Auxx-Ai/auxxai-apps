// src/tools/internal/task-update.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import msTeamsIcon from '../../assets/icon.png'
import taskUpdateExecute from './task-update.tool.server'

export const taskUpdateTool = defineTool({
  id: 'block_ms_teams_task_update',
  name: 'Microsoft Teams: update Planner task (block-internal)',
  description: 'Internal tool backing the Microsoft Teams workflow block. Not exposed to agents.',
  icon: msTeamsIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: taskUpdateExecute,
})
