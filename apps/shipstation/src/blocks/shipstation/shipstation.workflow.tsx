// src/blocks/shipstation/shipstation.workflow.tsx

import { type WorkflowBlock } from '@auxx/sdk'
import {
  useWorkflowNode,
  WorkflowNode,
  WorkflowNodeHandle,
  WorkflowNodeRow,
} from '@auxx/sdk/client'
import shipstationIcon from '../../assets/icon.png'
import { ShipstationPanel } from './shipstation-panel'
import { shipstationSchema } from './shipstation-schema'
import { shipstationToolMap } from './shipstation-tool-map'
import shipstationExecute from './shipstation.server'

export { shipstationSchema }

/** Node captions. Keyed the same way as the tool map, so a gap is visible. */
const RESOURCE_LABELS: Record<string, Record<string, string>> = {
  shipment: {
    getMany: 'Get Shipments',
    get: 'Get Shipment',
    create: 'Create Shipment',
    update: 'Update Shipment',
    cancel: 'Cancel Shipment',
    addTag: 'Add Shipment Tag',
    removeTag: 'Remove Shipment Tag',
    addNote: 'Add Internal Note',
  },
  label: {
    getMany: 'Get Labels',
    get: 'Get Label',
    create: 'Purchase Label',
    void: 'Void Label',
    createReturn: 'Create Return Label',
    track: 'Track Label (master)',
  },
  tracking: {
    get: 'Track Package',
  },
  rate: {
    estimate: 'Estimate Rates',
    getMany: 'Get Rates',
    getForShipment: 'Get Shipment Rates',
  },
  carrier: {
    getMany: 'Get Carriers',
    getServices: 'Get Carrier Services',
    getPackageTypes: 'Get Package Types',
  },
  address: {
    validate: 'Validate Address',
  },
  fulfillment: {
    getMany: 'Get Fulfillments',
  },
}

function ShipstationNode() {
  const { data } = useWorkflowNode()

  const resource = data.resource as string
  const operation = data.operation as string
  const label = RESOURCE_LABELS[resource]?.[operation] || 'ShipStation'

  return (
    <WorkflowNode>
      <WorkflowNodeHandle type="target" id="target" position="left" />
      <WorkflowNodeRow label={label} />
      <WorkflowNodeHandle type="source" id="source" position="right" />
    </WorkflowNode>
  )
}

export const shipstationBlock = {
  id: 'shipstation',
  label: 'ShipStation',
  description:
    'Shipments, labels and package tracking. Look up or create shipments, purchase and void labels, issue return labels, shop rates and track individual boxes.',
  category: 'action',
  icon: shipstationIcon,
  color: '#0B5FFF',
  schema: shipstationSchema,
  node: ShipstationNode,
  panel: ShipstationPanel,
  execute: shipstationExecute,
  config: {
    timeout: 30000,
    // Writes are not idempotent. Purchasing a label twice buys two labels, so
    // the block must never retry on its own; a failed run is the author's to
    // re-run deliberately.
    retries: 0,
    requiresConnection: true,
  },
  toolMap: shipstationToolMap,
} satisfies WorkflowBlock<typeof shipstationSchema>
