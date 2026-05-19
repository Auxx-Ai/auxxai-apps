// src/triggers/app-mention/app-mention.server.ts

/**
 * Identity execute. The Slack Events webhook builds the trigger payload
 * (see ../../webhooks/slack-events.webhook.ts) and the platform dispatches
 * it through this trigger; we just forward the structured fields downstream.
 */
export default async function appMentionExecute(input: Record<string, unknown>) {
  // biome-ignore lint/suspicious/noExplicitAny: schema-typed pass-through matches WorkflowTrigger contract.
  return input as any
}
