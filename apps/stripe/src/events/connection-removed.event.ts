import type { Connection } from '@auxx/sdk/server'

export default async function connectionRemoved({ connection }: { connection: Connection }) {
  // No-op for initial implementation.
  // Future: Clean up Stripe webhook endpoints.
}
