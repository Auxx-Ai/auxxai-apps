// src/tools/internal/label-track.tool.server.ts

import { executeLabel } from '../../blocks/shipstation/resources/label/label-execute.server'

export default async function labelTrackExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeLabel('track', input)
}
