// src/blocks/ms-teams/resources/task/task-panel.tsx

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { msTeamsSchema } from '../../ms-teams-schema'

type SelectOption = { label: string; value: string }

interface TaskPanelProps {
  api: UseWorkflowApi<typeof msTeamsSchema>
  groups: SelectOption[]
  groupsLoading: boolean
  plans: SelectOption[]
  plansLoading: boolean
  buckets: SelectOption[]
  bucketsLoading: boolean
  members: SelectOption[]
  membersLoading: boolean
}

export function TaskPanel({
  api,
  groups,
  groupsLoading,
  plans,
  plansLoading,
  buckets,
  bucketsLoading,
  members,
  membersLoading,
}: TaskPanelProps) {
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

  const groupOptions = groupsLoading ? [{ label: 'Loading groups...', value: '' }] : groups
  const planOptions = plansLoading ? [{ label: 'Loading plans...', value: '' }] : plans
  const bucketOptions = bucketsLoading ? [{ label: 'Loading buckets...', value: '' }] : buckets
  const memberOptions = membersLoading
    ? [{ label: 'Loading members...', value: '' }]
    : [{ label: 'Unassigned', value: '' }, ...members]

  return (
    <>
      {/* Task: Create */}
      <ConditionalRender when={(d) => d.operation === 'create'}>
        <Section title="Location">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'taskCreateGroup'} options={groupOptions} />
            </VarField>
            <VarField>
              <OptionsInput name={'taskCreatePlan'} options={planOptions} />
            </VarField>
            <VarField>
              <OptionsInput name={'taskCreateBucket'} options={bucketOptions} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Task">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'taskCreateTitle'} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'taskCreateAssignedTo'} options={memberOptions} />
            </VarField>
            <VarField>
              <StringInput name={'taskCreateDueDateTime'} />
            </VarField>
            <VarField>
              <NumberInput name={'taskCreatePercentComplete'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Task: Get */}
      <ConditionalRender when={(d) => d.operation === 'get'}>
        <Section title="Task">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'taskGetTaskId'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Task: Get Many */}
      <ConditionalRender when={(d) => d.operation === 'getMany'}>
        <Section title="Source">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'taskGetManyTasksFor'} />
            </VarField>
            <ConditionalRender when={(d) => d.taskGetManyTasksFor === 'plan'}>
              <VarField>
                <OptionsInput name={'taskGetManyGroup'} options={groupOptions} />
              </VarField>
              <VarField>
                <OptionsInput name={'taskGetManyPlan'} options={planOptions} />
              </VarField>
            </ConditionalRender>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <BooleanInput name={'taskGetManyReturnAll'} />
            </VarField>
            <ConditionalRender when={(d) => !d.taskGetManyReturnAll}>
              <VarField>
                <NumberInput name={'taskGetManyLimit'} />
              </VarField>
            </ConditionalRender>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Task: Update */}
      <ConditionalRender when={(d) => d.operation === 'update'}>
        <Section title="Task">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'taskUpdateTaskId'} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Update Fields">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'taskUpdateTitle'} />
            </VarField>
            <VarField>
              <NumberInput name={'taskUpdatePercentComplete'} />
            </VarField>
            <VarField>
              <StringInput name={'taskUpdateDueDateTime'} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Reassign" collapsible>
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'taskUpdateGroup'} options={groupOptions} />
            </VarField>
            <VarField>
              <OptionsInput name={'taskUpdateAssignedTo'} options={memberOptions} />
            </VarField>
            <VarField>
              <OptionsInput name={'taskUpdatePlan'} options={planOptions} />
            </VarField>
            <VarField>
              <OptionsInput name={'taskUpdateBucket'} options={bucketOptions} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Task: Delete */}
      <ConditionalRender when={(d) => d.operation === 'delete'}>
        <Section title="Task">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'taskDeleteTaskId'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
