// src/tools/list-shopify-stores.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../assets/icon.png'
import listShopifyStoresExecute from './list-shopify-stores.tool.server'

export const listShopifyStoresTool = defineTool({
  id: 'list_shopify_stores',
  name: 'List connected Shopify stores',
  description:
    'List the Shopify store on the connection bound to this agent. Use this once when the user asks a store-specific question (currency, domain, time zone) before calling other Shopify tools.',
  icon: shopifyIcon,
  inputs: z.object({}),
  outputs: z.object({
    stores: z
      .array(
        z.object({
          shopId: z.string().describe('Shop GID (e.g. gid://shopify/Shop/12345).'),
          name: z.string().describe('Store display name.'),
          myshopifyDomain: z.string().describe('Primary `<store>.myshopify.com` domain.'),
          primaryDomain: z.string().describe('Customer-facing domain (may equal myshopifyDomain).'),
          currencyCode: z.string().describe('ISO 4217 currency code.'),
          ianaTimezone: z.string().describe('IANA time zone of the shop.'),
          primaryLocationId: z
            .string()
            .nullable()
            .describe('Default inventory location GID, or null.'),
        })
      )
      .describe(
        'Connected store. Today this is always exactly one entry — one credId per binding. Future multi-shop creds would surface here.'
      ),
  }),
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: listShopifyStoresExecute,
})
