import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { stripeSchema } from '../../stripe-schema'

interface SourcePanelProps {
  api: UseWorkflowApi<typeof stripeSchema>
}

export function SourcePanel({ api }: SourcePanelProps) {
  const {
    StringInput,
    NumberInput,
    OptionsInput,
    VarField,
    VarFieldGroup,
    Section,
    ConditionalRender,
  } = api

  return (
    <>
      <ConditionalRender when={(d) => d.operation === 'create'}>
        <Section title="Source Details">
          <VarFieldGroup>
            <VarField>
              <StringInput name="createSourceCustomerId" />
            </VarField>
            <VarField>
              <OptionsInput name="createSourceType" />
            </VarField>
            <VarField>
              <NumberInput name="createSourceAmount" />
            </VarField>
            <VarField>
              <StringInput name="createSourceCurrency" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      <ConditionalRender when={(d) => d.operation === 'delete'}>
        <Section title="Source Details">
          <VarFieldGroup>
            <VarField>
              <StringInput name="deleteSourceCustomerId" />
            </VarField>
            <VarField>
              <StringInput name="deleteSourceId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      <ConditionalRender when={(d) => d.operation === 'get'}>
        <Section title="Source">
          <VarFieldGroup>
            <VarField>
              <StringInput name="getSourceId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
