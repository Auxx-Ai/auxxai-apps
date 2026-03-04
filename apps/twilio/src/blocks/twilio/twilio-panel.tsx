// src/blocks/twilio/twilio-panel.tsx

import { useEffect } from 'react'
import { WorkflowPanel, useWorkflow } from '@auxx/sdk/client'
import { twilioSchema } from './twilio-schema'
import { OPERATIONS } from './resources/constants'
import { SmsPanel } from './resources/sms/sms-panel'
import { CallPanel } from './resources/call/call-panel'

export function TwilioPanel() {
  const api = useWorkflow<typeof twilioSchema>(twilioSchema)
  const { data, updateData, OptionsInput, VarFieldGroup, FieldRow, FieldDivider, Section, ConditionalRender } = api

  const resource = (data?.resource ?? 'sms') as keyof typeof OPERATIONS
  const operation = data?.operation ?? 'send'

  // Auto-reset operation when resource changes
  useEffect(() => {
    if (!data) return
    const validOps = OPERATIONS[resource]
    if (validOps && !validOps.some((op) => op.value === operation)) {
      updateData({ operation: validOps[0].value })
    }
  }, [resource])

  return (
    <WorkflowPanel>
      <Section title="Operation">
        <VarFieldGroup>
          <ConditionalRender when={(d) => d.resource === 'sms'}>
            <FieldRow>
              <OptionsInput name="resource" acceptsVariables={false} variant="outline" />
              <FieldDivider />
              <OptionsInput name="operation" options={OPERATIONS.sms} expand />
            </FieldRow>
          </ConditionalRender>

          <ConditionalRender when={(d) => d.resource === 'call'}>
            <FieldRow>
              <OptionsInput name="resource" acceptsVariables={false} variant="outline" />
              <FieldDivider />
              <OptionsInput name="operation" options={OPERATIONS.call} expand />
            </FieldRow>
          </ConditionalRender>
        </VarFieldGroup>
      </Section>

      <ConditionalRender when={(d) => d.resource === 'sms'}>
        <SmsPanel api={api} />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'call'}>
        <CallPanel api={api} />
      </ConditionalRender>
    </WorkflowPanel>
  )
}
