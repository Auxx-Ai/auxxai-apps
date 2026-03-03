import { Workflow } from '@auxx/sdk'

export const couponInputs = {
  // --- Coupon: Create ---
  createCouponDuration: Workflow.select({
    label: 'Duration',
    options: [
      { value: 'once', label: 'Once' },
      { value: 'forever', label: 'Forever' },
    ],
    default: 'once',
  }),
  createCouponType: Workflow.select({
    label: 'Discount Type',
    options: [
      { value: 'percent', label: 'Percent' },
      { value: 'fixedAmount', label: 'Fixed Amount' },
    ],
    default: 'percent',
  }),
  createCouponPercentOff: Workflow.number({
    label: 'Percent Off',
    description: 'Discount percentage (1-100)',
    min: 1,
    max: 100,
  }),
  createCouponAmountOff: Workflow.number({
    label: 'Amount Off',
    description: 'Amount in cents',
    min: 1,
  }),
  createCouponCurrency: Workflow.string({
    label: 'Currency',
    placeholder: 'usd',
    acceptsVariables: true,
  }),

  // --- Coupon: Get Many ---
  getManyCouponsReturnAll: Workflow.boolean({
    label: 'Return All',
    default: false,
  }),
  getManyCouponsLimit: Workflow.number({
    label: 'Limit',
    default: 50,
    min: 1,
    max: 100,
  }),
}

export function couponComputeOutputs(operation: string) {
  switch (operation) {
    case 'create':
      return {
        couponId: Workflow.string({ label: 'Coupon ID' }),
        percentOff: Workflow.string({ label: 'Percent Off' }),
        amountOff: Workflow.string({ label: 'Amount Off' }),
        currency: Workflow.string({ label: 'Currency' }),
        duration: Workflow.string({ label: 'Duration' }),
        valid: Workflow.string({ label: 'Valid' }),
      }
    case 'getMany':
      return {
        coupons: Workflow.array({
          label: 'Coupons',
          items: Workflow.struct({
            id: Workflow.string({ label: 'ID' }),
            percentOff: Workflow.string({ label: 'Percent Off' }),
            amountOff: Workflow.string({ label: 'Amount Off' }),
            duration: Workflow.string({ label: 'Duration' }),
            valid: Workflow.string({ label: 'Valid' }),
          }),
        }),
        totalCount: Workflow.string({ label: 'Total Count' }),
        truncated: Workflow.string({ label: 'Truncated' }),
      }
    default:
      return {}
  }
}
