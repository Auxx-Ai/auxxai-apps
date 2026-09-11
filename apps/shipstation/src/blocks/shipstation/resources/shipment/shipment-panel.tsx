// src/blocks/shipstation/resources/shipment/shipment-panel.tsx

/**
 * The `shipment` resource's panel: one `ConditionalRender` per operation, all
 * reading from the block's single flat input namespace.
 *
 * The warehouse and carrier pickers are loaded lazily and only for the two
 * operations that describe a shipment, so opening a tag or note operation costs
 * no ShipStation calls.
 */

import type { UseWorkflowApi } from '@auxx/sdk/client'
import listCarriers from '../../shared/list-carriers.server'
import listWarehouses from '../../shared/list-warehouses.server'
import { useCarrierServices } from '../../shared/use-carrier-services'
import { usePackageTypes } from '../../shared/use-package-types'
import { useShipstationData } from '../../shared/use-shipstation-data'
import type { shipstationSchema } from '../../shipstation-schema'

interface ShipmentPanelProps {
  api: UseWorkflowApi<typeof shipstationSchema>
}

type SelectOption = { label: string; value: string }

function withLoading(options: SelectOption[], loading: boolean, what: string): SelectOption[] {
  return loading && options.length === 0 ? [{ label: `Loading ${what}...`, value: '' }] : options
}

