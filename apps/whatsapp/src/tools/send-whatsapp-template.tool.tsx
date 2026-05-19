// src/tools/send-whatsapp-template.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import whatsappIcon from '../assets/icon.png'
import sendWhatsappTemplateExecute from './send-whatsapp-template.tool.server'

export const sendWhatsappTemplateTool = defineTool({
  id: 'send_whatsapp_template',
  name: 'Send WhatsApp template',
  description: 'Send a pre-approved WhatsApp template message.',
  icon: whatsappIcon,
  inputs: z.object({
    phoneNumberId: z.string().min(1),
    recipientPhone: z.string().min(1),
    templateId: z
      .string()
      .min(1)
      .describe('Template selector in the form "<name>|<languageCode>".'),
    components: z
      .string()
      .optional()
      .describe('Optional JSON array of template component parameters.'),
  }),
  outputs: z.object({
    messageId: z.string(),
    messageStatus: z.string(),
    recipientWaId: z.string(),
  }),
  config: { requiresConnection: true, timeout: 15000 },
  execute: sendWhatsappTemplateExecute,
})
