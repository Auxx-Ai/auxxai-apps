// src/blocks/discord/discord.server.ts
//
// Dispatcher for the `discord` workflow block. Routes the user's
// (resource, operation) pair through `toolMap` and delegates execution to
// the matching tool via `ctx.runTool`. Block-shaped union inputs are
// projected into the tool's flat input shape by `projectInputsForOp` —
// the per-op transforms previously inlined in the resource execute
// helpers (channel-execute.server / message-execute.server / member-execute.server).

import { discordToolMap } from './discord-tool-map'

const SUPPRESS_EMBEDS = 1 << 2
const SUPPRESS_NOTIFICATIONS = 1 << 12

type BlockInput = Record<string, unknown>
type ToolInput = Record<string, unknown>

interface BlockExecuteContext {
  runTool: (toolId: string, input: ToolInput) => Promise<unknown>
}

/**
 * Map the block's union input (per-op-prefixed field names) onto the flat
 * shape each tool's `inputs` schema expects.
 */
function projectInputsForOp(opKey: string, input: BlockInput): ToolInput {
  switch (opKey) {
    case 'channel.create':
      return {
        guildId: input.createGuild,
        name: input.createName,
        type: input.createType,
        topic: input.createTopic,
        parentId: input.createCategory,
        nsfw: input.createNsfw,
      }
    case 'channel.update':
      return {
        channelId: input.updateChannel,
        name: input.updateName,
        topic: input.updateTopic,
        parentId: input.updateCategory,
        nsfw: input.updateNsfw,
      }
    case 'channel.delete':
      return { channelId: input.deleteChannel }
    case 'channel.get':
      return { channelId: input.getChannel }
    case 'channel.getMany':
      return {
        guildId: input.getManyGuild,
        filterType: input.getManyFilterType,
      }
    case 'message.send': {
      // Block exposes boolean toggles for tts and the suppress flags. Tool
      // accepts the flat fields; tts isn't supported by the tool surface
      // (workflow-only toggle) so it's silently dropped.
      const flags = []
      if (input.sendSuppressEmbeds) flags.push(SUPPRESS_EMBEDS)
      if (input.sendSuppressNotifications) flags.push(SUPPRESS_NOTIFICATIONS)
      void flags
      return {
        channelId: input.sendChannel,
        content: input.sendContent,
        replyToMessageId:
          typeof input.sendReplyTo === 'string' && input.sendReplyTo.trim()
            ? input.sendReplyTo.trim()
            : undefined,
        suppressEmbeds: input.sendSuppressEmbeds,
        suppressNotifications: input.sendSuppressNotifications,
      }
    }
    case 'message.delete':
      return {
        channelId: input.deleteMessageChannel,
        messageId: input.deleteMessageId,
      }
    case 'message.get':
      return {
        channelId: input.getMessageChannel,
        messageId: input.getMessageId,
      }
    case 'message.getMany':
      return {
        channelId: input.getManyMessageChannel,
        returnAll: input.getManyMessageReturnAll,
        limit: input.getManyMessageLimit,
      }
    case 'message.react':
      return {
        channelId: input.reactChannel,
        messageId: input.reactMessageId,
        emoji: input.reactEmoji,
      }
    case 'member.getMany':
      return {
        guildId: input.getManyMemberGuild,
        // List-discord-members tool takes a different shape (q + limit) than
        // the block (returnAll + limit). Workflow returnAll is mapped to the
        // tool's hard-cap-aware limit.
        limit:
          input.getManyMemberReturnAll === true
            ? 1000
            : typeof input.getManyMemberLimit === 'number'
              ? input.getManyMemberLimit
              : undefined,
      }
    case 'member.roleAdd':
      return {
        guildId: input.roleAddGuild,
        userId:
          typeof input.roleAddUserId === 'string'
            ? input.roleAddUserId.trim()
            : input.roleAddUserId,
        roleIds: splitRoleIds(input.roleAddRoles),
      }
    case 'member.roleRemove':
      return {
        guildId: input.roleRemoveGuild,
        userId:
          typeof input.roleRemoveUserId === 'string'
            ? input.roleRemoveUserId.trim()
            : input.roleRemoveUserId,
        roleIds: splitRoleIds(input.roleRemoveRoles),
      }
    default:
      return input
  }
}

function splitRoleIds(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string')
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean)
  }
  return []
}

export default async function discordExecute(
  input: BlockInput,
  ctx?: BlockExecuteContext
): Promise<unknown> {
  const resource = input.resource
  const operation = input.operation
  const opKey = `${resource}.${operation}`
  const toolMap = discordToolMap as Record<string, string>
  const toolId = toolMap[opKey]
  if (!toolId) {
    throw new Error(`Unknown op: ${opKey}`)
  }
  if (!ctx?.runTool) {
    throw new Error('Discord block requires lambda runtime ctx.runTool')
  }
  const projected = projectInputsForOp(opKey, input)
  return ctx.runTool(toolId, projected)
}
