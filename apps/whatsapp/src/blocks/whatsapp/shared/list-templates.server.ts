// src/blocks/whatsapp/shared/list-templates.server.ts

import { whatsappApi } from './whatsapp-api'
import { getWhatsappConnection } from '../../../tools/shared/connection'

export default async function listTemplates(): Promise<{ label: string; value: string }[]> {
  const { token, businessAccountId } = getWhatsappConnection()
  if (!businessAccountId) {
    throw new Error(
      'WhatsApp Business Account ID missing. Reconnect WhatsApp in Settings > Apps > WhatsApp.'
    )
  }

  const response = await whatsappApi<{
    data: { name: string; language: string; status: string }[]
  }>(`${businessAccountId}/message_templates`, token)

  return (response.data ?? [])
    .filter((t) => t.status === 'APPROVED')
    .map((t) => ({
      label: `${t.name} - ${t.language}`,
      value: `${t.name}|${t.language}`,
    }))
}
