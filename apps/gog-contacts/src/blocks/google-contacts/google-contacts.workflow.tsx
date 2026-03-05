import { type WorkflowBlock } from '@auxx/sdk'
import {
  WorkflowNode,
  WorkflowNodeRow,
  WorkflowNodeHandle,
  useWorkflowNode,
} from '@auxx/sdk/client'
import googleContactsIcon from '../../assets/icon.png'
import googleContactsExecute from './google-contacts.server'
import { GoogleContactsPanel } from './google-contacts-panel'
import { googleContactsSchema } from './google-contacts-schema'

export { googleContactsSchema }

function GoogleContactsNode() {
  const { data } = useWorkflowNode()

  let label = 'Google Contacts'

  if (data.resource === 'contact') {
    if (data.operation === 'create') label = 'Create Contact'
    else if (data.operation === 'delete') label = 'Delete Contact'
    else if (data.operation === 'get') label = 'Get Contact'
    else if (data.operation === 'getMany') label = 'Get Contacts'
    else if (data.operation === 'update') label = 'Update Contact'
  }

  return (
    <WorkflowNode>
      <WorkflowNodeHandle type="target" id="target" position="left" />
      <WorkflowNodeRow label={label} />
      <WorkflowNodeHandle type="source" id="source" position="right" />
    </WorkflowNode>
  )
}

export const googleContactsBlock = {
  id: 'google-contacts',
  label: 'Google Contacts',
  description: 'Manage Google Contacts — create, update, delete, and search contacts',
  category: 'action',
  icon: googleContactsIcon,
  color: '#4285F4',
  schema: googleContactsSchema,
  node: GoogleContactsNode,
  panel: GoogleContactsPanel,
  execute: googleContactsExecute,
  config: {
    timeout: 15000,
    retries: 1,
    requiresConnection: true,
  },
} satisfies WorkflowBlock<typeof googleContactsSchema>
