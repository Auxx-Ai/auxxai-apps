// src/tools/slack-block-create-channel.tool.server.ts

import { executeChannel } from '../blocks/slack/resources/channel/channel-execute.server'

export default async function slackBlockCreateChannel(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeChannel('create', input)
}
