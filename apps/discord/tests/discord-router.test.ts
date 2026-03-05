import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock resource execute functions
vi.mock('../src/blocks/discord/resources/channel/channel-execute.server', () => ({
  executeChannel: vi.fn(),
}))
vi.mock('../src/blocks/discord/resources/message/message-execute.server', () => ({
  executeMessage: vi.fn(),
}))
vi.mock('../src/blocks/discord/resources/member/member-execute.server', () => ({
  executeMember: vi.fn(),
}))

import discordExecute from '../src/blocks/discord/discord.server'
import { executeChannel } from '../src/blocks/discord/resources/channel/channel-execute.server'
import { executeMessage } from '../src/blocks/discord/resources/message/message-execute.server'
import { executeMember } from '../src/blocks/discord/resources/member/member-execute.server'

const mockedChannel = vi.mocked(executeChannel)
const mockedMessage = vi.mocked(executeMessage)
const mockedMember = vi.mocked(executeMember)

beforeEach(() => {
  vi.clearAllMocks()
})

// ── Routing ─────────────────────────────────────────────────────────────────

describe('discordExecute routing', () => {
  it('routes channel resource to executeChannel', async () => {
    mockedChannel.mockResolvedValueOnce({ channelId: '1' })

    const result = await discordExecute({ resource: 'channel', operation: 'get' })

    expect(mockedChannel).toHaveBeenCalledWith('get', { resource: 'channel', operation: 'get' })
    expect(result).toEqual({ channelId: '1' })
  })

  it('routes message resource to executeMessage', async () => {
    mockedMessage.mockResolvedValueOnce({ messageId: '1' })

    const result = await discordExecute({ resource: 'message', operation: 'send' })

    expect(mockedMessage).toHaveBeenCalledWith('send', { resource: 'message', operation: 'send' })
    expect(result).toEqual({ messageId: '1' })
  })

  it('routes member resource to executeMember', async () => {
    mockedMember.mockResolvedValueOnce({ members: [] })

    const result = await discordExecute({ resource: 'member', operation: 'getMany' })

    expect(mockedMember).toHaveBeenCalledWith('getMany', { resource: 'member', operation: 'getMany' })
    expect(result).toEqual({ members: [] })
  })
})

// ── Error cases ─────────────────────────────────────────────────────────────

describe('discordExecute errors', () => {
  it('throws on unknown resource', async () => {
    await expect(
      discordExecute({ resource: 'webhook', operation: 'create' })
    ).rejects.toThrow('Unknown resource: webhook')
  })

  it('throws on invalid operation for a valid resource', async () => {
    await expect(
      discordExecute({ resource: 'channel', operation: 'react' })
    ).rejects.toThrow('Invalid operation "react" for resource "channel"')
  })

  it('throws on invalid operation for message resource', async () => {
    await expect(
      discordExecute({ resource: 'message', operation: 'create' })
    ).rejects.toThrow('Invalid operation "create" for resource "message"')
  })

  it('throws on invalid operation for member resource', async () => {
    await expect(
      discordExecute({ resource: 'member', operation: 'delete' })
    ).rejects.toThrow('Invalid operation "delete" for resource "member"')
  })
})

// ── Valid operations per resource ───────────────────────────────────────────

describe('all valid operations are accepted', () => {
  const validOps: [string, string[], ReturnType<typeof vi.mocked>][] = [
    ['channel', ['create', 'delete', 'get', 'getMany', 'update'], mockedChannel],
    ['message', ['send', 'delete', 'get', 'getMany', 'react'], mockedMessage],
    ['member', ['getMany', 'roleAdd', 'roleRemove'], mockedMember],
  ]

  for (const [resource, operations, mock] of validOps) {
    for (const operation of operations) {
      it(`accepts ${resource}.${operation}`, async () => {
        mock.mockResolvedValueOnce({})
        await expect(discordExecute({ resource, operation })).resolves.toBeDefined()
      })
    }
  }
})
