// src/blocks/slack/resources/message/message-panel.tsx

/**
 * Message resource panel UI.
 * Renders operation-specific inputs for Message:Send and Message:Delete.
 */

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { slackSchema } from '../../slack-schema'

type SelectOption = { label: string; value: string }

interface MessagePanelProps {
  api: UseWorkflowApi<typeof slackSchema>
  channels: SelectOption[]
  channelsLoading: boolean
  users: SelectOption[]
  usersLoading: boolean
}

export function MessagePanel({ api, channels, channelsLoading, users, usersLoading }: MessagePanelProps) {
  const { StringInput, OptionsInput, BooleanInput, VarField, VarFieldGroup, FieldRow, Section, ConditionalRender } = api

  return (
    <>
      {/* Message: Send — existing SendMessage UI */}
      <ConditionalRender when={(d) => d.operation === 'send'}>
        <Section title="Target">
          <VarFieldGroup>
            {/* Channel mode: [sendTo ▾] [channelMode ▾ ──────────────] */}
            <ConditionalRender when={(d) => d.sendTo === 'channel'}>
              <FieldRow>
                <OptionsInput name={'sendTo'} acceptsVariables={false} variant="outline" />
                <OptionsInput name={'channelMode'} expand />
              </FieldRow>
            </ConditionalRender>

            {/* User mode: [sendTo ▾] [userMode ▾ ──────────────────] */}
            <ConditionalRender when={(d) => d.sendTo === 'user'}>
              <FieldRow>
                <OptionsInput name={'sendTo'} acceptsVariables={false} variant="outline" />
                <OptionsInput name={'userMode'} expand />
              </FieldRow>
            </ConditionalRender>

            {/* Channel value rows */}
            <ConditionalRender when={(d) => d.sendTo === 'channel' && d.channelMode === 'list'}>
              <VarField>
                <OptionsInput
                  name={'channelList'}
                  options={channelsLoading ? [{ label: 'Loading channels...', value: '' }] : channels}
                />
              </VarField>
            </ConditionalRender>

            <ConditionalRender when={(d) => d.sendTo === 'channel' && d.channelMode === 'id'}>
              <VarField>
                <StringInput name={'channel'} />
              </VarField>
            </ConditionalRender>

            <ConditionalRender when={(d) => d.sendTo === 'channel' && d.channelMode === 'name'}>
              <VarField>
                <StringInput name={'channelName'} />
              </VarField>
            </ConditionalRender>

            <ConditionalRender when={(d) => d.sendTo === 'channel' && d.channelMode === 'url'}>
              <VarField>
                <StringInput name={'channelUrl'} />
              </VarField>
            </ConditionalRender>

            {/* User value rows */}
            <ConditionalRender when={(d) => d.sendTo === 'user' && d.userMode === 'list'}>
              <OptionsInput
                name={'userList'}
                options={usersLoading ? [{ label: 'Loading users...', value: '' }] : users}
              />
            </ConditionalRender>

            <ConditionalRender when={(d) => d.sendTo === 'user' && d.userMode === 'id'}>
              <VarField>
                <StringInput name={'user'} />
              </VarField>
            </ConditionalRender>

            <ConditionalRender when={(d) => d.sendTo === 'user' && d.userMode === 'email'}>
              <VarField>
                <StringInput name={'userEmail'} />
              </VarField>
            </ConditionalRender>
          </VarFieldGroup>
        </Section>

        <Section title="Message">
          <VarFieldGroup>
            <StringInput name={'text'} multiline />
          </VarFieldGroup>
        </Section>

        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name={'threadTs'} />
            </VarField>
            <VarField>
              <BooleanInput name={'unfurlLinks'} />
            </VarField>
            <VarField>
              <BooleanInput name={'unfurlMedia'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Message: Delete */}
      <ConditionalRender when={(d) => d.operation === 'delete'}>
        <Section title="Message to Delete" description="Only messages sent by the bot can be deleted.">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'deleteChannelMode'} />
            </VarField>

            <ConditionalRender when={(d) => d.deleteChannelMode === 'list'}>
              <VarField>
                <OptionsInput
                  name={'deleteChannelList'}
                  options={channelsLoading ? [{ label: 'Loading channels...', value: '' }] : channels}
                />
              </VarField>
            </ConditionalRender>

            <ConditionalRender when={(d) => d.deleteChannelMode === 'id'}>
              <VarField>
                <StringInput name={'deleteChannelId'} />
              </VarField>
            </ConditionalRender>

            <VarField>
              <StringInput name={'deleteMessageTs'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
