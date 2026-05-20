// src/blocks/template/template-panel.tsx

import { WorkflowPanel, useWorkflow } from '@auxx/sdk/client'
import { templateSchema } from './template-schema'

export function TemplatePanel() {
  const { Section, VarFieldGroup, FieldRow, OptionsInput, StringInput } =
    useWorkflow<typeof templateSchema>(templateSchema)

  return (
    <WorkflowPanel>
      <Section title="Operation">
        <VarFieldGroup>
          <FieldRow>
            <OptionsInput name="operation" acceptsVariables={false} variant="outline" />
          </FieldRow>
          <FieldRow>
            <StringInput name="text" />
          </FieldRow>
        </VarFieldGroup>
      </Section>
    </WorkflowPanel>
  )
}
