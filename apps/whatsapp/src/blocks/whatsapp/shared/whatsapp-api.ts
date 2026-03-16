// src/blocks/whatsapp/shared/whatsapp-api.ts

import { ConnectionExpiredError } from '@auxx/sdk/server'

export const WHATSAPP_API = 'https://graph.facebook.com/v21.0'

const ERROR_MESSAGES: Record<number, string> = {
  400: 'Bad request. Please check your input parameters.',
  401: 'Invalid access token. Please reconnect in Settings > Apps > WhatsApp.',
  403: 'Insufficient permissions. Check your WhatsApp Business API permissions.',
  404: 'Resource not found.',
  429: 'Rate limit exceeded. Please try again later.',
}

export function throwConnectionNotFound(): never {
  const err = new Error(
    'WhatsApp not connected. Please add your access token in Settings > Apps > WhatsApp.'
  ) as Error & { code: string; scope: string }
  err.code = 'CONNECTION_NOT_FOUND'
  err.scope = 'organization'
  throw err
}

export async function whatsappApi<T = unknown>(
  path: string,
  credential: string,
  options: { method?: string; body?: Record<string, unknown> } = {}
): Promise<T> {
  const { method = 'GET', body } = options

  const response = await fetch(`${WHATSAPP_API}/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${credential}`,
      'Content-Type': 'application/json',
    },
    ...(body && { body: JSON.stringify(body) }),
  })

  if (response.status === 204) {
    return {} as T
  }

  const data = await response.json()

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new ConnectionExpiredError('organization')
    }

    const apiError = data?.error?.message
    const message =
      ERROR_MESSAGES[response.status] ?? `WhatsApp API error: ${apiError ?? response.statusText}`
    throw new Error(message)
  }

  return data as T
}

export async function whatsappUploadMedia(
  phoneNumberId: string,
  credential: string,
  fileBuffer: ArrayBuffer,
  mimeType: string,
  fileName: string
): Promise<{ id: string }> {
  const formData = new FormData()
  formData.append('messaging_product', 'whatsapp')
  formData.append('type', mimeType)
  formData.append('file', new Blob([fileBuffer], { type: mimeType }), fileName)

  const response = await fetch(`${WHATSAPP_API}/${phoneNumberId}/media`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${credential}`,
    },
    body: formData,
  })

  const data = await response.json()

  if (!response.ok) {
    const apiError = data?.error?.message
    throw new Error(`Failed to upload media: ${apiError ?? response.statusText}`)
  }

  return data as { id: string }
}
