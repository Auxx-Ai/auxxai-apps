// src/triggers/example/example.server.ts

/**
 * Identity execute — the webhook handler builds the payload; this just
 * forwards the structured fields to the workflow / agent that subscribed.
 */
export default async function exampleTriggerExecute(input: Record<string, unknown>) {
  // biome-ignore lint/suspicious/noExplicitAny: schema-typed pass-through matches WorkflowTrigger contract.
  return input as any
}
