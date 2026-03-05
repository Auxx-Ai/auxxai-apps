// src/blocks/google-calendar/resources/event/event-panel.tsx

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { googleCalendarSchema } from '../../google-calendar-schema'

type SelectOption = { label: string; value: string }

interface EventPanelProps {
  api: UseWorkflowApi<typeof googleCalendarSchema>
  calendars: SelectOption[]
  calendarsLoading: boolean
}

export function EventPanel({ api, calendars, calendarsLoading }: EventPanelProps) {
  const {
    StringInput,
    OptionsInput,
    VarField,
    VarFieldGroup,
    FieldRow,
    FieldDivider,
    Section,
    ConditionalRender,
  } = api

  const calendarField = (
    <VarField>
      <OptionsInput
        name={'eventCalendar'}
        options={calendarsLoading ? [{ label: 'Loading calendars...', value: '' }] : calendars}
      />
    </VarField>
  )

  return (
    <>
      {/* Event: Create */}
      <ConditionalRender when={(d) => d.operation === 'create'}>
        <Section title="Event">
          <VarFieldGroup>
            {calendarField}
            <VarField>
              <StringInput name={'createSummary'} />
            </VarField>
            <FieldRow>
              <StringInput name={'createStart'} />
              <FieldDivider />
              <StringInput name={'createEnd'} />
            </FieldRow>
            <VarField>
              <OptionsInput name={'createAllDay'} />
            </VarField>
          </VarFieldGroup>
        </Section>

        <Section title="Details" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name={'createDescription'} />
            </VarField>
            <VarField>
              <StringInput name={'createLocation'} />
            </VarField>
            <VarField>
              <StringInput name={'createAttendees'} />
            </VarField>
            <VarField>
              <OptionsInput name={'createColor'} />
            </VarField>
          </VarFieldGroup>
        </Section>

        <Section title="Options" collapsible>
          <VarFieldGroup>
            <FieldRow>
              <OptionsInput name={'createVisibility'} />
              <FieldDivider />
              <OptionsInput name={'createShowMeAs'} />
            </FieldRow>
            <VarField>
              <OptionsInput name={'createSendUpdates'} />
            </VarField>
            <VarField>
              <OptionsInput name={'createGuestsCanModify'} />
            </VarField>
            <VarField>
              <OptionsInput name={'createGuestsCanInviteOthers'} />
            </VarField>
            <VarField>
              <OptionsInput name={'createGuestsCanSeeOtherGuests'} />
            </VarField>
            <VarField>
              <StringInput name={'createRecurrence'} />
            </VarField>
            <VarField>
              <OptionsInput name={'createConferenceSolution'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Event: Delete */}
      <ConditionalRender when={(d) => d.operation === 'delete'}>
        <Section title="Event to Delete">
          <VarFieldGroup>
            {calendarField}
            <VarField>
              <StringInput name={'deleteEventId'} />
            </VarField>
            <VarField>
              <OptionsInput name={'deleteSendUpdates'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Event: Get */}
      <ConditionalRender when={(d) => d.operation === 'get'}>
        <Section title="Event">
          <VarFieldGroup>
            {calendarField}
            <VarField>
              <StringInput name={'getEventId'} />
            </VarField>
          </VarFieldGroup>
        </Section>

        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name={'getTimezone'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Event: Get Many */}
      <ConditionalRender when={(d) => d.operation === 'getMany'}>
        <Section title="Events">
          <VarFieldGroup>
            {calendarField}
            <FieldRow>
              <StringInput name={'getManyAfter'} />
              <FieldDivider />
              <StringInput name={'getManyBefore'} />
            </FieldRow>
            <VarField>
              <OptionsInput name={'getManyLimit'} />
            </VarField>
          </VarFieldGroup>
        </Section>

        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name={'getManyQuery'} />
            </VarField>
            <VarField>
              <OptionsInput name={'getManyOrderBy'} />
            </VarField>
            <VarField>
              <OptionsInput name={'getManyExpandRecurring'} />
            </VarField>
            <VarField>
              <OptionsInput name={'getManyShowDeleted'} />
            </VarField>
            <VarField>
              <StringInput name={'getManyTimezone'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Event: Update */}
      <ConditionalRender when={(d) => d.operation === 'update'}>
        <Section title="Event">
          <VarFieldGroup>
            {calendarField}
            <VarField>
              <StringInput name={'updateEventId'} />
            </VarField>
          </VarFieldGroup>
        </Section>

        <Section title="Update Fields">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'updateSummary'} />
            </VarField>
            <FieldRow>
              <StringInput name={'updateStart'} />
              <FieldDivider />
              <StringInput name={'updateEnd'} />
            </FieldRow>
            <VarField>
              <OptionsInput name={'updateAllDay'} />
            </VarField>
            <VarField>
              <StringInput name={'updateDescription'} />
            </VarField>
            <VarField>
              <StringInput name={'updateLocation'} />
            </VarField>
            <VarField>
              <StringInput name={'updateAttendees'} />
            </VarField>
            <VarField>
              <OptionsInput name={'updateColor'} />
            </VarField>
            <FieldRow>
              <OptionsInput name={'updateVisibility'} />
              <FieldDivider />
              <OptionsInput name={'updateShowMeAs'} />
            </FieldRow>
            <VarField>
              <OptionsInput name={'updateSendUpdates'} />
            </VarField>
            <VarField>
              <OptionsInput name={'updateGuestsCanModify'} />
            </VarField>
            <VarField>
              <OptionsInput name={'updateGuestsCanInviteOthers'} />
            </VarField>
            <VarField>
              <OptionsInput name={'updateGuestsCanSeeOtherGuests'} />
            </VarField>
            <VarField>
              <StringInput name={'updateRecurrence'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
