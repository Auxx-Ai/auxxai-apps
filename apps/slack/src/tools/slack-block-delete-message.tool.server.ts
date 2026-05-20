// src/tools/slack-block-delete-message.tool.server.ts

import type { z } from '@auxx/sdk/tools'
import { executeMessage } from '../blocks/slack/resources/message/message-execute.server'
import { deleteMessageInputs, deleteMessageOutputs } from './schemas'

type Input = z.infer<typeof deleteMessageInputs>
type Output = z.infer<typeof deleteMessageOutputs>

export default async function slackBlockDeleteMessage(input: Input): Promise<Output> {
  return executeMessage('delete', input) as Promise<Output>
}
