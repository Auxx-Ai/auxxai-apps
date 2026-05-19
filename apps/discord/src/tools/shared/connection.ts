// src/tools/shared/connection.ts

/**
 * Resolve the bound Discord bot connection for a tool call. Tools use the
 * unified `getConnection()` SDK helper — the platform bridge picks the
 * credId from `Agent.appAccounts['discord'].credId`.
 *
 * Discord uses a single long-lived bot token (`secret` cred), not OAuth,
 * so `conn.value` is the bot token consumed directly by `discordApi`.
 * See plans/kopilot/apps/discord-overhaul.md §7.
 */
import { getConnection } from '@auxx/sdk/server'
import { throwConnectionNotFound } from '../../blocks/discord/shared/discord-api'

export function getDiscordToken(): string {
  const connection = getConnection()
  if (!connection?.value) throwConnectionNotFound()
  return connection.value
}
