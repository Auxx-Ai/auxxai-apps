import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { githubSchema } from '../../github-schema'

interface ReviewPanelProps {
  api: UseWorkflowApi<typeof githubSchema>
}

export function ReviewPanel({ api }: ReviewPanelProps) {
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
      {/* Review: Create */}
      <ConditionalRender when={(d) => d.operation === 'create'}>
        <Section title="Review">
          <VarFieldGroup>
            <VarField>
              <StringInput name="createReviewPRNumber" />
            </VarField>
            <VarField>
              <OptionsInput name="createReviewEvent" />
            </VarField>
            <ConditionalRender
              when={(d) =>
                d.createReviewEvent === 'REQUEST_CHANGES' || d.createReviewEvent === 'COMMENT'
              }
            >
              <VarField>
                <StringInput name="createReviewBody" multiline />
              </VarField>
            </ConditionalRender>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="createReviewCommitId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Review: Get */}
      <ConditionalRender when={(d) => d.operation === 'get'}>
        <Section title="Review">
          <VarFieldGroup>
            <VarField>
              <StringInput name="getReviewPRNumber" />
            </VarField>
            <VarField>
              <StringInput name="getReviewId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Review: Get Many */}
      <ConditionalRender when={(d) => d.operation === 'getMany'}>
        <Section title="Review">
          <VarFieldGroup>
            <VarField>
              <StringInput name="getManyReviewsPRNumber" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options">
          <VarFieldGroup>
            <VarField>
              <BooleanInput name="getManyReviewsReturnAll" />
            </VarField>
            <ConditionalRender when={(d) => !d.getManyReviewsReturnAll}>
              <VarField>
                <NumberInput name="getManyReviewsLimit" />
              </VarField>
            </ConditionalRender>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Review: Update */}
      <ConditionalRender when={(d) => d.operation === 'update'}>
        <Section title="Review">
          <VarFieldGroup>
            <VarField>
              <StringInput name="updateReviewPRNumber" />
            </VarField>
            <VarField>
              <StringInput name="updateReviewId" />
            </VarField>
            <VarField>
              <StringInput name="updateReviewBody" multiline />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
