// src/blocks/whatsapp/whatsapp-panel.tsx

import { useEffect } from 'react'
import { WorkflowPanel, useWorkflow } from '@auxx/sdk/client'
import { whatsappSchema } from './whatsapp-schema'
import { OPERATIONS } from './resources/constants'
import { MessagePanel } from './resources/message/message-panel'
import { MediaPanel } from './resources/media/media-panel'
import { useWhatsappData } from './shared/use-whatsapp-data'
import listPhoneNumbers from './shared/list-phone-numbers.server'
import listTemplates from './shared/list-templates.server'

export function WhatsappPanel() {
  const api = useWorkflow<typeof whatsappSchema>(whatsappSchema)
  const {
    data,
    updateData,
    OptionsInput,
    VarFieldGroup,
    FieldRow,
    FieldDivider,
    Section,
    ConditionalRender,
  } = api

  const resource = (data?.resource ?? 'message') as keyof typeof OPERATIONS
  const operation = data?.operation ?? 'sendText'

  // Auto-reset operation when resource changes
  useEffect(() => {
    if (!data) return
    const validOps = OPERATIONS[resource]
    if (validOps && !validOps.some((op) => op.value === operation)) {
      updateData({ operation: validOps[0].value })
    }
  }, [resource])

  const needsPhoneNumbers =
    resource === 'message' || (resource === 'media' && operation === 'upload')
  const needsTemplates = resource === 'message' && operation === 'sendTemplate'

  const phoneNumbers = useWhatsappData('phoneNumbers', listPhoneNumbers, {
    enabled: needsPhoneNumbers,
  })
  const templates = useWhatsappData('templates', listTemplates, {
    enabled: needsTemplates,
  })

  return (
    <WorkflowPanel>
      <Section title="Operation">
        <VarFieldGroup>
          <ConditionalRender when={(d) => d.resource === 'message'}>
            <FieldRow>
              <OptionsInput name="resource" acceptsVariables={false} variant="outline" />
              <FieldDivider />
              <OptionsInput name="operation" options={OPERATIONS.message} expand />
            </FieldRow>
          </ConditionalRender>

          <ConditionalRender when={(d) => d.resource === 'media'}>
            <FieldRow>
              <OptionsInput name="resource" acceptsVariables={false} variant="outline" />
              <FieldDivider />
              <OptionsInput name="operation" options={OPERATIONS.media} expand />
            </FieldRow>
          </ConditionalRender>
        </VarFieldGroup>
      </Section>

      <ConditionalRender when={(d) => d.resource === 'message'}>
        <MessagePanel api={api} phoneNumbers={phoneNumbers.data} templates={templates.data} />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'media'}>
        <MediaPanel api={api} phoneNumbers={phoneNumbers.data} />
      </ConditionalRender>
    </WorkflowPanel>
  )
}
