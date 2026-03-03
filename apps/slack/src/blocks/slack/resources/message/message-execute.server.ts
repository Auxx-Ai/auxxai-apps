// src/blocks/slack/resources/message/message-execute.server.ts

/**
 * Message resource server handlers.
 * Operations: Send (chat.postMessage), Delete (chat.delete)
 */

import { getOrganizationConnection } from '@auxx/sdk/server'
import { BlockValidationError } from '@auxx/sdk/shared'
import { slackApi, throwConnectionNotFound } from '../../shared/slack-api'

/**
 * Extract a Slack channel ID from a Slack URL.
 */
function parseChannelIdFromUrl(url: string): string {
  const match = url.match(/\/([A-Z][A-Z0-9]+)\/?(?:\?.*)?$/)
  if (!match) {
    throw new Error(
      'Invalid Slack channel URL. Expected format: https://app.slack.com/client/T.../C...'
    )
  }
  return match[1]
}

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
 * Resolve the delete channel ID from the delete input modes (list, id).
 */
function resolveDeleteChannelId(input: any): string {
  const mode = input.deleteChannelMode ?? 'list'

  switch (mode) {
    case 'list': {
      const channelId = input.deleteChannelList
      if (!channelId)
        throw new BlockValidationError([
          { field: 'deleteChannelList', message: 'Select a channel from the list.' },
        ])
      return channelId
    }
    case 'id': {
      const channelId = input.deleteChannelId?.trim()
      if (!channelId)
        throw new BlockValidationError([
          { field: 'deleteChannelId', message: 'Channel ID is required.' },
        ])
      return channelId
    }
    default:
      throw new Error(`Unknown delete channel mode: ${mode}`)
  }
}

/**
 * Send a message to a channel or user (existing logic from send-message.server.ts).
 */
async function sendMessage(token: string, input: any): Promise<Record<string, any>> {
  let targetChannelId: string
  const dynamicOutputs: Record<string, any> = {}
  const sendTo = input.sendTo ?? 'channel'

  if (sendTo === 'user') {
    let userId: string
    const userMode = input.userMode ?? 'list'

    switch (userMode) {
      case 'list':
        userId = input.userList
        if (!userId)
          throw new BlockValidationError([
            { field: 'userList', message: 'Select a user from the list.' },
          ])
        break
      case 'id':
        userId = input.user?.trim()
        if (!userId)
          throw new BlockValidationError([{ field: 'user', message: 'User ID is required.' }])
        break
      case 'email': {
        const email = input.userEmail?.trim()
        if (!email)
          throw new BlockValidationError([
            { field: 'userEmail', message: 'Email address is required.' },
          ])
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
    const channelMode = input.channelMode ?? 'list'

    switch (channelMode) {
      case 'list':
        targetChannelId = input.channelList
        if (!targetChannelId)
          throw new BlockValidationError([
            { field: 'channelList', message: 'Select a channel from the list.' },
          ])
        break
      case 'id':
        targetChannelId = input.channel?.trim()
        if (!targetChannelId)
          throw new BlockValidationError([{ field: 'channel', message: 'Channel ID is required.' }])
        break
      case 'name': {
        const name = input.channelName?.trim().replace(/^#/, '')
        if (!name)
          throw new BlockValidationError([
            { field: 'channelName', message: 'Channel name is required.' },
          ])
        targetChannelId = name
        break
      }
      case 'url': {
        const url = input.channelUrl?.trim()
        if (!url)
          throw new BlockValidationError([
            { field: 'channelUrl', message: 'Channel URL is required.' },
          ])
        targetChannelId = parseChannelIdFromUrl(url)
        break
      }
      default:
        throw new Error(`Unknown channel mode: ${channelMode}`)
    }

    dynamicOutputs.channelId = targetChannelId
    dynamicOutputs.channelName = input.channelName?.trim() || targetChannelId
  }

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

export async function executeMessage(operation: string, input: any): Promise<Record<string, any>> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value

  switch (operation) {
    case 'send':
      return sendMessage(token, input)

    case 'delete': {
      const messageTs = input.deleteMessageTs?.trim()
      if (!messageTs)
        throw new BlockValidationError([
          { field: 'deleteMessageTs', message: 'Message timestamp is required.' },
        ])

      const channelId = resolveDeleteChannelId(input)

      try {
        await slackApi('chat.delete', token, {
          channel: channelId,
          ts: messageTs,
        })
      } catch (error: any) {
        if (error.message?.includes('cant_delete_message')) {
          throw new Error(
            'Cannot delete this message. Bot tokens can only delete messages the bot posted.'
          )
        }
        throw error
      }

      return { success: 'true' }
    }

    default:
      throw new Error(`Unknown message operation: ${operation}`)
  }
}
