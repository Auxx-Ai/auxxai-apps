// src/tools/slack-block-delete-message.tool.server.ts

import { executeMessage } from '../blocks/slack/resources/message/message-execute.server'

export default async function slackBlockDeleteMessage(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeMessage('delete', input)
}
