// src/blocks/send-message/send-message.workflow.tsx

/**
 * Slack "Send Message" workflow block.
 *
 * Sends a message to a Slack channel or user via the organization's
 * OAuth connection. Supports multiple selection modes:
 * - Channels: From List, By ID, By Name, By URL
 * - Users: From List, By ID, By Email
 *
 * Also supports thread replies and link-unfurl options.
 */

import { Workflow, type WorkflowBlock, type WorkflowSchema } from '@auxx/sdk'
import {
  WorkflowNode,
  WorkflowNodeRow,
  WorkflowNodeText,
  WorkflowNodeHandle,
  WorkflowPanel,
  useWorkflow,
  useWorkflowNode,
} from '@auxx/sdk/client'
import slackIcon from '../../assets/icon.png'
import sendMessageExecute from './send-message.server'
import listChannels from './list-channels.server'
import listUsers from './list-users.server'
import { useSlackData } from './use-slack-data'

// ============================================================================
// Schema Definition
// ============================================================================

export const sendMessageSchema = {
  inputs: {
    sendTo: Workflow.select({
      label: 'Send To',
      description: 'Choose whether to send to a channel or a user',
      options: [
        { value: 'channel', label: 'Channel' },
        { value: 'user', label: 'User' },
      ],
      default: 'channel',
    }),

    // -- Channel mode inputs --
    channelMode: Workflow.select({
      label: 'Channel',
      description: 'How to specify the channel',
      options: [
        { value: 'list', label: 'From List' },
        { value: 'id', label: 'By ID' },
        { value: 'name', label: 'By Name' },
        { value: 'url', label: 'By URL' },
      ],
      default: 'list',
    }),
    channelList: Workflow.select({
      label: 'Channel',
      description: 'Select a channel from your Slack workspace',
      options: [] as { value: string; label: string }[], // Dynamic options loaded in panel
    }),
    channel: Workflow.string({
      label: 'Channel ID',
      description: 'Slack channel ID',
      placeholder: 'C0122KQ70S7E',
      acceptsVariables: true,
    }),
    channelName: Workflow.string({
      label: 'Channel Name',
      description: 'Channel name (with or without #)',
      placeholder: '#general',
      acceptsVariables: true,
    }),
    channelUrl: Workflow.string({
      label: 'Channel URL',
      description: 'Slack channel URL',
      placeholder: 'https://app.slack.com/client/T.../C...',
      acceptsVariables: true,
    }),

    // -- User mode inputs --
    userMode: Workflow.select({
      label: 'User',
      description: 'How to specify the user',
      options: [
        { value: 'list', label: 'From List' },
        { value: 'id', label: 'By ID' },
        { value: 'email', label: 'By Email' },
      ],
      default: 'list',
    }),
    userList: Workflow.select({
      label: 'User',
      description: 'Select a user from your Slack workspace',
      options: [] as { value: string; label: string }[], // Dynamic options loaded in panel
    }),
    user: Workflow.string({
      label: 'User ID',
      description: 'Slack user ID',
      placeholder: 'U0122KQ70S7E',
      acceptsVariables: true,
    }),
    userEmail: Workflow.string({
      label: 'Email',
      description: 'User email address',
      placeholder: 'user@company.com',
      acceptsVariables: true,
    }),

    // -- Message inputs (unchanged) --
    text: Workflow.string({
      label: 'Message',
      description: 'Message text to send',
      placeholder: 'Enter your message...',
      acceptsVariables: true,
      minLength: 1,
    }),
    threadTs: Workflow.string({
      label: 'Thread Timestamp',
      description: 'Reply to a specific thread (message timestamp)',
      placeholder: '1234567890.123456',
      acceptsVariables: true,
    }),
    unfurlLinks: Workflow.boolean({
      label: 'Unfurl Links',
      description: 'Show previews for URLs in the message',
      default: true,
    }),
    unfurlMedia: Workflow.boolean({
      label: 'Unfurl Media',
      description: 'Show previews for media URLs in the message',
      default: true,
    }),
  },
  outputs: {
    messageTs: Workflow.string({
      label: 'Message Timestamp',
      description: 'Slack message timestamp (unique message identifier)',
    }),
  },
  computeOutputs: (inputs) => {
    if (inputs.sendTo === 'channel') {
      return {
        channelId: Workflow.string({
          label: 'Channel ID',
          description: 'Resolved Slack channel ID where the message was posted',
        }),
        channelName: Workflow.string({
          label: 'Channel Name',
          description: 'Name of the channel where the message was posted',
        }),
      }
    }
    if (inputs.sendTo === 'user') {
      return {
        userId: Workflow.string({
          label: 'User ID',
          description: 'Resolved Slack user ID the message was sent to',
        }),
        dmChannelId: Workflow.string({
          label: 'DM Channel ID',
          description: 'DM channel ID opened with the user',
        }),
      }
    }
    return {}
  },
  layout: [
    {
      type: 'section' as const,
      title: 'Target',
      fields: [
        'sendTo',
        'channelMode',
        'channelList',
        'channel',
        'channelName',
        'channelUrl',
        'userMode',
        'userList',
        'user',
        'userEmail',
      ],
    },
    { type: 'section' as const, title: 'Message', fields: ['text'] },
    {
      type: 'section' as const,
      title: 'Options',
      collapsible: true,
      fields: ['threadTs', 'unfurlLinks', 'unfurlMedia'],
    },
  ],
} satisfies WorkflowSchema

