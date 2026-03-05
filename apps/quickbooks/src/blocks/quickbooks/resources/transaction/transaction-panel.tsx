import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { quickbooksSchema } from '../../quickbooks-schema'

interface TransactionPanelProps {
  api: UseWorkflowApi<typeof quickbooksSchema>
}

export function TransactionPanel({ api }: TransactionPanelProps) {
  const {
    StringInput,
    OptionsInput,
    VarField,
    VarFieldGroup,
    Section,
    ConditionalRender,
  } = api

  return (
    <>
      <ConditionalRender when={(d) => d.operation === 'getReport'}>
        <Section title="Date Range">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'getReportDateMacro'} />
            </VarField>
            <ConditionalRender when={(d) => !d.getReportDateMacro}>
              <VarField>
                <StringInput name={'getReportStartDate'} />
              </VarField>
              <VarField>
                <StringInput name={'getReportEndDate'} />
              </VarField>
            </ConditionalRender>
          </VarFieldGroup>
        </Section>

        <Section title="Filters">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'getReportTransactionType'} />
            </VarField>
            <VarField>
              <OptionsInput name={'getReportGroupBy'} />
            </VarField>
          </VarFieldGroup>
        </Section>

        <Section title="Sorting & Columns">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'getReportSortBy'} />
            </VarField>
            <VarField>
              <OptionsInput name={'getReportSortOrder'} />
            </VarField>
            <VarField>
              <StringInput name={'getReportColumns'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
