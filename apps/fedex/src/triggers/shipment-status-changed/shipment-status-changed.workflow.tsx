// src/triggers/shipment-status-changed/shipment-status-changed.workflow.tsx

/**
 * Agent-only trigger. It watches the agent-populated watch registry (via the
 * `watch_shipment` tool), so it has no meaningful workflow surface — a workflow
 * never calls `watch_shipment`, leaving the registry empty. Workflows use
 * `fedex.shipment-tracker` instead, which is configured from its own panel.
 */

import { defineTrigger } from '@auxx/sdk'
import icon from '../../assets/icon.png'
import { shipmentStatusChangedSchema } from './shipment-status-changed-schema'
import shipmentStatusChangedExecute from './shipment-status-changed.server'

export const shipmentStatusChangedTrigger = defineTrigger({
  id: 'fedex.shipment-status-changed',
  label: 'Shipment status changed',
  description:
    'Fires when a watched FedEx shipment gets a new status (delivered, exception, out for delivery, …).',
  icon,
  color: '#4D148C',
  schema: shipmentStatusChangedSchema,
  execute: shipmentStatusChangedExecute,
  config: {
    requiresConnection: true,
    timeout: 30000,
    retries: 0,
    polling: { intervalMinutes: 30, minIntervalMinutes: 15 },
  },
  agent: {
    label: 'FedEx shipment status changed',
    description: 'Fires when a watched FedEx shipment gets a new status (delivered, exception, …)',
    defaultEnabled: false,
  },
})
