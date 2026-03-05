// tests/message-execute.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
global.fetch = mockFetch

vi.mock('@auxx/sdk/server', () => ({
  getOrganizationConnection: vi.fn(() => ({
    id: 'conn-123',
    value: 'test-access-token',
  })),
}))

import { executeMessage } from '../src/blocks/whatsapp/resources/message/message-execute.server'

beforeEach(() => {
  mockFetch.mockReset()
})

function mockSendResponse(messageId = 'wamid.abc123', waId = '15551234567') {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => ({
      messages: [{ id: messageId }],
      contacts: [{ wa_id: waId }],
    }),
  })
}

describe('executeMessage', () => {
  describe('sendText', () => {
    it('sends text message with correct payload', async () => {
      mockSendResponse()

      const result = await executeMessage('sendText', {
        phoneNumberId: '12345',
        recipientPhone: '+1 (555) 123-4567',
        sendTextBody: 'Hello!',
        sendTextPreviewUrl: false,
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://graph.facebook.com/v21.0/12345/messages',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: '15551234567',
            type: 'text',
            text: { body: 'Hello!', preview_url: false },
          }),
        })
      )

      expect(result).toEqual({
        messageId: 'wamid.abc123',
        recipientWaId: '15551234567',
      })
    })

    it('sanitizes phone number by stripping special chars', async () => {
      mockSendResponse()

      await executeMessage('sendText', {
        phoneNumberId: '12345',
        recipientPhone: '+1-(555)-123-4567',
        sendTextBody: 'Test',
      })

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.to).toBe('15551234567')
    })
  })

  describe('sendMedia', () => {
    it('sends image with caption', async () => {
      mockSendResponse()

      await executeMessage('sendMedia', {
        phoneNumberId: '12345',
        recipientPhone: '15551234567',
        sendMediaType: 'image',
        sendMediaUrl: 'https://example.com/pic.jpg',
        sendMediaCaption: 'A photo',
      })

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.type).toBe('image')
      expect(body.image.link).toBe('https://example.com/pic.jpg')
      expect(body.image.caption).toBe('A photo')
    })

    it('sends document with filename', async () => {
      mockSendResponse()

      await executeMessage('sendMedia', {
        phoneNumberId: '12345',
        recipientPhone: '15551234567',
        sendMediaType: 'document',
        sendMediaUrl: 'https://example.com/report.pdf',
        sendMediaFilename: 'report.pdf',
      })

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.type).toBe('document')
      expect(body.document.filename).toBe('report.pdf')
    })
  })

  describe('sendTemplate', () => {
    it('sends template with name and language parsed from value', async () => {
      mockSendResponse()

      await executeMessage('sendTemplate', {
        phoneNumberId: '12345',
        recipientPhone: '15551234567',
        sendTemplateId: 'hello_world|en_US',
        sendTemplateComponents: JSON.stringify([
          { type: 'body', parameters: [{ type: 'text', text: 'John' }] },
        ]),
      })

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.type).toBe('template')
      expect(body.template.name).toBe('hello_world')
      expect(body.template.language.code).toBe('en_US')
      expect(body.template.components).toHaveLength(1)
    })

    it('throws on invalid components JSON', async () => {
      await expect(
        executeMessage('sendTemplate', {
          phoneNumberId: '12345',
          recipientPhone: '15551234567',
          sendTemplateId: 'test|en',
          sendTemplateComponents: 'not-json',
        })
      ).rejects.toThrow('Invalid template components JSON')
    })
  })

  describe('sendContacts', () => {
    it('sends contact card with all fields', async () => {
      mockSendResponse()

      await executeMessage('sendContacts', {
        phoneNumberId: '12345',
        recipientPhone: '15551234567',
        sendContactFormattedName: 'John Doe',
        sendContactFirstName: 'John',
        sendContactLastName: 'Doe',
        sendContactPhone: '+1234567890',
        sendContactEmail: 'john@example.com',
      })

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.type).toBe('contacts')
      expect(body.contacts[0].name.formatted_name).toBe('John Doe')
      expect(body.contacts[0].phones[0].phone).toBe('+1234567890')
      expect(body.contacts[0].emails[0].email).toBe('john@example.com')
    })
  })

  describe('sendLocation', () => {
    it('sends location with coordinates', async () => {
      mockSendResponse()

      await executeMessage('sendLocation', {
        phoneNumberId: '12345',
        recipientPhone: '15551234567',
        sendLocationLatitude: '37.775',
        sendLocationLongitude: '-122.425',
        sendLocationName: 'San Francisco',
        sendLocationAddress: '1 Market St',
      })

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.type).toBe('location')
      expect(body.location.latitude).toBe(37.775)
      expect(body.location.longitude).toBe(-122.425)
      expect(body.location.name).toBe('San Francisco')
    })
  })

  it('throws on unknown operation', async () => {
    await expect(
      executeMessage('unknown' as any, { phoneNumberId: '12345', recipientPhone: '123' })
    ).rejects.toThrow('Unknown message operation: unknown')
  })

  it('throws when connection not found', async () => {
    const mod = await import('@auxx/sdk/server')
    ;(mod.getOrganizationConnection as any).mockReturnValueOnce(null)

    await expect(
      executeMessage('sendText', { phoneNumberId: '12345', recipientPhone: '123', sendTextBody: 'hi' })
    ).rejects.toThrow('WhatsApp not connected')
  })
})
