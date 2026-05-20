// src/tools/schemas/callback.ts

import { z } from '@auxx/sdk/tools'

// Shared output — both callback ops return a simple success acknowledgement.
const successOutputs = z.object({ success: z.string() }).loose()

export const answerCallbackQueryInputs = z
  .object({
    answerQueryId: z.string(),
    answerQueryText: z.string().optional(),
    answerQueryShowAlert: z.boolean().optional(),
    answerQueryUrl: z.string().optional(),
    answerQueryCacheTime: z.number().optional(),
  })
  .loose()
export const answerCallbackQueryOutputs = successOutputs

export const answerInlineQueryInputs = z
  .object({
    answerInlineQueryId: z.string(),
    answerInlineResults: z.string(),
    answerInlineCacheTime: z.number().optional(),
  })
  .loose()
export const answerInlineQueryOutputs = successOutputs
