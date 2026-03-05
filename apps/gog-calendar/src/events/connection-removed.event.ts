// src/events/connection-removed.event.ts

import type { Connection } from '@auxx/sdk/server'

export default async function connectionRemoved({ connection }: { connection: Connection }) {
  // No webhook cleanup needed — polling triggers are managed by the platform
}
