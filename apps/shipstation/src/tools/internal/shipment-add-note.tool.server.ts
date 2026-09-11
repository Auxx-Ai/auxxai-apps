// src/tools/internal/shipment-add-note.tool.server.ts

import { executeShipment } from '../../blocks/shipstation/resources/shipment/shipment-execute.server'

/** Add Internal Note: a thin delegate onto the shipment resource executor. */
export default async function shipmentAddNoteExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeShipment('addNote', input)
}
