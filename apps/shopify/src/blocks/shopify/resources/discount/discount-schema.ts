// src/blocks/shopify/resources/discount/discount-schema.ts

import { Workflow } from '@auxx/sdk'

export const discountInputs = {
  // --- Discount: Create ---
  createTitle: Workflow.string({
    label: 'Discount Code',
    description: 'The code customers enter at checkout',
    acceptsVariables: true,
  }),
  createValueType: Workflow.select({
    label: 'Discount Type',
    options: [
      { value: 'percentage', label: 'Percentage' },
      { value: 'fixed_amount', label: 'Fixed Amount' },
    ],
    default: 'percentage',
  }),
  createValue: Workflow.string({
    label: 'Value',
    description: 'Discount value (e.g., -10 for 10% off or -$10)',
    acceptsVariables: true,
  }),
  createTargetType: Workflow.select({
    label: 'Applies To',
    options: [
      { value: 'line_item', label: 'Line Items' },
      { value: 'shipping_line', label: 'Shipping' },
    ],
    default: 'line_item',
  }),
  createTargetSelection: Workflow.select({
    label: 'Target Selection',
    options: [
      { value: 'all', label: 'All items' },
      { value: 'entitled', label: 'Specific items' },
    ],
    default: 'all',
  }),
  createAllocationMethod: Workflow.select({
    label: 'Allocation Method',
    options: [
      { value: 'across', label: 'Across all items' },
      { value: 'each', label: 'Each item' },
    ],
    default: 'across',
  }),
  createCustomerSelection: Workflow.select({
    label: 'Customer Eligibility',
    options: [
      { value: 'all', label: 'All customers' },
      { value: 'prerequisite', label: 'Specific customers' },
    ],
    default: 'all',
  }),
  createStartsAt: Workflow.string({
    label: 'Starts At',
    placeholder: '2026-01-01T00:00:00Z',
    acceptsVariables: true,
  }),
  createEndsAt: Workflow.string({
    label: 'Ends At',
    description: 'Leave empty for no end date',
    acceptsVariables: true,
  }),
  createUsageLimit: Workflow.string({
    label: 'Usage Limit',
    description: 'Max total uses (leave empty for unlimited)',
    acceptsVariables: true,
  }),
  createOncePerCustomer: Workflow.select({
    label: 'Once Per Customer',
    options: [
      { value: 'false', label: 'No' },
      { value: 'true', label: 'Yes' },
    ],
    default: 'false',
  }),
  createMinSubtotal: Workflow.string({
    label: 'Minimum Subtotal',
    description: 'Minimum order subtotal for discount',
    acceptsVariables: true,
  }),
  createMinQuantity: Workflow.string({
    label: 'Minimum Quantity',
    description: 'Minimum item quantity for discount',
    acceptsVariables: true,
  }),

  // --- Discount: Update ---
  updatePriceRuleId: Workflow.string({ label: 'Price Rule ID', acceptsVariables: true }),
  updateDiscountCodeId: Workflow.string({ label: 'Discount Code ID', acceptsVariables: true }),
  updateCode: Workflow.string({ label: 'Discount Code', acceptsVariables: true }),
  updateValue: Workflow.string({ label: 'Value', acceptsVariables: true }),
  updateEndsAt: Workflow.string({ label: 'Ends At', acceptsVariables: true }),
  updateUsageLimit: Workflow.string({ label: 'Usage Limit', acceptsVariables: true }),

  // --- Discount: Get ---
  getPriceRuleId: Workflow.string({ label: 'Price Rule ID', acceptsVariables: true }),
  getDiscountCodeId: Workflow.string({ label: 'Discount Code ID', acceptsVariables: true }),

  // --- Discount: Get Many ---
  getManyPriceRuleId: Workflow.string({
    label: 'Price Rule ID',
    description: 'List codes for this price rule (leave empty to list price rules)',
    acceptsVariables: true,
  }),
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

  // --- Discount: Delete ---
  deletePriceRuleId: Workflow.string({ label: 'Price Rule ID', acceptsVariables: true }),
  deleteDiscountCodeId: Workflow.string({
    label: 'Discount Code ID',
    description: 'Leave empty to delete the entire price rule',
    acceptsVariables: true,
  }),
}

export function discountComputeOutputs(operation: string) {
  if (operation === 'create' || operation === 'get') {
    return {
      priceRuleId: Workflow.string({ label: 'Price Rule ID' }),
      discountCodeId: Workflow.string({ label: 'Discount Code ID' }),
      code: Workflow.string({ label: 'Discount Code' }),
      value: Workflow.string({ label: 'Value' }),
      valueType: Workflow.string({ label: 'Value Type' }),
      targetType: Workflow.string({ label: 'Target Type' }),
      startsAt: Workflow.string({ label: 'Starts At' }),
      endsAt: Workflow.string({ label: 'Ends At' }),
      usageLimit: Workflow.string({ label: 'Usage Limit' }),
      timesUsed: Workflow.string({ label: 'Times Used' }),
    }
  }
  if (operation === 'update') {
    return {
      priceRuleId: Workflow.string({ label: 'Price Rule ID' }),
      discountCodeId: Workflow.string({ label: 'Discount Code ID' }),
      code: Workflow.string({ label: 'Discount Code' }),
      value: Workflow.string({ label: 'Value' }),
    }
  }
  if (operation === 'delete') {
    return {
      success: Workflow.string({ label: 'Success' }),
    }
  }
  if (operation === 'getMany') {
    return {
      priceRules: Workflow.string({ label: 'Price Rules (JSON)' }),
      discountCodes: Workflow.string({ label: 'Discount Codes (JSON)' }),
      count: Workflow.string({ label: 'Count' }),
    }
  }
  return {}
}
