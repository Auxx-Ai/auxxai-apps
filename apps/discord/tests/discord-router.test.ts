import { describe, it, expect, vi, beforeEach } from 'vitest'

import discordExecute from '../src/blocks/discord/discord.server'

const runTool = vi.fn()
const ctx = { runTool }

beforeEach(() => {
  vi.clearAllMocks()
  runTool.mockResolvedValue({})
})

describe('discordExecute dispatcher', () => {
  it('dispatches channel.create to create_discord_channel with projected inputs', async () => {
    await discordExecute(
      {
        resource: 'channel',
        operation: 'create',
        createGuild: 'g1',
        createName: 'new-channel',
        createType: 'text',
        createTopic: 'topic',
        createCategory: 'cat1',
        createNsfw: false,
      },
      ctx
    )

    expect(runTool).toHaveBeenCalledWith('create_discord_channel', {
      guildId: 'g1',
      name: 'new-channel',
      type: 'text',
      topic: 'topic',
      parentId: 'cat1',
      nsfw: false,
    })
  })

  it('dispatches message.send with the trimmed reply id', async () => {
    await discordExecute(
      {
        resource: 'message',
        operation: 'send',
        sendChannel: 'c1',
        sendContent: 'hello',
        sendReplyTo: '  m1  ',
        sendSuppressEmbeds: true,
        sendSuppressNotifications: false,
      },
      ctx
    )

    expect(runTool).toHaveBeenCalledWith('send_discord_message', {
      channelId: 'c1',
      content: 'hello',
      replyToMessageId: 'm1',
      suppressEmbeds: true,
      suppressNotifications: false,
    })
  })

  it('splits comma-separated role ids for member.roleAdd', async () => {
    await discordExecute(
      {
        resource: 'member',
        operation: 'roleAdd',
        roleAddGuild: 'g1',
        roleAddUserId: 'u1',
        roleAddRoles: 'r1, r2 , r3',
      },
      ctx
    )

    expect(runTool).toHaveBeenCalledWith('add_discord_member_role', {
      guildId: 'g1',
      userId: 'u1',
      roleIds: ['r1', 'r2', 'r3'],
    })
  })

  it('throws on unknown resource', async () => {
    await expect(
      discordExecute({ resource: 'unknown', operation: 'noop' }, ctx)
    ).rejects.toThrow(/Unknown op/)
  })

  it('throws when ctx.runTool is missing', async () => {
    await expect(
      discordExecute({ resource: 'channel', operation: 'get', getChannel: '1' })
    ).rejects.toThrow(/runTool/)
  })
})
