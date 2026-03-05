// src/blocks/quickbooks/resources/bill/bill-panel.tsx

/**
 * Bill resource panel UI.
 * Renders operation-specific inputs for Bill: Create, Delete, Get, Get Many, and Update.
 */

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { quickbooksSchema } from '../../quickbooks-schema'

type SelectOption = { label: string; value: string }

interface BillPanelProps {
  api: UseWorkflowApi<typeof quickbooksSchema>
  vendors: SelectOption[]
  vendorsLoading: boolean
  items: SelectOption[]
  itemsLoading: boolean
  accounts: SelectOption[]
  accountsLoading: boolean
}

export function BillPanel({
  api,
  vendors,
  vendorsLoading,
  items,
  itemsLoading,
  accounts,
  accountsLoading,
}: BillPanelProps) {
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
      {/* Bill: Create */}
      <ConditionalRender when={(d) => d.operation === 'create'}>
        <Section title="Vendor">
          <VarFieldGroup>
            <VarField>
              <OptionsInput
                name={'createBillVendor'}
                options={vendors}
                placeholder={vendorsLoading ? 'Loading vendors...' : 'Select a vendor'}
              />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Line Item">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'createBillDetailType'} />
            </VarField>
            <ConditionalRender
              when={(d) => d.createBillDetailType === 'AccountBasedExpenseLineDetail'}
            >
              <VarField>
                <OptionsInput
                  name={'createBillAccountId'}
                  options={accounts}
                  placeholder={accountsLoading ? 'Loading accounts...' : 'Select an account'}
                />
              </VarField>
            </ConditionalRender>
            <ConditionalRender
              when={(d) => d.createBillDetailType === 'ItemBasedExpenseLineDetail'}
            >
              <VarField>
                <OptionsInput
                  name={'createBillItemId'}
                  options={items}
                  placeholder={itemsLoading ? 'Loading items...' : 'Select an item'}
                />
              </VarField>
            </ConditionalRender>
            <VarField>
              <NumberInput name={'createBillAmount'} />
            </VarField>
            <VarField>
              <StringInput name={'createBillDescription'} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Bill Details">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'createBillDueDate'} />
            </VarField>
            <VarField>
              <StringInput name={'createBillTxnDate'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Bill: Delete */}
      <ConditionalRender when={(d) => d.operation === 'delete'}>
        <Section title="Bill">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'deleteBillId'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Bill: Get */}
      <ConditionalRender when={(d) => d.operation === 'get'}>
        <Section title="Bill">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'getBillId'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Bill: Get Many */}
      <ConditionalRender when={(d) => d.operation === 'getMany'}>
        <Section title="Filter">
          <VarFieldGroup>
            <VarField>
              <BooleanInput name={'getManyBillReturnAll'} />
            </VarField>
            <ConditionalRender when={(d) => d.getManyBillReturnAll === false}>
              <VarField>
                <NumberInput name={'getManyBillLimit'} />
              </VarField>
            </ConditionalRender>
            <VarField>
              <StringInput name={'getManyBillQuery'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Bill: Update */}
      <ConditionalRender when={(d) => d.operation === 'update'}>
        <Section title="Bill">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'updateBillId'} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Vendor">
          <VarFieldGroup>
            <VarField>
              <OptionsInput
                name={'updateBillVendor'}
                options={vendors}
                placeholder={vendorsLoading ? 'Loading vendors...' : 'Select a vendor'}
              />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Line Item">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'updateBillDetailType'} />
            </VarField>
            <ConditionalRender
              when={(d) => d.updateBillDetailType === 'AccountBasedExpenseLineDetail'}
            >
              <VarField>
                <OptionsInput
                  name={'updateBillAccountId'}
                  options={accounts}
                  placeholder={accountsLoading ? 'Loading accounts...' : 'Select an account'}
                />
              </VarField>
            </ConditionalRender>
            <ConditionalRender
              when={(d) => d.updateBillDetailType === 'ItemBasedExpenseLineDetail'}
            >
              <VarField>
                <OptionsInput
                  name={'updateBillItemId'}
                  options={items}
                  placeholder={itemsLoading ? 'Loading items...' : 'Select an item'}
                />
              </VarField>
            </ConditionalRender>
            <VarField>
              <NumberInput name={'updateBillAmount'} />
            </VarField>
            <VarField>
              <StringInput name={'updateBillDescription'} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Update Fields">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'updateBillDueDate'} />
            </VarField>
            <VarField>
              <StringInput name={'updateBillTxnDate'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
