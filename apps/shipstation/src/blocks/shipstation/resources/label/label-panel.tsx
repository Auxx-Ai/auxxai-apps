// src/blocks/shipstation/resources/label/label-panel.tsx

/**
 * The `label` resource panel.
 *
 * Rendered inside `shipstation-panel.tsx`'s `resource === 'label'` branch, so
 * everything here conditions on `operation` only.
 *
 * ## The shape of `create`
 *
 * `label.create` is one operation with three modes, and the mode select is the
 * first thing an author sees. The address and package inputs render ONLY in
 * `scratch` mode. That is the point of collapsing the three purchase endpoints:
 * buying the label for a shipment a previous node produced stays a one-field
 * panel, and the full shipment payload appears only when the author actually
 * has to describe a shipment that does not exist yet.
 */

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { shipstationSchema } from '../../shipstation-schema'
import listCarriers from '../../shared/list-carriers.server'
import listWarehouses from '../../shared/list-warehouses.server'
import { usePackageTypes } from '../../shared/use-package-types'
import { useShipstationData } from '../../shared/use-shipstation-data'

interface LabelPanelProps {
  api: UseWorkflowApi<typeof shipstationSchema>
}

export function LabelPanel({ api }: LabelPanelProps) {
  const {
    StringInput,
    NumberInput,
    BooleanInput,
    OptionsInput,
    VarInput,
    ArrayInput,
    VarField,
    VarFieldGroup,
    Section,
    ConditionalRender,
    data,
  } = api

  const operation = (data?.operation ?? '') as string
  const purchaseFrom = (data?.labelCreateFrom ?? 'shipment') as string

  // Only load a picker the author can actually see. A carrier list is pointless
  // while somebody is filling in a void or a track lookup.
  const needsCarriers =
    operation === 'getMany' || (operation === 'create' && purchaseFrom === 'scratch')
  const needsWarehouses =
    operation === 'create' &&
    purchaseFrom === 'scratch' &&
    (data?.labelCreateShipFromMode ?? 'warehouse') === 'warehouse'

  const { data: carriers, loading: carriersLoading } = useShipstationData(
    'shipstation:carriers',
    listCarriers,
    { enabled: needsCarriers }
  )
  const { data: warehouses, loading: warehousesLoading } = useShipstationData(
    'shipstation:warehouses',
    listWarehouses,
    { enabled: needsWarehouses }
  )

  const { data: packageTypes, loading: packageTypesLoading } = usePackageTypes(
    operation === 'create' && purchaseFrom === 'scratch'
  )
  const packageTypeOptions = packageTypesLoading
    ? [{ label: 'Loading package types...', value: '' }]
    : packageTypes

  const carrierOptions = carriersLoading
    ? [{ value: '', label: 'Loading carriers...' }]
    : [{ value: '', label: 'Any carrier' }, ...carriers]
  const warehouseOptions = warehousesLoading
    ? [{ value: '', label: 'Loading warehouses...' }]
    : warehouses

  return (
    <>
      {/* --- Label: Get Many --- */}
      <ConditionalRender when={(d) => d.operation === 'getMany'}>
        <Section title="Filters">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="labelGetManyStatus" />
            </VarField>
            <VarField>
              <OptionsInput name="labelGetManyCarrierId" options={carrierOptions} />
            </VarField>
            <VarField>
              <StringInput name="labelGetManyServiceCode" />
            </VarField>
            <VarField>
              <StringInput name="labelGetManyTrackingNumber" />
            </VarField>
            <VarField>
              <StringInput name="labelGetManyShipmentId" />
            </VarField>
            <VarField>
              <StringInput name="labelGetManyExternalShipmentId" />
            </VarField>
            <VarField>
              <StringInput name="labelGetManyBatchId" />
            </VarField>
            <VarField>
              <StringInput name="labelGetManyWarehouseId" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Created">
          <VarFieldGroup>
            <VarField>
              <StringInput name="labelGetManyCreatedAtStart" />
            </VarField>
            <VarField>
              <StringInput name="labelGetManyCreatedAtEnd" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Paging">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="labelGetManySortBy" />
            </VarField>
            <VarField>
              <OptionsInput name="labelGetManySortDir" />
            </VarField>
            <VarField>
              <NumberInput name="labelGetManyPage" />
            </VarField>
            <VarField>
              <NumberInput name="labelGetManyPageSize" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* --- Label: Get --- */}
      <ConditionalRender when={(d) => d.operation === 'get'}>
        <Section title="Label">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="labelGetIdKind" />
            </VarField>
            <VarField>
              <StringInput name="labelGetId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* --- Label: Purchase (create) --- */}
      <ConditionalRender when={(d) => d.operation === 'create'}>
        <Section title="Purchase">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="labelCreateFrom" />
            </VarField>
          </VarFieldGroup>
        </Section>

        <ConditionalRender when={(d) => d.labelCreateFrom === 'shipment'}>
          <Section title="Shipment">
            <VarFieldGroup>
              <VarField>
                <StringInput name="labelCreateShipmentId" />
              </VarField>
            </VarFieldGroup>
          </Section>
        </ConditionalRender>

        <ConditionalRender when={(d) => d.labelCreateFrom === 'rate'}>
          <Section title="Rate">
            <VarFieldGroup>
              <VarField>
                <StringInput name="labelCreateRateId" />
              </VarField>
            </VarFieldGroup>
          </Section>
        </ConditionalRender>

        {/* The full shipment payload. Renders only in scratch mode, which is
            what keeps the two common modes above a one-field panel. */}
        <ConditionalRender when={(d) => d.labelCreateFrom === 'scratch'}>
          <Section title="Service">
            <VarFieldGroup>
              <VarField>
                <OptionsInput name="labelCreateCarrierId" options={carrierOptions} />
              </VarField>
              <VarField>
                <StringInput name="labelCreateServiceCode" />
              </VarField>
            </VarFieldGroup>
          </Section>

          <Section title="Ship to">
            <VarFieldGroup>
              <VarField>
                <VarInput name="labelCreateShipTo" />
              </VarField>
              <VarField>
                <StringInput name="labelCreateShipToPhone" />
              </VarField>
            </VarFieldGroup>
          </Section>

          <Section title="Ship from">
            <VarFieldGroup>
              <VarField>
                <OptionsInput name="labelCreateShipFromMode" />
              </VarField>
            </VarFieldGroup>
            <ConditionalRender
              when={(d) => (d.labelCreateShipFromMode ?? 'warehouse') === 'warehouse'}
            >
              <VarFieldGroup>
                <VarField>
                  <OptionsInput name="labelCreateWarehouseId" options={warehouseOptions} />
                </VarField>
              </VarFieldGroup>
            </ConditionalRender>
            <ConditionalRender when={(d) => d.labelCreateShipFromMode === 'address'}>
              <VarFieldGroup>
                <VarField>
                  <VarInput name="labelCreateShipFrom" />
                </VarField>
                <VarField>
                  <StringInput name="labelCreateShipFromPhone" />
                </VarField>
              </VarFieldGroup>
            </ConditionalRender>
          </Section>

          <Section title="Packages">
            <ArrayInput name="labelCreatePackages" addLabel="Add Package">
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
                  <OptionsInput name="packageCode" options={packageTypeOptions} acceptsVariables />
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

          <Section title="Options">
            <VarFieldGroup>
              <VarField>
                <OptionsInput name="labelCreateConfirmation" />
              </VarField>
              <VarField>
                <OptionsInput name="labelCreateInsuranceProvider" />
              </VarField>
              <VarField>
                <StringInput name="labelCreateShipDate" />
              </VarField>
              <VarField>
                <StringInput name="labelCreateExternalShipmentId" />
              </VarField>
              <VarField>
                <OptionsInput name="labelCreateValidateAddress" />
              </VarField>
            </VarFieldGroup>
          </Section>
        </ConditionalRender>

        <Section title="Label output">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="labelCreateLabelFormat" />
            </VarField>
            <VarField>
              <OptionsInput name="labelCreateLabelLayout" />
            </VarField>
            <VarField>
              <BooleanInput name="labelCreateTestLabel" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* --- Label: Void --- */}
      <ConditionalRender when={(d) => d.operation === 'void'}>
        <Section title="Void">
          <VarFieldGroup>
            <VarField>
              <StringInput name="labelVoidId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* --- Label: Cancel Refund Request --- */}
      <ConditionalRender when={(d) => d.operation === 'cancelRefund'}>
        <Section title="Cancel refund">
          <VarFieldGroup>
            <VarField>
              <StringInput name="labelCancelRefundId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* --- Label: Create Return Label --- */}
      <ConditionalRender when={(d) => d.operation === 'createReturn'}>
        <Section title="Return label">
          <VarFieldGroup>
            <VarField>
              <StringInput name="labelCreateReturnId" />
            </VarField>
            <VarField>
              <OptionsInput name="labelCreateReturnLabelFormat" />
            </VarField>
            <VarField>
              <OptionsInput name="labelCreateReturnLabelLayout" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* --- Label: Track (master) --- */}
      <ConditionalRender when={(d) => d.operation === 'track'}>
        <Section title="Master tracking">
          <VarFieldGroup>
            <VarField>
              <StringInput name="labelTrackId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
