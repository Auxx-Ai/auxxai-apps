// src/tools/slack-block-get-channel.tool.server.ts

import type { z } from '@auxx/sdk/tools'
import { executeChannel } from '../blocks/slack/resources/channel/channel-execute.server'
import { getChannelInputs, getChannelOutputs } from './schemas'

type Input = z.infer<typeof getChannelInputs>
type Output = z.infer<typeof getChannelOutputs>

export default async function slackBlockGetChannel(input: Input): Promise<Output> {
  return executeChannel('get', input) as Promise<Output>
}
