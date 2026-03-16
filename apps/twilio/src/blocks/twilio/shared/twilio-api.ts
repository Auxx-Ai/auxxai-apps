// src/blocks/twilio/shared/twilio-api.ts

import { ConnectionExpiredError } from '@auxx/sdk/server'

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
  options: { method?: string; body?: Record<string, string> } = {},
): Promise<T> {
  const { method = 'POST', body } = options
  const authHeader = `Basic ${btoa(`${accountSid}:${authToken}`)}`

  const response = await fetch(`${TWILIO_API}/${accountSid}${path}`, {
    method,
    headers: {
      Authorization: authHeader,
      ...(body && { 'Content-Type': 'application/x-www-form-urlencoded' }),
    },
    ...(body && { body: new URLSearchParams(body).toString() }),
  })

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new ConnectionExpiredError('organization')
    }

    const errorData = await response.json().catch(() => null)
    const twilioCode = errorData?.code
    const message =
      ERROR_MESSAGES[twilioCode] ??
      ERROR_MESSAGES[response.status] ??
      `Twilio API error: ${response.status} ${response.statusText}`
    throw new Error(message)
  }

  return response.json() as Promise<T>
}

export function throwConnectionNotFound(): never {
  const err = new Error(
    'Twilio not connected. Please add your Auth Token in Settings → Apps → Twilio.',
  ) as Error & { code: string; scope: string }
  err.code = 'CONNECTION_NOT_FOUND'
  err.scope = 'organization'
  throw err
}
