import type { UseWorkflowApi } from '@auxx/sdk/client'
import { WorkflowNodeText } from '@auxx/sdk/client'
import type { stripeSchema } from '../../stripe-schema'

interface BalancePanelProps {
  api: UseWorkflowApi<typeof stripeSchema>
}

export function BalancePanel({ api }: BalancePanelProps) {
  const { Section, VarFieldGroup } = api

  return (
    <Section title="Balance">
      <VarFieldGroup>
        <WorkflowNodeText className="text-xs text-muted-foreground">
          This operation retrieves your current Stripe account balance. No configuration required.
        </WorkflowNodeText>
      </VarFieldGroup>
    </Section>
  )
}
