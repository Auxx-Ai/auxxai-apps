// src/blocks/shopify/shopify-panel.tsx

import { useEffect } from 'react'
import { WorkflowPanel, useWorkflow } from '@auxx/sdk/client'
import { shopifySchema } from './shopify-schema'
import { OPERATIONS } from './resources/constants'
import { OrderPanel } from './resources/order/order-panel'
import { ProductPanel } from './resources/product/product-panel'
import { useShopifyData } from './shared/use-shopify-data'
import listLocations from './shared/list-locations.server'

export function ShopifyPanel() {
  const api = useWorkflow<typeof shopifySchema>(shopifySchema)

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

  const resource = (data?.resource ?? 'order') as keyof typeof OPERATIONS
  const operation = data?.operation ?? 'getMany'

  // Auto-reset operation when resource changes
  useEffect(() => {
    if (!data) return
    const validOps = OPERATIONS[resource]
    if (validOps && !validOps.some((op) => op.value === operation)) {
      updateData({ operation: validOps[0].value })
    }
  }, [resource])

  // Lazy data loading — locations needed for order create/update
  const needsLocations = resource === 'order' && (operation === 'create' || operation === 'update')

  const { data: locations, loading: locationsLoading } = useShopifyData(
    'locations',
    listLocations,
    { enabled: needsLocations }
  )

  return (
    <WorkflowPanel>
      <Section title="Operation">
        <VarFieldGroup>
          <ConditionalRender when={(d) => d.resource === 'order'}>
            <FieldRow>
              <OptionsInput name="resource" acceptsVariables={false} variant="outline" />
              <FieldDivider />
              <OptionsInput name="operation" options={OPERATIONS.order} expand />
            </FieldRow>
          </ConditionalRender>

          <ConditionalRender when={(d) => d.resource === 'product'}>
            <FieldRow>
              <OptionsInput name="resource" acceptsVariables={false} variant="outline" />
              <FieldDivider />
              <OptionsInput name="operation" options={OPERATIONS.product} expand />
            </FieldRow>
          </ConditionalRender>
        </VarFieldGroup>
      </Section>

      <ConditionalRender when={(d) => d.resource === 'order'}>
        <OrderPanel api={api} locations={locations} locationsLoading={locationsLoading} />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'product'}>
        <ProductPanel api={api} />
      </ConditionalRender>
    </WorkflowPanel>
  )
}
