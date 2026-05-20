// src/tools/delete-whatsapp-media.tool.server.ts

import { whatsappApi } from '../blocks/whatsapp/shared/whatsapp-api'
import { getWhatsappConnection } from './shared/connection'

interface DeleteWhatsappMediaInput {
  mediaId: string
}

interface DeleteWhatsappMediaOutput {
  success: boolean
}

export default async function deleteWhatsappMedia(
  input: DeleteWhatsappMediaInput
): Promise<DeleteWhatsappMediaOutput> {
  const { token } = getWhatsappConnection()
  await whatsappApi(input.mediaId, token, { method: 'DELETE' })
  return { success: true }
}
