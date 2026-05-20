// src/app.tsx

/**
 * Main app configuration.
 *
 * Surfaces are declared on individual tool/block/trigger files (via
 * `agent`, `action`, and `workflow` keys). This file is the registry:
 * every tool, block, and trigger you ship is referenced here.
 */

import { TextBlock } from '@auxx/sdk/client'
import { templateBlock } from './blocks/template/template.workflow'
import { echoTool } from './tools/echo.tool'
import { pingTool } from './tools/ping.tool'
import { reverseTool } from './tools/reverse.tool'
import { templateToolsets } from './tools/toolsets'
import { exampleTrigger } from './triggers/example/example.workflow'

export const app = {
  record: {
    actions: [],
    bulkActions: [],
    widgets: [],
  },
  callRecording: {
    insight: { textActions: [] },
    summary: { textActions: [] },
    transcript: { textActions: [] },
  },
  workflow: {
    blocks: [templateBlock],
    triggers: [exampleTrigger],
  },
  /**
   * Tool registry. Every tool ships here regardless of surface:
   * - `pingTool`    — has an `agent` surface key, shows up in the agent picker.
   * - `echoTool` /
   *   `reverseTool` — internal-only (no `agent` / no `action`). They back the
   *                   `templateBlock` dispatcher and never appear in pickers.
   *
   * Add an `action` surface key to a tool to also expose it as a quick action
   * on a ticket / record. See `apps/stripe` for the reference exhibit.
   */
  tools: [pingTool, echoTool, reverseTool],
  toolsets: templateToolsets,
}

export function App() {
  return (
    <>
      <TextBlock align="center">Template</TextBlock>
      <TextBlock align="left">
        Scaffold for a new Auxx app. Replace this UI with something that explains your integration
        to the admin who's installing it.
      </TextBlock>
    </>
  )
}
