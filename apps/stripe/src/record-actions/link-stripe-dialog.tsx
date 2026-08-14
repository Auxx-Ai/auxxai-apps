// src/record-actions/link-stripe-dialog.tsx

import {
  Form,
  FormField,
  FormSubmit,
  Forms,
  type InferFormValues,
  TextBlock,
  useRecord,
} from '@auxx/sdk/client'
import { Suspense, useMemo } from 'react'
import linkStripeCustomer from './link-stripe-customer.server'
import searchStripeOptions from './search-stripe-options.server'

/**
 * Unwrap a record field value to its primary (first) element. Multi-value
 * fields (`options.multi`) arrive from the host as `string[]` — the primary is
 * index 0. Scalars pass through; anything else (missing/empty) → `null`.
 */
function primaryValue(v: unknown): string | null {
  const first = Array.isArray(v) ? (v[0] ?? null) : v
  return typeof first === 'string' && first.length > 0 ? first : null
}

/**
 * Inner body — reads the contact's email (`useRecord`, suspends) and renders a
 * searchable Stripe-customer picker (`Forms.picker` → host `AsyncOptionPicker`).
 * The picker resolves options on demand via `searchStripeOptions`: seeded with
 * the contact's email on open, then live-searched as the user types.
 */
function LinkStripeBody({ recordId, hideDialog }: { recordId: string; hideDialog: () => void }) {
  const record = useRecord(recordId)
  // The contact email is exposed under its stable systemAttribute key
  // (`primary_email`), not `email`. Multi-value email fields come through as an
  // array — seed the picker from the primary only; manual search covers the
  // rest. No email at all → picker opens empty, user searches manually.
  const email = primaryValue(record.data.primary_email)

  const schema = useMemo(
    () => ({
      customer: Forms.picker({
        loadOptions: (query: string) => searchStripeOptions(query, email),
        multi: false,
      }),
    }),
    [email]
  )

  async function handleSubmit(values: InferFormValues<typeof schema>) {
    // InferFormValues can't recover the picker's value type (FormValue's generic
    // is phantom), so the value comes through untyped — cast to the string id.
    const customerId = values.customer as string
    if (!customerId) return
    await linkStripeCustomer(recordId, customerId)
    hideDialog()
  }

  return (
    <>
      <TextBlock align="left">
        Search Stripe for the customer to link to this contact{email ? ` (${email})` : ''}.
      </TextBlock>
      <Form schema={schema} onSubmit={handleSubmit} mode="onBlur">
        <FormField name="customer" label="Stripe customer" />
        <FormSubmit loadingText="Linking...">Link customer</FormSubmit>
      </Form>
    </>
  )
}

/**
 * Dialog for linking a contact to its Stripe customer. Renders a single
 * Suspense boundary for the contact-record read.
 */
export function LinkStripeDialog({
  recordId,
  hideDialog,
}: {
  recordId: string
  hideDialog: () => void
}) {
  return (
    <Suspense fallback={<TextBlock align="left">Loading…</TextBlock>}>
      <LinkStripeBody recordId={recordId} hideDialog={hideDialog} />
    </Suspense>
  )
}
