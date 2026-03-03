// src/blocks/notion/resources/user/user-panel.tsx

/**
 * User resource panel UI.
 * Renders operation-specific inputs for Get and Get Many.
 */

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { notionSchema } from '../../notion-schema'

interface UserPanelProps {
  api: UseWorkflowApi<typeof notionSchema>
}

export function UserPanel({ api }: UserPanelProps) {
  const { StringInput, NumberInput, BooleanInput, VarField, VarFieldGroup, Section, ConditionalRender } = api

  return (
    <>
      {/* User: Get */}
      <ConditionalRender when={(d) => d.operation === 'get'}>
        <Section title="User">
          <VarFieldGroup>
            <VarField>
              <StringInput name="getUserId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* User: Get Many */}
      <ConditionalRender when={(d) => d.operation === 'getMany'}>
        <Section title="Options">
          <VarFieldGroup>
            <VarField>
              <BooleanInput name="getManyUserReturnAll" />
            </VarField>
            <ConditionalRender when={(d) => !d.getManyUserReturnAll}>
              <VarField>
                <NumberInput name="getManyUserLimit" />
              </VarField>
            </ConditionalRender>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
