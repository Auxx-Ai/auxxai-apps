// src/blocks/shopify/resources/variant/variant-schema.ts

import { Workflow } from '@auxx/sdk'

const variantFieldOptions = [
  { value: 'id', label: 'ID' },
  { value: 'title', label: 'Title' },
  { value: 'price', label: 'Price' },
  { value: 'compare_at_price', label: 'Compare At Price' },
  { value: 'sku', label: 'SKU' },
  { value: 'barcode', label: 'Barcode' },
  { value: 'weight', label: 'Weight' },
  { value: 'weight_unit', label: 'Weight Unit' },
  { value: 'inventory_item_id', label: 'Inventory Item ID' },
  { value: 'inventory_quantity', label: 'Inventory Quantity' },
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
  { value: 'created_at', label: 'Created At' },
  { value: 'updated_at', label: 'Updated At' },
] as const

export const variantInputs = {
  // Shared
  productId: Workflow.string({ label: 'Product ID', required: true, acceptsVariables: true }),

  // --- Variant: Create ---
  createTitle: Workflow.string({ label: 'Title', acceptsVariables: true }),
  createPrice: Workflow.currency({ label: 'Price', acceptsVariables: true }),
  createCompareAtPrice: Workflow.currency({ label: 'Compare At Price', acceptsVariables: true }),
  createSku: Workflow.string({ label: 'SKU', acceptsVariables: true }),
  createBarcode: Workflow.string({ label: 'Barcode', acceptsVariables: true }),
  createWeight: Workflow.number({ label: 'Weight', acceptsVariables: true }),
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
  createInventoryQuantity: Workflow.number({
    label: 'Inventory Quantity',
    integer: true,
    acceptsVariables: true,
  }),
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
  createRequiresShipping: Workflow.boolean({
    label: 'Requires Shipping',
    default: true,
  }),
  createTaxable: Workflow.boolean({
    label: 'Taxable',
    default: true,
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
  updateVariantId: Workflow.string({ label: 'Variant ID', required: true, acceptsVariables: true }),
  updateTitle: Workflow.string({ label: 'Title', acceptsVariables: true }),
  updatePrice: Workflow.currency({ label: 'Price', acceptsVariables: true }),
  updateCompareAtPrice: Workflow.currency({ label: 'Compare At Price', acceptsVariables: true }),
  updateSku: Workflow.string({ label: 'SKU', acceptsVariables: true }),
  updateBarcode: Workflow.string({ label: 'Barcode', acceptsVariables: true }),
  updateWeight: Workflow.number({ label: 'Weight', acceptsVariables: true }),
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
  getVariantId: Workflow.string({ label: 'Variant ID', required: true, acceptsVariables: true }),
  getFields: Workflow.array({
    label: 'Fields',
    description: 'Fields to include in the response (leave empty for all)',
    items: Workflow.string({ label: 'Field' }),
    options: variantFieldOptions,
    canAdd: true,
    canManage: false,
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
  getManyFields: Workflow.array({
    label: 'Fields',
    description: 'Fields to include in the response (leave empty for all)',
    items: Workflow.string({ label: 'Field' }),
    options: variantFieldOptions,
    canAdd: true,
    canManage: false,
  }),

  // --- Variant: Delete ---
  deleteVariantId: Workflow.string({ label: 'Variant ID', required: true, acceptsVariables: true }),
}

const variantFields = {
  variantId: Workflow.string(),
  title: Workflow.string(),
  price: Workflow.currency(),
  compareAtPrice: Workflow.currency(),
  sku: Workflow.string(),
  barcode: Workflow.string(),
  weight: Workflow.number(),
  weightUnit: Workflow.string(),
  inventoryItemId: Workflow.string(),
  inventoryQuantity: Workflow.number({ integer: true }),
  option1: Workflow.string(),
  option2: Workflow.string(),
  option3: Workflow.string(),
  createdAt: Workflow.datetime(),
  updatedAt: Workflow.datetime(),
}

export function variantComputeOutputs(operation: string) {
  if (operation === 'create' || operation === 'get' || operation === 'update') {
    return {
      variant: Workflow.struct(variantFields, { label: 'variant' }),
    }
  }
  if (operation === 'delete') {
    return {
      success: Workflow.boolean({ label: 'success' }),
    }
  }
  if (operation === 'getMany') {
    return {
      variants: Workflow.array({
        label: 'variants',
        items: Workflow.struct(variantFields, { label: 'variant' }),
      }),
      count: Workflow.number({ label: 'count', integer: true }),
    }
  }
  return {}
}