// ============================================================================
// Node Component (Canvas Visualization)
// ============================================================================

function SendMessageNode() {
  const { data, status, lastRun } = useWorkflowNode()

  let target: string | undefined
  if (data.sendTo === 'user') {
    if (data.userMode === 'email') target = data.userEmail ? `@${data.userEmail}` : undefined
    else if (data.userMode === 'list') target = data.userList ? `User selected` : undefined
    else target = data.user ? `@${data.user}` : undefined
  } else {
    if (data.channelMode === 'name')
      target = data.channelName ? `#${data.channelName.replace(/^#/, '')}` : undefined
    else if (data.channelMode === 'list') target = data.channelList ? `Channel selected` : undefined
    else if (data.channelMode === 'url') target = data.channelUrl ? 'From URL' : undefined
    else target = data.channel ? `#${data.channel}` : undefined
  }

  return (
    <WorkflowNode>
      <WorkflowNodeHandle type="target" id="target" position="left" />

      <WorkflowNodeRow label="Send Slack Message" />

      {target && (
        <WorkflowNodeText className="text-xs text-muted-foreground">
          To: {target}
        </WorkflowNodeText>
      )}

      {data.text && (
        <WorkflowNodeText className="text-xs">
          {data.text.length > 40 ? `${data.text.substring(0, 40)}...` : data.text}
        </WorkflowNodeText>
      )}

      {status === 'error' && lastRun?.error && (
        <WorkflowNodeText className="text-xs text-destructive">
          Error: {lastRun.error.message}
        </WorkflowNodeText>
      )}

      <WorkflowNodeHandle type="source" id="source" position="right" />
    </WorkflowNode>
  )
}

// ============================================================================
// Panel Component (Configuration UI)
// ============================================================================

