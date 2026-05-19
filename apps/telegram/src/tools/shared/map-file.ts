// src/tools/shared/map-file.ts

import { getFileDownloadUrl } from '../../blocks/telegram/shared/telegram-api'

export interface MappedFile {
  fileId: string
  fileUniqueId: string
  fileSize: number | null
  filePath: string | null
  downloadUrl: string | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapFile(raw: any, botToken: string): MappedFile {
  const filePath = typeof raw?.file_path === 'string' ? raw.file_path : null
  return {
    fileId: raw?.file_id ?? '',
    fileUniqueId: raw?.file_unique_id ?? '',
    fileSize: typeof raw?.file_size === 'number' ? raw.file_size : null,
    filePath,
    downloadUrl: filePath ? getFileDownloadUrl(botToken, filePath) : null,
  }
}
