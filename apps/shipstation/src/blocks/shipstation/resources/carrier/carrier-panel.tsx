// src/blocks/shipstation/resources/carrier/carrier-panel.tsx

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { shipstationSchema } from '../../shipstation-schema'
import listCarriers from '../../shared/list-carriers.server'
import { useShipstationData } from '../../shared/use-shipstation-data'

interface CarrierPanelProps {
  api: UseWorkflowApi<typeof shipstationSchema>
}

/**
 * The `carrier` resource panel.
 *
 * The carrier picker is loaded only for the two carrier-scoped operations. A
 * carrier list is pointless while the author is filling in `getMany`, which is
 * what produces that list in the first place.
 */
export function CarrierPanel({ api }: CarrierPanelProps) {
  const { data, NumberInput, OptionsInput, VarField, VarFieldGroup, Section, ConditionalRender } =
    api

  const operation = (data?.operation ?? '') as string
  const needsCarrier = operation === 'getServices' || operation === 'getPackageTypes'

  const { data: carriers, loading: carriersLoading } = useShipstationData(
    'carriers',
    listCarriers,
    { enabled: needsCarrier }
  )
  const carrierOptions = carriersLoading ? [{ label: 'Loading carriers...', value: '' }] : carriers

  return (
    <>
      {/* Carrier: Get Many */}
      <ConditionalRender when={(d) => d.operation === 'getMany'}>
        <Section title="Carriers" collapsible>
          <VarFieldGroup>
            <VarField>
              <NumberInput name="carrierGetManyPage" />
            </VarField>
            <VarField>
              <NumberInput name="carrierGetManyPageSize" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Carrier: Get Services */}
      <ConditionalRender when={(d) => d.operation === 'getServices'}>
        <Section title="Carrier">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="carrierGetServicesCarrierId" options={carrierOptions} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Carrier: Get Package Types */}
      <ConditionalRender when={(d) => d.operation === 'getPackageTypes'}>
        <Section title="Carrier">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="carrierGetPackageTypesCarrierId" options={carrierOptions} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
