// tests/whatsapp-router.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
global.fetch = mockFetch

vi.mock('@auxx/sdk/server', () => ({
  getOrganizationConnection: vi.fn(() => ({
    id: 'conn-123',
    value: 'test-access-token',
  })),
}))

import whatsappExecute from '../src/blocks/whatsapp/whatsapp.server'

beforeEach(() => {
  mockFetch.mockReset()
})

function mockApiResponse(data: any = {}) {
  mockFetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      messages: [{ id: 'msg-1' }],
      contacts: [{ wa_id: '123' }],
      ...data,
    }),
  })
}

describe('whatsappExecute router', () => {
  it('routes message/sendText to message executor', async () => {
    mockApiResponse()

    const result = await whatsappExecute({
      resource: 'message',
      operation: 'sendText',
      phoneNumberId: '12345',
      recipientPhone: '15551234567',
      sendTextBody: 'Hello',
    })

    expect(result.messageId).toBe('msg-1')
  })

  it('routes media/getUrl to media executor', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'media-1',
        url: 'https://example.com/media',
        mime_type: 'image/png',
        sha256: 'hash',
        file_size: 1000,
      }),
    })

    const result = await whatsappExecute({
      resource: 'media',
      operation: 'getUrl',
      getUrlMediaId: 'media-1',
    })

    expect(result.mediaId).toBe('media-1')
  })

  it('throws on unknown resource', async () => {
    await expect(
      whatsappExecute({ resource: 'unknown', operation: 'test' })
    ).rejects.toThrow('Unknown resource: unknown')
  })

  it('throws on invalid operation for resource', async () => {
    await expect(
      whatsappExecute({ resource: 'message', operation: 'delete' })
    ).rejects.toThrow('Invalid operation "delete" for resource "message"')
  })

  it('accepts all valid message operations', async () => {
    const validOps = ['sendText', 'sendMedia', 'sendTemplate', 'sendContacts', 'sendLocation']
    for (const op of validOps) {
      mockApiResponse()
      // Should not throw (we don't care about actual result here)
      await expect(
        whatsappExecute({
          resource: 'message',
          operation: op,
          phoneNumberId: '12345',
          recipientPhone: '15551234567',
          sendTextBody: 'test',
          sendMediaType: 'image',
          sendMediaUrl: 'https://example.com/img.jpg',
          sendTemplateId: 'test|en',
          sendContactFormattedName: 'Test',
          sendLocationLatitude: '0',
          sendLocationLongitude: '0',
        })
      ).resolves.toBeDefined()
    }
  })

  it('accepts all valid media operations', async () => {
    // upload needs file download mock
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'image/jpeg' }),
      arrayBuffer: async () => new ArrayBuffer(10),
    })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ id: 'media-1' }),
    })

    await expect(
      whatsappExecute({
        resource: 'media',
        operation: 'upload',
        uploadPhoneNumberId: '12345',
        uploadMediaUrl: 'https://example.com/file.jpg',
      })
    ).resolves.toBeDefined()

    // getUrl
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'media-1',
        url: 'https://example.com',
        mime_type: 'image/png',
        sha256: 'h',
        file_size: 100,
      }),
    })
    await expect(
      whatsappExecute({ resource: 'media', operation: 'getUrl', getUrlMediaId: 'media-1' })
    ).resolves.toBeDefined()

    // delete
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204 })
    await expect(
      whatsappExecute({ resource: 'media', operation: 'delete', deleteMediaId: 'media-1' })
    ).resolves.toBeDefined()
  })
})
