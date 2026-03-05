// src/blocks/quickbooks/resources/invoice/invoice-panel.tsx

/**
 * Invoice resource panel UI.
 * Renders operation-specific inputs for Invoice: Create, Delete, Get, Get Many, Send, Update, and Void.
 */

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { quickbooksSchema } from '../../quickbooks-schema'

type SelectOption = { label: string; value: string }

interface InvoicePanelProps {
  api: UseWorkflowApi<typeof quickbooksSchema>
  customers: SelectOption[]
  customersLoading: boolean
  items: SelectOption[]
  itemsLoading: boolean
}

export function InvoicePanel({
  api,
  customers,
  customersLoading,
  items,
  itemsLoading,
}: InvoicePanelProps) {
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
      {/* Invoice: Create */}
      <ConditionalRender when={(d) => d.operation === 'create'}>
        <Section title="Customer">
          <VarFieldGroup>
            <VarField>
              <OptionsInput
                name={'createInvoiceCustomer'}
                options={customers}
                placeholder={customersLoading ? 'Loading customers...' : 'Select a customer'}
              />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Line Item">
          <VarFieldGroup>
            <VarField>
              <OptionsInput
                name={'createInvoiceItemId'}
                options={items}
                placeholder={itemsLoading ? 'Loading items...' : 'Select an item'}
              />
            </VarField>
            <VarField>
              <StringInput name={'createInvoiceAmount'} />
            </VarField>
            <VarField>
              <StringInput name={'createInvoiceDescription'} />
            </VarField>
            <VarField>
              <StringInput name={'createInvoiceQuantity'} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Invoice Details">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'createInvoiceDocNumber'} />
            </VarField>
            <VarField>
              <StringInput name={'createInvoiceDueDate'} />
            </VarField>
            <VarField>
              <StringInput name={'createInvoiceTxnDate'} />
            </VarField>
            <VarField>
              <StringInput name={'createInvoiceBillEmail'} />
            </VarField>
            <VarField>
              <StringInput name={'createInvoiceCustomerMemo'} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Billing Address">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'createInvoiceBillAddrLine1'} />
            </VarField>
            <VarField>
              <StringInput name={'createInvoiceBillAddrCity'} />
            </VarField>
            <VarField>
              <StringInput name={'createInvoiceBillAddrPostalCode'} />
            </VarField>
            <VarField>
              <StringInput name={'createInvoiceBillAddrState'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Invoice: Delete */}
      <ConditionalRender when={(d) => d.operation === 'delete'}>
        <Section title="Invoice">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'deleteInvoiceId'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Invoice: Get */}
      <ConditionalRender when={(d) => d.operation === 'get'}>
        <Section title="Invoice">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'getInvoiceId'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Invoice: Get Many */}
      <ConditionalRender when={(d) => d.operation === 'getMany'}>
        <Section title="Filter">
          <VarFieldGroup>
            <VarField>
              <BooleanInput name={'getManyInvoiceReturnAll'} />
            </VarField>
            <ConditionalRender when={(d) => d.getManyInvoiceReturnAll === false}>
              <VarField>
                <NumberInput name={'getManyInvoiceLimit'} />
              </VarField>
            </ConditionalRender>
            <VarField>
              <StringInput name={'getManyInvoiceQuery'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Invoice: Send */}
      <ConditionalRender when={(d) => d.operation === 'send'}>
        <Section title="Invoice">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'sendInvoiceId'} />
            </VarField>
            <VarField>
              <StringInput name={'sendInvoiceEmail'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Invoice: Update */}
      <ConditionalRender when={(d) => d.operation === 'update'}>
        <Section title="Invoice">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'updateInvoiceId'} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Customer">
          <VarFieldGroup>
            <VarField>
              <OptionsInput
                name={'updateInvoiceCustomer'}
                options={customers}
                placeholder={customersLoading ? 'Loading customers...' : 'Select a customer'}
              />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Line Item">
          <VarFieldGroup>
            <VarField>
              <OptionsInput
                name={'updateInvoiceItemId'}
                options={items}
                placeholder={itemsLoading ? 'Loading items...' : 'Select an item'}
              />
            </VarField>
            <VarField>
              <StringInput name={'updateInvoiceAmount'} />
            </VarField>
            <VarField>
              <StringInput name={'updateInvoiceDescription'} />
            </VarField>
            <VarField>
              <StringInput name={'updateInvoiceQuantity'} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Update Fields">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'updateInvoiceDocNumber'} />
            </VarField>
            <VarField>
              <StringInput name={'updateInvoiceDueDate'} />
            </VarField>
            <VarField>
              <StringInput name={'updateInvoiceTxnDate'} />
            </VarField>
            <VarField>
              <StringInput name={'updateInvoiceBillEmail'} />
            </VarField>
            <VarField>
              <StringInput name={'updateInvoiceCustomerMemo'} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Billing Address">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'updateInvoiceBillAddrLine1'} />
            </VarField>
            <VarField>
              <StringInput name={'updateInvoiceBillAddrCity'} />
            </VarField>
            <VarField>
              <StringInput name={'updateInvoiceBillAddrPostalCode'} />
            </VarField>
            <VarField>
              <StringInput name={'updateInvoiceBillAddrState'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Invoice: Void */}
      <ConditionalRender when={(d) => d.operation === 'void'}>
        <Section title="Invoice">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'voidInvoiceId'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
