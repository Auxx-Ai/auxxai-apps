import { Workflow } from '@auxx/sdk'

export const balanceInputs = {}

export function balanceComputeOutputs(operation: string) {
  if (operation === 'get') {
    return {
      available: Workflow.array({
        label: 'Available',
        items: Workflow.struct({
          amount: Workflow.string({ label: 'Amount' }),
          currency: Workflow.string({ label: 'Currency' }),
        }),
      }),
      pending: Workflow.array({
        label: 'Pending',
        items: Workflow.struct({
          amount: Workflow.string({ label: 'Amount' }),
          currency: Workflow.string({ label: 'Currency' }),
        }),
      }),
      livemode: Workflow.string({ label: 'Live Mode' }),
    }
  }
  return {}
}
