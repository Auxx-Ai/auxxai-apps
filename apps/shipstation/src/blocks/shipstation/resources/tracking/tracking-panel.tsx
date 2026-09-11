// src/blocks/shipstation/resources/tracking/tracking-panel.tsx

/**
 * Panel for the `tracking` resource.
 *
 * One operation and three inputs, so this stays flat: a tracking number, and
 * the carrier named either by code or by connected account.
 *
 * The carrier list is loaded lazily and only while this resource is selected,
 * so filling in a shipment or a rate never costs a `/v2/carriers` call.
 */

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { shipstationSchema } from '../../shipstation-schema'
import listCarriers from '../../shared/list-carriers.server'
import { useShipstationData } from '../../shared/use-shipstation-data'

interface TrackingPanelProps {
  api: UseWorkflowApi<typeof shipstationSchema>
}

export function TrackingPanel({ api }: TrackingPanelProps) {
  const { data, StringInput, OptionsInput, VarField, VarFieldGroup, Section, ConditionalRender } =
    api

  const carrierPickerActive =
    (data?.resource as string) === 'tracking' && data?.trackingGetCarrierBy === 'id'

  const { data: carriers, loading: carriersLoading } = useShipstationData(
    'shipstation.carriers',
    listCarriers,
    { enabled: carrierPickerActive }
  )

  const carrierOptions = carriersLoading ? [{ label: 'Loading carriers...', value: '' }] : carriers

  return (
    <>
      {/* Tracking: Get */}
      <ConditionalRender when={(d) => d.operation === 'get'}>
        <Section title="Parcel">
          <VarFieldGroup>
            <VarField>
              <StringInput name="trackingGetTrackingNumber" />
            </VarField>
            <VarField>
              <OptionsInput name="trackingGetCarrierBy" />
            </VarField>
            <ConditionalRender when={(d) => d.trackingGetCarrierBy !== 'id'}>
              <VarField>
                <StringInput name="trackingGetCarrierCode" />
              </VarField>
            </ConditionalRender>
            <ConditionalRender when={(d) => d.trackingGetCarrierBy === 'id'}>
              <VarField>
                <OptionsInput name="trackingGetCarrierId" options={carrierOptions} />
              </VarField>
            </ConditionalRender>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
