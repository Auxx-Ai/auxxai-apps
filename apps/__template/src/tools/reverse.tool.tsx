// src/tools/reverse.tool.tsx

/**
 * Second internal-only tool dispatched by the template block. See
 * `echo.tool.tsx` for an explanation of internal-only tools.
 */

import { defineTool, z } from '@auxx/sdk/tools'
import icon from '../assets/icon.png'
import reverseExecute from './reverse.tool.server'

export const reverseTool = defineTool({
  id: 'reverse',
  name: 'Reverse',
  description: 'Returns the input text reversed.',
  icon,
  inputs: z.object({
    text: z.string().min(1),
  }),
  outputs: z.object({
    text: z.string(),
  }),
  config: { timeout: 5000 },
  execute: reverseExecute,
})
