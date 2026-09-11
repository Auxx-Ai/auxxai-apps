// src/blocks/shipstation/shared/capabilities.server.ts

import { getOrganizationSetting } from '@auxx/sdk/server'
import {
  type ConnectionCapabilities,
  deriveCapabilities,
  type ShipstationSettings,
} from '../resources/capabilities'

/**
 * What this installation may do, derived from its app settings.
 *
 * Runs server-side, so both callers agree by construction: the panel narrows
 * its pickers with it, and `shipstationExecute` refuses anything it excludes.
 *
 * Read at execute time rather than cached at install time, so flipping a flag
 * takes effect on the next run.
 */
export async function getShipstationCapabilities(): Promise<ConnectionCapabilities> {
  const settings: ShipstationSettings = {
    allowWrites: await getOrganizationSetting<boolean>('allowWrites'),
    allowLabelPurchase: await getOrganizationSetting<boolean>('allowLabelPurchase'),
  }
  return deriveCapabilities(settings)
}

/** Picker options for the block panel. */
export default async function loadCapabilities(): Promise<{
  resources: string[]
  operations: Record<string, string[]>
}> {
  const { resources, operations } = await getShipstationCapabilities()
  return { resources, operations }
}
