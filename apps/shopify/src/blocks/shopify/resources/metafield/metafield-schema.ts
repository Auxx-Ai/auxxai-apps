// src/blocks/shopify/resources/metafield/metafield-schema.ts

import { Workflow } from '@auxx/sdk'

export const metafieldInputs = {
  // Shared -- owner resource scoping
  ownerResource: Workflow.select({
    label: 'Owner Resource',
    description: 'The resource type this metafield belongs to',
    options: [
      { value: 'shop', label: 'Shop' },
      { value: 'product', label: 'Product' },
      { value: 'variant', label: 'Product Variant' },
      { value: 'customer', label: 'Customer' },
      { value: 'order', label: 'Order' },
      { value: 'draft_order', label: 'Draft Order' },
      { value: 'collection', label: 'Collection' },
    ],
    default: 'product',
  }),
  ownerId: Workflow.string({
    label: 'Owner ID',
    description: 'ID of the resource (not required for shop-level metafields)',
    acceptsVariables: true,
  }),

  // --- Metafield: Create ---
  createNamespace: Workflow.string({
    label: 'Namespace',
    description: 'Container for a set of metafields',
    placeholder: 'custom',
    acceptsVariables: true,
  }),
  createKey: Workflow.string({
    label: 'Key',
    description: 'Identifier for the metafield',
    acceptsVariables: true,
  }),
  createValue: Workflow.string({
    label: 'Value',
    acceptsVariables: true,
  }),
  createType: Workflow.select({
    label: 'Type',
    options: [
      { value: 'single_line_text_field', label: 'Single Line Text' },
      { value: 'multi_line_text_field', label: 'Multi Line Text' },
      { value: 'number_integer', label: 'Integer' },
      { value: 'number_decimal', label: 'Decimal' },
      { value: 'boolean', label: 'Boolean' },
      { value: 'date', label: 'Date' },
      { value: 'date_time', label: 'Date & Time' },
      { value: 'json', label: 'JSON' },
      { value: 'url', label: 'URL' },
      { value: 'color', label: 'Color' },
      { value: 'weight', label: 'Weight' },
      { value: 'dimension', label: 'Dimension' },
      { value: 'volume', label: 'Volume' },
      { value: 'rating', label: 'Rating' },
      { value: 'money', label: 'Money' },
    ],
    default: 'single_line_text_field',
  }),

  // --- Metafield: Update ---
  updateMetafieldId: Workflow.string({ label: 'Metafield ID', acceptsVariables: true }),
  updateValue: Workflow.string({ label: 'Value', acceptsVariables: true }),
  updateType: Workflow.select({
    label: 'Type',
    options: [
      { value: '', label: 'No change' },
      { value: 'single_line_text_field', label: 'Single Line Text' },
      { value: 'multi_line_text_field', label: 'Multi Line Text' },
      { value: 'number_integer', label: 'Integer' },
      { value: 'number_decimal', label: 'Decimal' },
      { value: 'boolean', label: 'Boolean' },
      { value: 'json', label: 'JSON' },
    ],
    default: '',
  }),

  // --- Metafield: Get ---
  getMetafieldId: Workflow.string({ label: 'Metafield ID', acceptsVariables: true }),

  // --- Metafield: Get Many ---
  getManyNamespace: Workflow.string({
    label: 'Namespace',
    description: 'Filter by namespace',
    acceptsVariables: true,
  }),
  getManyKey: Workflow.string({
    label: 'Key',
    description: 'Filter by key',
    acceptsVariables: true,
  }),
  getManyLimit: Workflow.select({
    label: 'Limit',
    options: [
      { value: '10', label: '10' },
      { value: '25', label: '25' },
      { value: '50', label: '50' },
      { value: '100', label: '100' },
      { value: '250', label: '250' },
    ],
    default: '50',
  }),

  // --- Metafield: Delete ---
  deleteMetafieldId: Workflow.string({ label: 'Metafield ID', acceptsVariables: true }),
}

export function metafieldComputeOutputs(operation: string) {
  if (operation === 'create' || operation === 'get' || operation === 'update') {
    return {
      metafieldId: Workflow.string({ label: 'Metafield ID' }),
      namespace: Workflow.string({ label: 'Namespace' }),
      key: Workflow.string({ label: 'Key' }),
      value: Workflow.string({ label: 'Value' }),
      type: Workflow.string({ label: 'Type' }),
      ownerResource: Workflow.string({ label: 'Owner Resource' }),
      ownerId: Workflow.string({ label: 'Owner ID' }),
      createdAt: Workflow.string({ label: 'Created At' }),
      updatedAt: Workflow.string({ label: 'Updated At' }),
    }
  }
  if (operation === 'delete') {
    return {
      success: Workflow.string({ label: 'Success' }),
    }
  }
  if (operation === 'getMany') {
    return {
      metafields: Workflow.string({ label: 'Metafields (JSON)' }),
      count: Workflow.string({ label: 'Count' }),
    }
  }
  return {}
}
