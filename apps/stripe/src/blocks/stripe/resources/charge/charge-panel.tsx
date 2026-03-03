import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { stripeSchema } from '../../stripe-schema'

interface ChargePanelProps {
  api: UseWorkflowApi<typeof stripeSchema>
}

export function ChargePanel({ api }: ChargePanelProps) {
  const {
    StringInput,
    NumberInput,
    BooleanInput,
    VarField,
    VarFieldGroup,
    FieldRow,
    Section,
    ConditionalRender,
  } = api

  return (
    <>
      <ConditionalRender when={(d) => d.operation === 'create'}>
        <Section title="Charge Details">
          <VarFieldGroup>
            <VarField>
              <StringInput name="createChargeCustomerId" />
            </VarField>
            <FieldRow>
              <VarField>
                <NumberInput name="createChargeAmount" />
              </VarField>
              <VarField>
                <StringInput name="createChargeCurrency" />
              </VarField>
            </FieldRow>
            <VarField>
              <StringInput name="createChargeSourceId" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="createChargeDescription" />
            </VarField>
            <VarField>
              <StringInput name="createChargeReceiptEmail" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      <ConditionalRender when={(d) => d.operation === 'get'}>
        <Section title="Charge">
          <VarFieldGroup>
            <VarField>
              <StringInput name="getChargeId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      <ConditionalRender when={(d) => d.operation === 'getMany'}>
        <Section title="Options">
          <VarFieldGroup>
            <VarField>
              <BooleanInput name="getManyChargesReturnAll" />
            </VarField>
            <ConditionalRender when={(d) => !d.getManyChargesReturnAll}>
              <VarField>
                <NumberInput name="getManyChargesLimit" />
              </VarField>
            </ConditionalRender>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      <ConditionalRender when={(d) => d.operation === 'update'}>
        <Section title="Charge">
          <VarFieldGroup>
            <VarField>
              <StringInput name="updateChargeId" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Update Fields">
          <VarFieldGroup>
            <VarField>
              <StringInput name="updateChargeDescription" />
            </VarField>
            <VarField>
              <StringInput name="updateChargeReceiptEmail" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
