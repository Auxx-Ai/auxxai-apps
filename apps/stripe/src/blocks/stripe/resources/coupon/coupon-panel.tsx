import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { stripeSchema } from '../../stripe-schema'

interface CouponPanelProps {
  api: UseWorkflowApi<typeof stripeSchema>
}

export function CouponPanel({ api }: CouponPanelProps) {
  const {
    OptionsInput,
    NumberInput,
    StringInput,
    BooleanInput,
    VarField,
    VarFieldGroup,
    Section,
    ConditionalRender,
  } = api

  return (
    <>
      <ConditionalRender when={(d) => d.operation === 'create'}>
        <Section title="Coupon Details">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="createCouponDuration" />
            </VarField>
            <VarField>
              <OptionsInput name="createCouponType" />
            </VarField>
            <ConditionalRender when={(d) => d.createCouponType === 'percent'}>
              <VarField>
                <NumberInput name="createCouponPercentOff" />
              </VarField>
            </ConditionalRender>
            <ConditionalRender when={(d) => d.createCouponType === 'fixedAmount'}>
              <VarField>
                <NumberInput name="createCouponAmountOff" />
              </VarField>
              <VarField>
                <StringInput name="createCouponCurrency" />
              </VarField>
            </ConditionalRender>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      <ConditionalRender when={(d) => d.operation === 'getMany'}>
        <Section title="Options">
          <VarFieldGroup>
            <VarField>
              <BooleanInput name="getManyCouponsReturnAll" />
            </VarField>
            <ConditionalRender when={(d) => !d.getManyCouponsReturnAll}>
              <VarField>
                <NumberInput name="getManyCouponsLimit" />
              </VarField>
            </ConditionalRender>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
