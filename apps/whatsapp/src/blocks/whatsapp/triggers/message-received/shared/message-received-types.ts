// src/blocks/whatsapp/triggers/message-received/shared/message-received-types.ts

export type WhatsAppEventType = 'message' | 'status' | 'unknown'

export type WhatsAppMessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'location'
  | 'contacts'
  | 'sticker'
  | 'reaction'
  | 'other'

export function detectEventType(payload: any): WhatsAppEventType {
  const changes = payload?.entry?.[0]?.changes?.[0]?.value
  if (!changes) return 'unknown'
  if (changes.messages?.length > 0) return 'message'
  if (changes.statuses?.length > 0) return 'status'
  return 'unknown'
}

function detectMessageType(message: any): WhatsAppMessageType {
  const type = message.type
  if (type === 'text') return 'text'
  if (type === 'image') return 'image'
  if (type === 'video') return 'video'
  if (type === 'audio') return 'audio'
  if (type === 'document') return 'document'
  if (type === 'location') return 'location'
  if (type === 'contacts') return 'contacts'
  if (type === 'sticker') return 'sticker'
  if (type === 'reaction') return 'reaction'
  return 'other'
}

function extractMediaInfo(message: any): { mediaId: string; mediaUrl: string; mimeType: string } {
  const mediaTypes = ['image', 'video', 'audio', 'document', 'sticker']
  for (const type of mediaTypes) {
    if (message[type]) {
      return {
        mediaId: message[type].id ?? '',
        mediaUrl: message[type].url ?? '',
        mimeType: message[type].mime_type ?? '',
      }
    }
  }
  return { mediaId: '', mediaUrl: '', mimeType: '' }
}

function extractMessageBody(message: any): string {
  if (message.text?.body) return message.text.body
  if (message.image?.caption) return message.image.caption
  if (message.video?.caption) return message.video.caption
  if (message.document?.caption) return message.document.caption
  return ''
}

export interface TriggerDataItem {
  eventType: string
  messageId: string
  from: string
  to: string
  timestamp: string
  messageType: string
  messageBody: string
  mediaId: string
  mediaUrl: string
  mimeType: string
  statusType: string
  contactName: string
  raw: any
}

export function extractTriggerData(entry: any): TriggerDataItem[] {
  const changes = entry.changes?.[0]?.value
  if (!changes) return []

  const phoneNumberId = changes.metadata?.phone_number_id ?? ''
  const items: TriggerDataItem[] = []

  // Process messages
  if (changes.messages) {
    for (const message of changes.messages) {
      const contactInfo = changes.contacts?.find((c: any) => c.wa_id === message.from)
      const media = extractMediaInfo(message)

      items.push({
        eventType: 'message',
        messageId: message.id ?? '',
        from: message.from ?? '',
        to: phoneNumberId,
        timestamp: message.timestamp ?? '',
        messageType: detectMessageType(message),
        messageBody: extractMessageBody(message),
        mediaId: media.mediaId,
        mediaUrl: media.mediaUrl,
        mimeType: media.mimeType,
        statusType: '',
        contactName: contactInfo?.profile?.name ?? '',
        raw: entry,
      })
    }
  }

  // Process statuses
  if (changes.statuses) {
    for (const status of changes.statuses) {
      items.push({
        eventType: 'status',
        messageId: status.id ?? '',
        from: '',
        to: status.recipient_id ?? '',
        timestamp: status.timestamp ?? '',
        messageType: '',
        messageBody: '',
        mediaId: '',
        mediaUrl: '',
        mimeType: '',
        statusType: status.status ?? '',
        contactName: '',
        raw: entry,
      })
    }
  }

  return items
}
