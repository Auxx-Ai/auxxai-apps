// tests/whatsapp-api.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { whatsappApi, throwConnectionNotFound } from '../src/blocks/whatsapp/shared/whatsapp-api'

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockReset()
})

describe('whatsappApi', () => {
  it('makes GET requests with Bearer auth', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: [{ id: '123' }] }),
    })

    const result = await whatsappApi('123456/phone_numbers', 'test-token')

    expect(mockFetch).toHaveBeenCalledWith(
      'https://graph.facebook.com/v21.0/123456/phone_numbers',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    )
    expect(result).toEqual({ data: [{ id: '123' }] })
  })

  it('makes POST requests with JSON body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ messages: [{ id: 'msg-1' }] }),
    })

    const result = await whatsappApi('12345/messages', 'test-token', {
      method: 'POST',
      body: { messaging_product: 'whatsapp', to: '15551234567', type: 'text' },
    })

    expect(mockFetch).toHaveBeenCalledWith(
      'https://graph.facebook.com/v21.0/12345/messages',
      expect.objectContaining({
        method: 'POST',
        body: expect.any(String),
      })
    )
    expect(result).toEqual({ messages: [{ id: 'msg-1' }] })
  })

  it('handles 401 errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ error: { message: 'Invalid token' } }),
    })

    await expect(whatsappApi('test', 'bad-token')).rejects.toThrow(
      'Invalid access token'
    )
  })

  it('handles 403 errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      json: async () => ({ error: { message: 'Permission denied' } }),
    })

    await expect(whatsappApi('test', 'token')).rejects.toThrow('Insufficient permissions')
  })

  it('handles 429 rate limit errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      json: async () => ({ error: { message: 'Rate limited' } }),
    })

    await expect(whatsappApi('test', 'token')).rejects.toThrow('Rate limit exceeded')
  })

  it('handles 204 No Content', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
    })

    const result = await whatsappApi('test-media-id', 'token', { method: 'DELETE' })
    expect(result).toEqual({})
  })

  it('handles unknown error status codes', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ error: { message: 'Server error' } }),
    })

    await expect(whatsappApi('test', 'token')).rejects.toThrow('WhatsApp API error: Server error')
  })
})

describe('throwConnectionNotFound', () => {
  it('throws structured error', () => {
    try {
      throwConnectionNotFound()
    } catch (err: any) {
      expect(err.message).toContain('WhatsApp not connected')
      expect(err.code).toBe('CONNECTION_NOT_FOUND')
      expect(err.scope).toBe('organization')
    }
  })
})
