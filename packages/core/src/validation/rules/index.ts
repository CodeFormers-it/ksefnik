import type { ValidationRule } from '../rule.js'
import { requiredFieldsRule } from './required-fields.js'
import { nipFormatRule } from './nip-format.js'
import { buyerNipFormatRule } from './buyer-nip-format.js'
import { nipNotZerosRule } from './nip-not-zeros.js'
import { amountPositiveRule } from './amount-positive.js'
import { amountMaxRule } from './amount-max.js'
import { dateValidRule } from './date-valid.js'
import { dateNotFutureRule } from './date-not-future.js'
import { dateOrderRule } from './date-order.js'
import { vatRateValidRule } from './vat-rate-valid.js'
import { invoiceNumberFormatRule } from './invoice-number-format.js'
import { duplicateCheckRule } from './duplicate-check.js'
import { currencyValidRule } from './currency-valid.js'
import { lineItemsSumRule } from './line-items-sum.js'
import { vatCalculationRule } from './vat-calculation.js'
import { sellerBuyerDifferentRule } from './seller-buyer-different.js'
import { dateRangeRule } from './date-range.js'
import { quantityPositiveRule } from './quantity-positive.js'
import { descriptionLengthRule } from './description-length.js'
import { ksefReferenceFormatRule } from './ksef-reference-format.js'

export const allRules: ValidationRule[] = [
  requiredFieldsRule,
  nipFormatRule,
  buyerNipFormatRule,
  nipNotZerosRule,
  amountPositiveRule,
  amountMaxRule,
  dateValidRule,
  dateNotFutureRule,
  dateOrderRule,
  vatRateValidRule,
  invoiceNumberFormatRule,
  duplicateCheckRule,
  currencyValidRule,
  lineItemsSumRule,
  vatCalculationRule,
  sellerBuyerDifferentRule,
  dateRangeRule,
  quantityPositiveRule,
  descriptionLengthRule,
  ksefReferenceFormatRule,
]

export {
  requiredFieldsRule,
  nipFormatRule,
  buyerNipFormatRule,
  nipNotZerosRule,
  amountPositiveRule,
  amountMaxRule,
  dateValidRule,
  dateNotFutureRule,
  dateOrderRule,
  vatRateValidRule,
  invoiceNumberFormatRule,
  duplicateCheckRule,
  currencyValidRule,
  lineItemsSumRule,
  vatCalculationRule,
  sellerBuyerDifferentRule,
  dateRangeRule,
  quantityPositiveRule,
  descriptionLengthRule,
  ksefReferenceFormatRule,
}
