// src/triggers/example/example.workflow.tsx

/**
 * Example trigger — declared with `defineTrigger`.
 *
 * Surface keys decide where the trigger shows up:
 *   - `workflow: { node, panel }`  — visible in the workflow editor's
 *     trigger picker. Required for any visual trigger.
 *   - `agent: { … }` (optional)   — opt this trigger in as a fan-out
 *     source for agents (e.g. an agent run whenever this trigger fires).
 *     Omit it if the trigger is workflow-only.
 *
 * Keep one trigger file per event source. The webhook → trigger mapping
 * happens in `src/webhooks/*` on the runtime side.
 */

import { defineTrigger } from '@auxx/sdk'
import { WorkflowNode, WorkflowNodeHandle, WorkflowNodeRow } from '@auxx/sdk/client'
import icon from '../../assets/icon.png'
import { ExampleTriggerPanel } from './example-panel'
import { exampleTriggerSchema } from './example-schema'
import exampleTriggerExecute from './example.server'

function ExampleTriggerNode() {
  return (
    <WorkflowNode>
      <WorkflowNodeRow label="Example: Event Received" />
      <WorkflowNodeHandle type="source" id="source" position="right" />
    </WorkflowNode>
  )
}

export const exampleTrigger = defineTrigger({
  id: 'template.example',
  label: 'Example Event',
  description: 'Fires when the example webhook receives a payload.',
  icon,
  color: '#888888',
  schema: exampleTriggerSchema,
  execute: exampleTriggerExecute,
  config: {
    timeout: 5000,
    retries: 0,
  },
  workflow: {
    node: ExampleTriggerNode,
    panel: ExampleTriggerPanel,
  },
  // agent: {},
  // ^ Uncomment to also expose this trigger as a fan-out source for
  //   agents (an agent run kicks off whenever this trigger fires).
})
