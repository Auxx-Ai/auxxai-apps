import type { Connection } from '@auxx/sdk/server'

export default async function connectionAdded({ connection }: { connection: Connection }) {
  // No-op — webhook triggers can be added in a future release
}
