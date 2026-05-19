// src/triggers/app-mention/app-mention-panel.tsx

import { WorkflowPanel, useWorkflow } from '@auxx/sdk/client'
import { appMentionSchema } from './app-mention-schema'

export function AppMentionPanel() {
  const { Section } = useWorkflow<typeof appMentionSchema>(appMentionSchema)
  return (
    <WorkflowPanel>
      <Section title="Trigger">
        <div style={{ padding: 8, fontSize: 12, opacity: 0.7 }}>
          Fires when someone @-mentions the Auxx bot in a Slack channel where the bot is a member.
          No configuration required.
        </div>
      </Section>
    </WorkflowPanel>
  )
}
