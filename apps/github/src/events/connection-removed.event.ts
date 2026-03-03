import type { Connection } from '@auxx/sdk/server'

export default async function connectionRemoved({ connection }: { connection: Connection }) {
  // No-op — future: clean up GitHub webhooks
}
