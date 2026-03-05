// src/blocks/discord/resources/member/member-panel.tsx

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { discordSchema } from '../../discord-schema'

type SelectOption = { label: string; value: string }

interface MemberPanelProps {
  api: UseWorkflowApi<typeof discordSchema>
  guilds: SelectOption[]
  guildsLoading: boolean
  guildsError: string | null
  roles: SelectOption[]
  rolesLoading: boolean
  rolesError: string | null
}

export function MemberPanel({
  api,
  guilds,
  guildsLoading,
  guildsError,
  roles,
  rolesLoading,
  rolesError,
}: MemberPanelProps) {
  const {
    StringInput,
    NumberInput,
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
  const roleOptions = rolesLoading
    ? [{ label: 'Loading roles...', value: '' }]
    : rolesError
      ? [{ label: `Error: ${rolesError}`, value: '' }]
      : roles

  return (
    <>
      {/* Member: Get Many */}
      <ConditionalRender when={(d) => d.operation === 'getMany'}>
        <Section title="Server">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'getManyMemberGuild'} options={guildOptions} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options">
          <VarFieldGroup>
            <VarField>
              <BooleanInput name={'getManyMemberReturnAll'} />
            </VarField>
            <ConditionalRender when={(d) => !d.getManyMemberReturnAll}>
              <VarField>
                <NumberInput name={'getManyMemberLimit'} />
              </VarField>
            </ConditionalRender>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Member: Add Role */}
      <ConditionalRender when={(d) => d.operation === 'roleAdd'}>
        <Section title="Server">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'roleAddGuild'} options={guildOptions} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Member & Roles">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'roleAddUserId'} />
            </VarField>
            <VarField>
              <OptionsInput name={'roleAddRoles'} options={roleOptions} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Member: Remove Role */}
      <ConditionalRender when={(d) => d.operation === 'roleRemove'}>
        <Section title="Server">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'roleRemoveGuild'} options={guildOptions} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Member & Roles">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'roleRemoveUserId'} />
            </VarField>
            <VarField>
              <OptionsInput name={'roleRemoveRoles'} options={roleOptions} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
