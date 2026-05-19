// src/tools/find-whatsapp-contact-by-phone.tool.tsx

import { defineTool, refs, z } from '@auxx/sdk/tools'
import whatsappIcon from '../assets/icon.png'
import findWhatsappContactByPhoneExecute from './find-whatsapp-contact-by-phone.tool.server'

export const findWhatsappContactByPhoneTool = defineTool({
  id: 'find_whatsapp_contact_by_phone',
  name: 'Find WhatsApp contact by phone',
  description:
    'Look up an Auxx contact by phone number. Returns the contact recordId when a matching primary phone is found. Use this on inbound WhatsApp messages to attach a contact card.',
  icon: whatsappIcon,
  inputs: z.object({
    phone: z
      .string()
      .min(1)
      .describe(
        'Phone number in any common format (with or without country code, dashes, parens, spaces). Normalized server-side before lookup.'
      ),
  }),
  outputs: z.object({
    normalizedPhone: z.string(),
    auxxRecordId: refs
      .entity('contact')
      .nullable()
      .describe('Auxx contact record id, or null when no contact matches the phone.'),
    notImportedReason: z
      .literal('NOT_IMPORTED')
      .nullable()
      .describe('Set when no contact in Auxx has this phone.'),
  }),
  config: { requiresConnection: false, timeout: 5000 },
  execute: findWhatsappContactByPhoneExecute,
})
