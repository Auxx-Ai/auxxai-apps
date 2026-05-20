// src/tools/schemas/file.ts

import { z } from '@auxx/sdk/tools'

export const getFileInputs = z
  .object({
    getFileId: z.string(),
  })
  .loose()
export const getFileOutputs = z
  .object({
    fileId: z.string(),
    downloadUrl: z.string(),
  })
  .loose()
