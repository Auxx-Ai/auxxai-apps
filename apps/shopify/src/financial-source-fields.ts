// src/financial-source-fields.ts
// Shopify normalization ends here. The platform receives ordinary record fields.
type SourceAccount = { providerKey: string; externalAccountId: string; environment: string }
type Acquisition = { id: string; startedAt: string }
type SourceRow = Record<string, unknown>

function sourceFields(externalId: string, sourceAccount: SourceAccount, acquisition?: Acquisition) {
  return {
    id: externalId,
    externalId,
    sourceKey: JSON.stringify([
      sourceAccount.providerKey,
      sourceAccount.externalAccountId,
      sourceAccount.environment,
      externalId,
    ]),
    ...sourceAccount,
    acquisitionId: acquisition?.id ?? null,
    acquiredAt: acquisition?.startedAt ?? null,
  }
}

/** Project a normalized processor transaction as separately mappable source fields. */
export function processorSourceFields(input: {
  externalId: string
  sourceAccount: SourceAccount
  acquisition: Acquisition
  page: SourceRow
  entry: SourceRow | null
  raw: unknown
  rejectionReason: string | null
}) {
  return {
    ...sourceFields(input.externalId, input.sourceAccount, input.acquisition),
    ...input.entry,
    raw: input.raw,
    rejectionReason: input.rejectionReason,
    page: input.page,
  }
}

/** Keep the reported payout header and source membership history alongside mapped child transactions. */
export function payoutSourceFields(input: {
  externalId: string
  sourceAccount: SourceAccount
  acquisition: Acquisition
  payout: SourceRow | null
  raw: unknown
  rejectionReason: string | null
  membership: SourceRow
}) {
  const entries = (input.membership.entries ?? []) as SourceRow[]
  const page = input.membership.page as SourceRow | null
  return {
    ...sourceFields(input.externalId, input.sourceAccount, input.acquisition),
    ...input.payout,
    raw: input.raw,
    rejectionReason: input.rejectionReason,
    membership: input.membership,
    processorTransactions: entries.map((entry, rowIndex) =>
      processorSourceFields({
        externalId: String(entry.id),
        sourceAccount: input.sourceAccount,
        acquisition: input.acquisition,
        entry,
        raw: entry.raw,
        rejectionReason: null,
        page: { id: page?.id ?? input.acquisition.id, index: page?.index ?? 0, rowIndex },
      }),
    ),
  }
}

/** Normalize order payment coverage and expose each transaction to the standard child mapper. */
export function orderPaymentSourceFields(input: {
  sourceAccount: SourceAccount
  orderExternalId: string
  sourceUpdatedAt: string | null
  complete: boolean
  transactions: SourceRow[]
}) {
  return {
    paymentSourceProvider: input.sourceAccount.providerKey,
    paymentSourceAccount: input.sourceAccount.externalAccountId,
    paymentSourceEnvironment: input.sourceAccount.environment,
    paymentSourceOrderId: input.orderExternalId,
    paymentSourceUpdatedAt: input.sourceUpdatedAt,
    paymentSourceComplete: input.complete,
    paymentSourceCount: input.transactions.length,
    paymentTransactions: input.transactions.map(({ version: _version, ...transaction }) => ({
      ...transaction,
      ...sourceFields(String(transaction.id), {
        ...input.sourceAccount,
        environment: transaction.test === true ? 'test' : input.sourceAccount.environment,
      }),
      orderExternalId: input.orderExternalId,
      sourceUpdatedAt: input.sourceUpdatedAt,
    })),
  }
}
