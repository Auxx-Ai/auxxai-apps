// src/blocks/google-calendar/resources/calendar/calendar-schema.ts

import { Workflow } from '@auxx/sdk'

export const calendarInputs = {
  // --- Calendar: Check Availability ---
  availabilityCalendar: Workflow.select({
    label: 'Calendar',
    description: 'Calendar to check availability for',
    options: [] as { value: string; label: string }[],
  }),
  availabilityStartTime: Workflow.string({
    label: 'Start Time',
    description: 'Start of the time range (ISO 8601)',
    placeholder: '2026-03-04T09:00:00Z',
    acceptsVariables: true,
  }),
  availabilityEndTime: Workflow.string({
    label: 'End Time',
    description: 'End of the time range (ISO 8601)',
    placeholder: '2026-03-04T17:00:00Z',
    acceptsVariables: true,
  }),
  availabilityOutputFormat: Workflow.select({
    label: 'Output Format',
    options: [
      { value: 'availability', label: 'Availability (true/false)' },
      { value: 'bookedSlots', label: 'Booked Slots' },
      { value: 'raw', label: 'Raw API Response' },
    ],
    default: 'availability',
  }),
  availabilityTimezone: Workflow.string({
    label: 'Timezone',
    description: 'Timezone for the response (e.g. America/New_York). Defaults to UTC.',
    placeholder: 'America/New_York',
    acceptsVariables: true,
  }),
}

export function calendarComputeOutputs(operation: string) {
  if (operation === 'checkAvailability') {
    return {
      available: Workflow.string({ label: 'Available' }),
      bookedSlots: Workflow.string({ label: 'Booked Slots (JSON)' }),
    }
  }
  return {}
}
