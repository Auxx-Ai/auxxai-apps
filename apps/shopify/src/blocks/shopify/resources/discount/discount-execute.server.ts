// src/blocks/shopify/resources/discount/discount-execute.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { shopifyApi, throwConnectionNotFound, getShopDomain } from '../../shared/shopify-api'

function getConnectionInfo() {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  return {
    token: connection.value,
    shopDomain: getShopDomain(connection.metadata),
  }
}

export async function executeDiscount(operation: string, input: any): Promise<Record<string, any>> {
  const { token, shopDomain } = getConnectionInfo()

  switch (operation) {
    case 'create': {
      // Step 1: Create price rule
      const priceRule: any = {
        title: input.createTitle,
        value_type: input.createValueType || 'percentage',
        value: input.createValue,
        target_type: input.createTargetType || 'line_item',
        target_selection: input.createTargetSelection || 'all',
        allocation_method: input.createAllocationMethod || 'across',
        customer_selection: input.createCustomerSelection || 'all',
        starts_at: input.createStartsAt || new Date().toISOString(),
      }
      if (input.createEndsAt) priceRule.ends_at = input.createEndsAt
      if (input.createUsageLimit) priceRule.usage_limit = Number(input.createUsageLimit)
      if (input.createOncePerCustomer === 'true') priceRule.once_per_customer = true
      if (input.createMinSubtotal) {
        priceRule.prerequisite_subtotal_range = {
          greater_than_or_equal_to: input.createMinSubtotal,
        }
      }
      if (input.createMinQuantity) {
        priceRule.prerequisite_quantity_range = {
          greater_than_or_equal_to: Number(input.createMinQuantity),
        }
      }

      const priceRuleResult = await shopifyApi<{ price_rule: any }>(
        shopDomain,
        token,
        '/price_rules.json',
        { method: 'POST', body: { price_rule: priceRule } }
      )
      const priceRuleId = priceRuleResult.price_rule.id

      // Step 2: Create discount code
      const codeResult = await shopifyApi<{ discount_code: any }>(
        shopDomain,
        token,
        `/price_rules/${priceRuleId}/discount_codes.json`,
        { method: 'POST', body: { discount_code: { code: input.createTitle } } }
      )

      return {
        priceRuleId: String(priceRuleId),
        discountCodeId: String(codeResult.discount_code.id ?? ''),
        code: codeResult.discount_code.code || '',
        value: priceRuleResult.price_rule.value || '',
        valueType: priceRuleResult.price_rule.value_type || '',
        targetType: priceRuleResult.price_rule.target_type || '',
        startsAt: priceRuleResult.price_rule.starts_at || '',
        endsAt: priceRuleResult.price_rule.ends_at || '',
        usageLimit: String(priceRuleResult.price_rule.usage_limit ?? ''),
        timesUsed: '0',
      }
    }

    case 'update': {
      // Update price rule if value fields provided
      if (input.updateValue || input.updateEndsAt || input.updateUsageLimit) {
        const priceRule: any = {}
        if (input.updateValue) priceRule.value = input.updateValue
        if (input.updateEndsAt) priceRule.ends_at = input.updateEndsAt
        if (input.updateUsageLimit) priceRule.usage_limit = Number(input.updateUsageLimit)

        await shopifyApi(shopDomain, token, `/price_rules/${input.updatePriceRuleId}.json`, {
          method: 'PUT',
          body: { price_rule: priceRule },
        })
      }

      // Update discount code if code provided
      let discountCode: any = {}
      if (input.updateCode && input.updateDiscountCodeId) {
        const codeResult = await shopifyApi<{ discount_code: any }>(
          shopDomain,
          token,
          `/price_rules/${input.updatePriceRuleId}/discount_codes/${input.updateDiscountCodeId}.json`,
          { method: 'PUT', body: { discount_code: { code: input.updateCode } } }
        )
        discountCode = codeResult.discount_code
      }

      return {
        priceRuleId: String(input.updatePriceRuleId),
        discountCodeId: String(input.updateDiscountCodeId || discountCode.id || ''),
        code: input.updateCode || discountCode.code || '',
        value: input.updateValue || '',
      }
    }

    case 'get': {
      const priceRuleResult = await shopifyApi<{ price_rule: any }>(
        shopDomain,
        token,
        `/price_rules/${input.getPriceRuleId}.json`
      )

      let discountCode: any = {}
      if (input.getDiscountCodeId) {
        const codeResult = await shopifyApi<{ discount_code: any }>(
          shopDomain,
          token,
          `/price_rules/${input.getPriceRuleId}/discount_codes/${input.getDiscountCodeId}.json`
        )
        discountCode = codeResult.discount_code
      }

      return {
        priceRuleId: String(priceRuleResult.price_rule.id ?? ''),
        discountCodeId: String(discountCode.id ?? ''),
        code: discountCode.code || '',
        value: priceRuleResult.price_rule.value || '',
        valueType: priceRuleResult.price_rule.value_type || '',
        targetType: priceRuleResult.price_rule.target_type || '',
        startsAt: priceRuleResult.price_rule.starts_at || '',
        endsAt: priceRuleResult.price_rule.ends_at || '',
        usageLimit: String(priceRuleResult.price_rule.usage_limit ?? ''),
        timesUsed: String(discountCode.usage_count ?? '0'),
      }
    }

    case 'getMany': {
      const qs: Record<string, string> = {
        limit: input.getManyLimit || '50',
      }

      if (input.getManyPriceRuleId) {
        // List discount codes for a price rule
        const result = await shopifyApi<{ discount_codes: any[] }>(
          shopDomain,
          token,
          `/price_rules/${input.getManyPriceRuleId}/discount_codes.json`,
          { qs }
        )
        const codes = result.discount_codes || []
        return {
          priceRules: [],
          discountCodes: codes,
          count: String(codes.length),
        }
      }

      // List price rules
      const result = await shopifyApi<{ price_rules: any[] }>(
        shopDomain,
        token,
        '/price_rules.json',
        { qs }
      )
      const rules = result.price_rules || []
      return {
        priceRules: rules,
        discountCodes: [],
        count: String(rules.length),
      }
    }

    case 'delete': {
      if (input.deleteDiscountCodeId) {
        await shopifyApi(
          shopDomain,
          token,
          `/price_rules/${input.deletePriceRuleId}/discount_codes/${input.deleteDiscountCodeId}.json`,
          { method: 'DELETE' }
        )
      } else {
        await shopifyApi(shopDomain, token, `/price_rules/${input.deletePriceRuleId}.json`, {
          method: 'DELETE',
        })
      }
      return { success: 'true' }
    }

    default:
      throw new Error(`Unknown discount operation: ${operation}`)
  }
}
