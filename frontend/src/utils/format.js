export const formatMoney = (value) =>
  `$${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`

