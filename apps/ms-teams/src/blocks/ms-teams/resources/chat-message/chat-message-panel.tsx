// src/blocks/ms-teams/resources/chat-message/chat-message-panel.tsx

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { msTeamsSchema } from '../../ms-teams-schema'

type SelectOption = { label: string; value: string }

interface ChatMessagePanelProps {
  api: UseWorkflowApi<typeof msTeamsSchema>
  chats: SelectOption[]
  chatsLoading: boolean
}

export function ChatMessagePanel({ api, chats, chatsLoading }: ChatMessagePanelProps) {
  const {
    StringInput,
    OptionsInput,
    BooleanInput,
    NumberInput,
    VarField,
    VarFieldGroup,
    Section,
    ConditionalRender,
  } = api

  const chatOptions = chatsLoading ? [{ label: 'Loading chats...', value: '' }] : chats

  return (
    <>
      {/* Chat Message: Create */}
      <ConditionalRender when={(d) => d.operation === 'create'}>
        <Section title="Chat">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'chatCreateChat'} options={chatOptions} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Message">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'chatCreateContentType'} />
            </VarField>
            <VarField>
              <StringInput name={'chatCreateMessage'} multiline />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Chat Message: Get */}
      <ConditionalRender when={(d) => d.operation === 'get'}>
        <Section title="Chat">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'chatGetChat'} options={chatOptions} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Message">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'chatGetMessageId'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Chat Message: Get Many */}
      <ConditionalRender when={(d) => d.operation === 'getMany'}>
        <Section title="Chat">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'chatGetManyChat'} options={chatOptions} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <BooleanInput name={'chatGetManyReturnAll'} />
            </VarField>
            <ConditionalRender when={(d) => !d.chatGetManyReturnAll}>
              <VarField>
                <NumberInput name={'chatGetManyLimit'} />
              </VarField>
            </ConditionalRender>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
