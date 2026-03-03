import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { telegramSchema } from '../../telegram-schema'

interface ChatPanelProps {
  api: UseWorkflowApi<typeof telegramSchema>
}

export function ChatPanel({ api }: ChatPanelProps) {
  const { StringInput, VarField, VarFieldGroup, Section, ConditionalRender } = api

  return (
    <>
      {/* Get */}
      <ConditionalRender when={(d) => d.operation === 'get'}>
        <Section title="Chat">
          <VarFieldGroup>
            <VarField>
              <StringInput name="getChatChatId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Get Administrators */}
      <ConditionalRender when={(d) => d.operation === 'getAdministrators'}>
        <Section title="Chat">
          <VarFieldGroup>
            <VarField>
              <StringInput name="getAdminsChatId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Get Member */}
      <ConditionalRender when={(d) => d.operation === 'getMember'}>
        <Section title="Member">
          <VarFieldGroup>
            <VarField>
              <StringInput name="getMemberChatId" />
            </VarField>
            <VarField>
              <StringInput name="getMemberUserId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Leave */}
      <ConditionalRender when={(d) => d.operation === 'leave'}>
        <Section title="Chat">
          <VarFieldGroup>
            <VarField>
              <StringInput name="leaveChatId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Set Description */}
      <ConditionalRender when={(d) => d.operation === 'setDescription'}>
        <Section title="Chat">
          <VarFieldGroup>
            <VarField>
              <StringInput name="setDescChatId" />
            </VarField>
            <VarField>
              <StringInput name="setDescDescription" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Set Title */}
      <ConditionalRender when={(d) => d.operation === 'setTitle'}>
        <Section title="Chat">
          <VarFieldGroup>
            <VarField>
              <StringInput name="setTitleChatId" />
            </VarField>
            <VarField>
              <StringInput name="setTitleTitle" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
