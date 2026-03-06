// src/blocks/shopify/resources/draft-order/draft-order-panel.tsx

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { shopifySchema } from '../../shopify-schema'

interface DraftOrderPanelProps {
  api: UseWorkflowApi<typeof shopifySchema>
}

export function DraftOrderPanel({ api }: DraftOrderPanelProps) {
  const { StringInput, OptionsInput, BooleanInput, VarInput, VarField, VarFieldGroup, Section, ConditionalRender } = api

  return (
    <>
      {/* Draft Order: Create */}
      <ConditionalRender when={(d) => d.operation === 'create'}>
        <Section title="Customer">
          <VarFieldGroup>
            <VarField>
              <StringInput name="createCustomerId" />
            </VarField>
            <VarField>
              <StringInput name="createEmail" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Details" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="createNote" />
            </VarField>
            <VarField>
              <StringInput name="createTags" />
            </VarField>
            <VarField>
              <BooleanInput name="createTaxExempt" />
            </VarField>
            <VarField>
              <BooleanInput name="createUseCustomerDefaultAddress" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Shipping Address" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="createShippingFirstName" />
            </VarField>
            <VarField>
              <StringInput name="createShippingLastName" />
            </VarField>
            <VarField>
              <StringInput name="createShippingAddress1" />
            </VarField>
            <VarField>
              <StringInput name="createShippingAddress2" />
            </VarField>
            <VarField>
              <StringInput name="createShippingCity" />
            </VarField>
            <VarField>
              <StringInput name="createShippingProvince" />
            </VarField>
            <VarField>
              <StringInput name="createShippingCountry" />
            </VarField>
            <VarField>
              <StringInput name="createShippingZip" />
            </VarField>
            <VarField>
              <StringInput name="createShippingPhone" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Draft Order: Update */}
      <ConditionalRender when={(d) => d.operation === 'update'}>
        <Section title="Draft Order">
          <VarFieldGroup>
            <VarField>
              <StringInput name="updateDraftOrderId" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Update Fields">
          <VarFieldGroup>
            <VarField>
              <StringInput name="updateNote" />
            </VarField>
            <VarField>
              <StringInput name="updateTags" />
            </VarField>
            <VarField>
              <StringInput name="updateEmail" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Draft Order: Get */}
      <ConditionalRender when={(d) => d.operation === 'get'}>
        <Section title="Draft Order">
          <VarFieldGroup>
            <VarField>
              <StringInput name="getDraftOrderId" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <VarInput name="getFields" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Draft Order: Get Many */}
      <ConditionalRender when={(d) => d.operation === 'getMany'}>
        <Section title="Draft Orders">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="getManyLimit" />
            </VarField>
            <VarField>
              <OptionsInput name="getManyStatus" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <VarInput name="getManyFields" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Draft Order: Delete */}
      <ConditionalRender when={(d) => d.operation === 'delete'}>
        <Section title="Draft Order to Delete">
          <VarFieldGroup>
            <VarField>
              <StringInput name="deleteDraftOrderId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Draft Order: Complete */}
      <ConditionalRender when={(d) => d.operation === 'complete'}>
        <Section title="Complete Draft Order">
          <VarFieldGroup>
            <VarField>
              <StringInput name="completeDraftOrderId" />
            </VarField>
            <VarField>
              <BooleanInput name="completePaymentPending" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Draft Order: Send Invoice */}
      <ConditionalRender when={(d) => d.operation === 'sendInvoice'}>
        <Section title="Send Invoice">
          <VarFieldGroup>
            <VarField>
              <StringInput name="sendInvoiceDraftOrderId" />
            </VarField>
            <VarField>
              <StringInput name="sendInvoiceTo" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Email Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="sendInvoiceSubject" />
            </VarField>
            <VarField>
              <StringInput name="sendInvoiceCustomMessage" />
            </VarField>
            <VarField>
              <StringInput name="sendInvoiceBcc" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
