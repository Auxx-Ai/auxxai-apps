// src/blocks/notion/resources/page/page-panel.tsx

/**
 * Page resource panel UI.
 * Renders operation-specific inputs for Archive, Create, Search.
 */

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { notionSchema } from '../../notion-schema'

interface PagePanelProps {
  api: UseWorkflowApi<typeof notionSchema>
}

export function PagePanel({ api }: PagePanelProps) {
  const {
    StringInput,
    NumberInput,
    BooleanInput,
    OptionsInput,
    VarField,
    VarFieldGroup,
    Section,
    ConditionalRender,
  } = api

  return (
    <>
      {/* Page: Archive */}
      <ConditionalRender when={(d) => d.operation === 'archive'}>
        <Section title="Page">
          <VarFieldGroup>
            <VarField>
              <StringInput name="archivePageId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Page: Create */}
      <ConditionalRender when={(d) => d.operation === 'create'}>
        <Section title="Parent">
          <VarFieldGroup>
            <VarField>
              <StringInput name="createPageParentId" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Page">
          <VarFieldGroup>
            <VarField>
              <StringInput name="createPageTitle" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Content" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="createPageContent" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="createPageIcon" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Page: Search */}
      <ConditionalRender when={(d) => d.operation === 'search'}>
        <Section title="Search">
          <VarFieldGroup>
            <VarField>
              <StringInput name="searchText" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="searchFilterObject" />
            </VarField>
            <VarField>
              <BooleanInput name="searchReturnAll" />
            </VarField>
            <ConditionalRender when={(d) => !d.searchReturnAll}>
              <VarField>
                <NumberInput name="searchLimit" />
              </VarField>
            </ConditionalRender>
            <VarField>
              <OptionsInput name="searchSortDirection" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
