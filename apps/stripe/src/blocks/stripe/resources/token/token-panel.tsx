import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { stripeSchema } from '../../stripe-schema'

interface TokenPanelProps {
  api: UseWorkflowApi<typeof stripeSchema>
}

export function TokenPanel({ api }: TokenPanelProps) {
  const {
    StringInput,
    OptionsInput,
    VarField,
    VarFieldGroup,
    FieldRow,
    Section,
    ConditionalRender,
  } = api

  return (
    <ConditionalRender when={(d) => d.operation === 'create'}>
      <Section title="Token Type">
        <VarFieldGroup>
          <VarField>
            <OptionsInput name="createTokenType" />
          </VarField>
        </VarFieldGroup>
      </Section>
      <Section title="Card Details">
        <VarFieldGroup>
          <VarField>
            <StringInput name="createTokenCardNumber" />
          </VarField>
          <FieldRow>
            <VarField>
              <StringInput name="createTokenExpMonth" />
            </VarField>
            <VarField>
              <StringInput name="createTokenExpYear" />
            </VarField>
          </FieldRow>
          <VarField>
            <StringInput name="createTokenCvc" />
          </VarField>
        </VarFieldGroup>
      </Section>
    </ConditionalRender>
  )
}
