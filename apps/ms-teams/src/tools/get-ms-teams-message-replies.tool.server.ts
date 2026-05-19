// src/tools/get-ms-teams-message-replies.tool.server.ts

import { graphApi } from '../blocks/ms-teams/shared/ms-teams-api'
import { getMsTeamsConnection } from './shared/connection'
import { type MappedMsTeamsReplyMessage, mapReplyMessage } from './shared/map-message'

interface GetMsTeamsMessageRepliesInput {
  teamId: string
  channelId: string
  messageId: string
}

interface GetMsTeamsMessageRepliesOutput {
  parent: MappedMsTeamsReplyMessage
  replies: MappedMsTeamsReplyMessage[]
}

interface GraphRepliesList {
  value?: unknown[]
}

export default async function getMsTeamsMessageReplies(
  input: GetMsTeamsMessageRepliesInput
): Promise<GetMsTeamsMessageRepliesOutput> {
  const { token } = getMsTeamsConnection()
  const base = `/teams/${input.teamId}/channels/${input.channelId}/messages/${input.messageId}`

  const [parent, replies] = await Promise.all([
    graphApi<unknown>('GET', base, token, { version: 'beta' }),
    graphApi<GraphRepliesList>('GET', `${base}/replies`, token, { version: 'beta' }),
  ])

  // Replies come in reverse-chrono from Graph; flip so the LLM reads top-down.
  const rawReplies = (replies.value ?? []).slice().reverse()

  return {
    parent: mapReplyMessage(parent),
    replies: rawReplies.map(mapReplyMessage),
  }
}
