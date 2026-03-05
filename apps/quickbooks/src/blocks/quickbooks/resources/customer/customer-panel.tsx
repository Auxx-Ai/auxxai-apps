// src/blocks/quickbooks/resources/customer/customer-panel.tsx

/**
 * Customer resource panel UI.
 * Renders operation-specific inputs for Customer: Create, Get, Get Many, and Update.
 */

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { quickbooksSchema } from '../../quickbooks-schema'

interface CustomerPanelProps {
  api: UseWorkflowApi<typeof quickbooksSchema>
}

export function CustomerPanel({ api }: CustomerPanelProps) {
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
      {/* Customer: Create */}
      <ConditionalRender when={(d) => d.operation === 'create'}>
        <Section title="New Customer">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'createCustomerDisplayName'} />
            </VarField>
            <VarField>
              <StringInput name={'createCustomerGivenName'} />
            </VarField>
            <VarField>
              <StringInput name={'createCustomerFamilyName'} />
            </VarField>
            <VarField>
              <StringInput name={'createCustomerCompanyName'} />
            </VarField>
            <VarField>
              <StringInput name={'createCustomerEmail'} />
            </VarField>
            <VarField>
              <StringInput name={'createCustomerPhone'} />
            </VarField>
            <VarField>
              <StringInput name={'createCustomerBillAddrLine1'} />
            </VarField>
            <VarField>
              <StringInput name={'createCustomerBillAddrCity'} />
            </VarField>
            <VarField>
              <StringInput name={'createCustomerBillAddrPostalCode'} />
            </VarField>
            <VarField>
              <StringInput name={'createCustomerBillAddrState'} />
            </VarField>
            <VarField>
              <BooleanInput name={'createCustomerTaxable'} />
            </VarField>
            <VarField>
              <OptionsInput name={'createCustomerPreferredDeliveryMethod'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Customer: Get */}
      <ConditionalRender when={(d) => d.operation === 'get'}>
        <Section title="Customer">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'getCustomerId'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Customer: Get Many */}
      <ConditionalRender when={(d) => d.operation === 'getMany'}>
        <Section title="Filter">
          <VarFieldGroup>
            <VarField>
              <BooleanInput name={'getManyCustomerReturnAll'} />
            </VarField>
            <ConditionalRender when={(d) => d.getManyCustomerReturnAll === false}>
              <VarField>
                <NumberInput name={'getManyCustomerLimit'} />
              </VarField>
            </ConditionalRender>
            <VarField>
              <StringInput name={'getManyCustomerQuery'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Customer: Update */}
      <ConditionalRender when={(d) => d.operation === 'update'}>
        <Section title="Customer">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'updateCustomerId'} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Update Fields">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'updateCustomerDisplayName'} />
            </VarField>
            <VarField>
              <StringInput name={'updateCustomerGivenName'} />
            </VarField>
            <VarField>
              <StringInput name={'updateCustomerFamilyName'} />
            </VarField>
            <VarField>
              <StringInput name={'updateCustomerCompanyName'} />
            </VarField>
            <VarField>
              <StringInput name={'updateCustomerEmail'} />
            </VarField>
            <VarField>
              <StringInput name={'updateCustomerPhone'} />
            </VarField>
            <VarField>
              <StringInput name={'updateCustomerBillAddrLine1'} />
            </VarField>
            <VarField>
              <StringInput name={'updateCustomerBillAddrCity'} />
            </VarField>
            <VarField>
              <StringInput name={'updateCustomerBillAddrPostalCode'} />
            </VarField>
            <VarField>
              <StringInput name={'updateCustomerBillAddrState'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
