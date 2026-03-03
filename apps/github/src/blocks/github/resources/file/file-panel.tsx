import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { githubSchema } from '../../github-schema'

interface FilePanelProps {
  api: UseWorkflowApi<typeof githubSchema>
}

export function FilePanel({ api }: FilePanelProps) {
  const { StringInput, VarField, VarFieldGroup, Section, ConditionalRender } = api

  return (
    <>
      {/* File: Create */}
      <ConditionalRender when={(d) => d.operation === 'create'}>
        <Section title="File">
          <VarFieldGroup>
            <VarField>
              <StringInput name="createFilePath" />
            </VarField>
            <VarField>
              <StringInput name="createFileContent" multiline />
            </VarField>
            <VarField>
              <StringInput name="createFileCommitMessage" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="createFileBranch" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* File: Delete */}
      <ConditionalRender when={(d) => d.operation === 'delete'}>
        <Section title="File">
          <VarFieldGroup>
            <VarField>
              <StringInput name="deleteFilePath" />
            </VarField>
            <VarField>
              <StringInput name="deleteFileCommitMessage" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="deleteFileBranch" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* File: Edit */}
      <ConditionalRender when={(d) => d.operation === 'edit'}>
        <Section title="File">
          <VarFieldGroup>
            <VarField>
              <StringInput name="editFilePath" />
            </VarField>
            <VarField>
              <StringInput name="editFileContent" multiline />
            </VarField>
            <VarField>
              <StringInput name="editFileCommitMessage" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="editFileBranch" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* File: Get */}
      <ConditionalRender when={(d) => d.operation === 'get'}>
        <Section title="File">
          <VarFieldGroup>
            <VarField>
              <StringInput name="getFilePath" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="getFileBranch" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* File: List */}
      <ConditionalRender when={(d) => d.operation === 'list'}>
        <Section title="Directory">
          <VarFieldGroup>
            <VarField>
              <StringInput name="listFilePath" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="listFileBranch" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
