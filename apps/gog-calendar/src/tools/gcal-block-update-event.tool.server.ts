// src/tools/gcal-block-update-event.tool.server.ts

import type { z } from '@auxx/sdk/tools'
import { executeEvent } from '../blocks/google-calendar/resources/event/event-execute.server'
import { updateEventInputs, updateEventOutputs } from './schemas/event'

type Input = z.infer<typeof updateEventInputs>
type Output = z.infer<typeof updateEventOutputs>

export default async function gcalBlockUpdateEvent(input: Input): Promise<Output> {
  return executeEvent('update', input) as Promise<Output>
}
