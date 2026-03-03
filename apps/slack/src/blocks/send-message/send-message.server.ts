// src/blocks/send-message/send-message.server.ts

/**
 * Server-side execution function for the Slack "Send Message" workflow block.
 *
 * Uses the organization's OAuth connection (bot token) to call the Slack API.
 * Resolves the target channel/user based on the selected mode:
 * - Channel modes: list, id, name, url
 * - User modes: list, id, email
 */

import { getOrganizationConnection } from '@auxx/sdk/server'
import { BlockValidationError } from '@auxx/sdk/shared'
import type { InferWorkflowInput } from '@auxx/sdk'
import type { sendMessageSchema } from './send-message.workflow'
import { slackApi, throwConnectionNotFound } from './slack-api'

/**
 * Open (or retrieve) a DM conversation channel with a user ID.
 */
async function resolveUserChannel(token: string, userId: string): Promise<string> {
  const conversation = await slackApi('conversations.open', token, { users: userId })
  if (!conversation.channel) {
    throw new Error(`Could not open DM channel with user: ${userId}`)
  }

  const channel = conversation.channel as unknown as { id: string }
  return channel.id
}

/**
 * Extract a Slack channel ID from a Slack URL.
 *
 * Matches URLs like:
 * - https://app.slack.com/client/T.../C0122KQ70S7E
 * - https://yourworkspace.slack.com/archives/C0122KQ70S7E
 */
function parseChannelIdFromUrl(url: string): string {
  const match = url.match(/\/([A-Z][A-Z0-9]+)\/?(?:\?.*)?$/)
  if (!match) {
    throw new Error(
      'Invalid Slack channel URL. Expected format: https://app.slack.com/client/T.../C...',
    )
  }
  return match[1]
}

/**
 * Server-side execution function.
 * Receives resolved input values (variables already interpolated).
 *
 * Returns static outputs (messageTs) plus dynamic outputs based on sendTo mode:
 * - channel: channelId, channelName
 * - user: userId, dmChannelId
 */
export default async function sendMessageExecute(
  input: InferWorkflowInput<typeof sendMessageSchema>,
): Promise<{ messageTs: string; [key: string]: string }> {
  const connection = getOrganizationConnection()
  if (!connection?.value) {
    throwConnectionNotFound()
  }

  const token = connection.value
  let targetChannelId: string
  const dynamicOutputs: Record<string, string> = {}

  const sendTo = input.sendTo ?? 'channel'

  if (sendTo === 'user') {
    // Resolve user ID based on mode
    let userId: string
    const userMode = input.userMode ?? 'list'

    switch (userMode) {
      case 'list':
        userId = input.userList
        if (!userId)
          throw new BlockValidationError([{ field: 'userList', message: 'Select a user from the list.' }])
        break
      case 'id':
        userId = input.user?.trim()
        if (!userId)
          throw new BlockValidationError([{ field: 'user', message: 'User ID is required.' }])
        break
      case 'email': {
        const email = input.userEmail?.trim()
        if (!email)
          throw new BlockValidationError([{ field: 'userEmail', message: 'Email address is required.' }])
        const lookup = await slackApi('users.lookupByEmail', token, { email })
        if (!lookup.user?.id) throw new Error(`No Slack user found for email: ${email}`)
        userId = lookup.user.id
        break
      }
      default:
        throw new Error(`Unknown user mode: ${userMode}`)
    }

    targetChannelId = await resolveUserChannel(token, userId)
    dynamicOutputs.userId = userId
    dynamicOutputs.dmChannelId = targetChannelId
  } else {
    // Resolve channel ID based on mode
    const channelMode = input.channelMode ?? 'list'

    switch (channelMode) {
      case 'list':
        targetChannelId = input.channelList
        if (!targetChannelId)
          throw new BlockValidationError([{ field: 'channelList', message: 'Select a channel from the list.' }])
        break
      case 'id':
        targetChannelId = input.channel?.trim()
        if (!targetChannelId)
          throw new BlockValidationError([{ field: 'channel', message: 'Channel ID is required.' }])
        break
      case 'name': {
        const name = input.channelName?.trim().replace(/^#/, '')
        if (!name)
          throw new BlockValidationError([{ field: 'channelName', message: 'Channel name is required.' }])
        targetChannelId = name // Slack chat.postMessage accepts channel names
        break
      }
      case 'url': {
        const url = input.channelUrl?.trim()
        if (!url)
          throw new BlockValidationError([{ field: 'channelUrl', message: 'Channel URL is required.' }])
        targetChannelId = parseChannelIdFromUrl(url)
        break
      }
      default:
        throw new Error(`Unknown channel mode: ${channelMode}`)
    }

    dynamicOutputs.channelId = targetChannelId
    dynamicOutputs.channelName = input.channelName?.trim() || targetChannelId
  }

  // Send the message
  const result = await slackApi('chat.postMessage', token, {
    channel: targetChannelId,
    text: input.text,
    ...(input.threadTs ? { thread_ts: input.threadTs } : {}),
    unfurl_links: input.unfurlLinks ?? true,
    unfurl_media: input.unfurlMedia ?? true,
  })

  return {
    messageTs: result.ts ?? '',
    ...dynamicOutputs,
  }
}
