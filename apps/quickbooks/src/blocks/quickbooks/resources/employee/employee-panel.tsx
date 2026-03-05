// src/blocks/quickbooks/resources/employee/employee-panel.tsx

/**
 * Employee resource panel UI.
 * Renders operation-specific inputs for Employee: Create, Get, Get Many, and Update.
 */

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { quickbooksSchema } from '../../quickbooks-schema'

interface EmployeePanelProps {
  api: UseWorkflowApi<typeof quickbooksSchema>
}

export function EmployeePanel({ api }: EmployeePanelProps) {
  const {
    StringInput,
    NumberInput,
    BooleanInput,
    VarField,
    VarFieldGroup,
    Section,
    ConditionalRender,
  } = api

  return (
    <>
      {/* Employee: Create */}
      <ConditionalRender when={(d) => d.operation === 'create'}>
        <Section title="New Employee">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'createEmployeeGivenName'} />
            </VarField>
            <VarField>
              <StringInput name={'createEmployeeFamilyName'} />
            </VarField>
            <VarField>
              <StringInput name={'createEmployeeDisplayName'} />
            </VarField>
            <VarField>
              <StringInput name={'createEmployeeEmail'} />
            </VarField>
            <VarField>
              <StringInput name={'createEmployeePhone'} />
            </VarField>
            <VarField>
              <StringInput name={'createEmployeeSSN'} />
            </VarField>
            <VarField>
              <BooleanInput name={'createEmployeeBillableTime'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Employee: Get */}
      <ConditionalRender when={(d) => d.operation === 'get'}>
        <Section title="Employee">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'getEmployeeId'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Employee: Get Many */}
      <ConditionalRender when={(d) => d.operation === 'getMany'}>
        <Section title="Filter">
          <VarFieldGroup>
            <VarField>
              <BooleanInput name={'getManyEmployeeReturnAll'} />
            </VarField>
            <ConditionalRender when={(d) => d.getManyEmployeeReturnAll === false}>
              <VarField>
                <NumberInput name={'getManyEmployeeLimit'} />
              </VarField>
            </ConditionalRender>
            <VarField>
              <StringInput name={'getManyEmployeeQuery'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Employee: Update */}
      <ConditionalRender when={(d) => d.operation === 'update'}>
        <Section title="Employee">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'updateEmployeeId'} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Update Fields">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'updateEmployeeGivenName'} />
            </VarField>
            <VarField>
              <StringInput name={'updateEmployeeFamilyName'} />
            </VarField>
            <VarField>
              <StringInput name={'updateEmployeeDisplayName'} />
            </VarField>
            <VarField>
              <StringInput name={'updateEmployeeEmail'} />
            </VarField>
            <VarField>
              <StringInput name={'updateEmployeePhone'} />
            </VarField>
            <VarField>
              <StringInput name={'updateEmployeeSSN'} />
            </VarField>
            <VarField>
              <BooleanInput name={'updateEmployeeBillableTime'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
