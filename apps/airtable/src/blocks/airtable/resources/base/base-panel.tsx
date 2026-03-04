// src/blocks/airtable/resources/base/base-panel.tsx

/**
 * Base resource panel UI.
 * Renders operation-specific inputs for Get Many and Get Schema.
 */

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { airtableSchema } from '../../airtable-schema'

type SelectOption = { label: string; value: string }

interface BasePanelProps {
  api: UseWorkflowApi<typeof airtableSchema>
  bases: SelectOption[]
  basesLoading: boolean
}

export function BasePanel({ api, bases, basesLoading }: BasePanelProps) {
  const {
    NumberInput,
    BooleanInput,
    OptionsInput,
    VarField,
    VarFieldGroup,
    Section,
    ConditionalRender,
  } = api

  const loadingBases = basesLoading ? [{ label: 'Loading bases...', value: '' }] : bases

  return (
    <>
      {/* Base: Get Many */}
      <ConditionalRender when={(d) => d.operation === 'getMany'}>
        <Section title="Options">
          <VarFieldGroup>
            <VarField>
              <BooleanInput name="getManyReturnAll" />
            </VarField>
            <ConditionalRender when={(d) => !d.getManyReturnAll}>
              <VarField>
                <NumberInput name="getManyLimit" />
              </VarField>
            </ConditionalRender>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Base: Get Schema */}
      <ConditionalRender when={(d) => d.operation === 'getSchema'}>
        <Section title="Base">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="getSchemaBase" options={loadingBases} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
