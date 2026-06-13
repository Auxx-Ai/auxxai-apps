// src/blocks/fedex/fedex.workflow.tsx

import {
  WorkflowNode,
  WorkflowNodeHandle,
  WorkflowNodeRow,
  useWorkflowNode,
} from '@auxx/sdk/client'
import type { WorkflowBlock } from '@auxx/sdk'
import icon from '../../assets/icon.png'
import fedexExecute from './fedex.server'
import { FedexPanel } from './fedex-panel'
import { fedexSchema } from './fedex-schema'
import { fedexToolMap } from './fedex-tool-map'

export { fedexSchema }

const OPERATION_LABELS: Record<string, string> = {
  track: 'Track by number',
  trackByReference: 'Track by reference',
  watch: 'Watch shipment',
  unwatch: 'Unwatch shipment',
}

function FedexNode() {
  const { data } = useWorkflowNode()
  const label = OPERATION_LABELS[data.operation as string] ?? 'FedEx'

  return (
    <WorkflowNode>
      <WorkflowNodeHandle type="target" id="target" position="left" />
      <WorkflowNodeRow label={`FedEx: ${label}`} />
      <WorkflowNodeHandle type="source" id="source" position="right" />
    </WorkflowNode>
  )
}

export const fedexBlock = {
  id: 'fedex',
  label: 'FedEx',
  description:
    'Track FedEx shipments by number or reference, and watch shipments for status changes',
  category: 'action' as const,
  icon,
  color: '#4D148C',
  schema: fedexSchema,
  node: FedexNode,
  panel: FedexPanel,
  toolMap: fedexToolMap,
  execute: fedexExecute,
  config: {
    timeout: 15000,
    retries: 1,
    requiresConnection: true,
  },
} satisfies WorkflowBlock<typeof fedexSchema>
