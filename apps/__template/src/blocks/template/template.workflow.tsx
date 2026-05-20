// src/blocks/template/template.workflow.tsx

/**
 * Example workflow block — demonstrates the dispatcher pattern.
 *
 * `toolMap` declares the routing table: each block operation maps to an
 * internal tool id. The block's server file (`template.server.ts`) is a
 * thin `ctx.runTool` dispatcher — it does not contain business logic.
 *
 * Internal tools (`echo`, `reverse`) are still registered in `app.tsx`
 * but have no `agent` or `action` surface key, so they never show up in
 * the agent picker or quick-action drawer. They exist solely to back this
 * block.
 */

import type { WorkflowBlock } from '@auxx/sdk'
import { WorkflowNode, WorkflowNodeHandle, WorkflowNodeRow, useWorkflowNode } from '@auxx/sdk/client'
import icon from '../../assets/icon.png'
import { TemplatePanel } from './template-panel'
import { templateSchema } from './template-schema'
import { templateToolMap } from './template-tool-map'
import templateExecute from './template.server'

export { templateSchema }

function TemplateNode() {
  const { data } = useWorkflowNode()
  const label = data.operation === 'reverse' ? 'Reverse Text' : 'Echo Text'

  return (
    <WorkflowNode>
      <WorkflowNodeHandle type="target" id="target" position="left" />
      <WorkflowNodeRow label={label} />
      <WorkflowNodeHandle type="source" id="source" position="right" />
    </WorkflowNode>
  )
}

export const templateBlock = {
  id: 'template',
  label: 'Template',
  description: 'Example workflow block. Dispatches to internal tools.',
  category: 'action',
  icon,
  color: '#888888',
  schema: templateSchema,
  node: TemplateNode,
  panel: TemplatePanel,
  config: {
    timeout: 5000,
    retries: 0,
  },
  toolMap: templateToolMap,
  execute: templateExecute,
} satisfies WorkflowBlock<typeof templateSchema>
