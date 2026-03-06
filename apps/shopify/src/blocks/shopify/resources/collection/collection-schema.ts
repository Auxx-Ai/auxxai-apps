// src/blocks/shopify/resources/collection/collection-schema.ts

import { Workflow } from '@auxx/sdk'

export const collectionInputs = {
  // --- Collection: Create ---
  createTitle: Workflow.string({ label: 'Title', acceptsVariables: true }),
  createBodyHtml: Workflow.string({ label: 'Description (HTML)', acceptsVariables: true }),
  createPublished: Workflow.boolean({
    label: 'Published',
    default: true,
  }),
  createSortOrder: Workflow.select({
    label: 'Sort Order',
    options: [
      { value: 'alpha-asc', label: 'Alphabetically (A-Z)' },
      { value: 'alpha-desc', label: 'Alphabetically (Z-A)' },
      { value: 'best-selling', label: 'Best Selling' },
      { value: 'created', label: 'Date Created (oldest first)' },
      { value: 'created-desc', label: 'Date Created (newest first)' },
      { value: 'manual', label: 'Manual' },
      { value: 'price-asc', label: 'Price (low to high)' },
      { value: 'price-desc', label: 'Price (high to low)' },
    ],
    default: 'alpha-asc',
  }),
  createTemplateSuffix: Workflow.string({
    label: 'Template Suffix',
    description: 'Liquid template suffix',
    acceptsVariables: true,
  }),
  createImageUrl: Workflow.url({ label: 'Image URL', acceptsVariables: true }),

  // --- Collection: Update ---
  updateCollectionId: Workflow.string({ label: 'Collection ID', acceptsVariables: true }),
  updateTitle: Workflow.string({ label: 'Title', acceptsVariables: true }),
  updateBodyHtml: Workflow.string({ label: 'Description (HTML)', acceptsVariables: true }),
  updatePublished: Workflow.select({
    label: 'Published',
    options: [
      { value: '', label: 'No change' },
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' },
    ],
    default: '',
  }),
  updateSortOrder: Workflow.select({
    label: 'Sort Order',
    options: [
      { value: '', label: 'No change' },
      { value: 'alpha-asc', label: 'Alphabetically (A-Z)' },
      { value: 'alpha-desc', label: 'Alphabetically (Z-A)' },
      { value: 'best-selling', label: 'Best Selling' },
      { value: 'created', label: 'Date Created (oldest first)' },
      { value: 'created-desc', label: 'Date Created (newest first)' },
      { value: 'manual', label: 'Manual' },
      { value: 'price-asc', label: 'Price (low to high)' },
      { value: 'price-desc', label: 'Price (high to low)' },
    ],
    default: '',
  }),

  // --- Collection: Get ---
  getCollectionId: Workflow.string({ label: 'Collection ID', acceptsVariables: true }),
  getFields: Workflow.string({
    label: 'Fields',
    description: 'Comma-separated fields',
    acceptsVariables: true,
  }),

  // --- Collection: Get Many ---
  getManyType: Workflow.select({
    label: 'Collection Type',
    options: [
      { value: 'custom', label: 'Custom Collections' },
      { value: 'smart', label: 'Smart Collections' },
    ],
    default: 'custom',
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
  getManyProductId: Workflow.string({
    label: 'Product ID',
    description: 'Filter collections that contain this product',
    acceptsVariables: true,
  }),
  getManyTitle: Workflow.string({
    label: 'Title',
    description: 'Filter by title',
    acceptsVariables: true,
  }),
  getManyFields: Workflow.string({
    label: 'Fields',
    description: 'Comma-separated fields',
    acceptsVariables: true,
  }),

  // --- Collection: Delete ---
  deleteCollectionId: Workflow.string({ label: 'Collection ID', acceptsVariables: true }),

  // --- Collection: Add Product ---
  addProductCollectionId: Workflow.string({ label: 'Collection ID', acceptsVariables: true }),
  addProductProductId: Workflow.string({ label: 'Product ID', acceptsVariables: true }),

  // --- Collection: Remove Product ---
  removeProductCollectId: Workflow.string({
    label: 'Collect ID',
    description: 'The collect ID (join record between collection and product)',
    acceptsVariables: true,
  }),
}

const collectionFields = {
  collectionId: Workflow.string(),
  title: Workflow.string(),
  bodyHtml: Workflow.string(),
  handle: Workflow.string(),
  sortOrder: Workflow.string(),
  publishedAt: Workflow.datetime(),
  updatedAt: Workflow.datetime(),
}

export function collectionComputeOutputs(operation: string) {
  if (operation === 'create' || operation === 'get' || operation === 'update') {
    return {
      collection: Workflow.struct(collectionFields, { label: 'collection' }),
    }
  }
  if (operation === 'delete') {
    return {
      success: Workflow.boolean({ label: 'success' }),
    }
  }
  if (operation === 'getMany') {
    return {
      collections: Workflow.array({
        label: 'collections',
        items: Workflow.struct(collectionFields, { label: 'collection' }),
      }),
      count: Workflow.number({ label: 'count', integer: true }),
    }
  }
  if (operation === 'addProduct') {
    return {
      collectId: Workflow.string(),
      collectionId: Workflow.string(),
      productId: Workflow.string(),
    }
  }
  if (operation === 'removeProduct') {
    return {
      success: Workflow.boolean({ label: 'success' }),
    }
  }
  return {}
}
