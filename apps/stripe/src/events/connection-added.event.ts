import type { Connection } from '@auxx/sdk/server'

export default async function connectionAdded({ connection }: { connection: Connection }) {
  // No-op for initial implementation.
  // Future: Set up Stripe webhook endpoints for trigger support.
}
