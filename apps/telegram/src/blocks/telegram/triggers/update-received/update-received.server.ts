// src/blocks/telegram/triggers/update-received/update-received.server.ts

export default async function updateReceivedExecute(input: Record<string, unknown>) {
  // Trigger data is pre-populated from the incoming webhook triggerData.
  // The AppWorkflowTriggerProcessor maps each field to node output variables.
  return input as any
}
