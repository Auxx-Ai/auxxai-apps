// src/blocks/shopify/resources/customer-address/customer-address-panel.tsx

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { shopifySchema } from '../../shopify-schema'

interface CustomerAddressPanelProps {
  api: UseWorkflowApi<typeof shopifySchema>
}

export function CustomerAddressPanel({ api }: CustomerAddressPanelProps) {
  const { StringInput, OptionsInput, VarField, VarFieldGroup, Section, ConditionalRender } = api

  return (
    <>
      {/* Shared: Customer ID */}
      <Section title="Customer">
        <VarFieldGroup>
          <VarField>
            <StringInput name="customerId" />
          </VarField>
        </VarFieldGroup>
      </Section>

      {/* Address: Create */}
      <ConditionalRender when={(d) => d.operation === 'create'}>
        <Section title="Address">
          <VarFieldGroup>
            <VarField>
              <StringInput name="createFirstName" />
            </VarField>
            <VarField>
              <StringInput name="createLastName" />
            </VarField>
            <VarField>
              <StringInput name="createCompany" />
            </VarField>
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
              <StringInput name="createPhone" />
            </VarField>
            <VarField>
              <OptionsInput name="createIsDefault" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Address: Update */}
      <ConditionalRender when={(d) => d.operation === 'update'}>
        <Section title="Address">
          <VarFieldGroup>
            <VarField>
              <StringInput name="updateAddressId" />
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
              <StringInput name="updateCompany" />
            </VarField>
            <VarField>
              <StringInput name="updateAddress1" />
            </VarField>
            <VarField>
              <StringInput name="updateAddress2" />
            </VarField>
            <VarField>
              <StringInput name="updateCity" />
            </VarField>
            <VarField>
              <StringInput name="updateProvince" />
            </VarField>
            <VarField>
              <StringInput name="updateCountry" />
            </VarField>
            <VarField>
              <StringInput name="updateZip" />
            </VarField>
            <VarField>
              <StringInput name="updatePhone" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Address: Get */}
      <ConditionalRender when={(d) => d.operation === 'get'}>
        <Section title="Address">
          <VarFieldGroup>
            <VarField>
              <StringInput name="getAddressId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Address: Get Many */}
      <ConditionalRender when={(d) => d.operation === 'getMany'}>
        <Section title="Addresses">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="getManyLimit" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Address: Delete */}
      <ConditionalRender when={(d) => d.operation === 'delete'}>
        <Section title="Address to Delete">
          <VarFieldGroup>
            <VarField>
              <StringInput name="deleteAddressId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Address: Set Default */}
      <ConditionalRender when={(d) => d.operation === 'setDefault'}>
        <Section title="Set Default Address">
          <VarFieldGroup>
            <VarField>
              <StringInput name="setDefaultAddressId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
