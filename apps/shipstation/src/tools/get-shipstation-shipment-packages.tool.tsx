// src/tools/get-shipstation-shipment-packages.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shipstationIcon from '../assets/icon.png'
import getShipstationShipmentPackagesExecute from './get-shipstation-shipment-packages.tool.server'
import { exampleLabel, labelSchema } from './shared/schemas'

export const getShipstationShipmentPackagesTool = defineTool({
  id: 'get_shipstation_shipment_packages',
  name: 'Get shipment packages and tracking',
  description:
    'Get every package and tracking number for one ShipStation shipment. A shipment can be sent ' +
    'as several boxes, each with its own tracking number, and can have more than one label if a ' +
    'label was voided and re-printed. Voided labels are returned too, flagged, because they are ' +
    'the shipment’s history — read activeLabels for what is actually in transit.',
  icon: shipstationIcon,
  inputs: z.object({
    shipmentId: z.string().describe('ShipStation shipment id, e.g. se-428778294.'),
  }),
  outputs: z.object({
    shipmentId: z.string(),
    shipmentNumber: z.string().nullable(),
    storeId: z.string().nullable(),
    shipmentStatus: z.string().nullable(),
    externalShipmentId: z
      .string()
      .nullable()
      .describe(
        'Raw upstream id as ShipStation reports it. Its commerce meaning is unverified — do not parse it into order or fulfillment ids.'
      ),
    activeLabels: z.array(labelSchema).describe('Labels that are not voided.'),
    voidedLabels: z.array(labelSchema).describe('Voided labels, kept as history.'),
    activeTrackingNumbers: z
      .array(z.string())
      .describe(
        'Every tracking number across the active labels, ordered by label then box sequence.'
      ),
    complete: z
      .boolean()
      .describe('False when the label history was longer than this tool could page through.'),
  }),
  exampleOutput: {
    shipmentId: 'se-428778294',
    shipmentNumber: '14530',
    storeId: 'se-2943015',
    shipmentStatus: 'label_purchased',
    externalShipmentId: '7489518207152-8681743417520',
    activeLabels: [exampleLabel],
    voidedLabels: [],
    activeTrackingNumbers: ['770000000003', '770000000002', '770000000001'],
    complete: true,
  },
  config: { requiresConnection: true, idempotent: true, timeout: 30000 },
  execute: getShipstationShipmentPackagesExecute,
  agent: { toolsetSlug: 'shipstation.read' },
})
