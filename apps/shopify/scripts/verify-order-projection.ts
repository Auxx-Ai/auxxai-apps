// apps/shopify/scripts/verify-order-projection.ts
//
// Dev check: run the REAL connector handler against a live store and assert the phase-0a
// projection. Exercises the whole path — fetch, `deriveFulfillments`, the comma-string
// tag/gateway shapes, and the `maxUpdatedAt` watermark.
//
// `@auxx/sdk/server` is a TYPES-ONLY export — the app-runtime sandbox supplies it at
// runtime — so this cannot be run with plain tsx. Bundle it first with the stub, then
// run the bundle (esbuild lives in the platform repo, not here):
//
//   node -e "require('$HOME/Sites/auxxai/node_modules/.pnpm/esbuild@0.25.12/node_modules/esbuild').build({\
//     absWorkingDir:'$PWD', entryPoints:['scripts/verify-order-projection.ts'], bundle:true,\
//     platform:'node', format:'esm', target:'node20',\
//     alias:{'@auxx/sdk/server':'./scripts/sdk-server-stub.ts'},\
//     outfile:'/tmp/verify-order-projection.mjs'})"
//   SHOP=auxxai.myshopify.com TOKEN=shpat_… node /tmp/verify-order-projection.mjs

import shopifySync from '../src/shopify.connector.server'

const SHOP = process.env.SHOP || 'auxxai.myshopify.com'
const TOKEN = process.env.TOKEN

function assert(ok: boolean, label: string, detail?: unknown) {
  console.log(
    `${ok ? '  PASS' : '  FAIL'}  ${label}${detail === undefined ? '' : ` — ${JSON.stringify(detail)}`}`
  )
  if (!ok) process.exitCode = 1
}

async function main() {
  if (!TOKEN) {
    console.error('Set TOKEN=<shpat_…>')
    process.exit(1)
  }

  const result = await shopifySync({
    streamKey: 'order',
    mode: 'backfill',
    state: {},
    connection: { value: TOKEN, metadata: { connectionVariables: { shop: SHOP } } },
  } as never)

  const records = (result as any).records as any[]
  console.log(`\nFetched ${records.length} order records from ${SHOP}\n`)

  // ── watermark ───────────────────────────────────────────────────────────────
  const next = (result as any).nextState
  console.log('WATERMARK')
  console.log(`  nextState.updatedSince = ${next.updatedSince}`)
  // `updated_at` is not a declared order field, so recompute the truth from the API.
  const raw = await fetch(`https://${SHOP}/admin/api/2024-10/orders.json?status=any&limit=250`, {
    headers: { 'X-Shopify-Access-Token': TOKEN },
  }).then((r) => r.json() as any)
  const apiMax = raw.orders
    .map((o: any) => o.updated_at)
    .sort((a: string, b: string) => Date.parse(b) - Date.parse(a))[0]
  const apiLast = raw.orders[raw.orders.length - 1].updated_at
  console.log(`  true max across page  = ${apiMax}`)
  console.log(`  OLD behaviour (last row) would have been = ${apiLast}`)
  assert(Date.parse(next.updatedSince) === Date.parse(apiMax), 'watermark equals page max')
  assert(Date.parse(apiMax) !== Date.parse(apiLast), 'last row differs from max (bug was real)')

  // ── tags / gateways are comma strings, never arrays ─────────────────────────
  console.log('\nSHAPES')
  const tagged = records.filter((r) => r.fields.tags)
  assert(
    records.every((r) => typeof r.fields.tags === 'string'),
    'every tags value is a string'
  )
  assert(
    records.every((r) => typeof r.fields.payment_gateway_names === 'string'),
    'every payment_gateway_names value is a string'
  )
  assert(
    tagged.length > 0,
    'at least one order carries a non-empty tag string',
    tagged[0]?.fields.tags
  )
  console.log(`  sample tags    = ${JSON.stringify(tagged[0]?.fields.tags)}`)
  console.log(`  sample gateway = ${JSON.stringify(records[0]?.fields.payment_gateway_names)}`)

  // ── derived fulfillment rollup ──────────────────────────────────────────────
  console.log('\nDERIVED (order level)')
  for (const r of records.filter((x) => x.fields.derived.shipment_count > 0)) {
    console.log(`  ${r.fields.name}:`, JSON.stringify(r.fields.derived))
  }

  console.log('\nDERIVED (line level, only lines that shipped)')
  for (const r of records) {
    for (const li of r.fields.line_items) {
      if (li.derived.shipment_count === 0) continue
      console.log(
        `  ${r.fields.name} line ${li.id}: qty=${li.quantity} fulfillable=${li.fulfillable_quantity}`,
        JSON.stringify(li.derived)
      )
    }
  }

  // ── the split-shipment invariant this whole phase exists for ────────────────
  console.log('\nSPLIT-SHIPMENT INVARIANTS')
  const split = records.find((r) => r.fields.derived.is_split_shipment)
  assert(!!split, 'a split-shipment order is present', split?.fields.name)
  if (split) {
    const d = split.fields.derived
    assert(d.shipment_count > 1, 'shipment_count > 1', d.shipment_count)
    assert(
      Date.parse(d.first_fulfilled_at) < Date.parse(d.last_fulfilled_at),
      'first_fulfilled_at strictly precedes last_fulfilled_at',
      [d.first_fulfilled_at, d.last_fulfilled_at]
    )
    const splitLine = split.fields.line_items.find((li: any) => li.derived.shipment_count > 1)
    assert(!!splitLine, 'a line shipped more than once')
    assert(
      splitLine?.derived.tracking_number === null,
      'multi-shipment line carries NO tracking number',
      splitLine?.derived.tracking_number
    )
    assert(
      splitLine?.derived.fulfilled_quantity === splitLine?.quantity,
      'fulfilled quantity sums across shipments to the ordered quantity',
      [splitLine?.derived.fulfilled_quantity, splitLine?.quantity]
    )
  }

  const single = records.find((r) =>
    r.fields.line_items.some((li: any) => li.derived.shipment_count === 1)
  )
  const singleLine = single?.fields.line_items.find((li: any) => li.derived.shipment_count === 1)
  assert(!!singleLine, 'a single-shipment line is present')
  assert(
    typeof singleLine?.derived.tracking_number === 'string',
    'single-shipment line DOES carry a tracking number',
    singleLine?.derived.tracking_number
  )
  assert(
    singleLine?.derived.fulfilled_at === singleLine?.derived.last_fulfilled_at,
    'single-shipment line has identical first/last dates'
  )

  // ── unshipped lines are zeroed, not missing ─────────────────────────────────
  const unshipped = records.flatMap((r) =>
    r.fields.line_items.filter((li: any) => li.derived.shipment_count === 0)
  )
  assert(unshipped.length > 0, 'unshipped lines exist to check')
  assert(
    unshipped.every(
      (li: any) => li.derived.fulfilled_at === null && li.derived.fulfilled_quantity === 0
    ),
    'unshipped lines are explicitly zeroed, not undefined'
  )

  console.log(process.exitCode ? '\nFAILURES ABOVE\n' : '\nAll assertions passed.\n')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
