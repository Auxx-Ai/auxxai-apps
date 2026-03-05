// src/blocks/whatsapp/resources/message/message-execute.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { whatsappApi, throwConnectionNotFound } from '../../shared/whatsapp-api'

function sanitizePhone(phone: string): string {
  return phone.replace(/[-() +]/g, '')
}

interface SendResponse {
  messages: { id: string }[]
  contacts: { wa_id: string }[]
}

export async function executeMessage(
  operation: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()

  const credential = connection.value
  const phoneNumberId = input.phoneNumberId
  const to = sanitizePhone(input.recipientPhone)

  switch (operation) {
    case 'sendText': {
      const result = await whatsappApi<SendResponse>(`${phoneNumberId}/messages`, credential, {
        method: 'POST',
        body: {
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: {
            body: input.sendTextBody,
            preview_url: input.sendTextPreviewUrl ?? false,
          },
        },
      })
      return {
        messageId: result.messages?.[0]?.id ?? '',
        recipientWaId: result.contacts?.[0]?.wa_id ?? '',
      }
    }

    case 'sendMedia': {
      const mediaType = input.sendMediaType ?? 'image'
      const mediaPayload: Record<string, unknown> = {
        link: input.sendMediaUrl,
      }
      if (input.sendMediaCaption) {
        mediaPayload.caption = input.sendMediaCaption
      }
      if (mediaType === 'document' && input.sendMediaFilename) {
        mediaPayload.filename = input.sendMediaFilename
      }

      const result = await whatsappApi<SendResponse>(`${phoneNumberId}/messages`, credential, {
        method: 'POST',
        body: {
          messaging_product: 'whatsapp',
          to,
          type: mediaType,
          [mediaType]: mediaPayload,
        },
      })
      return {
        messageId: result.messages?.[0]?.id ?? '',
        recipientWaId: result.contacts?.[0]?.wa_id ?? '',
      }
    }

    case 'sendTemplate': {
      const templateValue = input.sendTemplateId ?? ''
      const [name, language] = templateValue.split('|')

      let components: unknown[] = []
      if (input.sendTemplateComponents) {
        try {
          components = JSON.parse(input.sendTemplateComponents)
        } catch {
          throw new Error('Invalid template components JSON')
        }
      }

      const result = await whatsappApi<SendResponse>(`${phoneNumberId}/messages`, credential, {
        method: 'POST',
        body: {
          messaging_product: 'whatsapp',
          to,
          type: 'template',
          template: {
            name,
            language: { code: language },
            ...(components.length > 0 ? { components } : {}),
          },
        },
      })
      return {
        messageId: result.messages?.[0]?.id ?? '',
        messageStatus: 'sent',
        recipientWaId: result.contacts?.[0]?.wa_id ?? '',
      }
    }

    case 'sendContacts': {
      const contact: Record<string, unknown> = {
        name: {
          formatted_name: input.sendContactFormattedName,
          ...(input.sendContactFirstName ? { first_name: input.sendContactFirstName } : {}),
          ...(input.sendContactLastName ? { last_name: input.sendContactLastName } : {}),
        },
      }
      if (input.sendContactPhone) {
        contact.phones = [{ phone: input.sendContactPhone, type: 'CELL' }]
      }
      if (input.sendContactEmail) {
        contact.emails = [{ email: input.sendContactEmail, type: 'WORK' }]
      }

      const result = await whatsappApi<SendResponse>(`${phoneNumberId}/messages`, credential, {
        method: 'POST',
        body: {
          messaging_product: 'whatsapp',
          to,
          type: 'contacts',
          contacts: [contact],
        },
      })
      return {
        messageId: result.messages?.[0]?.id ?? '',
        recipientWaId: result.contacts?.[0]?.wa_id ?? '',
      }
    }

    case 'sendLocation': {
      const result = await whatsappApi<SendResponse>(`${phoneNumberId}/messages`, credential, {
        method: 'POST',
        body: {
          messaging_product: 'whatsapp',
          to,
          type: 'location',
          location: {
            longitude: parseFloat(input.sendLocationLongitude),
            latitude: parseFloat(input.sendLocationLatitude),
            ...(input.sendLocationName ? { name: input.sendLocationName } : {}),
            ...(input.sendLocationAddress ? { address: input.sendLocationAddress } : {}),
          },
        },
      })
      return {
        messageId: result.messages?.[0]?.id ?? '',
        recipientWaId: result.contacts?.[0]?.wa_id ?? '',
      }
    }

    default:
      throw new Error(`Unknown message operation: ${operation}`)
  }
}
