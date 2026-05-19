// src/tools/send-quickbooks-invoice.tool.server.ts

import { quickbooksApi } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection, invalidInput } from './shared/connection'
import { validateQbId } from './shared/qql-builder'

interface SendQuickbooksInvoiceInput {
  invoiceId: string
  email?: string
}

interface SendQuickbooksInvoiceOutput {
  invoiceId: string
  emailStatus: 'EmailSent'
}

export default async function sendQuickbooksInvoice(
  input: SendQuickbooksInvoiceInput
): Promise<SendQuickbooksInvoiceOutput> {
  const id = input.invoiceId?.trim()
  if (!id) invalidInput('invoiceId is required.')
  validateQbId(id, 'invoiceId')

  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  const path = input.email
    ? `/invoice/${id}/send?sendTo=${encodeURIComponent(input.email)}`
    : `/invoice/${id}/send`

  // Send endpoint requires application/octet-stream — empty body.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await quickbooksApi<any>(realmId, path, credential, {
    method: 'POST',
    sandbox,
    headers: { 'Content-Type': 'application/octet-stream' },
  })

  return {
    invoiceId: String(result?.Invoice?.Id ?? id),
    emailStatus: 'EmailSent',
  }
}
