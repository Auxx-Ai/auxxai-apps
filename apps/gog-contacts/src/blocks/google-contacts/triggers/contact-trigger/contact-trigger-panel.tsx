import { WorkflowPanel, useWorkflow } from '@auxx/sdk/client'
import { contactTriggerSchema } from './contact-trigger-schema'

export function ContactTriggerPanel() {
  const api = useWorkflow<typeof contactTriggerSchema>(contactTriggerSchema)
  const { OptionsInput, VarField, VarFieldGroup, Section } = api

  return (
    <WorkflowPanel>
      <Section title="Trigger">
        <VarFieldGroup>
          <VarField>
            <OptionsInput name={'triggerOn'} />
          </VarField>
        </VarFieldGroup>
      </Section>
    </WorkflowPanel>
  )
}