export function ShipmentPanel({ api }: ShipmentPanelProps) {
  const {
    data,
    StringInput,
    NumberInput,
    OptionsInput,
    VarInput,
    ArrayInput,
    VarField,
    VarFieldGroup,
    Section,
    ConditionalRender,
  } = api

  const operation = (data?.operation ?? '') as string
  const describesAShipment =
    data?.resource === 'shipment' && (operation === 'create' || operation === 'update')

  const { data: warehouses, loading: warehousesLoading } = useShipstationData(
    'warehouses',
    listWarehouses,
    { enabled: describesAShipment }
  )
  const { data: carriers, loading: carriersLoading } = useShipstationData(
    'carriers',
    listCarriers,
    { enabled: describesAShipment }
  )

  const { data: packageTypes, loading: packageTypesLoading } = usePackageTypes(describesAShipment)

  // Scoped to whichever carrier THIS operation has selected — create and update
  // are separate fields and only one of them renders at a time.
  const selectedCarrierId = (
    operation === 'update' ? data?.shipmentUpdateCarrierId : data?.shipmentCreateCarrierId
  ) as string | undefined
  const { data: services, loading: servicesLoading } = useCarrierServices(
    selectedCarrierId,
    describesAShipment
  )

  const warehouseOptions = withLoading(warehouses, warehousesLoading, 'warehouses')
  const carrierOptions = withLoading(carriers, carriersLoading, 'carriers')
  // No carrier chosen yet is not "loading" — it is a question the author has not
  // answered, so say that rather than spinning forever on an empty list.
  const serviceOptions = selectedCarrierId
    ? withLoading(services, servicesLoading, 'services')
    : [{ label: 'Choose a carrier first', value: '' }]

  return (
    <>
      {/* --- Shipment: Get Many --- */}
      <ConditionalRender when={(d) => d.operation === 'getMany'}>
        <Section title="Filter">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="shipmentGetManyStatus" />
            </VarField>
            <VarField>
              <VarInput name="shipmentGetManyModifiedAtStart" />
            </VarField>
            <VarField>
              <VarInput name="shipmentGetManyModifiedAtEnd" />
            </VarField>
            <VarField>
              <StringInput name="shipmentGetManyTag" />
            </VarField>
            <VarField>
              <StringInput name="shipmentGetManyShipToName" />
            </VarField>
          </VarFieldGroup>
        </Section>

        <Section title="More filters" collapsible>
          <VarFieldGroup>
            <VarField>
              <VarInput name="shipmentGetManyCreatedAtStart" />
            </VarField>
            <VarField>
              <VarInput name="shipmentGetManyCreatedAtEnd" />
            </VarField>
            <VarField>
              <StringInput name="shipmentGetManyStoreId" />
            </VarField>
            <VarField>
              <StringInput name="shipmentGetManySalesOrderId" />
            </VarField>
            <VarField>
              <StringInput name="shipmentGetManyBatchId" />
            </VarField>
            <VarField>
              <StringInput name="shipmentGetManyShipmentNumber" />
            </VarField>
            <VarField>
              <StringInput name="shipmentGetManyItemKeyword" />
            </VarField>
          </VarFieldGroup>
        </Section>

        <Section title="Paging and order" collapsible>
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="shipmentGetManySortBy" />
            </VarField>
            <VarField>
              <OptionsInput name="shipmentGetManySortDir" />
            </VarField>
            <VarField>
              <NumberInput name="shipmentGetManyPage" />
            </VarField>
            <VarField>
              <NumberInput name="shipmentGetManyPageSize" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* --- Shipment: Get --- */}
      <ConditionalRender when={(d) => d.operation === 'get'}>
        <Section title="Shipment">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="shipmentGetIdKind" />
            </VarField>
            <VarField>
              <StringInput name="shipmentGetId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* --- Shipment: Create --- */}
      <ConditionalRender when={(d) => d.operation === 'create'}>
        <Section title="Ship to">
          <VarFieldGroup>
            <VarField>
              <VarInput name="shipmentCreateShipTo" />
            </VarField>
            <VarField>
              <StringInput name="shipmentCreateShipToPhone" />
            </VarField>
          </VarFieldGroup>
        </Section>

        <Section title="Ship from">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="shipmentCreateShipFromMode" />
            </VarField>
            <ConditionalRender when={(d) => d.shipmentCreateShipFromMode !== 'address'}>
              <VarField>
                <OptionsInput
                  name="shipmentCreateWarehouseId"
                  options={warehouseOptions}
                  loading={warehousesLoading}
                />
              </VarField>
            </ConditionalRender>
            <ConditionalRender when={(d) => d.shipmentCreateShipFromMode === 'address'}>
              <VarField>
                <VarInput name="shipmentCreateShipFrom" />
              </VarField>
              <VarField>
                <StringInput name="shipmentCreateShipFromPhone" />
              </VarField>
            </ConditionalRender>
          </VarFieldGroup>
        </Section>

        <Section title="Packages">
          <ArrayInput name="shipmentCreatePackages" addLabel="Add package">
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
                <OptionsInput
                  name="packageCode"
                  options={withLoading(packageTypes, packageTypesLoading, 'package types')}
                  acceptsVariables
                  placeholder="Carrier default"
                />
              </VarField>
              <VarField>
                <VarInput name="insuredValue" />
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

        <Section title="Carrier and service" collapsible>
          <VarFieldGroup>
            <VarField>
              <OptionsInput
                name="shipmentCreateCarrierId"
                options={carrierOptions}
                loading={carriersLoading}
              />
            </VarField>
            <VarField>
              <OptionsInput
                name="shipmentCreateServiceCode"
                options={serviceOptions}
                loading={servicesLoading}
                acceptsVariables
              />
            </VarField>
            <VarField>
              <VarInput name="shipmentCreateShipDate" />
            </VarField>
          </VarFieldGroup>
        </Section>

        <Section title="Reference" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="shipmentCreateExternalShipmentId" />
            </VarField>
            <VarField>
              <StringInput name="shipmentCreateStoreId" />
            </VarField>
            <VarField>
              <StringInput name="shipmentCreateInternalNotes" multiline />
            </VarField>
            <VarField>
              <OptionsInput name="shipmentCreateValidateAddress" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* --- Shipment: Update --- */}
      <ConditionalRender when={(d) => d.operation === 'update'}>
        <Section title="Shipment">
          <VarFieldGroup>
            <VarField>
              <StringInput name="shipmentUpdateShipmentId" />
            </VarField>
          </VarFieldGroup>
        </Section>

        <Section title="Ship to" collapsible>
          <VarFieldGroup>
            <VarField>
              <VarInput name="shipmentUpdateShipTo" />
            </VarField>
            <VarField>
              <StringInput name="shipmentUpdateShipToPhone" />
            </VarField>
          </VarFieldGroup>
        </Section>

        <Section title="Ship from" collapsible>
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="shipmentUpdateShipFromMode" />
            </VarField>
            <ConditionalRender when={(d) => d.shipmentUpdateShipFromMode === 'warehouse'}>
              <VarField>
                <OptionsInput
                  name="shipmentUpdateWarehouseId"
                  options={warehouseOptions}
                  loading={warehousesLoading}
                />
              </VarField>
            </ConditionalRender>
            <ConditionalRender when={(d) => d.shipmentUpdateShipFromMode === 'address'}>
              <VarField>
                <VarInput name="shipmentUpdateShipFrom" />
              </VarField>
              <VarField>
                <StringInput name="shipmentUpdateShipFromPhone" />
              </VarField>
            </ConditionalRender>
          </VarFieldGroup>
        </Section>

        <Section title="Packages" collapsible>
          <ArrayInput name="shipmentUpdatePackages" addLabel="Add package">
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
                <OptionsInput
                  name="packageCode"
                  options={withLoading(packageTypes, packageTypesLoading, 'package types')}
                  acceptsVariables
                  placeholder="Carrier default"
                />
              </VarField>
              <VarField>
                <VarInput name="insuredValue" />
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

        <Section title="Carrier and reference" collapsible>
          <VarFieldGroup>
            <VarField>
              <OptionsInput
                name="shipmentUpdateCarrierId"
                options={carrierOptions}
                loading={carriersLoading}
              />
            </VarField>
            <VarField>
              <OptionsInput
                name="shipmentUpdateServiceCode"
                options={serviceOptions}
                loading={servicesLoading}
                acceptsVariables
              />
            </VarField>
            <VarField>
              <VarInput name="shipmentUpdateShipDate" />
            </VarField>
            <VarField>
              <StringInput name="shipmentUpdateExternalShipmentId" />
            </VarField>
            <VarField>
              <StringInput name="shipmentUpdateShipmentNumber" />
            </VarField>
            <VarField>
              <StringInput name="shipmentUpdateStoreId" />
            </VarField>
            <VarField>
              <StringInput name="shipmentUpdateInternalNotes" multiline />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* --- Shipment: Cancel --- */}
      <ConditionalRender when={(d) => d.operation === 'cancel'}>
        <Section title="Shipment">
          <VarFieldGroup>
            <VarField>
              <StringInput name="shipmentCancelShipmentId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* --- Shipment: Add Tag --- */}
      <ConditionalRender when={(d) => d.operation === 'addTag'}>
        <Section title="Tag">
          <VarFieldGroup>
            <VarField>
              <StringInput name="shipmentAddTagShipmentId" />
            </VarField>
            <VarField>
              <StringInput name="shipmentAddTagName" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* --- Shipment: Remove Tag --- */}
      <ConditionalRender when={(d) => d.operation === 'removeTag'}>
        <Section title="Tag">
          <VarFieldGroup>
            <VarField>
              <StringInput name="shipmentRemoveTagShipmentId" />
            </VarField>
            <VarField>
              <StringInput name="shipmentRemoveTagName" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* --- Shipment: Add Internal Note --- */}
      <ConditionalRender when={(d) => d.operation === 'addNote'}>
        <Section title="Internal note">
          <VarFieldGroup>
            <VarField>
              <StringInput name="shipmentAddNoteShipmentId" />
            </VarField>
            <VarField>
              <StringInput name="shipmentAddNoteNote" multiline />
            </VarField>
            <VarField>
              <OptionsInput name="shipmentAddNoteMode" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
