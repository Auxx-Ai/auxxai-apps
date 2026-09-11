// src/blocks/shipstation/resources/rate/rate-panel.tsx

/**
 * Panel for the `rate` resource.
 *
 * Three operations with very different appetites: an estimate wants four
 * locality fields, a rate shop wants a whole shipment, and a shipment rate list
 * wants an id. Each is behind its own `ConditionalRender` so an author only ever
 * sees the one they picked.
 *
 * The packages array renders with `<ArrayInput>` and its child inputs INSIDE it;
 * the SDK scopes the child paths within the template. The reference for this is
 * `apps/supabase/.../row-panel.tsx` (`createFields`), NOT the Shopify block,
 * whose `createLineItems` array is declared and never rendered.
 *
 * Addresses render through `VarInput`, which resolves the field's declared type
 * from the schema; a `Workflow.address()` field therefore reaches the platform's
 * real address input, with its paste-parse and org country default.
 */

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { shipstationSchema } from '../../shipstation-schema'
import listCarriers from '../../shared/list-carriers.server'
import listWarehouses from '../../shared/list-warehouses.server'
import { usePackageTypes } from '../../shared/use-package-types'
import { useShipstationData } from '../../shared/use-shipstation-data'

interface RatePanelProps {
  api: UseWorkflowApi<typeof shipstationSchema>
}

export function RatePanel({ api }: RatePanelProps) {
  const {
    data,
    StringInput,
    NumberInput,
    BooleanInput,
    CurrencyInput,
    OptionsInput,
    ArrayInput,
    VarInput,
    VarField,
    VarFieldGroup,
    Section,
    ConditionalRender,
  } = api

  const active = (data?.resource as string) === 'rate'
  const operation = data?.operation as string | undefined
  const ratesShipment = active && (operation === 'estimate' || operation === 'getMany')

  const { data: carriers, loading: carriersLoading } = useShipstationData(
    'shipstation.carriers',
    listCarriers,
    { enabled: ratesShipment }
  )
  const { data: warehouses, loading: warehousesLoading } = useShipstationData(
    'shipstation.warehouses',
    listWarehouses,
    { enabled: active && operation === 'getMany' && data?.rateGetManyShipFromMode !== 'address' }
  )

  const { data: packageTypes } = usePackageTypes(ratesShipment)

  const carrierOptions = carriersLoading ? [{ label: 'Loading carriers...', value: '' }] : carriers
  const warehouseOptions = warehousesLoading
    ? [{ label: 'Loading warehouses...', value: '' }]
    : warehouses

  return (
    <>
      {/* Rate: Estimate */}
      <ConditionalRender when={(d) => d.operation === 'estimate'}>
        <Section title="Route">
          <VarFieldGroup>
            <VarField>
              <VarInput name="rateEstimateShipFrom" />
            </VarField>
            <VarField>
              <VarInput name="rateEstimateShipTo" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Parcel">
          <VarFieldGroup>
            <VarField>
              <NumberInput name="rateEstimateWeightValue" />
            </VarField>
            <VarField>
              <OptionsInput name="rateEstimateWeightUnit" />
            </VarField>
            <VarField>
              <NumberInput name="rateEstimateLength" />
            </VarField>
            <VarField>
              <NumberInput name="rateEstimateWidth" />
            </VarField>
            <VarField>
              <NumberInput name="rateEstimateHeight" />
            </VarField>
            <VarField>
              <OptionsInput name="rateEstimateDimensionUnit" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="rateEstimateCarrierIds" options={carrierOptions} />
            </VarField>
            <VarField>
              <OptionsInput name="rateEstimateConfirmation" />
            </VarField>
            <VarField>
              <OptionsInput name="rateEstimateResidential" />
            </VarField>
            <VarField>
              <StringInput name="rateEstimateShipDate" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Rate: Get Many (the full rate shop) */}
      <ConditionalRender when={(d) => d.operation === 'getMany'}>
        <Section title="Carriers">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="rateGetManyCarrierIds" options={carrierOptions} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Ship to">
          <VarFieldGroup>
            <VarField>
              <VarInput name="rateGetManyShipTo" />
            </VarField>
            <VarField>
              <StringInput name="rateGetManyShipToPhone" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Ship from">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="rateGetManyShipFromMode" />
            </VarField>
            <ConditionalRender when={(d) => d.rateGetManyShipFromMode !== 'address'}>
              <VarField>
                <OptionsInput name="rateGetManyWarehouseId" options={warehouseOptions} />
              </VarField>
            </ConditionalRender>
            <ConditionalRender when={(d) => d.rateGetManyShipFromMode === 'address'}>
              <VarField>
                <VarInput name="rateGetManyShipFrom" />
              </VarField>
              <VarField>
                <StringInput name="rateGetManyShipFromPhone" />
              </VarField>
            </ConditionalRender>
          </VarFieldGroup>
        </Section>
        <Section title="Packages">
          <ArrayInput name="rateGetManyPackages" addLabel="Add Package">
            <VarFieldGroup>
              <VarField>
                <NumberInput name="weightValue" />
              </VarField>
              <VarField>
                <OptionsInput name="weightUnit" />
              </VarField>
              <VarField>
                <NumberInput name="length" />
              </VarField>
              <VarField>
                <NumberInput name="width" />
              </VarField>
              <VarField>
                <NumberInput name="height" />
              </VarField>
              <VarField>
                <OptionsInput name="dimensionUnit" />
              </VarField>
              <VarField>
                {/* No package-type loader exists in `shared/` yet, so this is
                    an author-supplied or bound value. ShipStation falls back to
                    the carrier default when it is empty. */}
                <OptionsInput
                  name="packageCode"
                  acceptsVariables
                  placeholder="Carrier default"
                  options={packageTypes}
                />
              </VarField>
              <VarField>
                <CurrencyInput name="insuredValue" />
              </VarField>
              <VarField>
                <StringInput name="contentDescription" />
              </VarField>
              <VarField>
                <StringInput name="externalPackageId" />
              </VarField>
              <VarField>
                <StringInput name="reference1" />
              </VarField>
              <VarField>
                <StringInput name="reference2" />
              </VarField>
              <VarField>
                <StringInput name="reference3" />
              </VarField>
            </VarFieldGroup>
          </ArrayInput>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="rateGetManyConfirmation" />
            </VarField>
            <VarField>
              <StringInput name="rateGetManyShipDate" />
            </VarField>
            <VarField>
              <StringInput name="rateGetManyServiceCodes" />
            </VarField>
            <VarField>
              <StringInput name="rateGetManyPackageTypes" />
            </VarField>
            <VarField>
              <StringInput name="rateGetManyPreferredCurrency" />
            </VarField>
            <VarField>
              <BooleanInput name="rateGetManyCalculateTaxAmount" />
            </VarField>
            <VarField>
              <BooleanInput name="rateGetManyIsReturn" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Rate: Get Rates for Shipment */}
      <ConditionalRender when={(d) => d.operation === 'getForShipment'}>
        <Section title="Shipment">
          <VarFieldGroup>
            <VarField>
              <StringInput name="rateGetForShipmentShipmentId" />
            </VarField>
            <VarField>
              <StringInput name="rateGetForShipmentCreatedAtStart" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
