// src/tools/echo.tool.tsx

/**
 * Internal-only tool — no `agent` or `action` surface key.
 *
 * Tools without surface keys never appear in the agent picker or as quick
 * actions. They're still callable inside the platform — in this template
 * they're invoked by the workflow block's dispatcher (see
 * `blocks/template/template.server.ts`).
 *
 * Reach for this pattern when a block exposes multiple operations (e.g.
 * resource × operation pairs): each branch becomes a small internal tool,
 * and the block's server file is a thin `ctx.runTool` dispatcher.
 */

import { defineTool, z } from '@auxx/sdk/tools'
import icon from '../assets/icon.png'
import echoExecute from './echo.tool.server'

export const echoTool = defineTool({
  id: 'echo',
  name: 'Echo',
  description: 'Returns the input text unchanged.',
  icon,
  inputs: z.object({
    text: z.string().min(1),
  }),
  outputs: z.object({
    text: z.string(),
  }),
  config: { timeout: 5000 },
  execute: echoExecute,
})
