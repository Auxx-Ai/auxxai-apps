// src/blocks/quickbooks/resources/payment/payment-panel.tsx

/**
 * Payment resource panel UI.
 * Renders operation-specific inputs for Payment: Create, Delete, Get, Get Many, Send, Update, Void.
 */

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { quickbooksSchema } from '../../quickbooks-schema'

type SelectOption = { label: string; value: string }

interface PaymentPanelProps {
  api: UseWorkflowApi<typeof quickbooksSchema>
  customers: SelectOption[]
  customersLoading: boolean
}

export function PaymentPanel({ api, customers, customersLoading }: PaymentPanelProps) {
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
      {/* Payment: Create */}
      <ConditionalRender when={(d) => d.operation === 'create'}>
        <Section title="New Payment">
          <VarFieldGroup>
            <VarField>
              <OptionsInput
                name={'createPaymentCustomer'}
                options={customers}
                loading={customersLoading}
              />
            </VarField>
            <VarField>
              <NumberInput name={'createPaymentTotalAmt'} />
            </VarField>
            <VarField>
              <StringInput name={'createPaymentTxnDate'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Payment: Delete */}
      <ConditionalRender when={(d) => d.operation === 'delete'}>
        <Section title="Payment">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'deletePaymentId'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Payment: Get */}
      <ConditionalRender when={(d) => d.operation === 'get'}>
        <Section title="Payment">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'getPaymentId'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Payment: Get Many */}
      <ConditionalRender when={(d) => d.operation === 'getMany'}>
        <Section title="Filter">
          <VarFieldGroup>
            <VarField>
              <BooleanInput name={'getManyPaymentReturnAll'} />
            </VarField>
            <ConditionalRender when={(d) => d.getManyPaymentReturnAll === false}>
              <VarField>
                <NumberInput name={'getManyPaymentLimit'} />
              </VarField>
            </ConditionalRender>
            <VarField>
              <StringInput name={'getManyPaymentQuery'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Payment: Send */}
      <ConditionalRender when={(d) => d.operation === 'send'}>
        <Section title="Payment">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'sendPaymentId'} />
            </VarField>
            <VarField>
              <StringInput name={'sendPaymentEmail'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Payment: Update */}
      <ConditionalRender when={(d) => d.operation === 'update'}>
        <Section title="Payment">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'updatePaymentId'} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Update Fields">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'updatePaymentTxnDate'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Payment: Void */}
      <ConditionalRender when={(d) => d.operation === 'void'}>
        <Section title="Payment">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'voidPaymentId'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
