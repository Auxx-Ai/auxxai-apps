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
  setAvailable: Workflow.string({ label: 'Available Quantity', acceptsVariables: true }),
  setDisconnectIfNecessary: Workflow.select({
    label: 'Disconnect if Necessary',
    description: 'Whether to disconnect from other locations if needed',
    options: [
      { value: 'false', label: 'No' },
      { value: 'true', label: 'Yes' },
    ],
    default: 'false',
  }),

  // --- Inventory Level: Adjust ---
  adjustInventoryItemId: Workflow.string({ label: 'Inventory Item ID', acceptsVariables: true }),
  adjustLocationId: Workflow.select({
    label: 'Location',
    options: [] as { value: string; label: string }[],
  }),
  adjustAvailableAdjustment: Workflow.string({
    label: 'Adjustment',
    description: 'Amount to adjust by (positive or negative)',
    placeholder: '-5',
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

export function inventoryLevelComputeOutputs(operation: string) {
  if (operation === 'set' || operation === 'adjust' || operation === 'connect') {
    return {
      inventoryItemId: Workflow.string({ label: 'Inventory Item ID' }),
      locationId: Workflow.string({ label: 'Location ID' }),
      available: Workflow.string({ label: 'Available' }),
      updatedAt: Workflow.string({ label: 'Updated At' }),
    }
  }
  if (operation === 'delete') {
    return {
      success: Workflow.string({ label: 'Success' }),
    }
  }
  if (operation === 'getMany') {
    return {
      inventoryLevels: Workflow.string({ label: 'Inventory Levels (JSON)' }),
      count: Workflow.string({ label: 'Count' }),
    }
  }
  return {}
}
