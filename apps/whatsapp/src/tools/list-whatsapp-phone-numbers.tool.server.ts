// src/tools/list-whatsapp-phone-numbers.tool.server.ts

import { getOrganizationSettings } from '@auxx/sdk/server'
import { whatsappApi } from '../blocks/whatsapp/shared/whatsapp-api'
import { getWhatsappConnection } from './shared/connection'
import { type MappedWhatsappPhoneNumber, mapPhoneNumber } from './shared/map-phone-number'

interface ListWhatsappPhoneNumbersOutput {
  phoneNumbers: MappedWhatsappPhoneNumber[]
}

export default async function listWhatsappPhoneNumbers(): Promise<ListWhatsappPhoneNumbersOutput> {
  const { token } = getWhatsappConnection()

  const settings = await getOrganizationSettings()
  const businessAccountId = (settings as { businessAccountId?: string } | undefined)
    ?.businessAccountId
  if (!businessAccountId) {
    const err = new Error(
      'WhatsApp Business Account ID not configured. Set it in Settings > Apps > WhatsApp.'
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
