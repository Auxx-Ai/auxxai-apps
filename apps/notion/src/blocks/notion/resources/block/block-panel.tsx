// src/blocks/notion/resources/block/block-panel.tsx

/**
 * Block resource panel UI.
 * Renders operation-specific inputs for Append and Get Children.
 */

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { notionSchema } from '../../notion-schema'

interface BlockPanelProps {
  api: UseWorkflowApi<typeof notionSchema>
}

export function BlockPanel({ api }: BlockPanelProps) {
  const {
    StringInput,
    NumberInput,
    BooleanInput,
    OptionsInput,
    ArrayInput,
    VarField,
    VarFieldGroup,
    Section,
    ConditionalRender,
  } = api

  return (
    <>
      {/* Block: Append */}
      <ConditionalRender when={(d) => d.operation === 'append'}>
        <Section title="Parent">
          <VarFieldGroup>
            <VarField>
              <StringInput name="appendBlockId" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Blocks">
          <ArrayInput name="appendBlocks" addLabel="Add Block">
            <VarFieldGroup>
              <VarField>
                <OptionsInput name="blockType" />
              </VarField>
              <VarField>
                <StringInput name="content" />
              </VarField>
              <VarField>
                <BooleanInput name="checked" />
              </VarField>
              <VarField>
                <OptionsInput name="language" />
              </VarField>
            </VarFieldGroup>
          </ArrayInput>
        </Section>
      </ConditionalRender>

      {/* Block: Get Children */}
      <ConditionalRender when={(d) => d.operation === 'getChildren'}>
        <Section title="Parent">
          <VarFieldGroup>
            <VarField>
              <StringInput name="getChildrenBlockId" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <BooleanInput name="getChildrenReturnAll" />
            </VarField>
            <ConditionalRender when={(d) => !d.getChildrenReturnAll}>
              <VarField>
                <NumberInput name="getChildrenLimit" />
              </VarField>
            </ConditionalRender>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
