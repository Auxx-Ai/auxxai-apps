// src/tools/internal/task-create.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import msTeamsIcon from '../../assets/icon.png'
import taskCreateExecute from './task-create.tool.server'

export const taskCreateTool = defineTool({
  id: 'block_ms_teams_task_create',
  name: 'Microsoft Teams: create Planner task (block-internal)',
  description: 'Internal tool backing the Microsoft Teams workflow block. Not exposed to agents.',
  icon: msTeamsIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: taskCreateExecute,
})
