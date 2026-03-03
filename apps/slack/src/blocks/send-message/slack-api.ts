// src/blocks/send-message/slack-api.ts

/**
 * Shared Slack Web API utility used by both the execute function and
 * the dynamic list loaders (channels, users).
 */

export const SLACK_API = 'https://slack.com/api'

/** Map Slack API error codes to human-readable messages. */
export const SLACK_ERROR_MESSAGES: Record<string, string> = {
  channel_not_found: 'Channel not found. Verify the channel name or ID.',
  not_in_channel: 'Bot is not a member of this channel. Invite the bot first.',
  is_archived: 'Cannot post to an archived channel.',
  msg_too_long: 'Message text exceeds the 40,000 character limit.',
  no_text: 'Message text is required.',
  restricted_action: 'Workspace permissions prevent this action.',
  missing_scope: 'Bot token is missing required scopes. Reconnect the app.',
  token_revoked: 'Bot token has been revoked. Reconnect the app.',
  invalid_auth: 'Invalid authentication. Reconnect the app.',
  account_inactive: 'The bot user account has been deactivated.',
  user_not_found: 'User not found. Verify the user ID or email.',
  users_not_found: 'No user found for the provided email address.',
}

export interface SlackApiResponse {
  ok: boolean
  error?: string
  needed?: string
  provided?: string
  ts?: string
  channel?: string | { id: string }
  user?: { id: string }
  channels?: { id: string; name: string; is_private: boolean }[]
  members?: {
    id: string
    name: string
    real_name?: string
    deleted: boolean
    is_bot: boolean
    profile?: { display_name?: string }
  }[]
  response_metadata?: { next_cursor?: string; scopes?: string[] }
}

/**
 * Throw a structured CONNECTION_NOT_FOUND error that the platform maps to
 * a "Connection Required" toast with a link to Settings → Apps.
 */
export function throwConnectionNotFound(): never {
  const err = new Error(
    'Slack workspace not connected. Please reconnect in Settings → Apps → Slack.',
  ) as Error & { code: string; scope: string }
  err.code = 'CONNECTION_NOT_FOUND'
  err.scope = 'organization'
  throw err
}

/**
 * Call a Slack Web API method.
 */
export async function slackApi(
  method: string,
  token: string,
  body: Record<string, unknown>,
): Promise<SlackApiResponse> {
  const response = await fetch(`${SLACK_API}/${method}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`Slack API request failed: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as SlackApiResponse

  if (!data.ok) {
    const errorCode = data.error ?? 'unknown_error'
    console.error(`[slack-api] ${method} failed:`, {
      error: errorCode,
      needed: data.needed,
      provided: data.provided,
    })
    let message = SLACK_ERROR_MESSAGES[errorCode] ?? `Slack API error: ${errorCode}`
    if (errorCode === 'missing_scope' && data.needed) {
      message = `Bot token is missing the "${data.needed}" scope. Reconnect the app to grant it.`
    }
    throw new Error(message)
  }

  return data
}
