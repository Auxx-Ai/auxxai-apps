// src/blocks/discord/resources/message/message-panel.tsx

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { discordSchema } from '../../discord-schema'

type SelectOption = { label: string; value: string }

interface MessagePanelProps {
  api: UseWorkflowApi<typeof discordSchema>
  guilds: SelectOption[]
  guildsLoading: boolean
  guildsError: string | null
  channels: SelectOption[]
  channelsLoading: boolean
  channelsError: string | null
}

export function MessagePanel({
  api,
  guilds,
  guildsLoading,
  guildsError,
  channels,
  channelsLoading,
  channelsError,
}: MessagePanelProps) {
  const {
    StringInput,
    NumberInput,
    OptionsInput,
    BooleanInput,
    VarField,
    VarFieldGroup,
    Section,
    ConditionalRender,
  } = api

  const guildOptions = guildsLoading
    ? [{ label: 'Loading servers...', value: '' }]
    : guildsError
      ? [{ label: `Error: ${guildsError}`, value: '' }]
      : guilds
  const channelOptions = channelsLoading
    ? [{ label: 'Loading channels...', value: '' }]
    : channelsError
      ? [{ label: `Error: ${channelsError}`, value: '' }]
      : channels

  return (
    <>
      {/* Message: Send */}
      <ConditionalRender when={(d) => d.operation === 'send'}>
        <Section title="Server & Channel">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'sendGuild'} options={guildOptions} />
            </VarField>
            <VarField>
              <OptionsInput name={'sendChannel'} options={channelOptions} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Message">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'sendContent'} multiline />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name={'sendReplyTo'} />
            </VarField>
            <VarField>
              <BooleanInput name={'sendTts'} />
            </VarField>
            <VarField>
              <BooleanInput name={'sendSuppressEmbeds'} />
            </VarField>
            <VarField>
              <BooleanInput name={'sendSuppressNotifications'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Message: Get */}
      <ConditionalRender when={(d) => d.operation === 'get'}>
        <Section title="Server & Channel">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'getMessageGuild'} options={guildOptions} />
            </VarField>
            <VarField>
              <OptionsInput name={'getMessageChannel'} options={channelOptions} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Message">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'getMessageId'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Message: Get Many */}
      <ConditionalRender when={(d) => d.operation === 'getMany'}>
        <Section title="Server & Channel">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'getManyMessageGuild'} options={guildOptions} />
            </VarField>
            <VarField>
              <OptionsInput name={'getManyMessageChannel'} options={channelOptions} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options">
          <VarFieldGroup>
            <VarField>
              <BooleanInput name={'getManyMessageReturnAll'} />
            </VarField>
            <ConditionalRender when={(d) => !d.getManyMessageReturnAll}>
              <VarField>
                <NumberInput name={'getManyMessageLimit'} />
              </VarField>
            </ConditionalRender>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Message: Delete */}
      <ConditionalRender when={(d) => d.operation === 'delete'}>
        <Section title="Server & Channel">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'deleteMessageGuild'} options={guildOptions} />
            </VarField>
            <VarField>
              <OptionsInput name={'deleteMessageChannel'} options={channelOptions} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Message">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'deleteMessageId'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Message: React */}
      <ConditionalRender when={(d) => d.operation === 'react'}>
        <Section title="Server & Channel">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'reactGuild'} options={guildOptions} />
            </VarField>
            <VarField>
              <OptionsInput name={'reactChannel'} options={channelOptions} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Reaction">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'reactMessageId'} />
            </VarField>
            <VarField>
              <StringInput name={'reactEmoji'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
