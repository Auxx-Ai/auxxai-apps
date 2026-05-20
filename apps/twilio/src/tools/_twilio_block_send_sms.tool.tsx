// src/tools/_twilio_block_send_sms.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import twilioIcon from '../assets/icon.png'
import twilioBlockSendSmsExecute from './_twilio_block_send_sms.tool.server'

/**
 * Internal block-backing tool — invoked only via the Twilio workflow block's
 * dispatcher. Mirrors the full SMS-send behavior of the legacy block, including
 * WhatsApp-channel routing and the optional StatusCallback URL. Not surfaced to
 * agents or as an action (no `agent` / `action` key).
 */
export const twilioBlockSendSmsTool = defineTool({
  id: '_twilio_block_send_sms',
  name: 'Twilio block: send SMS (internal)',
  description: 'Internal dispatcher tool backing the Twilio workflow block SMS send op.',
  icon: twilioIcon,
  inputs: z.object({
    from: z.string(),
    to: z.string(),
    body: z.string().min(1),
    asWhatsApp: z.boolean().optional(),
    statusCallback: z.string().optional(),
  }),
  outputs: z.object({
    messageSid: z.string(),
    status: z.string(),
    from: z.string(),
    to: z.string(),
    body: z.string(),
    dateCreated: z.string(),
    price: z.string(),
    errorCode: z.string(),
    errorMessage: z.string(),
  }),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: twilioBlockSendSmsExecute,
})
