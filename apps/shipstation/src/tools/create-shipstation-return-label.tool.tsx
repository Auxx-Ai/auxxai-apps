// src/tools/create-shipstation-return-label.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shipstationIcon from '../assets/icon.png'
import createShipstationReturnLabelExecute from './create-shipstation-return-label.tool.server'
import { exampleLabel, labelSchema } from './shared/schemas'

/**
 * Buy a return label for an existing outbound label. The only agent-facing
 * write in this app, and the only member of the `shipstation.returns` toolset.
 */
export const createShipstationReturnLabelTool = defineTool({
  id: 'create_shipstation_return_label',
  name: 'Create ShipStation return label',
  description:
    'Create a prepaid RETURN label for an existing outbound ShipStation label, so the customer ' +
    'can send the shipment back. Returns the new label and a URL to the printable file. ' +
    'This buys a label from the carrier: it costs money, it cannot be undone from here, and ' +
    'calling it twice buys two labels. Confirm the outbound label id with get_shipstation_label ' +
    'or get_shipstation_shipment_packages first, and only create a label once the return has ' +
    'actually been agreed.',
  icon: shipstationIcon,
  inputs: z.object({
    labelId: z
      .string()
      .describe('The OUTBOUND label to return, e.g. se-197559213. Not a tracking number.'),
    labelFormat: z
      .enum(['pdf', 'png', 'zpl'])
      .optional()
      .describe('Printable format. Defaults to the account setting; pdf suits emailing.'),
    labelLayout: z
      .enum(['4x6', 'letter'])
      .optional()
      .describe('Page layout. 4x6 for a label printer, letter for a normal printer.'),
  }),
  outputs: z.object({
    summary: z
      .string()
      .describe('Readable rollup of what was created. Safe to quote directly when answering.'),
    label: labelSchema.describe('The new return label. isReturnLabel is true on it.'),
    downloadUrl: z
      .string()
      .nullable()
      .describe('URL of the printable label. Null while the label is still processing.'),
    pdfUrl: z.string().nullable(),
    pngUrl: z.string().nullable(),
    zplUrl: z.string().nullable(),
    rmaNumber: z.string().nullable().describe('Return merchandise authorization number, if set.'),
    shipmentCost: z
      .object({ currency: z.string(), amount: z.number() })
      .nullable()
      .describe('What the carrier charged for this label.'),
  }),
  exampleOutput: {
    summary:
      'Return label se-197559999 created against outbound label se-197559213 with fedex. ' +
      'Tracking 770000000099, cost 14.62 usd. The printable label is at downloadUrl.',
    label: {
      ...exampleLabel,
      labelId: 'se-197559999',
      labelStatus: 'completed',
      masterTrackingNumber: '770000000099',
      trackingStatus: 'unknown',
      isReturnLabel: true,
      packageCount: 1,
      packages: [
        {
          packageId: '158414099',
          sequence: 1,
          trackingNumber: '770000000099',
          isMaster: true,
          weight: { value: 1280, unit: 'ounce' },
          dimensions: { length: 71, width: 6, height: 13, unit: 'inch' },
        },
      ],
    },
    downloadUrl: 'https://api.shipstation.com/v2/downloads/10/abc/label-197559999.pdf',
    pdfUrl: 'https://api.shipstation.com/v2/downloads/10/abc/label-197559999.pdf',
    pngUrl: null,
    zplUrl: null,
    rmaNumber: null,
    shipmentCost: { currency: 'usd', amount: 14.62 },
  },
  config: { requiresConnection: true, timeout: 30000 },
  execute: createShipstationReturnLabelExecute,
  // Its own toolset, so granting the reads never grants a label purchase. Not
  // externally safe, and deliberately not offered on the email surface: a
  // request arriving by email is not proof the sender is the customer.
  agent: { toolsetSlug: 'shipstation.returns', surfaces: ['internal', 'builder'] },
})
