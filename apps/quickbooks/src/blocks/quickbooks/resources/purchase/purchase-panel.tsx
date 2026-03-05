import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { quickbooksSchema } from '../../quickbooks-schema'

interface PurchasePanelProps {
  api: UseWorkflowApi<typeof quickbooksSchema>
}

export function PurchasePanel({ api }: PurchasePanelProps) {
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
      {/* Purchase: Get */}
      <ConditionalRender when={(d) => d.operation === 'get'}>
        <Section title="Purchase">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'getPurchaseId'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Purchase: Get Many */}
      <ConditionalRender when={(d) => d.operation === 'getMany'}>
        <Section title="Filter">
          <VarFieldGroup>
            <VarField>
              <BooleanInput name={'getManyPurchaseReturnAll'} />
            </VarField>
            <ConditionalRender when={(d) => d.getManyPurchaseReturnAll === false}>
              <VarField>
                <NumberInput name={'getManyPurchaseLimit'} />
              </VarField>
            </ConditionalRender>
            <VarField>
              <StringInput name={'getManyPurchaseQuery'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
