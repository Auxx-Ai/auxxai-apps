// src/tools/slack-block-send-message.tool.server.ts

import { executeMessage } from '../blocks/slack/resources/message/message-execute.server'

export default async function slackBlockSendMessage(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeMessage('send', input)
}
