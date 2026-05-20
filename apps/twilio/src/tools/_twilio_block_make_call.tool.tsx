// src/tools/_twilio_block_make_call.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import twilioIcon from '../assets/icon.png'
import twilioBlockMakeCallExecute from './_twilio_block_make_call.tool.server'

/**
 * Internal block-backing tool — invoked only via the Twilio workflow block's
 * dispatcher. Mirrors the full call-make behavior of the legacy block, including
 * the raw-TwiML opt-in and the optional StatusCallback URL. Not surfaced to
 * agents or as an action.
 */
export const twilioBlockMakeCallTool = defineTool({
  id: '_twilio_block_make_call',
  name: 'Twilio block: make call (internal)',
  description: 'Internal dispatcher tool backing the Twilio workflow block call make op.',
  icon: twilioIcon,
  inputs: z.object({
    from: z.string(),
    to: z.string(),
    message: z.string().min(1),
    useTwiml: z.boolean().optional(),
    statusCallback: z.string().optional(),
  }),
  outputs: z.object({
    callSid: z.string(),
    status: z.string(),
    from: z.string(),
    to: z.string(),
    direction: z.string(),
    dateCreated: z.string(),
    price: z.string(),
    duration: z.string(),
  }),
  config: {
    requiresConnection: true,
    timeout: 20000,
  },
  execute: twilioBlockMakeCallExecute,
})
