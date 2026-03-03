// src/blocks/ms-teams/resources/channel/channel-panel.tsx

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { msTeamsSchema } from '../../ms-teams-schema'

type SelectOption = { label: string; value: string }

interface ChannelPanelProps {
  api: UseWorkflowApi<typeof msTeamsSchema>
  teams: SelectOption[]
  teamsLoading: boolean
  channels: SelectOption[]
  channelsLoading: boolean
}

export function ChannelPanel({
  api,
  teams,
  teamsLoading,
  channels,
  channelsLoading,
}: ChannelPanelProps) {
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
      {/* Channel: Create */}
      <ConditionalRender when={(d) => d.operation === 'create'}>
        <Section title="Team">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'channelCreateTeam'} options={teamOptions} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Channel">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'channelCreateName'} />
            </VarField>
            <VarField>
              <OptionsInput name={'channelCreateType'} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name={'channelCreateDescription'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Channel: Get */}
      <ConditionalRender when={(d) => d.operation === 'get'}>
        <Section title="Team & Channel">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'channelGetTeam'} options={teamOptions} />
            </VarField>
            <VarField>
              <OptionsInput name={'channelGetChannel'} options={channelOptions} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Channel: Get Many */}
      <ConditionalRender when={(d) => d.operation === 'getMany'}>
        <Section title="Team">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'channelGetManyTeam'} options={teamOptions} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <BooleanInput name={'channelGetManyReturnAll'} />
            </VarField>
            <ConditionalRender when={(d) => !d.channelGetManyReturnAll}>
              <VarField>
                <NumberInput name={'channelGetManyLimit'} />
              </VarField>
            </ConditionalRender>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Channel: Update */}
      <ConditionalRender when={(d) => d.operation === 'update'}>
        <Section title="Team & Channel">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'channelUpdateTeam'} options={teamOptions} />
            </VarField>
            <VarField>
              <OptionsInput name={'channelUpdateChannel'} options={channelOptions} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Update Fields">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'channelUpdateName'} />
            </VarField>
            <VarField>
              <StringInput name={'channelUpdateDescription'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Channel: Delete */}
      <ConditionalRender when={(d) => d.operation === 'delete'}>
        <Section title="Team & Channel">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'channelDeleteTeam'} options={teamOptions} />
            </VarField>
            <VarField>
              <OptionsInput name={'channelDeleteChannel'} options={channelOptions} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
