// src/tools/internal/task-get.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import msTeamsIcon from '../../assets/icon.png'
import taskGetExecute from './task-get.tool.server'

export const taskGetTool = defineTool({
  id: 'block_ms_teams_task_get',
  name: 'Microsoft Teams: get Planner task (block-internal)',
  description: 'Internal tool backing the Microsoft Teams workflow block. Not exposed to agents.',
  icon: msTeamsIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: taskGetExecute,
})
