// src/blocks/discord/resources/channel/channel-panel.tsx

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { discordSchema } from '../../discord-schema'

type SelectOption = { label: string; value: string }

interface ChannelPanelProps {
  api: UseWorkflowApi<typeof discordSchema>
  guilds: SelectOption[]
  guildsLoading: boolean
  guildsError: string | null
  channels: SelectOption[]
  channelsLoading: boolean
  channelsError: string | null
  categories: SelectOption[]
  categoriesLoading: boolean
  categoriesError: string | null
}

export function ChannelPanel({
  api,
  guilds,
  guildsLoading,
  guildsError,
  channels,
  channelsLoading,
  channelsError,
  categories,
  categoriesLoading,
  categoriesError,
}: ChannelPanelProps) {
  const {
    StringInput,
    OptionsInput,
    BooleanInput,
    VarField,
    VarFieldGroup,
    Section,
    ConditionalRender,
  } = api

  const guildOptions = guildsLoading
    ? [{ label: 'Loading servers...', value: '' }]
    : guildsError
      ? [{ label: `Error: ${guildsError}`, value: '' }]
      : guilds
  const channelOptions = channelsLoading
    ? [{ label: 'Loading channels...', value: '' }]
    : channelsError
      ? [{ label: `Error: ${channelsError}`, value: '' }]
      : channels
  const categoryOptions = categoriesLoading
    ? [{ label: 'Loading categories...', value: '' }]
    : categoriesError
      ? [{ label: `Error: ${categoriesError}`, value: '' }]
      : [{ label: 'None', value: '' }, ...categories]

  return (
    <>
      {/* Channel: Create */}
      <ConditionalRender when={(d) => d.operation === 'create'}>
        <Section title="Server">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'createGuild'} options={guildOptions} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Channel">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'createName'} />
            </VarField>
            <VarField>
              <OptionsInput name={'createType'} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name={'createTopic'} />
            </VarField>
            <VarField>
              <OptionsInput name={'createCategory'} options={categoryOptions} />
            </VarField>
            <VarField>
              <BooleanInput name={'createNsfw'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Channel: Get */}
      <ConditionalRender when={(d) => d.operation === 'get'}>
        <Section title="Server & Channel">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'getGuild'} options={guildOptions} />
            </VarField>
            <VarField>
              <OptionsInput name={'getChannel'} options={channelOptions} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Channel: Get Many */}
      <ConditionalRender when={(d) => d.operation === 'getMany'}>
        <Section title="Server">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'getManyGuild'} options={guildOptions} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'getManyFilterType'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Channel: Update */}
      <ConditionalRender when={(d) => d.operation === 'update'}>
        <Section title="Server & Channel">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'updateGuild'} options={guildOptions} />
            </VarField>
            <VarField>
              <OptionsInput name={'updateChannel'} options={channelOptions} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Updates">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'updateName'} />
            </VarField>
            <VarField>
              <StringInput name={'updateTopic'} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'updateCategory'} options={categoryOptions} />
            </VarField>
            <VarField>
              <BooleanInput name={'updateNsfw'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Channel: Delete */}
      <ConditionalRender when={(d) => d.operation === 'delete'}>
        <Section title="Server & Channel">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'deleteGuild'} options={guildOptions} />
            </VarField>
            <VarField>
              <OptionsInput name={'deleteChannel'} options={channelOptions} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
