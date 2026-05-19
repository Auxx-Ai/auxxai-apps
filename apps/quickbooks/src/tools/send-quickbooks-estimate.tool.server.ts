// src/tools/send-quickbooks-estimate.tool.server.ts

import { quickbooksApi } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection, invalidInput } from './shared/connection'
import { validateQbId } from './shared/qql-builder'

interface SendQuickbooksEstimateInput {
  estimateId: string
  email?: string
}

interface SendQuickbooksEstimateOutput {
  estimateId: string
  emailStatus: 'EmailSent'
}

export default async function sendQuickbooksEstimate(
  input: SendQuickbooksEstimateInput
): Promise<SendQuickbooksEstimateOutput> {
  const id = input.estimateId?.trim()
  if (!id) invalidInput('estimateId is required.')
  validateQbId(id, 'estimateId')

  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  const path = input.email
    ? `/estimate/${id}/send?sendTo=${encodeURIComponent(input.email)}`
    : `/estimate/${id}/send`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await quickbooksApi<any>(realmId, path, credential, {
    method: 'POST',
    sandbox,
    headers: { 'Content-Type': 'application/octet-stream' },
  })

  return {
    estimateId: String(result?.Estimate?.Id ?? id),
    emailStatus: 'EmailSent',
  }
}
