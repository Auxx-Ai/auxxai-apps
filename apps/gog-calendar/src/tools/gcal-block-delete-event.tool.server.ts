// src/tools/gcal-block-delete-event.tool.server.ts

import type { z } from '@auxx/sdk/tools'
import { executeEvent } from '../blocks/google-calendar/resources/event/event-execute.server'
import { deleteEventInputs, deleteEventOutputs } from './schemas/event'

type Input = z.infer<typeof deleteEventInputs>
type Output = z.infer<typeof deleteEventOutputs>

export default async function gcalBlockDeleteEvent(input: Input): Promise<Output> {
  return executeEvent('delete', input) as Promise<Output>
}
