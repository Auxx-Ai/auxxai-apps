// src/blocks/shopify/resources/inventory-level/inventory-level-schema.ts

import { Workflow } from '@auxx/sdk'

export const inventoryLevelInputs = {
  // --- Inventory Level: Get Many ---
  getManyInventoryItemIds: Workflow.string({
    label: 'Inventory Item IDs',
    description: 'Comma-separated inventory item IDs',
    acceptsVariables: true,
  }),
  getManyLocationIds: Workflow.string({
    label: 'Location IDs',
    description: 'Comma-separated location IDs',
    acceptsVariables: true,
  }),
  getManyLimit: Workflow.select({
    label: 'Limit',
    options: [
      { value: '10', label: '10' },
      { value: '25', label: '25' },
      { value: '50', label: '50' },
    ],
    default: '50',
  }),

  // --- Inventory Level: Set ---
  setInventoryItemId: Workflow.string({ label: 'Inventory Item ID', acceptsVariables: true }),
  setLocationId: Workflow.select({
    label: 'Location',
    options: [] as { value: string; label: string }[],
  }),
  setAvailable: Workflow.number({
    label: 'Available Quantity',
    integer: true,
    acceptsVariables: true,
  }),
  setDisconnectIfNecessary: Workflow.boolean({
    label: 'Disconnect if Necessary',
    description: 'Whether to disconnect from other locations if needed',
    default: false,
  }),

  // --- Inventory Level: Adjust ---
  adjustInventoryItemId: Workflow.string({ label: 'Inventory Item ID', acceptsVariables: true }),
  adjustLocationId: Workflow.select({
    label: 'Location',
    options: [] as { value: string; label: string }[],
  }),
  adjustAvailableAdjustment: Workflow.number({
    label: 'Adjustment',
    description: 'Amount to adjust by (positive or negative)',
    integer: true,
    acceptsVariables: true,
  }),

  // --- Inventory Level: Connect ---
  connectInventoryItemId: Workflow.string({ label: 'Inventory Item ID', acceptsVariables: true }),
  connectLocationId: Workflow.select({
    label: 'Location',
    options: [] as { value: string; label: string }[],
  }),

  // --- Inventory Level: Delete ---
  deleteInventoryItemId: Workflow.string({ label: 'Inventory Item ID', acceptsVariables: true }),
  deleteLocationId: Workflow.select({
    label: 'Location',
    options: [] as { value: string; label: string }[],
  }),
}

const inventoryLevelFields = {
  inventoryItemId: Workflow.string(),
  locationId: Workflow.string(),
  available: Workflow.number({ integer: true }),
  updatedAt: Workflow.datetime(),
}

export function inventoryLevelComputeOutputs(operation: string) {
  if (operation === 'set' || operation === 'adjust' || operation === 'connect') {
    return {
      inventoryLevel: Workflow.struct(inventoryLevelFields, { label: 'inventoryLevel' }),
    }
  }
  if (operation === 'delete') {
    return {
      success: Workflow.boolean({ label: 'success' }),
    }
  }
  if (operation === 'getMany') {
    return {
      inventoryLevels: Workflow.array({
        label: 'inventoryLevels',
        items: Workflow.struct(inventoryLevelFields, { label: 'inventoryLevel' }),
      }),
      count: Workflow.number({ label: 'count', integer: true }),
    }
  }
  return {}
}
