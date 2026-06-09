// src/blocks/whatsapp/shared/whatsapp-api.ts

import {
  ConflictError,
  ConnectionExpiredError,
  InsufficientPermissionsError,
  InvalidInputError,
  NotFoundError,
  RateLimitError,
  UpstreamServiceError,
} from '@auxx/sdk/server'

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

  let response: Response
  try {
    response = await fetch(`${WHATSAPP_API}/${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${credential}`,
        'Content-Type': 'application/json',
      },
      ...(body && { body: JSON.stringify(body) }),
    })
  } catch (err) {
    throw new UpstreamServiceError(err instanceof Error ? err.message : 'WhatsApp request failed')
  }

  if (response.status === 204) {
    return {} as T
  }

  const data = await response.json()

  if (!response.ok) {
    const apiError = data?.error?.message
    const message =
      ERROR_MESSAGES[response.status] ?? `WhatsApp API error: ${apiError ?? response.statusText}`

    if (response.status === 401) throw new ConnectionExpiredError('organization')
    if (response.status === 403) throw new InsufficientPermissionsError('organization')
    if (response.status === 429) {
      const ra = Number(response.headers.get('Retry-After'))
      throw new RateLimitError(Number.isFinite(ra) ? ra : undefined)
    }
    if (response.status === 404) throw new NotFoundError(message)
    if (response.status === 409) throw new ConflictError(message)
    if (response.status >= 500) {
      throw new UpstreamServiceError(`WhatsApp error ${response.status}`, response.status)
    }
    if (response.status === 400 || response.status === 422) {
      throw new InvalidInputError(apiError ?? message)
    }
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

  let response: Response
  try {
    response = await fetch(`${WHATSAPP_API}/${phoneNumberId}/media`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${credential}`,
      },
      body: formData,
    })
  } catch (err) {
    throw new UpstreamServiceError(err instanceof Error ? err.message : 'WhatsApp request failed')
  }

  const data = await response.json()

  if (!response.ok) {
    const apiError = data?.error?.message
    const message = `Failed to upload media: ${apiError ?? response.statusText}`

    if (response.status === 401) throw new ConnectionExpiredError('organization')
    if (response.status === 403) throw new InsufficientPermissionsError('organization')
    if (response.status === 429) {
      const ra = Number(response.headers.get('Retry-After'))
      throw new RateLimitError(Number.isFinite(ra) ? ra : undefined)
    }
    if (response.status === 404) throw new NotFoundError(message)
    if (response.status === 409) throw new ConflictError(message)
    if (response.status >= 500) {
      throw new UpstreamServiceError(`WhatsApp error ${response.status}`, response.status)
    }
    if (response.status === 400 || response.status === 422) {
      throw new InvalidInputError(apiError ?? message)
    }
    throw new Error(message)
  }

  return data as { id: string }
}
