// src/blocks/slack/resources/channel/channel-panel.tsx

/**
 * Channel resource panel UI.
 * Renders operation-specific inputs for Channel:Create and Channel:Get.
 */

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { slackSchema } from '../../slack-schema'

type SelectOption = { label: string; value: string }

interface ChannelPanelProps {
  api: UseWorkflowApi<typeof slackSchema>
  channels: SelectOption[]
  channelsLoading: boolean
}

export function ChannelPanel({ api, channels, channelsLoading }: ChannelPanelProps) {
  const { StringInput, OptionsInput, VarField, VarFieldGroup, Section, ConditionalRender } = api

  return (
    <>
      {/* Channel: Create */}
      <ConditionalRender when={(d) => d.operation === 'create'}>
        <Section title="New Channel">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'createChannelName'} />
            </VarField>
            <VarField>
              <OptionsInput name={'createChannelVisibility'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Channel: Get */}
      <ConditionalRender when={(d) => d.operation === 'get'}>
        <Section title="Channel">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'getChannelMode'} />
            </VarField>

            <ConditionalRender when={(d) => d.getChannelMode === 'list'}>
              <VarField>
                <OptionsInput
                  name={'getChannelList'}
                  options={
                    channelsLoading ? [{ label: 'Loading channels...', value: '' }] : channels
                  }
                />
              </VarField>
            </ConditionalRender>

            <ConditionalRender when={(d) => d.getChannelMode === 'id'}>
              <VarField>
                <StringInput name={'getChannelId'} />
              </VarField>
            </ConditionalRender>

            <ConditionalRender when={(d) => d.getChannelMode === 'name'}>
              <VarField>
                <StringInput name={'getChannelName'} />
              </VarField>
            </ConditionalRender>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
