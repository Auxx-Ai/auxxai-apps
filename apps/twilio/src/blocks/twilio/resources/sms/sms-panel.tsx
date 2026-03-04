// src/blocks/twilio/resources/sms/sms-panel.tsx

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { twilioSchema } from '../../twilio-schema'

interface SmsPanelProps {
  api: UseWorkflowApi<typeof twilioSchema>
}

export function SmsPanel({ api }: SmsPanelProps) {
  const { StringInput, BooleanInput, VarField, VarFieldGroup, Section } = api

  return (
    <>
      <Section title="Message">
        <VarFieldGroup>
          <VarField>
            <StringInput name={'sendFrom'} />
          </VarField>
          <VarField>
            <StringInput name={'sendTo'} />
          </VarField>
          <StringInput name={'sendMessage'} multiline />
        </VarFieldGroup>
      </Section>

      <Section title="Options" collapsible>
        <VarFieldGroup>
          <VarField>
            <BooleanInput name={'sendToWhatsApp'} />
          </VarField>
          <VarField>
            <StringInput name={'sendStatusCallback'} />
          </VarField>
        </VarFieldGroup>
      </Section>
    </>
  )
}
