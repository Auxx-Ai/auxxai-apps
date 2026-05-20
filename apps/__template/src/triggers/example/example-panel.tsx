// src/triggers/example/example-panel.tsx

import { WorkflowPanel, useWorkflow } from '@auxx/sdk/client'
import { exampleTriggerSchema } from './example-schema'

export function ExampleTriggerPanel() {
  const { Section } = useWorkflow<typeof exampleTriggerSchema>(exampleTriggerSchema)
  return (
    <WorkflowPanel>
      <Section title="Trigger">
        <div style={{ padding: 8, fontSize: 12, opacity: 0.7 }}>
          Example trigger. Wire your webhook to fan out into this trigger via the platform runtime.
        </div>
      </Section>
    </WorkflowPanel>
  )
}
