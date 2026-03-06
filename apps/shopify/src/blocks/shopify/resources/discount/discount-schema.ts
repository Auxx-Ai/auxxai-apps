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
  createStartsAt: Workflow.datetime({
    label: 'Starts At',
    placeholder: '2026-01-01T00:00:00Z',
    acceptsVariables: true,
  }),
  createEndsAt: Workflow.datetime({
    label: 'Ends At',
    description: 'Leave empty for no end date',
    acceptsVariables: true,
  }),
  createUsageLimit: Workflow.number({
    label: 'Usage Limit',
    description: 'Max total uses (leave empty for unlimited)',
    integer: true,
    acceptsVariables: true,
  }),
  createOncePerCustomer: Workflow.boolean({
    label: 'Once Per Customer',
    default: false,
  }),
  createMinSubtotal: Workflow.currency({
    label: 'Minimum Subtotal',
    description: 'Minimum order subtotal for discount',
    acceptsVariables: true,
  }),
  createMinQuantity: Workflow.number({
    label: 'Minimum Quantity',
    description: 'Minimum item quantity for discount',
    integer: true,
    acceptsVariables: true,
  }),

  // --- Discount: Update ---
  updatePriceRuleId: Workflow.string({ label: 'Price Rule ID', acceptsVariables: true }),
  updateDiscountCodeId: Workflow.string({ label: 'Discount Code ID', acceptsVariables: true }),
  updateCode: Workflow.string({ label: 'Discount Code', acceptsVariables: true }),
  updateValue: Workflow.string({ label: 'Value', acceptsVariables: true }),
  updateEndsAt: Workflow.datetime({ label: 'Ends At', acceptsVariables: true }),
  updateUsageLimit: Workflow.number({
    label: 'Usage Limit',
    integer: true,
    acceptsVariables: true,
  }),

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

const discountFields = {
  priceRuleId: Workflow.string(),
  discountCodeId: Workflow.string(),
  code: Workflow.string(),
  value: Workflow.string(),
  valueType: Workflow.string(),
  targetType: Workflow.string(),
  startsAt: Workflow.datetime(),
  endsAt: Workflow.datetime(),
  usageLimit: Workflow.number({ integer: true }),
  timesUsed: Workflow.number({ integer: true }),
}

export function discountComputeOutputs(operation: string) {
  if (operation === 'create' || operation === 'get') {
    return {
      discount: Workflow.struct(discountFields, { label: 'discount' }),
    }
  }
  if (operation === 'update') {
    return {
      discount: Workflow.struct({
        priceRuleId: Workflow.string(),
        discountCodeId: Workflow.string(),
        code: Workflow.string(),
        value: Workflow.string(),
      }, { label: 'discount' }),
    }
  }
  if (operation === 'delete') {
    return {
      success: Workflow.boolean({ label: 'success' }),
    }
  }
  if (operation === 'getMany') {
    return {
      priceRules: Workflow.array({
        label: 'priceRules',
        items: Workflow.struct(discountFields, { label: 'priceRule' }),
      }),
      discountCodes: Workflow.array({
        label: 'discountCodes',
        items: Workflow.struct(discountFields, { label: 'discountCode' }),
      }),
      count: Workflow.number({ label: 'count', integer: true }),
    }
  }
  return {}
}
