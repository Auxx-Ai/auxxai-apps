import { Workflow } from '@auxx/sdk'

export const employeeInputs = {
  // --- Employee: Create ---
  createEmployeeGivenName: Workflow.string({
    label: 'First Name',
    description: 'Required. Employee first name.',
    acceptsVariables: true,
  }),
  createEmployeeFamilyName: Workflow.string({
    label: 'Last Name',
    description: 'Required. Employee last name.',
    acceptsVariables: true,
  }),
  createEmployeeDisplayName: Workflow.string({
    label: 'Display Name',
    acceptsVariables: true,
  }),
  createEmployeeEmail: Workflow.string({
    label: 'Email',
    placeholder: 'employee@example.com',
    acceptsVariables: true,
  }),
  createEmployeePhone: Workflow.string({
    label: 'Phone',
    acceptsVariables: true,
  }),
  createEmployeeSSN: Workflow.string({
    label: 'SSN',
    description: 'Social Security Number',
    acceptsVariables: true,
  }),
  createEmployeeBillableTime: Workflow.boolean({
    label: 'Billable Time',
    description: 'Track billable time for this employee',
    default: false,
  }),

  // --- Employee: Get ---
  getEmployeeId: Workflow.string({
    label: 'Employee ID',
    acceptsVariables: true,
  }),

  // --- Employee: Get Many ---
  getManyEmployeeReturnAll: Workflow.boolean({
    label: 'Return All',
    description: 'Return all results',
    default: false,
  }),
  getManyEmployeeLimit: Workflow.number({
    label: 'Limit',
    description: 'Max results (1-1000)',
    default: 50,
  }),
  getManyEmployeeQuery: Workflow.string({
    label: 'Filter (WHERE clause)',
    description: "e.g. DisplayName = 'Jane'",
    acceptsVariables: true,
  }),

  // --- Employee: Update ---
  updateEmployeeId: Workflow.string({
    label: 'Employee ID',
    acceptsVariables: true,
  }),
  updateEmployeeGivenName: Workflow.string({
    label: 'First Name',
    acceptsVariables: true,
  }),
  updateEmployeeFamilyName: Workflow.string({
    label: 'Last Name',
    acceptsVariables: true,
  }),
  updateEmployeeDisplayName: Workflow.string({
    label: 'Display Name',
    acceptsVariables: true,
  }),
  updateEmployeeEmail: Workflow.string({
    label: 'Email',
    acceptsVariables: true,
  }),
  updateEmployeePhone: Workflow.string({
    label: 'Phone',
    acceptsVariables: true,
  }),
  updateEmployeeSSN: Workflow.string({
    label: 'SSN',
    description: 'Social Security Number',
    acceptsVariables: true,
  }),
  updateEmployeeBillableTime: Workflow.boolean({
    label: 'Billable Time',
    description: 'Track billable time for this employee',
    default: false,
  }),
}

export function employeeComputeOutputs(operation: string) {
  if (operation === 'create') {
    return {
      employeeId: Workflow.string({ label: 'Employee ID' }),
      displayName: Workflow.string({ label: 'Display Name' }),
      givenName: Workflow.string({ label: 'First Name' }),
      familyName: Workflow.string({ label: 'Last Name' }),
      syncToken: Workflow.string({ label: 'Sync Token' }),
    }
  }
  if (operation === 'get') {
    return {
      employeeId: Workflow.string({ label: 'Employee ID' }),
      displayName: Workflow.string({ label: 'Display Name' }),
      givenName: Workflow.string({ label: 'First Name' }),
      familyName: Workflow.string({ label: 'Last Name' }),
      email: Workflow.string({ label: 'Email' }),
      phone: Workflow.string({ label: 'Phone' }),
      active: Workflow.string({ label: 'Active' }),
      raw: Workflow.string({ label: 'Raw Response (JSON)' }),
    }
  }
  if (operation === 'getMany') {
    return {
      employees: Workflow.string({ label: 'Employees (JSON)' }),
      count: Workflow.string({ label: 'Count' }),
    }
  }
  if (operation === 'update') {
    return {
      employeeId: Workflow.string({ label: 'Employee ID' }),
      displayName: Workflow.string({ label: 'Display Name' }),
      givenName: Workflow.string({ label: 'First Name' }),
      familyName: Workflow.string({ label: 'Last Name' }),
      email: Workflow.string({ label: 'Email' }),
      phone: Workflow.string({ label: 'Phone' }),
      active: Workflow.string({ label: 'Active' }),
      raw: Workflow.string({ label: 'Raw Response (JSON)' }),
    }
  }
  return {}
}
