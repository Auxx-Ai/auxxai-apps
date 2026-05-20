// src/blocks/github/github.server.ts

import { githubBlockToolMap } from './github.workflow'
import { VALID_OPERATIONS } from './resources/constants'

type ToolMapKey = keyof typeof githubBlockToolMap

/**
 * Router-style dispatcher — the block now delegates per (resource, operation)
 * to internal tools (`tools/internal/*`) via the lambda-injected
 * `globalThis.__AUXX_WORKFLOW_SDK__.runTool`. See impl plan §6.3 / §7.4 and
 * plans/kopilot/agents/triggers/app-surface-per-app-migration.md §2.5.
 */
export default async function githubExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  const { resource, operation } = input

  const valid = VALID_OPERATIONS[resource]
  if (!valid) throw new Error(`Unknown resource: ${resource}`)
  if (!valid.includes(operation)) {
    throw new Error(`Invalid operation "${operation}" for resource "${resource}"`)
  }

  const key = `${resource}.${operation}` as ToolMapKey
  const toolId = githubBlockToolMap[key]
  if (!toolId) {
    throw new Error(`No tool mapped for ${key}`)
  }

  const runTool = (globalThis as any).__AUXX_WORKFLOW_SDK__?.runTool as
    | ((toolId: string, input: Record<string, any>) => Promise<Record<string, any>>)
    | undefined
  if (!runTool) {
    throw new Error(
      'Block dispatcher: runTool is not available on the workflow runtime. ' +
        'The lambda runtime must inject globalThis.__AUXX_WORKFLOW_SDK__.runTool.'
    )
  }

  return runTool(toolId, input)
}
