import { useMemo } from 'react'
import { MONTH_NAMES, sumBy, topN } from '../utils/salesAggregation'

export function useDerivedSales(filteredRows) {
  return useMemo(() => {
    const totalSales = filteredRows.reduce((sum, row) => sum + (Number(row.Total) || 0), 0)
    const numOrders = filteredRows.length
    const avgOrder = numOrders ? totalSales / numOrders : 0

    const salesData = sumBy(filteredRows, 'YearMonth')
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((row) => ({ ...row, year: String(row.name).split('-')[0] }))

    const monthlyGrowth =
      salesData.length > 1 && salesData[salesData.length - 2].sales
        ? ((salesData[salesData.length - 1].sales - salesData[salesData.length - 2].sales) /
            salesData[salesData.length - 2].sales) *
          100
        : 0

    const map = new Map(MONTH_NAMES.map((m) => [m, 0]))
    filteredRows.forEach((row) => {
      const monthIdx = Number(String(row.YearMonth || '').split('-')[1]) - 1
      const month = MONTH_NAMES[monthIdx] || 'Unknown'
      map.set(month, (map.get(month) || 0) + (Number(row.Total) || 0))
    })
    const monthlyData = MONTH_NAMES.map((month) => ({ month, sales: map.get(month) || 0 }))

    const yearlyData = sumBy(filteredRows, 'year')
      .map((row) => ({ year: String(row.name), sales: row.sales }))
      .sort((a, b) => a.year.localeCompare(b.year))

    const categorySales = topN(sumBy(filteredRows, 'Product Category'), 8)
    const customerTypeSales = topN(sumBy(filteredRows, 'Customer Type'), 8)
    const topProducts = topN(sumBy(filteredRows, 'Product Name'), 10)
    const managerPerformance = topN(sumBy(filteredRows, 'Account Manager'), 10)
    const stateSales = topN(sumBy(filteredRows, 'State'), 12)

    const summaryText = (() => {
      const tc = categorySales[0]?.name || 'N/A'
      const ts = stateSales[0]?.name || 'N/A'
      const tp = topProducts[0]?.name || 'N/A'
      return `Total sales ${totalSales.toLocaleString(undefined, { maximumFractionDigits: 0 })} across ${numOrders.toLocaleString()} line items. Average order ${avgOrder.toLocaleString(undefined, { maximumFractionDigits: 0 })}. Month-over-month growth on the series: ${monthlyGrowth.toFixed(1)}%. Leading category: ${tc}. Top state: ${ts}. Top product: ${tp}.`
    })()

    return {
      totalSales,
      numOrders,
      avgOrder,
      monthlyGrowth,
      salesData,
      monthlyData,
      yearlyData,
      categorySales,
      customerTypeSales,
      topProducts,
      managerPerformance,
      stateSales,
      summaryText,
    }
  }, [filteredRows])
}
