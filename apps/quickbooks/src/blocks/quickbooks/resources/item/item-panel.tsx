// src/blocks/quickbooks/resources/item/item-panel.tsx

/**
 * Item resource panel UI.
 * Renders operation-specific inputs for Item: Get and Get Many.
 */

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { quickbooksSchema } from '../../quickbooks-schema'

interface ItemPanelProps {
  api: UseWorkflowApi<typeof quickbooksSchema>
}

export function ItemPanel({ api }: ItemPanelProps) {
  const {
    StringInput,
    NumberInput,
    BooleanInput,
    VarField,
    VarFieldGroup,
    Section,
    ConditionalRender,
  } = api

  return (
    <>
      {/* Item: Get */}
      <ConditionalRender when={(d) => d.operation === 'get'}>
        <Section title="Item">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'getItemId'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Item: Get Many */}
      <ConditionalRender when={(d) => d.operation === 'getMany'}>
        <Section title="Filter">
          <VarFieldGroup>
            <VarField>
              <BooleanInput name={'getManyItemReturnAll'} />
            </VarField>
            <ConditionalRender when={(d) => d.getManyItemReturnAll === false}>
              <VarField>
                <NumberInput name={'getManyItemLimit'} />
              </VarField>
            </ConditionalRender>
            <VarField>
              <StringInput name={'getManyItemQuery'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
