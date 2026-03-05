// src/blocks/whatsapp/resources/media/media-execute.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import {
  whatsappApi,
  whatsappUploadMedia,
  throwConnectionNotFound,
} from '../../shared/whatsapp-api'

export async function executeMedia(
  operation: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()

  const credential = connection.value

  switch (operation) {
    case 'upload': {
      const phoneNumberId = input.uploadPhoneNumberId
      const mediaUrl = input.uploadMediaUrl

      // Fetch the file from the URL
      const fileResponse = await fetch(mediaUrl)
      if (!fileResponse.ok) {
        throw new Error(`Failed to download file from URL: ${fileResponse.statusText}`)
      }

      const contentType = fileResponse.headers.get('content-type') ?? 'application/octet-stream'
      const buffer = await fileResponse.arrayBuffer()
      const urlParts = new URL(mediaUrl).pathname.split('/')
      const fileName = urlParts[urlParts.length - 1] || 'file'

      const result = await whatsappUploadMedia(
        phoneNumberId,
        credential,
        buffer,
        contentType,
        fileName
      )
      return { mediaId: result.id }
    }

    case 'getUrl': {
      const result = await whatsappApi<{
        id: string
        url: string
        mime_type: string
        sha256: string
        file_size: number
      }>(input.getUrlMediaId, credential)

      return {
        mediaId: result.id,
        mediaUrl: result.url,
        mimeType: result.mime_type,
        fileSize: result.file_size,
        sha256: result.sha256,
      }
    }

    case 'delete': {
      await whatsappApi(input.deleteMediaId, credential, { method: 'DELETE' })
      return { success: true }
    }

    default:
      throw new Error(`Unknown media operation: ${operation}`)
  }
}
