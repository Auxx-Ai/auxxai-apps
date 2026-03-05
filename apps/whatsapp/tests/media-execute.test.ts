// tests/media-execute.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
global.fetch = mockFetch

vi.mock('@auxx/sdk/server', () => ({
  getOrganizationConnection: vi.fn(() => ({
    id: 'conn-123',
    value: 'test-access-token',
  })),
}))

import { executeMedia } from '../src/blocks/whatsapp/resources/media/media-execute.server'

beforeEach(() => {
  mockFetch.mockReset()
})

describe('executeMedia', () => {
  describe('upload', () => {
    it('downloads file and uploads via FormData', async () => {
      // Mock file download
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'image/jpeg' }),
        arrayBuffer: async () => new ArrayBuffer(100),
      })

      // Mock upload response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 'media-123' }),
      })

      const result = await executeMedia('upload', {
        uploadPhoneNumberId: '12345',
        uploadMediaUrl: 'https://example.com/photo.jpg',
      })

      expect(result).toEqual({ mediaId: 'media-123' })

      // First call downloads the file
      expect(mockFetch.mock.calls[0][0]).toBe('https://example.com/photo.jpg')

      // Second call uploads to WhatsApp
      expect(mockFetch.mock.calls[1][0]).toBe(
        'https://graph.facebook.com/v21.0/12345/media'
      )
    })

    it('throws when file download fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      })

      await expect(
        executeMedia('upload', {
          uploadPhoneNumberId: '12345',
          uploadMediaUrl: 'https://example.com/missing.jpg',
        })
      ).rejects.toThrow('Failed to download file from URL')
    })
  })

  describe('getUrl', () => {
    it('returns media info', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'media-123',
          url: 'https://lookaside.fbsbx.com/file.jpg',
          mime_type: 'image/jpeg',
          sha256: 'abc123',
          file_size: 12345,
        }),
      })

      const result = await executeMedia('getUrl', { getUrlMediaId: 'media-123' })

      expect(result).toEqual({
        mediaId: 'media-123',
        mediaUrl: 'https://lookaside.fbsbx.com/file.jpg',
        mimeType: 'image/jpeg',
        fileSize: 12345,
        sha256: 'abc123',
      })
    })
  })

  describe('delete', () => {
    it('deletes media and returns success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      })

      const result = await executeMedia('delete', { deleteMediaId: 'media-123' })
      expect(result).toEqual({ success: true })
    })
  })

  it('throws on unknown operation', async () => {
    await expect(executeMedia('unknown' as any, {})).rejects.toThrow(
      'Unknown media operation: unknown'
    )
  })
})
