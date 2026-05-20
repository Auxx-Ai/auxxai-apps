// src/tools/slack-block-create-channel.tool.server.ts

import type { z } from '@auxx/sdk/tools'
import { executeChannel } from '../blocks/slack/resources/channel/channel-execute.server'
import { createChannelInputs, createChannelOutputs } from './schemas'

type Input = z.infer<typeof createChannelInputs>
type Output = z.infer<typeof createChannelOutputs>

export default async function slackBlockCreateChannel(input: Input): Promise<Output> {
  return executeChannel('create', input) as Promise<Output>
}
