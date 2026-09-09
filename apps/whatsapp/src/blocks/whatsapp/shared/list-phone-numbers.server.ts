// src/blocks/whatsapp/shared/list-phone-numbers.server.ts

import { whatsappApi } from './whatsapp-api'
import { getWhatsappConnection } from '../../../tools/shared/connection'

export default async function listPhoneNumbers(): Promise<{ label: string; value: string }[]> {
  const { token, businessAccountId } = getWhatsappConnection()
  if (!businessAccountId) {
    throw new Error(
      'WhatsApp Business Account ID missing. Reconnect WhatsApp in Settings > Apps > WhatsApp.'
    )
  }

  const response = await whatsappApi<{
    data: { id: string; display_phone_number: string; verified_name: string }[]
  }>(`${businessAccountId}/phone_numbers`, token)

  return (response.data ?? []).map((phone) => ({
    label: `${phone.display_phone_number} - ${phone.verified_name}`,
    value: phone.id,
  }))
}
