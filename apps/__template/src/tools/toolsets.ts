// src/tools/toolsets.ts

import type { Toolset } from '@auxx/sdk/tools'

/**
 * Toolsets are the approval gate an admin uses to grant an agent a group of
 * tools at once. Each tool you want to expose to an agent should list a
 * `toolsetSlug` matching one of these ids — otherwise it won't be picked up
 * by the agent surface.
 *
 * Only tools that opt in via an `agent` surface key (see `ping.tool.tsx`)
 * show up here; internal-only tools (dispatched by a block) intentionally
 * don't appear in any toolset.
 */
export const templateToolsets: Toolset[] = [
  {
    id: 'template.examples',
    name: 'Template examples',
    description: 'Example tools an agent can call.',
    tools: ['ping'],
  },
]
