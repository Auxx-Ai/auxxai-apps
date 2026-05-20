// src/tools/ping.tool.tsx

/**
 * Example agent-exposed tool.
 *
 * The `agent` surface key opts this tool into the agent picker. Pair it with
 * a `toolsetSlug` so admins can group-approve it via that toolset.
 *
 * If you want the same tool to be runnable as a quick action from a ticket
 * (or other record surface), add an `action` surface key alongside `agent`.
 * If a tool is *only* used as a block dispatch target, omit both keys — it
 * stays internal-only (see `echo.tool.tsx`).
 */

import { defineTool, z } from '@auxx/sdk/tools'
import icon from '../assets/icon.png'
import pingExecute from './ping.tool.server'

export const pingTool = defineTool({
  id: 'ping',
  name: 'Ping',
  description: 'Echoes a message back to the caller. Use this as a sanity check.',
  icon,
  inputs: z.object({
    message: z.string().min(1).describe('Any string to echo back.'),
  }),
  outputs: z.object({
    reply: z.string(),
    receivedAt: z.string(),
  }),
  config: { timeout: 5000 },
  execute: pingExecute,
  agent: { toolsetSlug: 'template.examples' },
})
