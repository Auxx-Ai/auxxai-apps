// src/tools/gcal-block-check-availability.tool.server.ts

import type { z } from '@auxx/sdk/tools'
import { executeCalendar } from '../blocks/google-calendar/resources/calendar/calendar-execute.server'
import { checkAvailabilityInputs, checkAvailabilityOutputs } from './schemas/calendar'

type Input = z.infer<typeof checkAvailabilityInputs>
type Output = z.infer<typeof checkAvailabilityOutputs>

export default async function gcalBlockCheckAvailability(input: Input): Promise<Output> {
  return executeCalendar('checkAvailability', input) as Promise<Output>
}
