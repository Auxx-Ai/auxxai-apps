// src/blocks/discord/discord-panel.tsx

import { useEffect, useCallback } from 'react'
import { WorkflowPanel, useWorkflow } from '@auxx/sdk/client'
import { discordSchema } from './discord-schema'
import { OPERATIONS } from './resources/constants'
import { ChannelPanel } from './resources/channel/channel-panel'
import { MessagePanel } from './resources/message/message-panel'
import { MemberPanel } from './resources/member/member-panel'
import { useDiscordData } from './shared/use-discord-data'
import listGuilds from './shared/list-guilds.server'
import listChannels from './shared/list-channels.server'
import listRoles from './shared/list-roles.server'

export function DiscordPanel() {
  const api = useWorkflow<typeof discordSchema>(discordSchema)

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

  const resource = (data?.resource ?? 'message') as keyof typeof OPERATIONS
  const operation = data?.operation ?? 'send'

  // Determine current guild based on which operation is active
  const currentGuild =
    resource === 'channel'
      ? operation === 'create'
        ? data?.createGuild
        : operation === 'get'
          ? data?.getGuild
          : operation === 'getMany'
            ? data?.getManyGuild
            : operation === 'update'
              ? data?.updateGuild
              : operation === 'delete'
                ? data?.deleteGuild
                : undefined
      : resource === 'message'
        ? operation === 'send'
          ? data?.sendGuild
          : operation === 'get'
            ? data?.getMessageGuild
            : operation === 'getMany'
              ? data?.getManyMessageGuild
              : operation === 'delete'
                ? data?.deleteMessageGuild
                : operation === 'react'
                  ? data?.reactGuild
                  : undefined
        : resource === 'member'
          ? operation === 'getMany'
            ? data?.getManyMemberGuild
            : operation === 'roleAdd'
              ? data?.roleAddGuild
              : operation === 'roleRemove'
                ? data?.roleRemoveGuild
                : undefined
          : undefined

  // Auto-reset operation when resource changes
  useEffect(() => {
    if (!data) return
    const validOps = OPERATIONS[resource]
    if (validOps && !validOps.some((op) => op.value === operation)) {
      updateData({ operation: validOps[0].value })
    }
  }, [resource])

  // Lazy data loading
  const needsGuilds = true

  const needsChannels =
    ((resource === 'channel' && ['get', 'update', 'delete'].includes(operation)) ||
      resource === 'message') &&
    !!currentGuild

  const needsCategories =
    resource === 'channel' && ['create', 'update'].includes(operation) && !!currentGuild

  const needsRoles =
    resource === 'member' && ['roleAdd', 'roleRemove'].includes(operation) && !!currentGuild

  const { data: guilds, loading: guildsLoading } = useDiscordData('guilds', listGuilds, {
    enabled: needsGuilds,
  })

  const fetchChannels = useCallback(() => listChannels(currentGuild as string), [currentGuild])
  const { data: channels, loading: channelsLoading } = useDiscordData(
    `channels:${currentGuild}`,
    fetchChannels,
    { enabled: needsChannels }
  )

  const fetchTextChannels = useCallback(
    () => listChannels(currentGuild as string, 'text'),
    [currentGuild]
  )
  const { data: textChannels, loading: textChannelsLoading } = useDiscordData(
    `textChannels:${currentGuild}`,
    fetchTextChannels,
    { enabled: resource === 'message' && !!currentGuild }
  )

  const fetchCategories = useCallback(
    () => listChannels(currentGuild as string, 'category'),
    [currentGuild]
  )
  const { data: categories, loading: categoriesLoading } = useDiscordData(
    `categories:${currentGuild}`,
    fetchCategories,
    { enabled: needsCategories }
  )

  const fetchRoles = useCallback(() => listRoles(currentGuild as string), [currentGuild])
  const { data: roles, loading: rolesLoading } = useDiscordData(
    `roles:${currentGuild}`,
    fetchRoles,
    { enabled: needsRoles }
  )

  return (
    <WorkflowPanel>
      <Section title="Operation">
        <VarFieldGroup>
          <ConditionalRender when={(d) => d.resource === 'channel'}>
            <FieldRow>
              <OptionsInput name="resource" acceptsVariables={false} variant="outline" />
              <FieldDivider />
              <OptionsInput name="operation" options={OPERATIONS.channel} expand />
            </FieldRow>
          </ConditionalRender>

          <ConditionalRender when={(d) => d.resource === 'message'}>
            <FieldRow>
              <OptionsInput name="resource" acceptsVariables={false} variant="outline" />
              <FieldDivider />
              <OptionsInput name="operation" options={OPERATIONS.message} expand />
            </FieldRow>
          </ConditionalRender>

          <ConditionalRender when={(d) => d.resource === 'member'}>
            <FieldRow>
              <OptionsInput name="resource" acceptsVariables={false} variant="outline" />
              <FieldDivider />
              <OptionsInput name="operation" options={OPERATIONS.member} expand />
            </FieldRow>
          </ConditionalRender>
        </VarFieldGroup>
      </Section>

      <ConditionalRender when={(d) => d.resource === 'channel'}>
        <ChannelPanel
          api={api}
          guilds={guilds}
          guildsLoading={guildsLoading}
          channels={channels}
          channelsLoading={channelsLoading}
          categories={categories}
          categoriesLoading={categoriesLoading}
        />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'message'}>
        <MessagePanel
          api={api}
          guilds={guilds}
          guildsLoading={guildsLoading}
          channels={resource === 'message' ? textChannels : channels}
          channelsLoading={resource === 'message' ? textChannelsLoading : channelsLoading}
        />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'member'}>
        <MemberPanel
          api={api}
          guilds={guilds}
          guildsLoading={guildsLoading}
          roles={roles}
          rolesLoading={rolesLoading}
        />
      </ConditionalRender>
    </WorkflowPanel>
  )
}
