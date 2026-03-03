import type { Connection } from '@auxx/sdk/server'

export default async function connectionAdded({ connection }: { connection: Connection }) {
  // No-op — future: set up GitHub webhooks
}
