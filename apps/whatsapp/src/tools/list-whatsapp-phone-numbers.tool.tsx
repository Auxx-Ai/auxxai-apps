// src/tools/list-whatsapp-phone-numbers.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import whatsappIcon from '../assets/icon.png'
import listWhatsappPhoneNumbersExecute from './list-whatsapp-phone-numbers.tool.server'

export const listWhatsappPhoneNumbersTool = defineTool({
  id: 'list_whatsapp_phone_numbers',
  name: 'List WhatsApp phone numbers',
  description:
    'List sender phone numbers on the connected WhatsApp Business Account. Use this to discover the phoneNumberId to send from before calling any send_whatsapp_* tool.',
  icon: whatsappIcon,
  inputs: z.object({}),
  outputs: z.object({
    phoneNumbers: z.array(
      z.object({
        id: z.string(),
        displayPhoneNumber: z.string(),
        verifiedName: z.string(),
      })
    ),
  }),
  config: { requiresConnection: true, timeout: 10000 },
  execute: listWhatsappPhoneNumbersExecute,
})
