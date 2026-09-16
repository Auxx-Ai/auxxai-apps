// src/events/connection-removed.event.ts

import type { Connection } from '@auxx/sdk/server'

/**
 * No-op.
 *
 * `connection-added` registers nothing upstream, so there is nothing to tear
 * down: Affirm has no proven settlement webhook (build plan §3.5) and this app
 * reads on a schedule. Nothing is revoked either — the API key pair is issued
 * and rotated in the Affirm portal, not by us, and an app that silently
 * invalidated a merchant's production credentials on uninstall would be doing
 * something nobody asked for.
 *
 * The financial rows the connector already wrote are deliberately left alone.
 * They are settlement evidence for money that really moved; disconnecting the
 * source does not un-happen the deposit.
 */
export default async function connectionRemoved({
  connection: _connection,
}: {
  connection: Connection
}) {
  // Intentionally empty.
}
