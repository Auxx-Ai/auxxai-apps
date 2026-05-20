// src/tools/gcal-block-create-event.tool.server.ts

import type { z } from '@auxx/sdk/tools'
import { executeEvent } from '../blocks/google-calendar/resources/event/event-execute.server'
import { createEventInputs, createEventOutputs } from './schemas/event'

type Input = z.infer<typeof createEventInputs>
type Output = z.infer<typeof createEventOutputs>

export default async function gcalBlockCreateEvent(input: Input): Promise<Output> {
  return executeEvent('create', input) as Promise<Output>
}
