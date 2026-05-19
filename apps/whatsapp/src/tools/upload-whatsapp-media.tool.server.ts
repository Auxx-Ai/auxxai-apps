// src/tools/upload-whatsapp-media.tool.server.ts

import { whatsappUploadMedia } from '../blocks/whatsapp/shared/whatsapp-api'
import { getWhatsappConnection } from './shared/connection'

interface UploadWhatsappMediaInput {
  phoneNumberId: string
  mediaUrl: string
}

interface UploadWhatsappMediaOutput {
  mediaId: string
}

export default async function uploadWhatsappMedia(
  input: UploadWhatsappMediaInput
): Promise<UploadWhatsappMediaOutput> {
  const { token } = getWhatsappConnection()

  const fileResponse = await fetch(input.mediaUrl)
  if (!fileResponse.ok) {
    throw new Error(`Failed to download file from URL: ${fileResponse.statusText}`)
  }

  const contentType = fileResponse.headers.get('content-type') ?? 'application/octet-stream'
  const buffer = await fileResponse.arrayBuffer()
  const urlParts = new URL(input.mediaUrl).pathname.split('/')
  const fileName = urlParts[urlParts.length - 1] || 'file'

  const result = await whatsappUploadMedia(
    input.phoneNumberId,
    token,
    buffer,
    contentType,
    fileName
  )
  return { mediaId: result.id }
}
