// src/tools/internal/address-validate.tool.server.ts

import { executeAddress } from '../../blocks/shipstation/resources/address/address-execute.server'

export default async function addressValidateExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeAddress('validate', input)
}
