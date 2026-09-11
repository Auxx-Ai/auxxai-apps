// src/events/connection-added.event.ts

import type { Connection, ConnectionAddedResult } from '@auxx/sdk/server'
import { shipstationApi } from '../tools/shared/shipstation-api'

/**
 * Validate the key on connect with the cheapest authenticated GET.
 *
 * No label is returned. ShipStation V2 exposes no verified account-identity
 * endpoint — carriers, the key itself and the store set are all either unstable
 * or not account identity — so inventing a label here would be a guess that
 * later reads as fact. The platform falls back to an honest generated name.
 */
export default async function connectionAdded({
  connection,
}: {
  connection: Connection
}): Promise<ConnectionAddedResult> {
  await shipstationApi('/carriers', connection.value)
  return {}
}
