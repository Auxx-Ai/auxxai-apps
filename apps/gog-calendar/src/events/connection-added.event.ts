// src/events/connection-added.event.ts

import type { Connection } from '@auxx/sdk/server'

export default async function connectionAdded({ connection }: { connection: Connection }) {
  // No webhook setup needed — polling triggers are managed by the platform
}
