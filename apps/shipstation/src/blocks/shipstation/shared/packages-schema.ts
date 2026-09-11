// src/blocks/shipstation/shared/packages-schema.ts

/**
 * The shared packages array for operations that describe physical boxes
 * (`shipment.create`, `shipment.update`, `label.create` in scratch mode,
 * `rate.getMany`).
 *
 * Declared once here and spread into each resource's inputs under its own
 * prefixed key, so the four operations cannot drift apart.
 *
 * ## Rendering
 *
 * An array-of-struct renders with `<ArrayInput name="..." addLabel="...">` and
 * the child inputs INSIDE it; the SDK scopes child paths within the template.
 *
 * 🛑 Do NOT copy the Shopify block for this. Shopify declares `createLineItems`
 * as an array-of-struct in `order-schema.ts` and `order-panel.tsx` never renders
 * it, so that input is unreachable in its UI. The working references are
 * `apps/supabase/src/blocks/supabase/resources/row/row-panel.tsx` (`createFields`)
 * and `apps/notion/.../database-page-panel.tsx` (`createProperties`).
 */

import { Workflow } from '@auxx/sdk'

const WEIGHT_UNITS = [
  { value: 'ounce', label: 'Ounces' },
  { value: 'pound', label: 'Pounds' },
  { value: 'gram', label: 'Grams' },
  { value: 'kilogram', label: 'Kilograms' },
] as const

const DIMENSION_UNITS = [
  { value: 'inch', label: 'Inches' },
  { value: 'centimeter', label: 'Centimeters' },
] as const

/**
 * One package row.
 *
 * Only `weight` is required by ShipStation. The four dimension fields are
 * all-or-nothing and the three references are all-or-nothing; the converter in
 * `to-shipstation-address.ts` enforces both rather than sending partials.
 */
export function packagesArray(options: { label: string; description?: string }) {
  return Workflow.array({
    label: options.label,
    description: options.description,
    required: true,
    items: Workflow.struct({
      weightValue: Workflow.number({ label: 'Weight', acceptsVariables: true }),
      weightUnit: Workflow.select({
        label: 'Weight unit',
        options: WEIGHT_UNITS,
        default: 'ounce',
      }),
      length: Workflow.number({ label: 'Length', acceptsVariables: true }),
      width: Workflow.number({ label: 'Width', acceptsVariables: true }),
      height: Workflow.number({ label: 'Height', acceptsVariables: true }),
      dimensionUnit: Workflow.select({
        label: 'Dimension unit',
        options: DIMENSION_UNITS,
        default: 'inch',
      }),
      packageCode: Workflow.select({
        label: 'Package type',
        description: 'Carrier or custom package type. Leave empty for the carrier default.',
        options: [] as { value: string; label: string }[],
      }),
      insuredValue: Workflow.currency({ label: 'Insured value', acceptsVariables: true }),
      externalPackageId: Workflow.string({ label: 'External package id', acceptsVariables: true }),
      contentDescription: Workflow.string({ label: 'Contents', acceptsVariables: true }),
      reference1: Workflow.string({ label: 'Reference 1', acceptsVariables: true }),
      reference2: Workflow.string({ label: 'Reference 2', acceptsVariables: true }),
      reference3: Workflow.string({ label: 'Reference 3', acceptsVariables: true }),
    }),
  })
}

export { WEIGHT_UNITS, DIMENSION_UNITS }
