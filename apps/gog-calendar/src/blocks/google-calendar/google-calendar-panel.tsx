// src/blocks/google-calendar/google-calendar-panel.tsx

import { useEffect } from 'react'
import { WorkflowPanel, useWorkflow } from '@auxx/sdk/client'
import { googleCalendarSchema } from './google-calendar-schema'
import { OPERATIONS } from './resources/constants'
import { CalendarPanel } from './resources/calendar/calendar-panel'
import { EventPanel } from './resources/event/event-panel'
import { useCalendarData } from './shared/use-calendar-data'
import listCalendars from './shared/list-calendars.server'

export function GoogleCalendarPanel() {
  const api = useWorkflow<typeof googleCalendarSchema>(googleCalendarSchema)

  const {
    data,
    updateData,
    OptionsInput,
    VarFieldGroup,
    FieldRow,
    FieldDivider,
    Section,
    ConditionalRender,
  } = api

  const resource = (data?.resource ?? 'event') as keyof typeof OPERATIONS
  const operation = data?.operation ?? 'create'

  // Auto-reset operation when resource changes
  useEffect(() => {
    if (!data) return
    const validOps = OPERATIONS[resource]
    if (validOps && !validOps.some((op) => op.value === operation)) {
      updateData({ operation: validOps[0].value })
    }
  }, [resource])

  const { data: calendars, loading: calendarsLoading } = useCalendarData('calendars', listCalendars)

  return (
    <WorkflowPanel>
      <Section title="Operation">
        <VarFieldGroup>
          <ConditionalRender when={(d) => d.resource === 'calendar'}>
            <FieldRow>
              <OptionsInput name="resource" acceptsVariables={false} variant="outline" />
              <FieldDivider />
              <OptionsInput name="operation" options={OPERATIONS.calendar} expand />
            </FieldRow>
          </ConditionalRender>

          <ConditionalRender when={(d) => d.resource === 'event'}>
            <FieldRow>
              <OptionsInput name="resource" acceptsVariables={false} variant="outline" />
              <FieldDivider />
              <OptionsInput name="operation" options={OPERATIONS.event} expand />
            </FieldRow>
          </ConditionalRender>
        </VarFieldGroup>
      </Section>

      <ConditionalRender when={(d) => d.resource === 'calendar'}>
        <CalendarPanel api={api} calendars={calendars} calendarsLoading={calendarsLoading} />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'event'}>
        <EventPanel api={api} calendars={calendars} calendarsLoading={calendarsLoading} />
      </ConditionalRender>
    </WorkflowPanel>
  )
}
