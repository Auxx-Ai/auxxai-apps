import { getOrganizationConnection, getOrganizationSettings } from '@auxx/sdk/server'
import { BlockValidationError } from '@auxx/sdk/shared'
import {
  quickbooksApi,
  quickbooksQuery,
  getSyncToken,
  throwConnectionNotFound,
  buildEmail,
  buildPhone,
} from '../../shared/quickbooks-api'

async function getConnectionAndRealm() {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const realmId = connection.metadata?.realmId
  if (!realmId) throw new Error('QuickBooks realm ID not found. Please reconnect.')
  const settings = await getOrganizationSettings()
  const sandbox = settings?.sandbox === true
  return { credential: connection.value, realmId, sandbox }
}

export async function executeEmployee(
  operation: string,
  input: any,
): Promise<Record<string, any>> {
  const { credential, realmId, sandbox } = await getConnectionAndRealm()

  switch (operation) {
    case 'create': {
      const givenName = input.createEmployeeGivenName?.trim()
      if (!givenName)
        throw new BlockValidationError([
          { field: 'createEmployeeGivenName', message: 'First name is required.' },
        ])

      const familyName = input.createEmployeeFamilyName?.trim()
      if (!familyName)
        throw new BlockValidationError([
          { field: 'createEmployeeFamilyName', message: 'Last name is required.' },
        ])

      const body: Record<string, any> = {
        GivenName: givenName,
        FamilyName: familyName,
        ...(input.createEmployeeDisplayName && {
          DisplayName: input.createEmployeeDisplayName,
        }),
        ...(input.createEmployeeSSN && { SSN: input.createEmployeeSSN }),
        ...(input.createEmployeeBillableTime !== undefined && {
          BillableTime: input.createEmployeeBillableTime,
        }),
      }

      const email = buildEmail(input.createEmployeeEmail)
      if (email) body.PrimaryEmailAddr = email

      const phone = buildPhone(input.createEmployeePhone)
      if (phone) body.PrimaryPhone = phone

      const result = await quickbooksApi<any>(realmId, '/employee', credential, {
        method: 'POST',
        body,
        sandbox,
      })

      const employee = result.Employee
      return {
        employeeId: employee.Id,
        displayName: employee.DisplayName ?? '',
        givenName: employee.GivenName ?? '',
        familyName: employee.FamilyName ?? '',
        syncToken: employee.SyncToken,
      }
    }

    case 'get': {
      const id = input.getEmployeeId?.trim()
      if (!id)
        throw new BlockValidationError([
          { field: 'getEmployeeId', message: 'Employee ID is required.' },
        ])

      const result = await quickbooksApi<any>(realmId, `/employee/${id}`, credential, {
        sandbox,
      })
      const e = result.Employee

      return {
        employeeId: e.Id,
        displayName: e.DisplayName ?? '',
        givenName: e.GivenName ?? '',
        familyName: e.FamilyName ?? '',
        email: e.PrimaryEmailAddr?.Address ?? '',
        phone: e.PrimaryPhone?.FreeFormNumber ?? '',
        active: String(e.Active ?? true),
        raw: e,
      }
    }

    case 'getMany': {
      const returnAll = input.getManyEmployeeReturnAll === true
      const limit = Number(input.getManyEmployeeLimit) || 50
      const where = input.getManyEmployeeQuery?.trim() || undefined

      const employees = await quickbooksQuery<any>(realmId, 'Employee', credential, {
        where,
        limit,
        returnAll,
        sandbox,
      })

      return {
        employees: employees,
        count: String(employees.length),
      }
    }

    case 'update': {
      const id = input.updateEmployeeId?.trim()
      if (!id)
        throw new BlockValidationError([
          { field: 'updateEmployeeId', message: 'Employee ID is required.' },
        ])

      const { syncToken } = await getSyncToken(realmId, 'Employee', id, credential, {
        sandbox,
      })

      const body: Record<string, any> = {
        sparse: true,
        Id: id,
        SyncToken: syncToken,
        ...(input.updateEmployeeGivenName && { GivenName: input.updateEmployeeGivenName }),
        ...(input.updateEmployeeFamilyName && { FamilyName: input.updateEmployeeFamilyName }),
        ...(input.updateEmployeeDisplayName && {
          DisplayName: input.updateEmployeeDisplayName,
        }),
        ...(input.updateEmployeeSSN && { SSN: input.updateEmployeeSSN }),
        ...(input.updateEmployeeBillableTime !== undefined && {
          BillableTime: input.updateEmployeeBillableTime,
        }),
      }

      const email = buildEmail(input.updateEmployeeEmail)
      if (email) body.PrimaryEmailAddr = email

      const phone = buildPhone(input.updateEmployeePhone)
      if (phone) body.PrimaryPhone = phone

      const result = await quickbooksApi<any>(realmId, '/employee', credential, {
        method: 'POST',
        body,
        sandbox,
      })

      const e = result.Employee
      return {
        employeeId: e.Id,
        displayName: e.DisplayName ?? '',
        givenName: e.GivenName ?? '',
        familyName: e.FamilyName ?? '',
        email: e.PrimaryEmailAddr?.Address ?? '',
        phone: e.PrimaryPhone?.FreeFormNumber ?? '',
        active: String(e.Active ?? true),
        raw: e,
      }
    }

    default:
      throw new Error(`Unknown employee operation: ${operation}`)
  }
}
