// src/tools/list-whatsapp-phone-numbers.tool.server.ts

import { whatsappApi } from '../blocks/whatsapp/shared/whatsapp-api'
import { getWhatsappConnection } from './shared/connection'
import { type MappedWhatsappPhoneNumber, mapPhoneNumber } from './shared/map-phone-number'

interface ListWhatsappPhoneNumbersOutput {
  phoneNumbers: MappedWhatsappPhoneNumber[]
}

export default async function listWhatsappPhoneNumbers(): Promise<ListWhatsappPhoneNumbersOutput> {
  const { token, businessAccountId } = getWhatsappConnection()
  if (!businessAccountId) {
    const err = new Error(
      'WhatsApp Business Account ID missing. Reconnect WhatsApp in Settings > Apps > WhatsApp.'
    ) as Error & { code: string }
    err.code = 'SETTINGS_MISSING'
    throw err
  }

  const response = await whatsappApi<{
    data: { id: string; display_phone_number: string; verified_name: string }[]
  }>(`${businessAccountId}/phone_numbers`, token)

  return {
    phoneNumbers: (response.data ?? []).map(mapPhoneNumber),
  }
}
