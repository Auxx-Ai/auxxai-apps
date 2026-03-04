import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { stripeSchema } from '../../stripe-schema'

interface CustomerPanelProps {
  api: UseWorkflowApi<typeof stripeSchema>
}

export function CustomerPanel({ api }: CustomerPanelProps) {
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
        <Section title="Customer Details">
          <VarFieldGroup>
            <VarField>
              <StringInput name="createCustomerName" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Additional Fields" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="createCustomerEmail" />
            </VarField>
            <VarField>
              <StringInput name="createCustomerPhone" />
            </VarField>
            <VarField>
              <StringInput name="createCustomerDescription" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Address" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="createCustomerAddressLine1" />
            </VarField>
            <VarField>
              <StringInput name="createCustomerAddressLine2" />
            </VarField>
            <FieldRow>
              <VarField>
                <StringInput name="createCustomerAddressCity" />
              </VarField>
              <VarField>
                <StringInput name="createCustomerAddressState" />
              </VarField>
            </FieldRow>
            <FieldRow>
              <VarField>
                <StringInput name="createCustomerAddressCountry" />
              </VarField>
              <VarField>
                <StringInput name="createCustomerAddressPostalCode" />
              </VarField>
            </FieldRow>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      <ConditionalRender when={(d) => d.operation === 'delete'}>
        <Section title="Customer">
          <VarFieldGroup>
            <VarField>
              <StringInput name="deleteCustomerId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      <ConditionalRender when={(d) => d.operation === 'get'}>
        <Section title="Customer">
          <VarFieldGroup>
            <VarField>
              <StringInput name="getCustomerId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      <ConditionalRender when={(d) => d.operation === 'getMany'}>
        <Section title="Filters" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="getManyCustomersEmail" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options">
          <VarFieldGroup>
            <VarField>
              <BooleanInput name="getManyCustomersReturnAll" />
            </VarField>
            <ConditionalRender when={(d) => !d.getManyCustomersReturnAll}>
              <VarField>
                <NumberInput name="getManyCustomersLimit" />
              </VarField>
            </ConditionalRender>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      <ConditionalRender when={(d) => d.operation === 'update'}>
        <Section title="Customer">
          <VarFieldGroup>
            <VarField>
              <StringInput name="updateCustomerId" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Update Fields" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="updateCustomerName" />
            </VarField>
            <VarField>
              <StringInput name="updateCustomerEmail" />
            </VarField>
            <VarField>
              <StringInput name="updateCustomerPhone" />
            </VarField>
            <VarField>
              <StringInput name="updateCustomerDescription" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Address" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="updateCustomerAddressLine1" />
            </VarField>
            <VarField>
              <StringInput name="updateCustomerAddressLine2" />
            </VarField>
            <FieldRow>
              <VarField>
                <StringInput name="updateCustomerAddressCity" />
              </VarField>
              <VarField>
                <StringInput name="updateCustomerAddressState" />
              </VarField>
            </FieldRow>
            <FieldRow>
              <VarField>
                <StringInput name="updateCustomerAddressCountry" />
              </VarField>
              <VarField>
                <StringInput name="updateCustomerAddressPostalCode" />
              </VarField>
            </FieldRow>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
