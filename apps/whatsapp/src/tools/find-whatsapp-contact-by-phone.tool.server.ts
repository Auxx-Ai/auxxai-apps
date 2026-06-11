// src/tools/find-whatsapp-contact-by-phone.tool.server.ts

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import { normalizePhone } from './shared/normalize-phone'
import { resolveContactRefByPhone } from './shared/resolve-contact-ref'

interface FindWhatsappContactByPhoneInput {
  phone: string
}

interface FindWhatsappContactByPhoneOutput {
  normalizedPhone: string
  auxxRecordId: string | null
  notImportedReason: 'NOT_IMPORTED' | null
}

export default async function findWhatsappContactByPhone(
  input: FindWhatsappContactByPhoneInput,
  ctx: ToolExecuteContext
): Promise<FindWhatsappContactByPhoneOutput> {
  const normalized = normalizePhone(input.phone)
  const recordId = normalized ? await resolveContactRefByPhone(normalized) : null
  return {
    normalizedPhone: normalized,
    auxxRecordId: recordId,
    notImportedReason: recordId ? null : 'NOT_IMPORTED',
  }
}
