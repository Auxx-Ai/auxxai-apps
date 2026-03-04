import { useEffect } from 'react'
import { WorkflowPanel, useWorkflow } from '@auxx/sdk/client'
import { stripeSchema } from './stripe-schema'
import { OPERATIONS } from './resources/constants'
import { BalancePanel } from './resources/balance/balance-panel'
import { ChargePanel } from './resources/charge/charge-panel'
import { CouponPanel } from './resources/coupon/coupon-panel'
import { CustomerPanel } from './resources/customer/customer-panel'
import { CustomerCardPanel } from './resources/customer-card/customer-card-panel'
import { SourcePanel } from './resources/source/source-panel'
import { TokenPanel } from './resources/token/token-panel'

export function StripePanel() {
  const api = useWorkflow<typeof stripeSchema>(stripeSchema)
  const {
    data,
    updateData,
    OptionsInput,
    VarFieldGroup,
    FieldRow,
    FieldDivider,
    Section,
    ConditionalRender,
  } = api

  const resource = (data?.resource ?? 'customer') as keyof typeof OPERATIONS
  const operation = data?.operation ?? 'create'

  // Auto-reset operation when resource changes
  useEffect(() => {
    if (!data) return
    const validOps = OPERATIONS[resource]
    if (validOps && !validOps.some((op) => op.value === operation)) {
      updateData({ operation: validOps[0].value })
    }
  }, [resource])

  return (
    <WorkflowPanel>
      <Section title="Operation">
        <VarFieldGroup>
          <ConditionalRender when={(d) => d.resource === 'balance'}>
            <FieldRow>
              <OptionsInput name="resource" acceptsVariables={false} variant="outline" />
              <FieldDivider />
              <OptionsInput name="operation" options={OPERATIONS.balance} expand />
            </FieldRow>
          </ConditionalRender>

          <ConditionalRender when={(d) => d.resource === 'charge'}>
            <FieldRow>
              <OptionsInput name="resource" acceptsVariables={false} variant="outline" />
              <FieldDivider />
              <OptionsInput name="operation" options={OPERATIONS.charge} expand />
            </FieldRow>
          </ConditionalRender>

          <ConditionalRender when={(d) => d.resource === 'coupon'}>
            <FieldRow>
              <OptionsInput name="resource" acceptsVariables={false} variant="outline" />
              <FieldDivider />
              <OptionsInput name="operation" options={OPERATIONS.coupon} expand />
            </FieldRow>
          </ConditionalRender>

          <ConditionalRender when={(d) => d.resource === 'customer'}>
            <FieldRow>
              <OptionsInput name="resource" acceptsVariables={false} variant="outline" />
              <FieldDivider />
              <OptionsInput name="operation" options={OPERATIONS.customer} expand />
            </FieldRow>
          </ConditionalRender>

          <ConditionalRender when={(d) => d.resource === 'customerCard'}>
            <FieldRow>
              <OptionsInput name="resource" acceptsVariables={false} variant="outline" />
              <FieldDivider />
              <OptionsInput name="operation" options={OPERATIONS.customerCard} expand />
            </FieldRow>
          </ConditionalRender>

          <ConditionalRender when={(d) => d.resource === 'source'}>
            <FieldRow>
              <OptionsInput name="resource" acceptsVariables={false} variant="outline" />
              <FieldDivider />
              <OptionsInput name="operation" options={OPERATIONS.source} expand />
            </FieldRow>
          </ConditionalRender>

          <ConditionalRender when={(d) => d.resource === 'token'}>
            <FieldRow>
              <OptionsInput name="resource" acceptsVariables={false} variant="outline" />
              <FieldDivider />
              <OptionsInput name="operation" options={OPERATIONS.token} expand />
            </FieldRow>
          </ConditionalRender>
        </VarFieldGroup>
      </Section>

      <ConditionalRender when={(d) => d.resource === 'balance'}>
        <BalancePanel api={api} />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'charge'}>
        <ChargePanel api={api} />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'coupon'}>
        <CouponPanel api={api} />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'customer'}>
        <CustomerPanel api={api} />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'customerCard'}>
        <CustomerCardPanel api={api} />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'source'}>
        <SourcePanel api={api} />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'token'}>
        <TokenPanel api={api} />
      </ConditionalRender>
    </WorkflowPanel>
  )
}
