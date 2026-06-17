// src/blocks/ups/ups.workflow.tsx

import {
  WorkflowNode,
  WorkflowNodeHandle,
  WorkflowNodeRow,
  useWorkflowNode,
} from '@auxx/sdk/client'
import type { WorkflowBlock } from '@auxx/sdk'
import icon from '../../assets/icon.png'
import upsExecute from './ups.server'
import { UpsPanel } from './ups-panel'
import { upsSchema } from './ups-schema'
import { upsToolMap } from './ups-tool-map'

export { upsSchema }

const OPERATION_LABELS: Record<string, string> = {
  track: 'Track by number',
  watch: 'Watch shipment',
  unwatch: 'Unwatch shipment',
}

function UpsNode() {
  const { data } = useWorkflowNode()
  const label = OPERATION_LABELS[data.operation as string] ?? 'UPS'

  return (
    <WorkflowNode>
      <WorkflowNodeHandle type="target" id="target" position="left" />
      <WorkflowNodeRow label={`UPS: ${label}`} />
      <WorkflowNodeHandle type="source" id="source" position="right" />
    </WorkflowNode>
  )
}

export const upsBlock = {
  id: 'ups',
  label: 'UPS',
  description: 'Track UPS shipments by number, and watch shipments for status changes',
  category: 'action' as const,
  icon,
  color: '#351C15',
  schema: upsSchema,
  node: UpsNode,
  panel: UpsPanel,
  toolMap: upsToolMap,
  execute: upsExecute,
  config: {
    timeout: 15000,
    retries: 1,
    requiresConnection: true,
  },
} satisfies WorkflowBlock<typeof upsSchema>
