import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { githubSchema } from '../../github-schema'

interface IssuePanelProps {
  api: UseWorkflowApi<typeof githubSchema>
}

export function IssuePanel({ api }: IssuePanelProps) {
  const { StringInput, OptionsInput, VarField, VarFieldGroup, Section, ConditionalRender } = api

  return (
    <>
      {/* Issue: Create */}
      <ConditionalRender when={(d) => d.operation === 'create'}>
        <Section title="Issue Details">
          <VarFieldGroup>
            <VarField>
              <StringInput name="createIssueTitle" />
            </VarField>
            <VarField>
              <StringInput name="createIssueBody" multiline />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="createIssueLabels" />
            </VarField>
            <VarField>
              <StringInput name="createIssueAssignees" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Issue: Create Comment */}
      <ConditionalRender when={(d) => d.operation === 'createComment'}>
        <Section title="Comment">
          <VarFieldGroup>
            <VarField>
              <StringInput name="commentIssueNumber" />
            </VarField>
            <VarField>
              <StringInput name="commentBody" multiline />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Issue: Edit */}
      <ConditionalRender when={(d) => d.operation === 'edit'}>
        <Section title="Issue">
          <VarFieldGroup>
            <VarField>
              <StringInput name="editIssueNumber" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Edit Fields" collapsible defaultOpen>
          <VarFieldGroup>
            <VarField>
              <StringInput name="editIssueTitle" />
            </VarField>
            <VarField>
              <StringInput name="editIssueBody" multiline />
            </VarField>
            <VarField>
              <OptionsInput name="editIssueState" />
            </VarField>
            <VarField>
              <OptionsInput name="editIssueStateReason" />
            </VarField>
            <VarField>
              <StringInput name="editIssueLabels" />
            </VarField>
            <VarField>
              <StringInput name="editIssueAssignees" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Issue: Get */}
      <ConditionalRender when={(d) => d.operation === 'get'}>
        <Section title="Issue">
          <VarFieldGroup>
            <VarField>
              <StringInput name="getIssueNumber" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Issue: Lock */}
      <ConditionalRender when={(d) => d.operation === 'lock'}>
        <Section title="Issue">
          <VarFieldGroup>
            <VarField>
              <StringInput name="lockIssueNumber" />
            </VarField>
            <VarField>
              <OptionsInput name="lockReason" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
