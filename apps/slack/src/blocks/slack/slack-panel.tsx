// src/blocks/slack/slack-panel.tsx

/**
 * Top-level Slack panel component.
 *
 * Renders the Resource/Operation selector row and conditionally renders
 * the appropriate resource panel (ChannelPanel or MessagePanel).
 *
 * Handles:
 * - Auto-resetting operation when resource changes
 * - Lazy data loading (channels/users only fetched when needed)
 */

import { useEffect } from 'react'
import { WorkflowPanel, useWorkflow } from '@auxx/sdk/client'
import { slackSchema } from './slack-schema'
import { OPERATIONS } from './resources/constants'
import { ChannelPanel } from './resources/channel/channel-panel'
import { MessagePanel } from './resources/message/message-panel'
import { useSlackData } from './shared/use-slack-data'
import listChannels from './shared/list-channels.server'
import listUsers from './shared/list-users.server'

export function SlackPanel() {
  const api = useWorkflow<typeof slackSchema>(slackSchema)

  const { data, updateData, OptionsInput, VarFieldGroup, FieldRow, FieldDivider, Section, ConditionalRender } = api

  // Guard: data may be undefined on first render before the platform populates it
  const resource = (data?.resource ?? 'message') as keyof typeof OPERATIONS
  const operation = data?.operation ?? 'send'
  const sendTo = data?.sendTo ?? 'channel'

  // Auto-reset operation when resource changes to a value that doesn't
  // have the current operation (e.g. switching from message to channel
  // while "delete" is selected).
  useEffect(() => {
    if (!data) return
    const validOps = OPERATIONS[resource]
    if (validOps && !validOps.some((op) => op.value === operation)) {
      updateData({ operation: validOps[0].value })
    }
  }, [resource])

  // Lazy data loading — only fetch when the active resource/operation needs it
  const needsChannels =
    (resource === 'channel' && operation === 'get') ||
    (resource === 'message' && operation === 'send' && sendTo === 'channel') ||
    (resource === 'message' && operation === 'delete')

  const needsUsers =
    resource === 'message' && operation === 'send' && sendTo === 'user'

  const { data: channels, loading: channelsLoading } = useSlackData(
    'channels',
    listChannels,
    { enabled: needsChannels },
  )

  const { data: users, loading: usersLoading } = useSlackData(
    'users',
    listUsers,
    { delay: 400, enabled: needsUsers },
  )

  return (
    <WorkflowPanel>
      {/* Resource/Operation selector row */}
      <Section title="Operation">
        <VarFieldGroup>
          {/* When resource=channel: [Resource ▾] | [Channel Operation ▾] */}
          <ConditionalRender when={(d) => d.resource === 'channel'}>
            <FieldRow>
              <OptionsInput name="resource" acceptsVariables={false} variant="outline" />
              <FieldDivider />
              <OptionsInput name="operation" options={OPERATIONS.channel} expand />
            </FieldRow>
          </ConditionalRender>

          {/* When resource=message: [Resource ▾] | [Message Operation ▾] */}
          <ConditionalRender when={(d) => d.resource === 'message'}>
            <FieldRow>
              <OptionsInput name="resource" acceptsVariables={false} variant="outline" />
              <FieldDivider />
              <OptionsInput name="operation" options={OPERATIONS.message} expand />
            </FieldRow>
          </ConditionalRender>
        </VarFieldGroup>
      </Section>

      {/* Resource-specific panels */}
      <ConditionalRender when={(d) => d.resource === 'channel'}>
        <ChannelPanel api={api} channels={channels} channelsLoading={channelsLoading} />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'message'}>
        <MessagePanel
          api={api}
          channels={channels}
          channelsLoading={channelsLoading}
          users={users}
          usersLoading={usersLoading}
        />
      </ConditionalRender>
    </WorkflowPanel>
  )
}
