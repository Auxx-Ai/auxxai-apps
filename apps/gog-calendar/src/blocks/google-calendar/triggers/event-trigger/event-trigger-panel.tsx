// src/blocks/google-calendar/triggers/event-trigger/event-trigger-panel.tsx

import { WorkflowPanel, useWorkflow } from '@auxx/sdk/client'
import { eventTriggerSchema } from './event-trigger-schema'
import { useCalendarData } from '../../shared/use-calendar-data'
import listCalendars from '../../shared/list-calendars.server'

export function EventTriggerPanel() {
  const api = useWorkflow<typeof eventTriggerSchema>(eventTriggerSchema)
  const { OptionsInput, StringInput, VarField, VarFieldGroup, Section } = api

  const { data: calendars, loading: calendarsLoading } = useCalendarData('calendars', listCalendars)

  return (
    <WorkflowPanel>
      <Section title="Trigger">
        <VarFieldGroup>
          <VarField>
            <OptionsInput
              name={'calendarId'}
              options={
                calendarsLoading ? [{ label: 'Loading calendars...', value: '' }] : calendars
              }
            />
          </VarField>
          <VarField>
            <OptionsInput name={'triggerOn'} />
          </VarField>
        </VarFieldGroup>
      </Section>

      <Section title="Options" collapsible>
        <VarFieldGroup>
          <VarField>
            <StringInput name={'matchTerm'} />
          </VarField>
        </VarFieldGroup>
      </Section>
    </WorkflowPanel>
  )
}
