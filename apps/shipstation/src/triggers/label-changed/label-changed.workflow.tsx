// src/triggers/label-changed/label-changed.workflow.tsx

import { defineTrigger } from '@auxx/sdk'
import { WorkflowNode, WorkflowNodeHandle, WorkflowNodeRow } from '@auxx/sdk/client'
import icon from '../../assets/icon.png'
import { LabelChangedPanel } from './label-changed-panel'
import { labelChangedSchema } from './label-changed-schema'
import labelChangedExecute from './label-changed.server'

function LabelChangedNode() {
  return (
    <WorkflowNode>
      <WorkflowNodeRow label="ShipStation: Label created or voided" />
      <WorkflowNodeHandle type="source" id="source" position="right" />
    </WorkflowNode>
  )
}

/**
 * Polling trigger over the two label deltas ShipStation actually supports:
 * creations by `created_at` and voids by `voided_at`. Each event carries a
 * `changeType`.
 *
 * `config.polling` is what makes this a polling trigger; the interval selector
 * is rendered by the platform, not by the panel.
 */
export const labelChangedTrigger = defineTrigger({
  id: 'shipstation.label-changed',
  label: 'Label created or voided',
  description:
    'Polls ShipStation for labels bought or voided since the last check and fires once per change, tagged `created` or `voided`. The first poll only establishes the starting point; it does not replay history.',
  icon,
  color: '#0B5FFF',
  schema: labelChangedSchema,
  execute: labelChangedExecute,
  config: {
    requiresConnection: true,
    timeout: 30000,
    retries: 0,
    polling: { intervalMinutes: 15, minIntervalMinutes: 5 },
  },
  workflow: {
    node: LabelChangedNode,
    panel: LabelChangedPanel,
  },
})
