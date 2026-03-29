export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const sumBy = (rows, key, valueKey = 'Total') => {
  const map = new Map()
  rows.forEach((row) => {
    const label = row[key] == null || row[key] === '' ? 'Unknown' : String(row[key])
    map.set(label, (map.get(label) || 0) + (Number(row[valueKey]) || 0))
  })
  return Array.from(map.entries()).map(([name, sales]) => ({ name, sales }))
}

export const topN = (rows, n = 10) => [...rows].sort((a, b) => b.sales - a.sales).slice(0, n)
