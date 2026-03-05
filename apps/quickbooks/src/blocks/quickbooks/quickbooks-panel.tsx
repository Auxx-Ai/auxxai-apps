import { useEffect } from 'react'
import { WorkflowPanel, useWorkflow } from '@auxx/sdk/client'
import { quickbooksSchema } from './quickbooks-schema'
import { OPERATIONS } from './resources/constants'
import { CustomerPanel } from './resources/customer/customer-panel'
import { InvoicePanel } from './resources/invoice/invoice-panel'
import { PaymentPanel } from './resources/payment/payment-panel'
import { EstimatePanel } from './resources/estimate/estimate-panel'
import { BillPanel } from './resources/bill/bill-panel'
import { EmployeePanel } from './resources/employee/employee-panel'
import { ItemPanel } from './resources/item/item-panel'
import { VendorPanel } from './resources/vendor/vendor-panel'
import { PurchasePanel } from './resources/purchase/purchase-panel'
import { TransactionPanel } from './resources/transaction/transaction-panel'
import { useQuickBooksData } from './shared/use-quickbooks-data'
import listCustomers from './shared/list-customers.server'
import listVendors from './shared/list-vendors.server'
import listItems from './shared/list-items.server'
import listAccounts from './shared/list-accounts.server'

export function QuickBooksPanel() {
  const api = useWorkflow<typeof quickbooksSchema>(quickbooksSchema)

  const {
    data,
    updateData,
    OptionsInput,
    VarFieldGroup,
    FieldRow,
    FieldDivider,
    Section,
    ConditionalRender,
  } = api

  const resource = (data?.resource ?? 'customer') as keyof typeof OPERATIONS
  const operation = data?.operation ?? 'get'

  // Auto-reset operation when resource changes
  useEffect(() => {
    if (!data) return
    const validOps = OPERATIONS[resource]
    if (validOps && !validOps.some((op) => op.value === operation)) {
      updateData({ operation: validOps[0].value })
    }
  }, [resource])

  // Lazy data loading
  const needsCustomers =
    (resource === 'invoice' && ['create', 'update'].includes(operation)) ||
    (resource === 'estimate' && ['create', 'update'].includes(operation)) ||
    (resource === 'payment' && ['create', 'update'].includes(operation))

  const needsVendors = resource === 'bill' && ['create', 'update'].includes(operation)

  const needsItems =
    (resource === 'invoice' && operation === 'create') ||
    (resource === 'estimate' && operation === 'create') ||
    (resource === 'bill' && operation === 'create')

  const needsAccounts = resource === 'bill' && operation === 'create'

  const { data: customers, loading: customersLoading } = useQuickBooksData(
    'customers',
    listCustomers,
    { enabled: needsCustomers },
  )

  const { data: vendors, loading: vendorsLoading } = useQuickBooksData(
    'vendors',
    listVendors,
    { enabled: needsVendors },
  )

  const { data: items, loading: itemsLoading } = useQuickBooksData('items', listItems, {
    enabled: needsItems,
  })

  const { data: accounts, loading: accountsLoading } = useQuickBooksData(
    'accounts',
    listAccounts,
    { enabled: needsAccounts },
  )

  return (
    <WorkflowPanel>
      {/* Resource/Operation selector */}
      <Section title="Operation">
        <VarFieldGroup>
          {Object.keys(OPERATIONS).map((res) => (
            <ConditionalRender key={res} when={(d) => d.resource === res}>
              <FieldRow>
                <OptionsInput name="resource" acceptsVariables={false} variant="outline" />
                <FieldDivider />
                <OptionsInput
                  name="operation"
                  options={OPERATIONS[res as keyof typeof OPERATIONS]}
                  expand
                />
              </FieldRow>
            </ConditionalRender>
          ))}
        </VarFieldGroup>
      </Section>

      {/* Resource-specific panels */}
      <ConditionalRender when={(d) => d.resource === 'bill'}>
        <BillPanel
          api={api}
          vendors={vendors}
          vendorsLoading={vendorsLoading}
          items={items}
          itemsLoading={itemsLoading}
          accounts={accounts}
          accountsLoading={accountsLoading}
        />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'customer'}>
        <CustomerPanel api={api} />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'employee'}>
        <EmployeePanel api={api} />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'estimate'}>
        <EstimatePanel
          api={api}
          customers={customers}
          customersLoading={customersLoading}
          items={items}
          itemsLoading={itemsLoading}
        />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'invoice'}>
        <InvoicePanel
          api={api}
          customers={customers}
          customersLoading={customersLoading}
          items={items}
          itemsLoading={itemsLoading}
        />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'item'}>
        <ItemPanel api={api} />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'payment'}>
        <PaymentPanel api={api} customers={customers} customersLoading={customersLoading} />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'purchase'}>
        <PurchasePanel api={api} />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'transaction'}>
        <TransactionPanel api={api} />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'vendor'}>
        <VendorPanel api={api} />
      </ConditionalRender>
    </WorkflowPanel>
  )
}
