// src/blocks/whatsapp/triggers/message-received/message-received.server.ts

export default async function messageReceivedExecute(input: Record<string, unknown>) {
  // Trigger data is pre-populated from the incoming webhook triggerData.
  // The AppWorkflowTriggerProcessor maps each field to node output variables.
  return input as any
}
