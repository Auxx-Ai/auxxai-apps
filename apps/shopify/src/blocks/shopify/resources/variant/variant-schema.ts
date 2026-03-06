// src/blocks/shopify/resources/variant/variant-schema.ts

import { Workflow } from '@auxx/sdk'

export const variantInputs = {
  // Shared
  productId: Workflow.string({ label: 'Product ID', acceptsVariables: true }),

  // --- Variant: Create ---
  createTitle: Workflow.string({ label: 'Title', acceptsVariables: true }),
  createPrice: Workflow.string({ label: 'Price', acceptsVariables: true }),
  createCompareAtPrice: Workflow.string({ label: 'Compare At Price', acceptsVariables: true }),
  createSku: Workflow.string({ label: 'SKU', acceptsVariables: true }),
  createBarcode: Workflow.string({ label: 'Barcode', acceptsVariables: true }),
  createWeight: Workflow.string({ label: 'Weight', acceptsVariables: true }),
  createWeightUnit: Workflow.select({
    label: 'Weight Unit',
    options: [
      { value: 'g', label: 'Grams' },
      { value: 'kg', label: 'Kilograms' },
      { value: 'oz', label: 'Ounces' },
      { value: 'lb', label: 'Pounds' },
    ],
    default: 'g',
  }),
  createInventoryQuantity: Workflow.string({ label: 'Inventory Quantity', acceptsVariables: true }),
  createInventoryPolicy: Workflow.select({
    label: 'Inventory Policy',
    description: 'What happens when inventory reaches zero',
    options: [
      { value: 'deny', label: 'Deny (stop selling)' },
      { value: 'continue', label: 'Continue (allow overselling)' },
    ],
    default: 'deny',
  }),
  createFulfillmentService: Workflow.string({
    label: 'Fulfillment Service',
    default: 'manual',
    acceptsVariables: true,
  }),
  createRequiresShipping: Workflow.select({
    label: 'Requires Shipping',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' },
    ],
    default: 'true',
  }),
  createTaxable: Workflow.select({
    label: 'Taxable',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' },
    ],
    default: 'true',
  }),
  createOption1: Workflow.string({
    label: 'Option 1',
    description: 'e.g., Size value: "Small"',
    acceptsVariables: true,
  }),
  createOption2: Workflow.string({
    label: 'Option 2',
    description: 'e.g., Color value: "Red"',
    acceptsVariables: true,
  }),
  createOption3: Workflow.string({ label: 'Option 3', acceptsVariables: true }),

  // --- Variant: Update ---
  updateVariantId: Workflow.string({ label: 'Variant ID', acceptsVariables: true }),
  updateTitle: Workflow.string({ label: 'Title', acceptsVariables: true }),
  updatePrice: Workflow.string({ label: 'Price', acceptsVariables: true }),
  updateCompareAtPrice: Workflow.string({ label: 'Compare At Price', acceptsVariables: true }),
  updateSku: Workflow.string({ label: 'SKU', acceptsVariables: true }),
  updateBarcode: Workflow.string({ label: 'Barcode', acceptsVariables: true }),
  updateWeight: Workflow.string({ label: 'Weight', acceptsVariables: true }),
  updateWeightUnit: Workflow.select({
    label: 'Weight Unit',
    options: [
      { value: '', label: 'No change' },
      { value: 'g', label: 'Grams' },
      { value: 'kg', label: 'Kilograms' },
      { value: 'oz', label: 'Ounces' },
      { value: 'lb', label: 'Pounds' },
    ],
    default: '',
  }),
  updateInventoryPolicy: Workflow.select({
    label: 'Inventory Policy',
    options: [
      { value: '', label: 'No change' },
      { value: 'deny', label: 'Deny' },
      { value: 'continue', label: 'Continue' },
    ],
    default: '',
  }),
  updateTaxable: Workflow.select({
    label: 'Taxable',
    options: [
      { value: '', label: 'No change' },
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' },
    ],
    default: '',
  }),
  updateOption1: Workflow.string({ label: 'Option 1', acceptsVariables: true }),
  updateOption2: Workflow.string({ label: 'Option 2', acceptsVariables: true }),
  updateOption3: Workflow.string({ label: 'Option 3', acceptsVariables: true }),

  // --- Variant: Get ---
  getVariantId: Workflow.string({ label: 'Variant ID', acceptsVariables: true }),
  getFields: Workflow.string({
    label: 'Fields',
    description: 'Comma-separated fields',
    acceptsVariables: true,
  }),

  // --- Variant: Get Many ---
  getManyLimit: Workflow.select({
    label: 'Limit',
    options: [
      { value: '10', label: '10' },
      { value: '25', label: '25' },
      { value: '50', label: '50' },
      { value: '100', label: '100' },
      { value: '250', label: '250' },
    ],
    default: '50',
  }),
  getManyFields: Workflow.string({
    label: 'Fields',
    description: 'Comma-separated fields',
    acceptsVariables: true,
  }),

  // --- Variant: Delete ---
  deleteVariantId: Workflow.string({ label: 'Variant ID', acceptsVariables: true }),
}

export function variantComputeOutputs(operation: string) {
  if (operation === 'create' || operation === 'get' || operation === 'update') {
    return {
      variantId: Workflow.string({ label: 'Variant ID' }),
      title: Workflow.string({ label: 'Title' }),
      price: Workflow.string({ label: 'Price' }),
      compareAtPrice: Workflow.string({ label: 'Compare At Price' }),
      sku: Workflow.string({ label: 'SKU' }),
      barcode: Workflow.string({ label: 'Barcode' }),
      weight: Workflow.string({ label: 'Weight' }),
      weightUnit: Workflow.string({ label: 'Weight Unit' }),
      inventoryItemId: Workflow.string({ label: 'Inventory Item ID' }),
      inventoryQuantity: Workflow.string({ label: 'Inventory Quantity' }),
      option1: Workflow.string({ label: 'Option 1' }),
      option2: Workflow.string({ label: 'Option 2' }),
      option3: Workflow.string({ label: 'Option 3' }),
      createdAt: Workflow.string({ label: 'Created At' }),
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
      variants: Workflow.string({ label: 'Variants (JSON)' }),
      count: Workflow.string({ label: 'Count' }),
    }
  }
  return {}
}
