// src/blocks/whatsapp/shared/list-templates.server.ts

import { getOrganizationConnection, getOrganizationSettings } from '@auxx/sdk/server'
import { whatsappApi, throwConnectionNotFound } from './whatsapp-api'

export default async function listTemplates(): Promise<{ label: string; value: string }[]> {
  const connection = getOrganizationConnection()
  if (!connection?.value) {
    throwConnectionNotFound()
  }

  const settings = await getOrganizationSettings<{ businessAccountId?: string }>()
  const businessAccountId = settings?.businessAccountId
  if (!businessAccountId) {
    throw new Error(
      'WhatsApp Business Account ID not configured. Set it in Settings > Apps > WhatsApp.'
    )
  }

  const response = await whatsappApi<{
    data: { name: string; language: string; status: string }[]
  }>(`${businessAccountId}/message_templates`, connection.value)

  return (response.data ?? [])
    .filter((t) => t.status === 'APPROVED')
    .map((t) => ({
      label: `${t.name} - ${t.language}`,
      value: `${t.name}|${t.language}`,
    }))
}
