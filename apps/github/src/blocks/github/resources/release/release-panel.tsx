import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { githubSchema } from '../../github-schema'

interface ReleasePanelProps {
  api: UseWorkflowApi<typeof githubSchema>
}

export function ReleasePanel({ api }: ReleasePanelProps) {
  const {
    StringInput,
    BooleanInput,
    NumberInput,
    VarField,
    VarFieldGroup,
    Section,
    ConditionalRender,
  } = api

  return (
    <>
      {/* Release: Create */}
      <ConditionalRender when={(d) => d.operation === 'create'}>
        <Section title="Release">
          <VarFieldGroup>
            <VarField>
              <StringInput name="createReleaseTag" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Details" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="createReleaseName" />
            </VarField>
            <VarField>
              <StringInput name="createReleaseBody" multiline />
            </VarField>
            <VarField>
              <BooleanInput name="createReleaseDraft" />
            </VarField>
            <VarField>
              <BooleanInput name="createReleasePrerelease" />
            </VarField>
            <VarField>
              <StringInput name="createReleaseTarget" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Release: Delete */}
      <ConditionalRender when={(d) => d.operation === 'delete'}>
        <Section title="Release">
          <VarFieldGroup>
            <VarField>
              <StringInput name="deleteReleaseId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Release: Get */}
      <ConditionalRender when={(d) => d.operation === 'get'}>
        <Section title="Release">
          <VarFieldGroup>
            <VarField>
              <StringInput name="getReleaseId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Release: Get Many */}
      <ConditionalRender when={(d) => d.operation === 'getMany'}>
        <Section title="Options">
          <VarFieldGroup>
            <VarField>
              <BooleanInput name="getManyReleasesReturnAll" />
            </VarField>
            <ConditionalRender when={(d) => !d.getManyReleasesReturnAll}>
              <VarField>
                <NumberInput name="getManyReleasesLimit" />
              </VarField>
            </ConditionalRender>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Release: Update */}
      <ConditionalRender when={(d) => d.operation === 'update'}>
        <Section title="Release">
          <VarFieldGroup>
            <VarField>
              <StringInput name="updateReleaseId" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Edit Fields" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="updateReleaseTag" />
            </VarField>
            <VarField>
              <StringInput name="updateReleaseName" />
            </VarField>
            <VarField>
              <StringInput name="updateReleaseBody" multiline />
            </VarField>
            <VarField>
              <BooleanInput name="updateReleaseDraft" />
            </VarField>
            <VarField>
              <BooleanInput name="updateReleasePrerelease" />
            </VarField>
            <VarField>
              <StringInput name="updateReleaseTarget" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
