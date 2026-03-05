import { useEffect } from 'react'
import { WorkflowPanel, useWorkflow } from '@auxx/sdk/client'
import { githubSchema } from './github-schema'
import { OPERATIONS } from './resources/constants'
import { IssuePanel } from './resources/issue/issue-panel'
import { FilePanel } from './resources/file/file-panel'
import { RepositoryPanel } from './resources/repository/repository-panel'
import { ReleasePanel } from './resources/release/release-panel'
import { ReviewPanel } from './resources/review/review-panel'
import { useGithubData } from './shared/use-github-data'
import listRepos from './shared/list-repos.server'

export function GitHubPanel() {
  const api = useWorkflow<typeof githubSchema>(githubSchema)
  const {
    data,
    updateData,
    StringInput,
    OptionsInput,
    VarFieldGroup,
    FieldRow,
    FieldDivider,
    Section,
    ConditionalRender,
  } = api

  const resource = (data?.resource ?? 'issue') as keyof typeof OPERATIONS
  const operation = data?.operation ?? 'create'

  const {
    data: repos,
    loading: reposLoading,
    error: reposError,
  } = useGithubData('repos', listRepos)

  const repoOptions = reposLoading
    ? [{ label: 'Loading repositories...', value: '' }]
    : reposError
      ? [{ label: `Error: ${reposError}`, value: '' }]
      : repos.length === 0
        ? [{ label: 'No repositories found', value: '' }]
        : repos

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
          {/* From List */}
          <ConditionalRender when={(d) => d.repoMode === 'list' || !d.repoMode}>
            <FieldRow>
              <OptionsInput name="repoMode" acceptsVariables={false} variant="outline" />
              <FieldDivider />
              <OptionsInput name="repoList" options={repoOptions} expand />
            </FieldRow>
          </ConditionalRender>

          {/* By Full Name */}
          <ConditionalRender when={(d) => d.repoMode === 'full-name'}>
            <FieldRow>
              <OptionsInput name="repoMode" acceptsVariables={false} variant="outline" />
              <FieldDivider />
              <StringInput name="repoFullName" placeholder="owner/repo" />
            </FieldRow>
          </ConditionalRender>
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
