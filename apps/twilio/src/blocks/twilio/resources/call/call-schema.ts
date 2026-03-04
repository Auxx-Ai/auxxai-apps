// src/blocks/twilio/resources/call/call-schema.ts

import { Workflow } from '@auxx/sdk'

export const callInputs = {
  makeFrom: Workflow.string({
    label: 'From',
    description: 'Twilio phone number to call from (E.164 format)',
    placeholder: '+14155238886',
    acceptsVariables: true,
  }),
  makeTo: Workflow.string({
    label: 'To',
    description: 'Destination phone number (E.164 format)',
    placeholder: '+14155238886',
    acceptsVariables: true,
  }),
  makeMessage: Workflow.string({
    label: 'Message',
    description: 'Text to speak to the recipient, or raw TwiML markup',
    placeholder: 'Hello, this is a call from Auxx...',
    acceptsVariables: true,
    minLength: 1,
  }),
  makeUseTwiml: Workflow.boolean({
    label: 'Use TwiML',
    description: 'Send message as raw TwiML instead of auto-wrapping in <Say> tags',
    default: false,
  }),
  makeStatusCallback: Workflow.string({
    label: 'Status Callback URL',
    description: 'Webhook URL to receive call status events',
    placeholder: 'https://example.com/status',
    acceptsVariables: true,
  }),
}

export function callComputeOutputs(operation: string) {
  if (operation === 'make') {
    return {
      callSid: Workflow.string({ label: 'Call SID' }),
      status: Workflow.string({ label: 'Status' }),
      from: Workflow.string({ label: 'From' }),
      to: Workflow.string({ label: 'To' }),
      direction: Workflow.string({ label: 'Direction' }),
      dateCreated: Workflow.string({ label: 'Date Created' }),
      price: Workflow.string({ label: 'Price' }),
      duration: Workflow.string({ label: 'Duration' }),
    }
  }
  return {}
}
