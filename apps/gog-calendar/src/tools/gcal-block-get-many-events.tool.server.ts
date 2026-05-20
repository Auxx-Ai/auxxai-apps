// src/tools/gcal-block-get-many-events.tool.server.ts

import type { z } from '@auxx/sdk/tools'
import { executeEvent } from '../blocks/google-calendar/resources/event/event-execute.server'
import { getManyEventsInputs, getManyEventsOutputs } from './schemas/event'

type Input = z.infer<typeof getManyEventsInputs>
type Output = z.infer<typeof getManyEventsOutputs>

export default async function gcalBlockGetManyEvents(input: Input): Promise<Output> {
  return executeEvent('getMany', input) as Promise<Output>
}
