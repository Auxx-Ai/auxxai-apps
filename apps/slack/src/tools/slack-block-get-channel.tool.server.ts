// src/tools/slack-block-get-channel.tool.server.ts

import { executeChannel } from '../blocks/slack/resources/channel/channel-execute.server'

export default async function slackBlockGetChannel(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeChannel('get', input)
}
