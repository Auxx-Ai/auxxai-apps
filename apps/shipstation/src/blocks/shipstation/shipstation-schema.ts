// src/blocks/shipstation/shipstation-schema.ts

/**
 * The `shipstation` block schema.
 *
 * Every resource's inputs are merged into ONE flat `inputs` object, which is why
 * input keys are namespaced. The convention, which every resource must follow:
 *
 *     <resource><Operation><Field>      e.g. shipmentGetId, labelCreateFrom
 *
 * This is collision-free by construction across 7 resources and 23 operations,
 * and it lets the dispatcher forward the flat input to an internal tool without
 * any per-operation projection.
 *
 * `computeOutputs` dispatches per resource so downstream nodes see the variables
 * that operation actually produces, rather than a union of everything.
 */

import { type WorkflowSchema, Workflow } from '@auxx/sdk'
import { ALL_OPERATIONS, RESOURCES } from './resources/constants'
import { addressComputeOutputs, addressInputs } from './resources/address/address-schema'
import { carrierComputeOutputs, carrierInputs } from './resources/carrier/carrier-schema'
import {
  fulfillmentComputeOutputs,
  fulfillmentInputs,
} from './resources/fulfillment/fulfillment-schema'
import { labelComputeOutputs, labelInputs } from './resources/label/label-schema'
import { rateComputeOutputs, rateInputs } from './resources/rate/rate-schema'
import { shipmentComputeOutputs, shipmentInputs } from './resources/shipment/shipment-schema'
import { trackingComputeOutputs, trackingInputs } from './resources/tracking/tracking-schema'

export const shipstationSchema = {
  inputs: {
    resource: Workflow.select({
      label: 'Resource',
      options: [...RESOURCES],
      default: 'shipment',
    }),
    operation: Workflow.select({
      label: 'Operation',
      options: ALL_OPERATIONS as any,
      default: 'getMany',
    }),
    ...shipmentInputs,
    ...labelInputs,
    ...trackingInputs,
    ...rateInputs,
    ...carrierInputs,
    ...addressInputs,
    ...fulfillmentInputs,
  },
  outputs: {},
  computeOutputs: (inputs: any) => {
    const { resource, operation } = inputs
    if (resource === 'shipment') return shipmentComputeOutputs(operation)
    if (resource === 'label') return labelComputeOutputs(operation)
    if (resource === 'tracking') return trackingComputeOutputs(operation)
    if (resource === 'rate') return rateComputeOutputs(operation)
    if (resource === 'carrier') return carrierComputeOutputs(operation)
    if (resource === 'address') return addressComputeOutputs(operation)
    if (resource === 'fulfillment') return fulfillmentComputeOutputs(operation)
    return {}
  },
} satisfies WorkflowSchema
