// src/blocks/affirm/affirm-panel.tsx

/**
 * Panel for the `affirm` block.
 *
 * Four operations and thirteen inputs, so there is no `resources/` subfolder
 * here: ShipStation splits its panel per resource because it carries 23
 * operations across 7 of them, and the same split for two resources would be six
 * files of ceremony around sixty lines of fields.
 *
 * Nothing is gated. Every operation is a read, the app declares no settings, and
 * there is no capability narrowing to do — unlike ShipStation, whose panel hides
 * writes its installation has not enabled.
 */

import { useWorkflow, WorkflowPanel } from '@auxx/sdk/client'
import { useEffect } from 'react'
import { affirmSchema, OPERATIONS, RESOURCES } from './affirm-schema'

export function AffirmPanel() {
  const api = useWorkflow<typeof affirmSchema>(affirmSchema)

  const {
    data,
    updateData,
    StringInput,
    NumberInput,
    OptionsInput,
    VarField,
    VarFieldGroup,
    FieldRow,
    FieldDivider,
    Section,
    ConditionalRender,
  } = api

  const resource = (data?.resource ?? 'settlement') as string
  const operation = (data?.operation ?? 'getMany') as string

  // `getMany` exists on both resources, but `getEvents` and `get` do not. A
  // resource switch that leaves an impossible pair selected would render an
  // empty panel and then fail the structural check at run time.
  useEffect(() => {
    if (!data) return
    const ops = OPERATIONS[resource] ?? []
    if (ops.length > 0 && !ops.some((op) => op.value === operation)) {
      updateData({ operation: ops[0].value })
    }
  }, [resource, operation])

  return (
    <WorkflowPanel>
      <Section title="Operation">
        <VarFieldGroup>
          {RESOURCES.map((res) => (
            <ConditionalRender key={res.value} when={(d) => d.resource === res.value}>
              <FieldRow>
                <OptionsInput
                  name="resource"
                  options={[...RESOURCES]}
                  acceptsVariables={false}
                  variant="outline"
                />
                <FieldDivider />
                <OptionsInput name="operation" options={OPERATIONS[res.value] ?? []} expand />
              </FieldRow>
            </ConditionalRender>
          ))}
        </VarFieldGroup>
      </Section>

      {/* Settlement: List Deposits — "what landed in the bank" */}
      <ConditionalRender when={(d) => d.resource === 'settlement' && d.operation === 'getMany'}>
        <Section
          title="Deposits"
          description="One row per settlement date, each with the deposit id the merchant sees on their bank statement."
        >
          <VarFieldGroup>
            <VarField>
              <StringInput name="settlementGetManyAfter" />
            </VarField>
            <VarField>
              <StringInput name="settlementGetManyBefore" />
            </VarField>
            <VarField>
              <NumberInput name="settlementGetManyLimit" />
            </VarField>
            <VarField>
              <StringInput name="settlementGetManyCursor" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Settlement: List Deposit Events — the captures, refunds and fees inside one */}
      <ConditionalRender when={(d) => d.resource === 'settlement' && d.operation === 'getEvents'}>
        <Section
          title="Deposit"
          description="Affirm provides no deposit filter on this feed, so the date window is read and the deposit is matched locally. Check the `complete` output before treating the result as a deposit's full membership."
        >
          <VarFieldGroup>
            <VarField>
              <StringInput name="settlementGetEventsDepositId" />
            </VarField>
            <VarField>
              <StringInput name="settlementGetEventsAfter" />
            </VarField>
            <VarField>
              <StringInput name="settlementGetEventsBefore" />
            </VarField>
            <VarField>
              <NumberInput name="settlementGetEventsLimit" />
            </VarField>
            <VarField>
              <StringInput name="settlementGetEventsCursor" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Charge: List Charges */}
      <ConditionalRender when={(d) => d.resource === 'charge' && d.operation === 'getMany'}>
        <Section
          title="Charges"
          description="What customers financed in a time window. Returns no customer name, email or address."
        >
          <VarFieldGroup>
            <VarField>
              <StringInput name="chargeGetManyAfter" />
            </VarField>
            <VarField>
              <StringInput name="chargeGetManyBefore" />
            </VarField>
            <VarField>
              <StringInput name="chargeGetManyOrderId" />
            </VarField>
            <VarField>
              <NumberInput name="chargeGetManyLimit" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Charge: Get Charge — the order-recognition path */}
      <ConditionalRender when={(d) => d.resource === 'charge' && d.operation === 'get'}>
        <Section
          title="Charge"
          description="One charge with its authorisation and capture history, and the Shopify payment session Affirm states for it — which is how a settlement whose order id does not match gets resolved."
        >
          <VarFieldGroup>
            <VarField>
              <StringInput name="chargeId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </WorkflowPanel>
  )
}
