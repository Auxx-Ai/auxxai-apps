// src/blocks/shopify/resources/inventory-item/inventory-item-schema.ts

import { Workflow } from '@auxx/sdk'

export const inventoryItemInputs = {
  // --- Inventory Item: Get ---
  getInventoryItemId: Workflow.string({ label: 'Inventory Item ID', acceptsVariables: true }),

  // --- Inventory Item: Get Many ---
  getManyIds: Workflow.string({
    label: 'Inventory Item IDs',
    description: 'Comma-separated inventory item IDs (max 100)',
    acceptsVariables: true,
  }),
  getManyLimit: Workflow.select({
    label: 'Limit',
    options: [
      { value: '10', label: '10' },
      { value: '25', label: '25' },
      { value: '50', label: '50' },
      { value: '100', label: '100' },
    ],
    default: '50',
  }),

  // --- Inventory Item: Update ---
  updateInventoryItemId: Workflow.string({ label: 'Inventory Item ID', acceptsVariables: true }),
  updateCost: Workflow.string({
    label: 'Cost',
    description: 'Unit cost of the item',
    acceptsVariables: true,
  }),
  updateTracked: Workflow.select({
    label: 'Tracked',
    description: 'Whether inventory is tracked',
    options: [
      { value: '', label: 'No change' },
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' },
    ],
    default: '',
  }),
  updateCountryCodeOfOrigin: Workflow.string({
    label: 'Country Code of Origin',
    description: 'ISO 3166-1 alpha-2',
    acceptsVariables: true,
  }),
  updateHarmonizedSystemCode: Workflow.string({
    label: 'HS Code',
    description: 'Harmonized System code for customs',
    acceptsVariables: true,
  }),
}

export function inventoryItemComputeOutputs(operation: string) {
  if (operation === 'get' || operation === 'update') {
    return {
      inventoryItemId: Workflow.string({ label: 'Inventory Item ID' }),
      sku: Workflow.string({ label: 'SKU' }),
      cost: Workflow.string({ label: 'Cost' }),
      tracked: Workflow.string({ label: 'Tracked' }),
      countryCodeOfOrigin: Workflow.string({ label: 'Country Code of Origin' }),
      harmonizedSystemCode: Workflow.string({ label: 'HS Code' }),
      createdAt: Workflow.string({ label: 'Created At' }),
      updatedAt: Workflow.string({ label: 'Updated At' }),
    }
  }
  if (operation === 'getMany') {
    return {
      inventoryItems: Workflow.string({ label: 'Inventory Items (JSON)' }),
      count: Workflow.string({ label: 'Count' }),
    }
  }
  return {}
}
