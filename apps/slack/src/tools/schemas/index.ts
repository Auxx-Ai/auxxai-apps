// src/tools/schemas/index.ts

/**
 * Shared zod schemas for the Slack internal block-backing tools.
 * Imported by both `.tool.tsx` (LLM-facing definitions) and
 * `.tool.server.ts` (typed wrappers) so each shape has one source of truth.
 */

import { z } from '@auxx/sdk/tools'

// --- channel ---

export const createChannelInputs = z.object({
  createChannelName: z.string(),
  createChannelVisibility: z.enum(['public', 'private']).optional(),
})
export const createChannelOutputs = z.object({
  channelId: z.string(),
  channelName: z.string(),
})

export const getChannelInputs = z.object({
  getChannelMode: z.enum(['list', 'id', 'name']).optional(),
  getChannelList: z.string().optional(),
  getChannelId: z.string().optional(),
  getChannelName: z.string().optional(),
})
export const getChannelOutputs = z.object({
  channelId: z.string(),
  channelName: z.string(),
  channelTopic: z.string(),
  channelPurpose: z.string(),
  memberCount: z.string(),
  isPrivate: z.string(),
})

// --- message ---

export const deleteMessageInputs = z.object({
  deleteChannelMode: z.enum(['list', 'id']).optional(),
  deleteChannelList: z.string().optional(),
  deleteChannelId: z.string().optional(),
  deleteMessageTs: z.string(),
})
export const deleteMessageOutputs = z.object({
  success: z.string(),
})

export const sendMessageInputs = z.object({
  sendTo: z.enum(['channel', 'user']).optional(),
  // Channel target inputs
  channelMode: z.enum(['list', 'id', 'name', 'url']).optional(),
  channelList: z.string().optional(),
  channel: z.string().optional(),
  channelName: z.string().optional(),
  channelUrl: z.string().optional(),
  // User target inputs
  userMode: z.enum(['list', 'id', 'email']).optional(),
  userList: z.string().optional(),
  user: z.string().optional(),
  userEmail: z.string().optional(),
  // Message body
  text: z.string(),
  threadTs: z.string().optional(),
  unfurlLinks: z.boolean().optional(),
  unfurlMedia: z.boolean().optional(),
})
export const sendMessageOutputs = z
  .object({
    messageTs: z.string(),
    channelId: z.string().optional(),
    channelName: z.string().optional(),
    userId: z.string().optional(),
    dmChannelId: z.string().optional(),
  })
  .loose()
