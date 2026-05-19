// src/tools/get-whatsapp-media-url.tool.server.ts

import { whatsappApi } from '../blocks/whatsapp/shared/whatsapp-api'
import { getWhatsappConnection } from './shared/connection'
import { type MappedWhatsappMedia, mapMedia } from './shared/map-media'

interface GetWhatsappMediaUrlInput {
  mediaId: string
}

export default async function getWhatsappMediaUrl(
  input: GetWhatsappMediaUrlInput
): Promise<MappedWhatsappMedia> {
  const { token } = getWhatsappConnection()

  const response = await whatsappApi<{
    id: string
    url: string
    mime_type: string
    sha256: string
    file_size: number
  }>(input.mediaId, token)

  return mapMedia(response)
}
