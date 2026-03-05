import { useEffect } from 'react'
import { WorkflowPanel, useWorkflow } from '@auxx/sdk/client'
import { googleContactsSchema } from './google-contacts-schema'
import { OPERATIONS } from './resources/constants'
import { ContactPanel } from './resources/contact/contact-panel'
import { useContactsData } from './shared/use-contacts-data'
import listContactGroups from './shared/list-contact-groups.server'

export function GoogleContactsPanel() {
  const api = useWorkflow<typeof googleContactsSchema>(googleContactsSchema)

  const {
    data,
    updateData,
    OptionsInput,
    VarFieldGroup,
    FieldRow,
    FieldDivider,
    Section,
    ConditionalRender,
  } = api

  const resource = (data?.resource ?? 'contact') as keyof typeof OPERATIONS
  const operation = data?.operation ?? 'create'

  // Auto-reset operation when resource changes
  useEffect(() => {
    if (!data) return
    const validOps = OPERATIONS[resource]
    if (validOps && !validOps.some((op) => op.value === operation)) {
      updateData({ operation: validOps[0].value })
    }
  }, [resource])

  // Load contact groups when needed (create or update operations)
  const needsGroups = operation === 'create' || operation === 'update'

  const { data: groups, loading: groupsLoading } = useContactsData(
    'contactGroups',
    listContactGroups,
    { enabled: needsGroups }
  )

  return (
    <WorkflowPanel>
      <Section title="Operation">
        <VarFieldGroup>
          <ConditionalRender when={(d) => d.resource === 'contact'}>
            <FieldRow>
              <OptionsInput name="resource" acceptsVariables={false} variant="outline" />
              <FieldDivider />
              <OptionsInput name="operation" options={OPERATIONS.contact} expand />
            </FieldRow>
          </ConditionalRender>
        </VarFieldGroup>
      </Section>

      <ConditionalRender when={(d) => d.resource === 'contact'}>
        <ContactPanel api={api} groups={groups} groupsLoading={groupsLoading} />
      </ConditionalRender>
    </WorkflowPanel>
  )
}
