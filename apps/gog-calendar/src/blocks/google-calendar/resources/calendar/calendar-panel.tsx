// src/blocks/google-calendar/resources/calendar/calendar-panel.tsx

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { googleCalendarSchema } from '../../google-calendar-schema'

type SelectOption = { label: string; value: string }

interface CalendarPanelProps {
  api: UseWorkflowApi<typeof googleCalendarSchema>
  calendars: SelectOption[]
  calendarsLoading: boolean
}

export function CalendarPanel({ api, calendars, calendarsLoading }: CalendarPanelProps) {
  const { StringInput, OptionsInput, VarField, VarFieldGroup, Section, ConditionalRender } = api

  return (
    <>
      <ConditionalRender when={(d) => d.operation === 'checkAvailability'}>
        <Section title="Availability Check">
          <VarFieldGroup>
            <VarField>
              <OptionsInput
                name={'availabilityCalendar'}
                options={
                  calendarsLoading ? [{ label: 'Loading calendars...', value: '' }] : calendars
                }
              />
            </VarField>
            <VarField>
              <StringInput name={'availabilityStartTime'} />
            </VarField>
            <VarField>
              <StringInput name={'availabilityEndTime'} />
            </VarField>
          </VarFieldGroup>
        </Section>

        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'availabilityOutputFormat'} />
            </VarField>
            <VarField>
              <StringInput name={'availabilityTimezone'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
