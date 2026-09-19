// src/blocks/authorize-net/authorize-net-panel.tsx

import { useWorkflow, WorkflowPanel } from '@auxx/sdk/client'
import { useEffect } from 'react'
import { authorizeNetSchema, OPERATIONS, RESOURCES } from './authorize-net-schema'

export function AuthorizeNetPanel() {
  const api = useWorkflow<typeof authorizeNetSchema>(authorizeNetSchema)

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

  const resource = (data?.resource ?? 'batch') as string
  const operation = (data?.operation ?? 'getMany') as string

  // No operation is shared between the resources, so a stale selection after a resource
  // switch renders an empty panel and then fails the structural check at run time.
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

      <ConditionalRender when={(d) => d.resource === 'batch' && d.operation === 'getMany'}>
        <Section
          title="Settled batches"
          description="One row per batch the acquirer settled to the bank. The amount is the sum of the batch's per-card-brand statistics and is gross — card fees are billed on a monthly statement, not deducted here."
        >
          <VarFieldGroup>
            <VarField>
              <StringInput name="batchGetManyAfter" />
            </VarField>
            <VarField>
              <StringInput name="batchGetManyBefore" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'batch' && d.operation === 'getTransactions'}>
        <Section
          title="Batch transactions"
          description="The charges and refunds inside one settled batch. Check `hasMore` before treating a page as the whole batch."
        >
          <VarFieldGroup>
            <VarField>
              <StringInput name="batchId" />
            </VarField>
            <VarField>
              <NumberInput name="batchGetTransactionsLimit" />
            </VarField>
            <VarField>
              <StringInput name="batchGetTransactionsCursor" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'transaction' && d.operation === 'get'}>
        <Section
          title="Transaction"
          description="One transaction with the batch it settled in, its invoice number and its masked card. Returns no customer name, email or address."
        >
          <VarFieldGroup>
            <VarField>
              <StringInput name="transId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      <ConditionalRender
        when={(d) => d.resource === 'transaction' && d.operation === 'getUnsettled'}
      >
        <Section
          title="Unsettled"
          description="Captured but not yet in a settled batch. These join a batch when the acquirer next settles."
        >
          <VarFieldGroup>
            <VarField>
              <NumberInput name="transactionGetUnsettledLimit" />
            </VarField>
            <VarField>
              <StringInput name="transactionGetUnsettledCursor" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </WorkflowPanel>
  )
}
