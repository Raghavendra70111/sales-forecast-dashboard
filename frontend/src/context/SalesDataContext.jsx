import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import axios from 'axios'

const API_BASE = 'http://127.0.0.1:5000/api'

const SalesDataContext = createContext(null)

const SEARCH_KEYS = [
  'Order No',
  'Customer Name',
  'City',
  'State',
  'Product Name',
  'Product Category',
  'Customer Type',
  'Account Manager',
]

export function SalesDataProvider({ children }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [yearFilter, setYearFilter] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const { data } = await axios.get(`${API_BASE}/full-data`)
        const normalized = (data.rows || []).map((row) => {
          const ym = String(row.YearMonth || '')
          const y = ym.split('-')[0] || ''
          return {
            ...row,
            year: y,
            Total: Number(row.Total) || 0,
          }
        })
        setRows(normalized)
        setError(null)
      } catch (e) {
        console.error(e)
        setError('Cannot reach API. Run: python server.py (use project .venv so statsmodels works).')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const yearFiltered = useMemo(() => {
    if (!yearFilter) return rows
    return rows.filter((r) => String(r.year) === String(yearFilter))
  }, [rows, yearFilter])

  const filteredRows = useMemo(() => {
    const base = yearFiltered
    const q = searchQuery.trim().toLowerCase()
    if (!q) return base
    return base.filter((row) => {
      const inText = SEARCH_KEYS.some((k) => String(row[k] ?? '').toLowerCase().includes(q))
      const inTotal = String(row.Total ?? '').includes(q)
      const inYear = String(row.year ?? '').includes(q)
      const inYm = String(row.YearMonth ?? '').includes(q)
      return inText || inTotal || inYear || inYm
    })
  }, [yearFiltered, searchQuery])

  const salesYears = useMemo(
    () => [...new Set(rows.map((r) => r.year).filter(Boolean))].sort(),
    [rows],
  )

  const value = {
    rows,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    yearFilter,
    setYearFilter,
    filteredRows,
    yearFiltered,
    salesYears,
  }

  return <SalesDataContext.Provider value={value}>{children}</SalesDataContext.Provider>
}

export function useSalesData() {
  const ctx = useContext(SalesDataContext)
  if (!ctx) throw new Error('useSalesData must be used inside SalesDataProvider')
  return ctx
}
