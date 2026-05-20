// src/tools/gcal-block-get-event.tool.server.ts

import type { z } from '@auxx/sdk/tools'
import { executeEvent } from '../blocks/google-calendar/resources/event/event-execute.server'
import { getEventInputs, getEventOutputs } from './schemas/event'

type Input = z.infer<typeof getEventInputs>
type Output = z.infer<typeof getEventOutputs>

export default async function gcalBlockGetEvent(input: Input): Promise<Output> {
  return executeEvent('get', input) as Promise<Output>
}
