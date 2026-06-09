// src/blocks/twilio/shared/twilio-api.ts

import {
  ConflictError,
  ConnectionExpiredError,
  InsufficientPermissionsError,
  InvalidInputError,
  NotFoundError,
  RateLimitError,
  UpstreamServiceError,
} from '@auxx/sdk/server'

const TWILIO_API = 'https://api.twilio.com/2010-04-01/Accounts'

const ERROR_MESSAGES: Record<number, string> = {
  400: 'Invalid request. Please check your phone numbers and message content.',
  401: 'Authentication failed. Please verify your Account SID and Auth Token in Settings → Apps → Twilio.',
  403: 'Your Twilio account does not have permission for this action.',
  404: 'The requested resource was not found.',
  429: 'Rate limit exceeded. Please try again later.',
  21211: 'Invalid "To" phone number. Use E.164 format (e.g., +14155238886).',
  21212: 'Invalid "From" phone number. Verify it is a valid Twilio number.',
  21408: 'Permission to send SMS not enabled for this region.',
  21610: 'Message blocked — recipient has opted out.',
  21614: '"To" number is not a valid mobile number.',
}

export async function twilioApi<T = unknown>(
  path: string,
  accountSid: string,
  authToken: string,
  options: {
    method?: string
    body?: Record<string, string>
    query?: Record<string, string | undefined>
  } = {}
): Promise<T> {
  const { method = 'POST', body, query } = options
  const authHeader = `Basic ${btoa(`${accountSid}:${authToken}`)}`

  const queryString = query
    ? Object.entries(query)
        .filter(([, v]) => v != null && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v as string)}`)
        .join('&')
    : ''
  const url = `${TWILIO_API}/${accountSid}${path}${queryString ? `?${queryString}` : ''}`

  let response: Response
  try {
    response = await fetch(url, {
      method,
      headers: {
        Authorization: authHeader,
        ...(body && { 'Content-Type': 'application/x-www-form-urlencoded' }),
      },
      ...(body && { body: new URLSearchParams(body).toString() }),
    })
  } catch (err) {
    throw new UpstreamServiceError(err instanceof Error ? err.message : 'Twilio request failed')
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    const twilioCode = errorData?.code
    const message =
      ERROR_MESSAGES[twilioCode] ??
      ERROR_MESSAGES[response.status] ??
      `Twilio API error: ${response.status} ${response.statusText}`

    if (response.status === 401) throw new ConnectionExpiredError('organization')
    if (response.status === 403) throw new InsufficientPermissionsError('organization')
    if (response.status === 429) {
      const ra = Number(response.headers.get('Retry-After'))
      throw new RateLimitError(Number.isFinite(ra) ? ra : undefined)
    }
    if (response.status === 404) throw new NotFoundError(message)
    if (response.status === 409) throw new ConflictError(message)
    if (response.status >= 500) {
      throw new UpstreamServiceError(`Twilio error ${response.status}`, response.status)
    }
    if (response.status === 400 || response.status === 422) {
      throw new InvalidInputError(message)
    }
    throw new Error(message)
  }

  return response.json() as Promise<T>
}

export function throwConnectionNotFound(): never {
  const err = new Error(
    'Twilio not connected. Please add your Auth Token in Settings → Apps → Twilio.'
  ) as Error & { code: string; scope: string }
  err.code = 'CONNECTION_NOT_FOUND'
  err.scope = 'organization'
  throw err
}
