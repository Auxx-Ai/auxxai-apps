// src/blocks/shopify/shopify-panel.tsx

import { useEffect } from 'react'
import { WorkflowPanel, useWorkflow } from '@auxx/sdk/client'
import { shopifySchema } from './shopify-schema'
import { OPERATIONS, RESOURCES } from './resources/constants'
import { OrderPanel } from './resources/order/order-panel'
import { ProductPanel } from './resources/product/product-panel'
import { CustomerPanel } from './resources/customer/customer-panel'
import { CustomerAddressPanel } from './resources/customer-address/customer-address-panel'
import { VariantPanel } from './resources/variant/variant-panel'
import { InventoryItemPanel } from './resources/inventory-item/inventory-item-panel'
import { InventoryLevelPanel } from './resources/inventory-level/inventory-level-panel'
import { MetafieldPanel } from './resources/metafield/metafield-panel'
import { FulfillmentPanel } from './resources/fulfillment/fulfillment-panel'
import { DraftOrderPanel } from './resources/draft-order/draft-order-panel'
import { CollectionPanel } from './resources/collection/collection-panel'
import { DiscountPanel } from './resources/discount/discount-panel'
import { useCapabilities } from './shared/use-capabilities'
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

  // What this connection's token was actually granted. Narrows the pickers to operations
  // the merchant can perform, instead of a build-time list identical for every org.
  // See auxxai repo: plans/connections/scope-derived-capabilities.md
  const { capabilities } = useCapabilities()

  /** Operation options for a resource, minus anything the granted scopes cannot perform. */
  const allowedOperations = (res: string) => {
    const allowed = capabilities.operations[res]
    const all = OPERATIONS[res] ?? []
    return allowed ? all.filter((op) => allowed.includes(op.value)) : all
  }

  const resourceOptions = RESOURCES.filter((r) => capabilities.resources.includes(r.value))

  // Auto-reset operation when the resource changes, or when narrowing capabilities makes the
  // current selection unavailable (e.g. a workflow built before a scope was revoked).
  useEffect(() => {
    if (!data) return
    const validOps = allowedOperations(resource as string)
    if (validOps.length > 0 && !validOps.some((op) => op.value === operation)) {
      updateData({ operation: validOps[0].value })
    }
  }, [resource, capabilities])

  // Lazy data loading — locations needed for order, fulfillment, inventory level
  const needsLocations =
    (resource === 'order' && (operation === 'create' || operation === 'update')) ||
    (resource === 'fulfillment' && operation === 'create') ||
    (resource === 'inventoryLevel' &&
      (operation === 'set' ||
        operation === 'adjust' ||
        operation === 'connect' ||
        operation === 'delete'))

  const { data: locations, loading: locationsLoading } = useShopifyData(
    'locations',
    listLocations,
    { enabled: needsLocations }
  )

  return (
    <WorkflowPanel>
      <Section title="Operation">
        <VarFieldGroup>
          {Object.keys(OPERATIONS).map((res) => (
            <ConditionalRender key={res} when={(d) => d.resource === res}>
              <FieldRow>
                <OptionsInput
                  name="resource"
                  options={resourceOptions}
                  acceptsVariables={false}
                  variant="outline"
                />
                <FieldDivider />
                <OptionsInput name="operation" options={allowedOperations(res)} expand />
              </FieldRow>
            </ConditionalRender>
          ))}
        </VarFieldGroup>
      </Section>

      <ConditionalRender when={(d) => d.resource === 'order'}>
        <OrderPanel api={api} locations={locations} locationsLoading={locationsLoading} />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'product'}>
        <ProductPanel api={api} />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'customer'}>
        <CustomerPanel api={api} />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'customerAddress'}>
        <CustomerAddressPanel api={api} />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'variant'}>
        <VariantPanel api={api} />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'inventoryItem'}>
        <InventoryItemPanel api={api} />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'inventoryLevel'}>
        <InventoryLevelPanel api={api} locations={locations} locationsLoading={locationsLoading} />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'metafield'}>
        <MetafieldPanel api={api} />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'fulfillment'}>
        <FulfillmentPanel api={api} locations={locations} locationsLoading={locationsLoading} />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'draftOrder'}>
        <DraftOrderPanel api={api} />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'collection'}>
        <CollectionPanel api={api} />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'discount'}>
        <DiscountPanel api={api} />
      </ConditionalRender>
    </WorkflowPanel>
  )
}
