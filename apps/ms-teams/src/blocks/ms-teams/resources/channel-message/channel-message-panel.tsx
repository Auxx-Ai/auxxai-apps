// src/blocks/ms-teams/resources/channel-message/channel-message-panel.tsx

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { msTeamsSchema } from '../../ms-teams-schema'

type SelectOption = { label: string; value: string }

interface ChannelMessagePanelProps {
  api: UseWorkflowApi<typeof msTeamsSchema>
  teams: SelectOption[]
  teamsLoading: boolean
  channels: SelectOption[]
  channelsLoading: boolean
}

export function ChannelMessagePanel({
  api,
  teams,
  teamsLoading,
  channels,
  channelsLoading,
}: ChannelMessagePanelProps) {
  const {
    StringInput,
    OptionsInput,
    BooleanInput,
    NumberInput,
    VarField,
    VarFieldGroup,
    Section,
    ConditionalRender,
  } = api

  const teamOptions = teamsLoading ? [{ label: 'Loading teams...', value: '' }] : teams
  const channelOptions = channelsLoading ? [{ label: 'Loading channels...', value: '' }] : channels

  return (
    <>
      {/* Channel Message: Create */}
      <ConditionalRender when={(d) => d.operation === 'create'}>
        <Section title="Team & Channel">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'msgCreateTeam'} options={teamOptions} />
            </VarField>
            <VarField>
              <OptionsInput name={'msgCreateChannel'} options={channelOptions} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Message">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'msgCreateContentType'} />
            </VarField>
            <VarField>
              <StringInput name={'msgCreateMessage'} multiline />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name={'msgCreateReplyToId'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Channel Message: Get Many */}
      <ConditionalRender when={(d) => d.operation === 'getMany'}>
        <Section title="Team & Channel">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'msgGetManyTeam'} options={teamOptions} />
            </VarField>
            <VarField>
              <OptionsInput name={'msgGetManyChannel'} options={channelOptions} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <BooleanInput name={'msgGetManyReturnAll'} />
            </VarField>
            <ConditionalRender when={(d) => !d.msgGetManyReturnAll}>
              <VarField>
                <NumberInput name={'msgGetManyLimit'} />
              </VarField>
            </ConditionalRender>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
