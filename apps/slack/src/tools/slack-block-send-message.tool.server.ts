// src/tools/slack-block-send-message.tool.server.ts

import type { z } from '@auxx/sdk/tools'
import { executeMessage } from '../blocks/slack/resources/message/message-execute.server'
import { sendMessageInputs, sendMessageOutputs } from './schemas'

type Input = z.infer<typeof sendMessageInputs>
type Output = z.infer<typeof sendMessageOutputs>

export default async function slackBlockSendMessage(input: Input): Promise<Output> {
  return executeMessage('send', input) as Promise<Output>
}
