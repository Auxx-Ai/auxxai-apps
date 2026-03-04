// src/blocks/ms-teams/ms-teams-panel.tsx

import { useEffect, useCallback } from 'react'
import { WorkflowPanel, useWorkflow } from '@auxx/sdk/client'
import { msTeamsSchema } from './ms-teams-schema'
import { OPERATIONS } from './resources/constants'
import { ChannelPanel } from './resources/channel/channel-panel'
import { ChannelMessagePanel } from './resources/channel-message/channel-message-panel'
import { ChatMessagePanel } from './resources/chat-message/chat-message-panel'
import { TaskPanel } from './resources/task/task-panel'
import { useMsTeamsData } from './shared/use-ms-teams-data'
import listTeams from './shared/list-teams.server'
import listChannels from './shared/list-channels.server'
import listChats from './shared/list-chats.server'
import listGroups from './shared/list-groups.server'
import listPlans from './shared/list-plans.server'
import listBuckets from './shared/list-buckets.server'
import listMembers from './shared/list-members.server'

export function MsTeamsPanel() {
  const api = useWorkflow<typeof msTeamsSchema>(msTeamsSchema)

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

  const resource = (data?.resource ?? 'channel') as keyof typeof OPERATIONS
  const operation = data?.operation ?? 'create'

  // Determine current team based on resource + operation
  const currentTeam =
    resource === 'channel'
      ? operation === 'create'
        ? data?.channelCreateTeam
        : operation === 'get'
          ? data?.channelGetTeam
          : operation === 'getMany'
            ? data?.channelGetManyTeam
            : operation === 'update'
              ? data?.channelUpdateTeam
              : operation === 'delete'
                ? data?.channelDeleteTeam
                : undefined
      : resource === 'channelMessage'
        ? operation === 'create'
          ? data?.msgCreateTeam
          : operation === 'getMany'
            ? data?.msgGetManyTeam
            : undefined
        : undefined

  // Determine current group for task operations
  const currentGroup =
    resource === 'task'
      ? operation === 'create'
        ? data?.taskCreateGroup
        : operation === 'getMany'
          ? data?.taskGetManyGroup
          : operation === 'update'
            ? data?.taskUpdateGroup
            : undefined
      : undefined

  // Determine current plan for task operations
  const currentPlan =
    resource === 'task'
      ? operation === 'create'
        ? data?.taskCreatePlan
        : operation === 'getMany'
          ? data?.taskGetManyPlan
          : operation === 'update'
            ? data?.taskUpdatePlan
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

  // --- Lazy data loading ---
  const needsTeams = ['channel', 'channelMessage'].includes(resource)
  const needsChannels =
    ['channel', 'channelMessage'].includes(resource) &&
    !!currentTeam &&
    !(resource === 'channel' && operation === 'create')
  const needsChats = resource === 'chatMessage'
  const needsGroups = resource === 'task'
  const needsPlans =
    resource === 'task' && ['create', 'getMany', 'update'].includes(operation) && !!currentGroup
  const needsBuckets =
    resource === 'task' && ['create', 'update'].includes(operation) && !!currentPlan
  const needsMembers =
    resource === 'task' && ['create', 'update'].includes(operation) && !!currentGroup

  const { data: teams, loading: teamsLoading } = useMsTeamsData('teams', listTeams, {
    enabled: needsTeams,
  })

  const fetchChannels = useCallback(() => listChannels(currentTeam as string), [currentTeam])
  const { data: channels, loading: channelsLoading } = useMsTeamsData(
    `channels:${currentTeam}`,
    fetchChannels,
    { enabled: needsChannels }
  )

  const { data: chats, loading: chatsLoading } = useMsTeamsData('chats', listChats, {
    enabled: needsChats,
  })

  const { data: groups, loading: groupsLoading } = useMsTeamsData('groups', listGroups, {
    enabled: needsGroups,
  })

  const fetchPlans = useCallback(() => listPlans(currentGroup as string), [currentGroup])
  const { data: plans, loading: plansLoading } = useMsTeamsData(
    `plans:${currentGroup}`,
    fetchPlans,
    { enabled: needsPlans }
  )

  const fetchBuckets = useCallback(() => listBuckets(currentPlan as string), [currentPlan])
  const { data: buckets, loading: bucketsLoading } = useMsTeamsData(
    `buckets:${currentPlan}`,
    fetchBuckets,
    { enabled: needsBuckets }
  )

  const fetchMembers = useCallback(() => listMembers(currentGroup as string), [currentGroup])
  const { data: members, loading: membersLoading } = useMsTeamsData(
    `members:${currentGroup}`,
    fetchMembers,
    { enabled: needsMembers }
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

          <ConditionalRender when={(d) => d.resource === 'channelMessage'}>
            <FieldRow>
              <OptionsInput name="resource" acceptsVariables={false} variant="outline" />
              <FieldDivider />
              <OptionsInput name="operation" options={OPERATIONS.channelMessage} expand />
            </FieldRow>
          </ConditionalRender>

          <ConditionalRender when={(d) => d.resource === 'chatMessage'}>
            <FieldRow>
              <OptionsInput name="resource" acceptsVariables={false} variant="outline" />
              <FieldDivider />
              <OptionsInput name="operation" options={OPERATIONS.chatMessage} expand />
            </FieldRow>
          </ConditionalRender>

          <ConditionalRender when={(d) => d.resource === 'task'}>
            <FieldRow>
              <OptionsInput name="resource" acceptsVariables={false} variant="outline" />
              <FieldDivider />
              <OptionsInput name="operation" options={OPERATIONS.task} expand />
            </FieldRow>
          </ConditionalRender>
        </VarFieldGroup>
      </Section>

      <ConditionalRender when={(d) => d.resource === 'channel'}>
        <ChannelPanel
          api={api}
          teams={teams}
          teamsLoading={teamsLoading}
          channels={channels}
          channelsLoading={channelsLoading}
        />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'channelMessage'}>
        <ChannelMessagePanel
          api={api}
          teams={teams}
          teamsLoading={teamsLoading}
          channels={channels}
          channelsLoading={channelsLoading}
        />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'chatMessage'}>
        <ChatMessagePanel api={api} chats={chats} chatsLoading={chatsLoading} />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'task'}>
        <TaskPanel
          api={api}
          groups={groups}
          groupsLoading={groupsLoading}
          plans={plans}
          plansLoading={plansLoading}
          buckets={buckets}
          bucketsLoading={bucketsLoading}
          members={members}
          membersLoading={membersLoading}
        />
      </ConditionalRender>
    </WorkflowPanel>
  )
}
