// src/tools/internal/task-get-many.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import msTeamsIcon from '../../assets/icon.png'
import taskGetManyExecute from './task-get-many.tool.server'

export const taskGetManyTool = defineTool({
  id: 'block_ms_teams_task_get_many',
  name: 'Microsoft Teams: list Planner tasks (block-internal)',
  description: 'Internal tool backing the Microsoft Teams workflow block. Not exposed to agents.',
  icon: msTeamsIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: taskGetManyExecute,
})
