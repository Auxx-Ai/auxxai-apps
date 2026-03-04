// src/blocks/twilio/resources/call/call-panel.tsx

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { twilioSchema } from '../../twilio-schema'

interface CallPanelProps {
  api: UseWorkflowApi<typeof twilioSchema>
}

export function CallPanel({ api }: CallPanelProps) {
  const { StringInput, BooleanInput, VarField, VarFieldGroup, Section } = api

  return (
    <>
      <Section title="Call">
        <VarFieldGroup>
          <VarField>
            <StringInput name={'makeFrom'} />
          </VarField>
          <VarField>
            <StringInput name={'makeTo'} />
          </VarField>
          <StringInput name={'makeMessage'} multiline />
        </VarFieldGroup>
      </Section>

      <Section title="Options" collapsible>
        <VarFieldGroup>
          <VarField>
            <BooleanInput name={'makeUseTwiml'} />
          </VarField>
          <VarField>
            <StringInput name={'makeStatusCallback'} />
          </VarField>
        </VarFieldGroup>
      </Section>
    </>
  )
}
