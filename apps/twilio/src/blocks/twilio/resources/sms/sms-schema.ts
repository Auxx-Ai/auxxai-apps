// src/blocks/twilio/resources/sms/sms-schema.ts

import { Workflow } from '@auxx/sdk'

export const smsInputs = {
  sendFrom: Workflow.string({
    label: 'From',
    description: 'Twilio phone number to send from (E.164 format)',
    placeholder: '+14155238886',
    acceptsVariables: true,
  }),
  sendTo: Workflow.string({
    label: 'To',
    description: 'Recipient phone number (E.164 format)',
    placeholder: '+14155238886',
    acceptsVariables: true,
  }),
  sendMessage: Workflow.string({
    label: 'Message',
    description: 'Message body text',
    placeholder: 'Enter your message...',
    acceptsVariables: true,
    minLength: 1,
  }),
  sendToWhatsApp: Workflow.boolean({
    label: 'Send as WhatsApp',
    description: 'Send via WhatsApp instead of SMS (requires a WhatsApp-enabled Twilio number)',
    default: false,
  }),
  sendStatusCallback: Workflow.string({
    label: 'Status Callback URL',
    description: 'Webhook URL to receive message status updates',
    placeholder: 'https://example.com/status',
    acceptsVariables: true,
  }),
}

export function smsComputeOutputs(operation: string) {
  if (operation === 'send') {
    return {
      messageSid: Workflow.string({ label: 'Message SID' }),
      status: Workflow.string({ label: 'Status' }),
      from: Workflow.string({ label: 'From' }),
      to: Workflow.string({ label: 'To' }),
      body: Workflow.string({ label: 'Body' }),
      dateCreated: Workflow.string({ label: 'Date Created' }),
      price: Workflow.string({ label: 'Price' }),
      errorCode: Workflow.string({ label: 'Error Code' }),
      errorMessage: Workflow.string({ label: 'Error Message' }),
    }
  }
  return {}
}
