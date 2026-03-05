import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @auxx/sdk/server before importing the module under test
vi.mock('@auxx/sdk/server', () => ({
  getOrganizationConnection: vi.fn(),
}))

// Mock discordApi
vi.mock('../src/blocks/discord/shared/discord-api', () => ({
  discordApi: vi.fn(),
  throwConnectionNotFound: vi.fn(() => {
    const err = new Error('Discord bot not connected.') as Error & { code: string }
    err.code = 'CONNECTION_NOT_FOUND'
    throw err
  }),
}))

import { getOrganizationConnection } from '@auxx/sdk/server'
import { executeChannel } from '../src/blocks/discord/resources/channel/channel-execute.server'
import { discordApi } from '../src/blocks/discord/shared/discord-api'

const TOKEN = 'test-bot-token'
const mockedGetConnection = vi.mocked(getOrganizationConnection)
const mockedApi = vi.mocked(discordApi)

beforeEach(() => {
  vi.clearAllMocks()
  mockedGetConnection.mockReturnValue({ value: TOKEN } as any)
})

// ── Connection check ────────────────────────────────────────────────────────

describe('connection check', () => {
  it('throws CONNECTION_NOT_FOUND when no connection', async () => {
    mockedGetConnection.mockReturnValue(null as any)

    await expect(executeChannel('get', { getChannel: '1' })).rejects.toThrow(
      'Discord bot not connected'
    )
  })
})

// ── create ──────────────────────────────────────────────────────────────────

describe('create channel', () => {
  it('throws BlockValidationError when guildId is missing', async () => {
    await expect(executeChannel('create', {})).rejects.toThrow()
  })

  it('throws BlockValidationError when name is missing', async () => {
    await expect(executeChannel('create', { createGuild: '123' })).rejects.toThrow()
  })

  it('calls the correct endpoint with POST', async () => {
    mockedApi.mockResolvedValueOnce({ id: '999', name: 'general', type: 0 })

    const result = await executeChannel('create', {
      createGuild: '123',
      createName: 'general',
      createType: 'text',
    })

    expect(mockedApi).toHaveBeenCalledWith(
      '/guilds/123/channels',
      TOKEN,
      expect.objectContaining({
        method: 'POST',
        body: expect.objectContaining({ name: 'general', type: 0 }),
      })
    )
    expect(result.channelId).toBe('999')
    expect(result.channelName).toBe('general')
    expect(result.channelType).toBe('Text')
  })

  it('includes optional fields when provided', async () => {
    mockedApi.mockResolvedValueOnce({ id: '1', name: 'nsfw', type: 0 })

    await executeChannel('create', {
      createGuild: '123',
      createName: 'nsfw',
      createTopic: 'Adults only',
      createCategory: '456',
      createNsfw: true,
    })

    const body = mockedApi.mock.calls[0][2]?.body
    expect(body).toMatchObject({
      name: 'nsfw',
      topic: 'Adults only',
      parent_id: '456',
      nsfw: true,
    })
  })
})

// ── get ─────────────────────────────────────────────────────────────────────

describe('get channel', () => {
  it('throws when channelId is missing', async () => {
    await expect(executeChannel('get', {})).rejects.toThrow()
  })

  it('calls correct endpoint and maps response', async () => {
    mockedApi.mockResolvedValueOnce({ id: '100', name: 'general', type: 0, topic: 'Welcome' })

    const result = await executeChannel('get', { getChannel: '100' })

    expect(mockedApi).toHaveBeenCalledWith('/channels/100', TOKEN)
    expect(result).toMatchObject({
      channelId: '100',
      channelName: 'general',
      channelType: 'Text',
      channelTopic: 'Welcome',
    })
  })
})

// ── getMany ─────────────────────────────────────────────────────────────────

describe('getMany channels', () => {
  it('throws when guildId is missing', async () => {
    await expect(executeChannel('getMany', {})).rejects.toThrow()
  })

  it('returns all channels when no filter', async () => {
    const channels = [
      { id: '1', name: 'general', type: 0 },
      { id: '2', name: 'voice', type: 2 },
    ]
    mockedApi.mockResolvedValueOnce(channels)

    const result = await executeChannel('getMany', { getManyGuild: '123' })

    expect(result.channels).toEqual(channels)
    expect(result.totalCount).toBe('2')
  })

  it('filters by channel type when specified', async () => {
    const channels = [
      { id: '1', name: 'general', type: 0 },
      { id: '2', name: 'voice', type: 2 },
      { id: '3', name: 'another-text', type: 0 },
    ]
    mockedApi.mockResolvedValueOnce(channels)

    const result = await executeChannel('getMany', {
      getManyGuild: '123',
      getManyFilterType: 'text',
    })

    expect(result.channels).toHaveLength(2)
    expect(result.channels.every((ch: any) => ch.type === 0)).toBe(true)
    expect(result.totalCount).toBe('2')
  })
})

// ── update ──────────────────────────────────────────────────────────────────

describe('update channel', () => {
  it('throws when channelId is missing', async () => {
    await expect(executeChannel('update', {})).rejects.toThrow()
  })

  it('calls correct endpoint with PATCH', async () => {
    mockedApi.mockResolvedValueOnce({ id: '100', name: 'renamed' })

    const result = await executeChannel('update', {
      updateChannel: '100',
      updateName: 'renamed',
    })

    expect(mockedApi).toHaveBeenCalledWith(
      '/channels/100',
      TOKEN,
      expect.objectContaining({
        method: 'PATCH',
        body: expect.objectContaining({ name: 'renamed' }),
      })
    )
    expect(result.channelId).toBe('100')
    expect(result.channelName).toBe('renamed')
  })
})

// ── delete ──────────────────────────────────────────────────────────────────

describe('delete channel', () => {
  it('throws when channelId is missing', async () => {
    await expect(executeChannel('delete', {})).rejects.toThrow()
  })

  it('calls correct endpoint with DELETE', async () => {
    mockedApi.mockResolvedValueOnce({ id: '100', name: 'deleted-channel' })

    const result = await executeChannel('delete', { deleteChannel: '100' })

    expect(mockedApi).toHaveBeenCalledWith(
      '/channels/100',
      TOKEN,
      expect.objectContaining({ method: 'DELETE' })
    )
    expect(result.deletedChannelId).toBe('100')
    expect(result.deletedChannelName).toBe('deleted-channel')
  })
})

// ── unknown operation ───────────────────────────────────────────────────────

describe('unknown operation', () => {
  it('throws on unknown operation', async () => {
    await expect(executeChannel('nonexistent', {})).rejects.toThrow(
      'Unknown channel operation: nonexistent'
    )
  })
})
