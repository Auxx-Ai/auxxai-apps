// src/tools/schemas/chat.ts

import { z } from '@auxx/sdk/tools'

// Shared output — chat mutation ops return a simple success acknowledgement.
const successOutputs = z.object({ success: z.string() }).loose()

export const getChatInputs = z
  .object({
    getChatChatId: z.string(),
  })
  .loose()
export const getChatOutputs = z
  .object({
    chatId: z.string(),
    type: z.string(),
    title: z.string(),
    username: z.string(),
  })
  .loose()

export const getChatAdministratorsInputs = z
  .object({
    getAdminsChatId: z.string(),
  })
  .loose()
export const getChatAdministratorsOutputs = z
  .object({
    count: z.string(),
  })
  .loose()

export const getChatMemberInputs = z
  .object({
    getMemberChatId: z.string(),
    getMemberUserId: z.string(),
  })
  .loose()
export const getChatMemberOutputs = z
  .object({
    status: z.string(),
    userId: z.string(),
  })
  .loose()

export const leaveChatInputs = z
  .object({
    leaveChatId: z.string(),
  })
  .loose()
export const leaveChatOutputs = successOutputs

export const setChatDescriptionInputs = z
  .object({
    setDescChatId: z.string(),
    setDescDescription: z.string().optional(),
  })
  .loose()
export const setChatDescriptionOutputs = successOutputs

export const setChatTitleInputs = z
  .object({
    setTitleChatId: z.string(),
    setTitleTitle: z.string(),
  })
  .loose()
export const setChatTitleOutputs = successOutputs
