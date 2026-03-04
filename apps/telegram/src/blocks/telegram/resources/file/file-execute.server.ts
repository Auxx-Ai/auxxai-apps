import { getOrganizationConnection } from '@auxx/sdk/server'
import { getFileDownloadUrl, telegramApi, throwConnectionNotFound } from '../../shared/telegram-api'

export async function executeFile(
  operation: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const botToken = connection.value

  switch (operation) {
    case 'get': {
      const result = await telegramApi<any>('getFile', botToken, {
        file_id: input.getFileId,
      })
      return {
        fileId: result.file_id ?? '',
        fileUniqueId: result.file_unique_id ?? '',
        fileSize: String(result.file_size ?? ''),
        filePath: result.file_path ?? '',
        downloadUrl: result.file_path ? getFileDownloadUrl(botToken, result.file_path) : '',
      }
    }

    default:
      throw new Error(`Unknown file operation: ${operation}`)
  }
}
