// tests/__mocks__/auxx-sdk-server.ts

import { vi } from 'vitest'

export const getOrganizationConnection = vi.fn(() => ({
  id: 'conn-123',
  value: 'test-access-token',
}))

export const getAppSettings = vi.fn(() => ({
  organization: {
    businessAccountId: 'test-business-account-id',
    appId: 'test-app-id',
    appSecret: 'test-app-secret',
  },
}))

export const createWebhookHandler = vi.fn(async () => ({
  id: 'handler-123',
  url: 'https://example.com/webhooks/test/whatsapp-events',
}))

export const updateWebhookHandler = vi.fn(async () => ({}))

export const deleteWebhookHandler = vi.fn(async () => ({}))

export const listWebhookHandlers = vi.fn(async () => [])
