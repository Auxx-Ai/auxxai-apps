// src/blocks/quickbooks/resources/estimate/estimate-panel.tsx

/**
 * Estimate resource panel UI.
 * Renders operation-specific inputs for Estimate: Create, Delete, Get, Get Many, Send, and Update.
 */

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { quickbooksSchema } from '../../quickbooks-schema'

type SelectOption = { label: string; value: string }

interface EstimatePanelProps {
  api: UseWorkflowApi<typeof quickbooksSchema>
  customers: SelectOption[]
  customersLoading: boolean
  items: SelectOption[]
  itemsLoading: boolean
}

export function EstimatePanel({
  api,
  customers,
  customersLoading,
  items,
  itemsLoading,
}: EstimatePanelProps) {
  const {
    StringInput,
    OptionsInput,
    NumberInput,
    BooleanInput,
    VarField,
    VarFieldGroup,
    Section,
    ConditionalRender,
  } = api

  return (
    <>
      {/* Estimate: Create */}
      <ConditionalRender when={(d) => d.operation === 'create'}>
        <Section title="New Estimate">
          <VarFieldGroup>
            <VarField>
              <OptionsInput
                name={'createEstimateCustomer'}
                options={customers}
                loading={customersLoading}
              />
            </VarField>
            <VarField>
              <OptionsInput
                name={'createEstimateItemId'}
                options={items}
                loading={itemsLoading}
              />
            </VarField>
            <VarField>
              <NumberInput name={'createEstimateAmount'} />
            </VarField>
            <VarField>
              <StringInput name={'createEstimateDescription'} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Optional Fields">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'createEstimateDocNumber'} />
            </VarField>
            <VarField>
              <StringInput name={'createEstimateTxnDate'} />
            </VarField>
            <VarField>
              <StringInput name={'createEstimateBillEmail'} />
            </VarField>
            <VarField>
              <StringInput name={'createEstimateCustomerMemo'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Estimate: Delete */}
      <ConditionalRender when={(d) => d.operation === 'delete'}>
        <Section title="Estimate">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'deleteEstimateId'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Estimate: Get */}
      <ConditionalRender when={(d) => d.operation === 'get'}>
        <Section title="Estimate">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'getEstimateId'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Estimate: Get Many */}
      <ConditionalRender when={(d) => d.operation === 'getMany'}>
        <Section title="Filter">
          <VarFieldGroup>
            <VarField>
              <BooleanInput name={'getManyEstimateReturnAll'} />
            </VarField>
            <ConditionalRender when={(d) => d.getManyEstimateReturnAll === false}>
              <VarField>
                <NumberInput name={'getManyEstimateLimit'} />
              </VarField>
            </ConditionalRender>
            <VarField>
              <StringInput name={'getManyEstimateQuery'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Estimate: Send */}
      <ConditionalRender when={(d) => d.operation === 'send'}>
        <Section title="Send Estimate">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'sendEstimateId'} />
            </VarField>
            <VarField>
              <StringInput name={'sendEstimateEmail'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Estimate: Update */}
      <ConditionalRender when={(d) => d.operation === 'update'}>
        <Section title="Estimate">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'updateEstimateId'} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Update Fields">
          <VarFieldGroup>
            <VarField>
              <OptionsInput
                name={'updateEstimateCustomer'}
                options={customers}
                loading={customersLoading}
              />
            </VarField>
            <VarField>
              <OptionsInput
                name={'updateEstimateItemId'}
                options={items}
                loading={itemsLoading}
              />
            </VarField>
            <VarField>
              <NumberInput name={'updateEstimateAmount'} />
            </VarField>
            <VarField>
              <StringInput name={'updateEstimateDescription'} />
            </VarField>
            <VarField>
              <StringInput name={'updateEstimateDocNumber'} />
            </VarField>
            <VarField>
              <StringInput name={'updateEstimateTxnDate'} />
            </VarField>
            <VarField>
              <StringInput name={'updateEstimateBillEmail'} />
            </VarField>
            <VarField>
              <StringInput name={'updateEstimateCustomerMemo'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
