// actions/create-coupon/create-coupon-schema.ts

import { Workflow, type WorkflowSchema } from '@auxx/sdk'

export const createCouponSchema = {
  inputs: {
    discountType: Workflow.select({
      label: 'Discount Type',
      options: [
        { value: 'percent', label: 'Percentage' },
        { value: 'fixedAmount', label: 'Fixed Amount' },
      ],
      default: 'percent',
    }),
    percentOff: Workflow.number({
      label: 'Percent Off',
      description: 'Discount percentage (1-100)',
      min: 1,
      max: 100,
    }),
    amountOff: Workflow.currency({
      label: 'Amount Off',
      description: 'Discount amount',
      currencyCode: 'USD',
    }),
    duration: Workflow.select({
      label: 'Duration',
      options: [
        { value: 'once', label: 'Once' },
        { value: 'forever', label: 'Forever' },
      ],
      default: 'once',
    }),
  },
  outputs: {
    couponCode: Workflow.string({ label: 'Coupon Code' }),
    percentOff: Workflow.string({ label: 'Percent Off' }),
    amountOff: Workflow.string({ label: 'Amount Off' }),
    duration: Workflow.string({ label: 'Duration' }),
    valid: Workflow.string({ label: 'Valid' }),
  },
} satisfies WorkflowSchema
