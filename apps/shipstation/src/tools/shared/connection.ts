// src/tools/shared/connection.ts

/**
 * Resolve the bound ShipStation connection for a tool call.
 *
 * ShipStation V2 uses a single long-lived API key (`secret` connection, no
 * connection variables), so `connection.value` IS the key.
 */

import { getConnection } from '@auxx/sdk/server'
import { throwConnectionNotFound } from './shipstation-api'

export function getShipstationApiKey(): string {
  const connection = getConnection()
  if (!connection?.value) throwConnectionNotFound()
  return connection.value
}
