// src/blocks/quickbooks/resources/vendor/vendor-panel.tsx

/**
 * Vendor resource panel UI.
 * Renders operation-specific inputs for Vendor: Create, Get, Get Many, and Update.
 */

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { quickbooksSchema } from '../../quickbooks-schema'

interface VendorPanelProps {
  api: UseWorkflowApi<typeof quickbooksSchema>
}

export function VendorPanel({ api }: VendorPanelProps) {
  const {
    StringInput,
    NumberInput,
    BooleanInput,
    VarField,
    VarFieldGroup,
    Section,
    ConditionalRender,
  } = api

  return (
    <>
      {/* Vendor: Create */}
      <ConditionalRender when={(d) => d.operation === 'create'}>
        <Section title="New Vendor">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'createVendorDisplayName'} />
            </VarField>
            <VarField>
              <StringInput name={'createVendorGivenName'} />
            </VarField>
            <VarField>
              <StringInput name={'createVendorFamilyName'} />
            </VarField>
            <VarField>
              <StringInput name={'createVendorCompanyName'} />
            </VarField>
            <VarField>
              <StringInput name={'createVendorEmail'} />
            </VarField>
            <VarField>
              <StringInput name={'createVendorPhone'} />
            </VarField>
            <VarField>
              <StringInput name={'createVendorAcctNum'} />
            </VarField>
            <VarField>
              <BooleanInput name={'createVendorVendor1099'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Vendor: Get */}
      <ConditionalRender when={(d) => d.operation === 'get'}>
        <Section title="Vendor">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'getVendorId'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Vendor: Get Many */}
      <ConditionalRender when={(d) => d.operation === 'getMany'}>
        <Section title="Filter">
          <VarFieldGroup>
            <VarField>
              <BooleanInput name={'getManyVendorReturnAll'} />
            </VarField>
            <ConditionalRender when={(d) => d.getManyVendorReturnAll === false}>
              <VarField>
                <NumberInput name={'getManyVendorLimit'} />
              </VarField>
            </ConditionalRender>
            <VarField>
              <StringInput name={'getManyVendorQuery'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Vendor: Update */}
      <ConditionalRender when={(d) => d.operation === 'update'}>
        <Section title="Vendor">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'updateVendorId'} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Update Fields">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'updateVendorDisplayName'} />
            </VarField>
            <VarField>
              <StringInput name={'updateVendorGivenName'} />
            </VarField>
            <VarField>
              <StringInput name={'updateVendorFamilyName'} />
            </VarField>
            <VarField>
              <StringInput name={'updateVendorCompanyName'} />
            </VarField>
            <VarField>
              <StringInput name={'updateVendorEmail'} />
            </VarField>
            <VarField>
              <StringInput name={'updateVendorPhone'} />
            </VarField>
            <VarField>
              <StringInput name={'updateVendorAcctNum'} />
            </VarField>
            <VarField>
              <BooleanInput name={'updateVendorVendor1099'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
