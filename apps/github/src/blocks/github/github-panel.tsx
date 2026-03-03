import { useEffect } from 'react'
import { WorkflowPanel, useWorkflow } from '@auxx/sdk/client'
import { githubSchema } from './github-schema'
import { OPERATIONS } from './resources/constants'
import { IssuePanel } from './resources/issue/issue-panel'
import { FilePanel } from './resources/file/file-panel'
import { RepositoryPanel } from './resources/repository/repository-panel'
import { ReleasePanel } from './resources/release/release-panel'
import { ReviewPanel } from './resources/review/review-panel'

export function GitHubPanel() {
  const api = useWorkflow<typeof githubSchema>(githubSchema)
  const {
    data,
    updateData,
    StringInput,
    OptionsInput,
    VarField,
    VarFieldGroup,
    FieldRow,
    FieldDivider,
    Section,
    ConditionalRender,
  } = api

  const resource = (data?.resource ?? 'issue') as keyof typeof OPERATIONS
  const operation = data?.operation ?? 'create'

  // Auto-reset operation when resource changes
  useEffect(() => {
    if (!data) return
    const validOps = OPERATIONS[resource]
    if (validOps && !validOps.some((op) => op.value === operation)) {
      updateData({ operation: validOps[0].value })
    }
  }, [resource])

  return (
    <WorkflowPanel>
      <Section title="Operation">
        <VarFieldGroup>
          {/* Issue */}
          <ConditionalRender when={(d) => d.resource === 'issue'}>
            <FieldRow>
              <OptionsInput name="resource" acceptsVariables={false} variant="outline" />
              <FieldDivider />
              <OptionsInput name="operation" options={[...OPERATIONS.issue]} expand />
            </FieldRow>
          </ConditionalRender>

          {/* File */}
          <ConditionalRender when={(d) => d.resource === 'file'}>
            <FieldRow>
              <OptionsInput name="resource" acceptsVariables={false} variant="outline" />
              <FieldDivider />
              <OptionsInput name="operation" options={[...OPERATIONS.file]} expand />
            </FieldRow>
          </ConditionalRender>

          {/* Repository */}
          <ConditionalRender when={(d) => d.resource === 'repository'}>
            <FieldRow>
              <OptionsInput name="resource" acceptsVariables={false} variant="outline" />
              <FieldDivider />
              <OptionsInput name="operation" options={[...OPERATIONS.repository]} expand />
            </FieldRow>
          </ConditionalRender>

          {/* Release */}
          <ConditionalRender when={(d) => d.resource === 'release'}>
            <FieldRow>
              <OptionsInput name="resource" acceptsVariables={false} variant="outline" />
              <FieldDivider />
              <OptionsInput name="operation" options={[...OPERATIONS.release]} expand />
            </FieldRow>
          </ConditionalRender>

          {/* Review */}
          <ConditionalRender when={(d) => d.resource === 'review'}>
            <FieldRow>
              <OptionsInput name="resource" acceptsVariables={false} variant="outline" />
              <FieldDivider />
              <OptionsInput name="operation" options={[...OPERATIONS.review]} expand />
            </FieldRow>
          </ConditionalRender>
        </VarFieldGroup>
      </Section>

      <Section title="Repository">
        <VarFieldGroup>
          <VarField>
            <StringInput name="owner" />
          </VarField>
          <VarField>
            <StringInput name="repo" />
          </VarField>
        </VarFieldGroup>
      </Section>

      <ConditionalRender when={(d) => d.resource === 'issue'}>
        <IssuePanel api={api} />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'file'}>
        <FilePanel api={api} />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'repository'}>
        <RepositoryPanel api={api} />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'release'}>
        <ReleasePanel api={api} />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'review'}>
        <ReviewPanel api={api} />
      </ConditionalRender>
    </WorkflowPanel>
  )
}
