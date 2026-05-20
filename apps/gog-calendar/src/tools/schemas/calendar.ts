// src/tools/schemas/calendar.ts

import { z } from '@auxx/sdk/tools'

export const checkAvailabilityInputs = z.object({
  availabilityCalendar: z.string(),
  availabilityStartTime: z.string(),
  availabilityEndTime: z.string(),
  availabilityTimezone: z.string().optional(),
  availabilityOutputFormat: z.enum(['availability', 'bookedSlots', 'raw']).optional(),
})
export const checkAvailabilityOutputs = z
  .object({
    available: z.string(),
    bookedSlots: z.string(),
  })
  .loose()
