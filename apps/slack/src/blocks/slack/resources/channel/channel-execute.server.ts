// src/blocks/slack/resources/channel/channel-execute.server.ts

/**
 * Channel resource server handlers.
 * Operations: Create (conversations.create), Get (conversations.info)
 */

import { getOrganizationConnection } from '@auxx/sdk/server'
import { BlockValidationError } from '@auxx/sdk/shared'
import { slackApi, throwConnectionNotFound } from '../../shared/slack-api'

/**
 * Resolve a channel ID from the get-channel input modes (list, id, name).
 */
function resolveGetChannelId(input: any): string {
  const mode = input.getChannelMode ?? 'list'

  switch (mode) {
    case 'list': {
      const channelId = input.getChannelList
      if (!channelId)
        throw new BlockValidationError([
          { field: 'getChannelList', message: 'Select a channel from the list.' },
        ])
      return channelId
    }
    case 'id': {
      const channelId = input.getChannelId?.trim()
      if (!channelId)
        throw new BlockValidationError([
          { field: 'getChannelId', message: 'Channel ID is required.' },
        ])
      return channelId
    }
    case 'name': {
      const name = input.getChannelName?.trim().replace(/^#/, '')
      if (!name)
        throw new BlockValidationError([
          { field: 'getChannelName', message: 'Channel name is required.' },
        ])
      return name
    }
    default:
      throw new Error(`Unknown channel get mode: ${mode}`)
  }
}

export async function executeChannel(operation: string, input: any): Promise<Record<string, any>> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value

  switch (operation) {
    case 'create': {
      const name = input.createChannelName?.trim()
      if (!name)
        throw new BlockValidationError([
          { field: 'createChannelName', message: 'Channel name is required.' },
        ])

      const result = await slackApi('conversations.create', token, {
        name,
        is_private: input.createChannelVisibility === 'private',
      })

      const channel = result.channel as any
      return {
        channelId: channel?.id ?? '',
        channelName: name,
      }
    }

    case 'get': {
      const channelId = resolveGetChannelId(input)
      const result = await slackApi('conversations.info', token, { channel: channelId })
      const ch = result.channel as any

      return {
        channelId: ch.id,
        channelName: ch.name ?? '',
        channelTopic: ch.topic?.value ?? '',
        channelPurpose: ch.purpose?.value ?? '',
        memberCount: String(ch.num_members ?? 0),
        isPrivate: String(ch.is_private ?? false),
      }
    }

    default:
      throw new Error(`Unknown channel operation: ${operation}`)
  }
}
