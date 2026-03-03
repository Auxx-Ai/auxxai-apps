import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { githubSchema } from '../../github-schema'

interface RepositoryPanelProps {
  api: UseWorkflowApi<typeof githubSchema>
}

export function RepositoryPanel({ api }: RepositoryPanelProps) {
  const {
    StringInput,
    OptionsInput,
    BooleanInput,
    NumberInput,
    VarField,
    VarFieldGroup,
    Section,
    ConditionalRender,
  } = api

  return (
    <>
      {/* Repository: Get — no additional fields beyond owner/repo */}

      {/* Repository: Get Issues */}
      <ConditionalRender when={(d) => d.operation === 'getIssues'}>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <BooleanInput name="getIssuesReturnAll" />
            </VarField>
            <ConditionalRender when={(d) => !d.getIssuesReturnAll}>
              <VarField>
                <NumberInput name="getIssuesLimit" />
              </VarField>
            </ConditionalRender>
            <VarField>
              <OptionsInput name="getIssuesState" />
            </VarField>
            <VarField>
              <OptionsInput name="getIssuesSort" />
            </VarField>
            <VarField>
              <OptionsInput name="getIssuesDirection" />
            </VarField>
            <VarField>
              <StringInput name="getIssuesLabels" />
            </VarField>
            <VarField>
              <StringInput name="getIssuesAssignee" />
            </VarField>
            <VarField>
              <StringInput name="getIssuesSince" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Repository: Get Pull Requests */}
      <ConditionalRender when={(d) => d.operation === 'getPullRequests'}>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <BooleanInput name="getPRsReturnAll" />
            </VarField>
            <ConditionalRender when={(d) => !d.getPRsReturnAll}>
              <VarField>
                <NumberInput name="getPRsLimit" />
              </VarField>
            </ConditionalRender>
            <VarField>
              <OptionsInput name="getPRsState" />
            </VarField>
            <VarField>
              <OptionsInput name="getPRsSort" />
            </VarField>
            <VarField>
              <OptionsInput name="getPRsDirection" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
