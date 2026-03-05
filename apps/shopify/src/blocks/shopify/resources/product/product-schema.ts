// src/blocks/shopify/resources/product/product-schema.ts

import { Workflow } from '@auxx/sdk'

export const productInputs = {
  // --- Product: Create ---
  createTitle: Workflow.string({
    label: 'Title',
    description: 'Product name',
    placeholder: 'Classic T-Shirt',
    acceptsVariables: true,
  }),
  createBodyHtml: Workflow.string({
    label: 'Description (HTML)',
    description: 'Product description in HTML',
    acceptsVariables: true,
  }),
  createVendor: Workflow.string({
    label: 'Vendor',
    placeholder: 'My Store',
    acceptsVariables: true,
  }),
  createProductType: Workflow.string({
    label: 'Product Type',
    description: 'Categorization for filtering',
    placeholder: 'Clothing',
    acceptsVariables: true,
  }),
  createTags: Workflow.string({
    label: 'Tags',
    description: 'Comma-separated (max 250 tags)',
    placeholder: 'sale, summer, new',
    acceptsVariables: true,
  }),
  createHandle: Workflow.string({
    label: 'Handle',
    description: 'URL-friendly name (auto-generated from title if blank)',
    placeholder: 'classic-t-shirt',
    acceptsVariables: true,
  }),
  createPublished: Workflow.select({
    label: 'Published',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No (Draft)' },
    ],
    default: 'true',
  }),
  createPublishedScope: Workflow.select({
    label: 'Published Scope',
    options: [
      { value: 'global', label: 'Global (Online Store + POS)' },
      { value: 'web', label: 'Web only' },
    ],
    default: 'global',
  }),
  createTemplateSuffix: Workflow.string({
    label: 'Template Suffix',
    description: 'Suffix for Liquid template (e.g., "special" -> product.special.liquid)',
    acceptsVariables: true,
  }),
  createImages: Workflow.array({
    label: 'Images',
    items: Workflow.struct({
      src: Workflow.string({ label: 'Image URL', acceptsVariables: true }),
      position: Workflow.string({ label: 'Position (1 = main)', acceptsVariables: true }),
    }),
  }),
  createOptions: Workflow.string({
    label: 'Options',
    description: 'Comma-separated custom properties (e.g., "Size, Color"). Max 3 options.',
    placeholder: 'Size, Color',
    acceptsVariables: true,
  }),

  // --- Product: Delete ---
  deleteProductId: Workflow.string({
    label: 'Product ID',
    description: 'ID of the product to delete',
    acceptsVariables: true,
  }),

  // --- Product: Get ---
  getProductId: Workflow.string({
    label: 'Product ID',
    description: 'ID of the product to retrieve',
    acceptsVariables: true,
  }),
  getProductFields: Workflow.string({
    label: 'Fields',
    description: 'Comma-separated list of fields to include (leave empty for all)',
    placeholder: 'id,title,vendor',
    acceptsVariables: true,
  }),

  // --- Product: Get Many ---
  getProductManyLimit: Workflow.select({
    label: 'Limit',
    description: 'Maximum number of products to return',
    options: [
      { value: '10', label: '10' },
      { value: '25', label: '25' },
      { value: '50', label: '50' },
      { value: '100', label: '100' },
      { value: '250', label: '250' },
    ],
    default: '50',
  }),
  getProductManyTitle: Workflow.string({
    label: 'Title',
    description: 'Filter by exact product title',
    acceptsVariables: true,
  }),
  getProductManyVendor: Workflow.string({
    label: 'Vendor',
    description: 'Filter by vendor name',
    acceptsVariables: true,
  }),
  getProductManyProductType: Workflow.string({
    label: 'Product Type',
    description: 'Filter by product type',
    acceptsVariables: true,
  }),
  getProductManyHandle: Workflow.string({
    label: 'Handle',
    description: 'Filter by product handle',
    acceptsVariables: true,
  }),
  getProductManyCollectionId: Workflow.string({
    label: 'Collection ID',
    description: 'Filter products by collection',
    acceptsVariables: true,
  }),
  getProductManyPublishedStatus: Workflow.select({
    label: 'Published Status',
    options: [
      { value: 'any', label: 'Any' },
      { value: 'published', label: 'Published' },
      { value: 'unpublished', label: 'Unpublished' },
    ],
    default: 'any',
  }),
  getProductManyCreatedAtMin: Workflow.string({
    label: 'Created After',
    description: 'Show products created after date (ISO 8601)',
    acceptsVariables: true,
  }),
  getProductManyCreatedAtMax: Workflow.string({
    label: 'Created Before',
    description: 'Show products created before date (ISO 8601)',
    acceptsVariables: true,
  }),
  getProductManyUpdatedAtMin: Workflow.string({
    label: 'Updated After',
    acceptsVariables: true,
  }),
  getProductManyUpdatedAtMax: Workflow.string({
    label: 'Updated Before',
    acceptsVariables: true,
  }),
  getProductManyFields: Workflow.string({
    label: 'Fields',
    description: 'Comma-separated list of fields to include',
    placeholder: 'id,title,vendor',
    acceptsVariables: true,
  }),

  // --- Product: Update ---
  updateProductId: Workflow.string({
    label: 'Product ID',
    description: 'ID of the product to update',
    acceptsVariables: true,
  }),
  updateTitle: Workflow.string({
    label: 'Title',
    acceptsVariables: true,
  }),
  updateBodyHtml: Workflow.string({
    label: 'Description (HTML)',
    acceptsVariables: true,
  }),
  updateVendor: Workflow.string({
    label: 'Vendor',
    acceptsVariables: true,
  }),
  updateProductType: Workflow.string({
    label: 'Product Type',
    acceptsVariables: true,
  }),
  updateTags: Workflow.string({
    label: 'Tags',
    description: 'Comma-separated (replaces existing)',
    acceptsVariables: true,
  }),
  updateHandle: Workflow.string({
    label: 'Handle',
    acceptsVariables: true,
  }),
  updatePublished: Workflow.select({
    label: 'Published',
    options: [
      { value: '', label: 'No Change' },
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No (Draft)' },
    ],
    default: '',
  }),
  updatePublishedScope: Workflow.select({
    label: 'Published Scope',
    options: [
      { value: '', label: 'No Change' },
      { value: 'global', label: 'Global' },
      { value: 'web', label: 'Web only' },
    ],
    default: '',
  }),
  updateTemplateSuffix: Workflow.string({
    label: 'Template Suffix',
    acceptsVariables: true,
  }),
  updateImages: Workflow.array({
    label: 'Images',
    items: Workflow.struct({
      src: Workflow.string({ label: 'Image URL', acceptsVariables: true }),
      position: Workflow.string({ label: 'Position', acceptsVariables: true }),
    }),
  }),
  updateOptions: Workflow.string({
    label: 'Options',
    description: 'Comma-separated custom properties',
    acceptsVariables: true,
  }),
}

export function productComputeOutputs(operation: string) {
  if (operation === 'create' || operation === 'get' || operation === 'update') {
    return {
      productId: Workflow.string({ label: 'Product ID' }),
      title: Workflow.string({ label: 'Title' }),
      bodyHtml: Workflow.string({ label: 'Description (HTML)' }),
      vendor: Workflow.string({ label: 'Vendor' }),
      productType: Workflow.string({ label: 'Product Type' }),
      handle: Workflow.string({ label: 'Handle' }),
      tags: Workflow.string({ label: 'Tags' }),
      status: Workflow.string({ label: 'Status' }),
      variants: Workflow.string({ label: 'Variants (JSON)' }),
      images: Workflow.string({ label: 'Images (JSON)' }),
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
      products: Workflow.string({ label: 'Products (JSON)' }),
      count: Workflow.string({ label: 'Count' }),
    }
  }
  return {}
}