function SendMessagePanel() {
  const {
    StringInput,
    OptionsInput,
    BooleanInput,
    VarField,
    VarFieldGroup,
    FieldRow,
    Section,
    ConditionalRender,
  } = useWorkflow<typeof sendMessageSchema>(sendMessageSchema)

  // Load channels and users from Slack API with module-level caching
  const {
    data: channels,
    loading: channelsLoading,
  } = useSlackData('channels', listChannels)

  const {
    data: users,
    loading: usersLoading,
  } = useSlackData('users', listUsers, { delay: 400 })

  return (
    <WorkflowPanel>
      <Section title="Target">
        {/*
         * Single VarFieldGroup for the entire target section.
         *
         * Row 1 (FieldRow): sendTo mode selector + mode-specific picker side-by-side.
         * Two separate FieldRows (one per sendTo value) avoid the ConditionalRender
         * sizing limitation — only one is ever visible at a time.
         *
         * Row 2 (VarField): the resolved value input for the active mode.
         */}
        <VarFieldGroup>
          {/* Channel mode: [sendTo ▾] [channelMode ▾ ──────────────] */}
          <ConditionalRender when={(data) => data.sendTo === 'channel'}>
            <FieldRow>
              <OptionsInput name="sendTo" acceptsVariables={false} />
              <OptionsInput name="channelMode" expand />
            </FieldRow>
          </ConditionalRender>

          {/* User mode: [sendTo ▾] [userMode ▾ ──────────────────] */}
          <ConditionalRender when={(data) => data.sendTo === 'user'}>
            <FieldRow>
              <OptionsInput name="sendTo" />
              <OptionsInput name="userMode" expand />
            </FieldRow>
          </ConditionalRender>

          {/* Channel value rows */}
          <ConditionalRender when={(data) => data.sendTo === 'channel' && data.channelMode === 'list'}>
            <VarField>
              <OptionsInput
                name="channelList"
                options={channelsLoading ? [{ label: 'Loading channels...', value: '' }] : channels}
              />
            </VarField>
          </ConditionalRender>

          <ConditionalRender when={(data) => data.sendTo === 'channel' && data.channelMode === 'id'}>
            <VarField>
              <StringInput name="channel" />
            </VarField>
          </ConditionalRender>

          <ConditionalRender when={(data) => data.sendTo === 'channel' && data.channelMode === 'name'}>
            <VarField>
              <StringInput name="channelName" />
            </VarField>
          </ConditionalRender>

          <ConditionalRender when={(data) => data.sendTo === 'channel' && data.channelMode === 'url'}>
            <VarField>
              <StringInput name="channelUrl" />
            </VarField>
          </ConditionalRender>

          {/* User value rows */}
          <ConditionalRender when={(data) => data.sendTo === 'user' && data.userMode === 'list'}>
            <OptionsInput
              name="userList"
              options={usersLoading ? [{ label: 'Loading users...', value: '' }] : users}
            />
          </ConditionalRender>

          <ConditionalRender when={(data) => data.sendTo === 'user' && data.userMode === 'id'}>
            <VarField>
              <StringInput name="user" />
            </VarField>
          </ConditionalRender>

          <ConditionalRender when={(data) => data.sendTo === 'user' && data.userMode === 'email'}>
            <VarField>
              <StringInput name="userEmail" />
            </VarField>
          </ConditionalRender>
        </VarFieldGroup>
      </Section>

      <Section title="Message">
        <VarFieldGroup>
          <VarField>
            <StringInput name="text" multiline />
          </VarField>
        </VarFieldGroup>
      </Section>

      <Section title="Options" collapsible>
        <VarFieldGroup>
          <VarField>
            <StringInput name="threadTs" />
          </VarField>
          <VarField>
            <BooleanInput name="unfurlLinks" />
          </VarField>
          <VarField>
            <BooleanInput name="unfurlMedia" />
          </VarField>
        </VarFieldGroup>
      </Section>
    </WorkflowPanel>
  )
}

// ============================================================================
// Workflow Block Export
// ============================================================================

export const sendMessageBlock = {
  id: 'send-message',
  label: 'Send Message',
  description: 'Send a message to a Slack channel or user',
  category: 'action',
  icon: slackIcon,
  color: '#4A154B',
  schema: sendMessageSchema,
  node: SendMessageNode,
  panel: SendMessagePanel,
  execute: sendMessageExecute,
  config: {
    timeout: 15000,
    retries: 1,
    requiresConnection: true,
  },
} satisfies WorkflowBlock<typeof sendMessageSchema>
