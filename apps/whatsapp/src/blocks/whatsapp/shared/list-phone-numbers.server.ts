// src/blocks/whatsapp/shared/list-phone-numbers.server.ts

import { getOrganizationConnection, getOrganizationSettings } from '@auxx/sdk/server'
import { whatsappApi, throwConnectionNotFound } from './whatsapp-api'

export default async function listPhoneNumbers(): Promise<{ label: string; value: string }[]> {
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
    data: { id: string; display_phone_number: string; verified_name: string }[]
  }>(`${businessAccountId}/phone_numbers`, connection.value)

  return (response.data ?? []).map((phone) => ({
    label: `${phone.display_phone_number} - ${phone.verified_name}`,
    value: phone.id,
  }))
}
