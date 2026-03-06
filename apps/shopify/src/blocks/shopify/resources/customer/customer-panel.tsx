// src/blocks/shopify/resources/customer/customer-panel.tsx

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { shopifySchema } from '../../shopify-schema'

interface CustomerPanelProps {
  api: UseWorkflowApi<typeof shopifySchema>
}

export function CustomerPanel({ api }: CustomerPanelProps) {
  const { StringInput, OptionsInput, VarField, VarFieldGroup, Section, ConditionalRender } = api

  return (
    <>
      {/* Customer: Create */}
      <ConditionalRender when={(d) => d.operation === 'create'}>
        <Section title="Customer">
          <VarFieldGroup>
            <VarField>
              <StringInput name="createFirstName" />
            </VarField>
            <VarField>
              <StringInput name="createLastName" />
            </VarField>
            <VarField>
              <StringInput name="createEmail" />
            </VarField>
            <VarField>
              <StringInput name="createPhone" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Details" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="createTags" />
            </VarField>
            <VarField>
              <StringInput name="createNote" />
            </VarField>
            <VarField>
              <OptionsInput name="createVerifiedEmail" />
            </VarField>
            <VarField>
              <OptionsInput name="createSendEmailInvite" />
            </VarField>
            <VarField>
              <OptionsInput name="createTaxExempt" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Default Address" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="createAddress1" />
            </VarField>
            <VarField>
              <StringInput name="createAddress2" />
            </VarField>
            <VarField>
              <StringInput name="createCity" />
            </VarField>
            <VarField>
              <StringInput name="createProvince" />
            </VarField>
            <VarField>
              <StringInput name="createCountry" />
            </VarField>
            <VarField>
              <StringInput name="createZip" />
            </VarField>
            <VarField>
              <StringInput name="createCompany" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Customer: Update */}
      <ConditionalRender when={(d) => d.operation === 'update'}>
        <Section title="Customer">
          <VarFieldGroup>
            <VarField>
              <StringInput name="updateCustomerId" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Update Fields">
          <VarFieldGroup>
            <VarField>
              <StringInput name="updateFirstName" />
            </VarField>
            <VarField>
              <StringInput name="updateLastName" />
            </VarField>
            <VarField>
              <StringInput name="updateEmail" />
            </VarField>
            <VarField>
              <StringInput name="updatePhone" />
            </VarField>
            <VarField>
              <StringInput name="updateTags" />
            </VarField>
            <VarField>
              <StringInput name="updateNote" />
            </VarField>
            <VarField>
              <OptionsInput name="updateTaxExempt" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Customer: Get */}
      <ConditionalRender when={(d) => d.operation === 'get'}>
        <Section title="Customer">
          <VarFieldGroup>
            <VarField>
              <StringInput name="getCustomerId" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="getFields" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Customer: Get Many */}
      <ConditionalRender when={(d) => d.operation === 'getMany'}>
        <Section title="Customers">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="getManyLimit" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Filters" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="getManyCreatedAtMin" />
            </VarField>
            <VarField>
              <StringInput name="getManyCreatedAtMax" />
            </VarField>
            <VarField>
              <StringInput name="getManyUpdatedAtMin" />
            </VarField>
            <VarField>
              <StringInput name="getManyUpdatedAtMax" />
            </VarField>
            <VarField>
              <StringInput name="getManyFields" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Customer: Delete */}
      <ConditionalRender when={(d) => d.operation === 'delete'}>
        <Section title="Customer to Delete">
          <VarFieldGroup>
            <VarField>
              <StringInput name="deleteCustomerId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Customer: Search */}
      <ConditionalRender when={(d) => d.operation === 'search'}>
        <Section title="Search">
          <VarFieldGroup>
            <VarField>
              <StringInput name="searchQuery" />
            </VarField>
            <VarField>
              <OptionsInput name="searchLimit" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
