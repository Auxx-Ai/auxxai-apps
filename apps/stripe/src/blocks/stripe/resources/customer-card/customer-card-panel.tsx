import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { stripeSchema } from '../../stripe-schema'

interface CustomerCardPanelProps {
  api: UseWorkflowApi<typeof stripeSchema>
}

export function CustomerCardPanel({ api }: CustomerCardPanelProps) {
  const { StringInput, VarField, VarFieldGroup, Section, ConditionalRender } = api

  return (
    <>
      <ConditionalRender when={(d) => d.operation === 'add'}>
        <Section title="Card Details">
          <VarFieldGroup>
            <VarField>
              <StringInput name="addCardCustomerId" />
            </VarField>
            <VarField>
              <StringInput name="addCardToken" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      <ConditionalRender when={(d) => d.operation === 'get'}>
        <Section title="Card Details">
          <VarFieldGroup>
            <VarField>
              <StringInput name="getCardCustomerId" />
            </VarField>
            <VarField>
              <StringInput name="getCardSourceId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      <ConditionalRender when={(d) => d.operation === 'remove'}>
        <Section title="Card Details">
          <VarFieldGroup>
            <VarField>
              <StringInput name="removeCardCustomerId" />
            </VarField>
            <VarField>
              <StringInput name="removeCardId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
