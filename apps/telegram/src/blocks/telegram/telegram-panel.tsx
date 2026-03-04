import { useEffect } from 'react'
import { WorkflowPanel, useWorkflow } from '@auxx/sdk/client'
import { telegramSchema } from './telegram-schema'
import { OPERATIONS } from './resources/constants'
import { CallbackPanel } from './resources/callback/callback-panel'
import { ChatPanel } from './resources/chat/chat-panel'
import { FilePanel } from './resources/file/file-panel'
import { MessagePanel } from './resources/message/message-panel'

export function TelegramPanel() {
  const api = useWorkflow<typeof telegramSchema>(telegramSchema)
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
  const operation = data?.operation ?? 'sendMessage'

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
          <ConditionalRender when={(d) => d.resource === 'message'}>
            <FieldRow>
              <OptionsInput name="resource" acceptsVariables={false} variant="outline" />
              <FieldDivider />
              <OptionsInput name="operation" options={OPERATIONS.message} expand />
            </FieldRow>
          </ConditionalRender>

          <ConditionalRender when={(d) => d.resource === 'chat'}>
            <FieldRow>
              <OptionsInput name="resource" acceptsVariables={false} variant="outline" />
              <FieldDivider />
              <OptionsInput name="operation" options={OPERATIONS.chat} expand />
            </FieldRow>
          </ConditionalRender>

          <ConditionalRender when={(d) => d.resource === 'callback'}>
            <FieldRow>
              <OptionsInput name="resource" acceptsVariables={false} variant="outline" />
              <FieldDivider />
              <OptionsInput name="operation" options={OPERATIONS.callback} expand />
            </FieldRow>
          </ConditionalRender>

          <ConditionalRender when={(d) => d.resource === 'file'}>
            <FieldRow>
              <OptionsInput name="resource" acceptsVariables={false} variant="outline" />
              <FieldDivider />
              <OptionsInput name="operation" options={OPERATIONS.file} expand />
            </FieldRow>
          </ConditionalRender>
        </VarFieldGroup>
      </Section>

      <ConditionalRender when={(d) => d.resource === 'message'}>
        <MessagePanel api={api} />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'chat'}>
        <ChatPanel api={api} />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'callback'}>
        <CallbackPanel api={api} />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'file'}>
        <FilePanel api={api} />
      </ConditionalRender>
    </WorkflowPanel>
  )
}
