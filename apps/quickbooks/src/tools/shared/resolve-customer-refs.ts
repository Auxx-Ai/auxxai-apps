// src/tools/shared/resolve-customer-refs.ts

/**
 * Forked-ref resolver: a QuickBooks Customer maps to an Auxx `contact`
 * AND, when `CompanyName` is populated, an Auxx `company`. Both are
 * resolved independently against `EntityInstance` via
 * `ctx.entities.findByIntegrationId`. Same externalId (`Customer.Id`)
 * under two (kind, source) pairs.
 *
 * Strict integrationId match — no email/name fallback (per
 * plans/kopilot/apps/quickbooks-overhaul.md §3 decision #5).
 * NOT_IMPORTED if any *expected* ref is missing (decision #12).
 *
 * Runtimes that predate the refs plumbing (refs.md PR 2) won't expose
 * `ctx.entities` — treat as NOT_IMPORTED so the tool still ships.
 */
import type { ToolExecuteContext } from '@auxx/sdk/tools'

const SOURCE = 'quickbooks'

export interface CustomerRefs {
  auxxContactId: string | null
  auxxCompanyId: string | null
  notImportedReason: 'NOT_IMPORTED' | null
}

export async function resolveCustomerRefs(
  ctx: ToolExecuteContext | undefined,
  customer: { Id?: string | null; CompanyName?: string | null }
): Promise<CustomerRefs> {
  const expectedCompany = Boolean(customer.CompanyName)
  const fallback: CustomerRefs = {
    auxxContactId: null,
    auxxCompanyId: null,
    notImportedReason: 'NOT_IMPORTED',
  }

  if (!ctx || !customer.Id) return fallback

  const entities = ctx.entities as ToolExecuteContext['entities'] | undefined
  if (!entities || typeof entities.findByIntegrationId !== 'function') return fallback

  let contactHit: { recordId: string } | null = null
  let companyHit: { recordId: string } | null = null

  try {
    const [contactResult, companyResult] = await Promise.all([
      entities.findByIntegrationId({ kind: 'contact', source: SOURCE, externalId: customer.Id }),
      expectedCompany
        ? entities.findByIntegrationId({ kind: 'company', source: SOURCE, externalId: customer.Id })
        : Promise.resolve(null),
    ])
    contactHit = contactResult ?? null
    companyHit = companyResult ?? null
  } catch {
    return fallback
  }

  const auxxContactId = contactHit?.recordId ?? null
  const auxxCompanyId = companyHit?.recordId ?? null
  const missingAny = !auxxContactId || (expectedCompany && !auxxCompanyId)

  return {
    auxxContactId,
    auxxCompanyId,
    notImportedReason: missingAny ? 'NOT_IMPORTED' : null,
  }
}
