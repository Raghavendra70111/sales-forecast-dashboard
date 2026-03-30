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

  // 🔥 NEW FILTER STATES
  const [categoryFilter, setCategoryFilter] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [customerTypeFilter, setCustomerTypeFilter] = useState('')

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
        setError('Cannot reach API. Run: python server.py')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  // 🔥 YEAR FILTER
  const yearFiltered = useMemo(() => {
    if (!yearFilter) return rows
    return rows.filter((r) => String(r.year) === String(yearFilter))
  }, [rows, yearFilter])

  // 🔥 MAIN FILTER LOGIC (UPDATED)
  const filteredRows = useMemo(() => {
    let data = yearFiltered

    // 🔍 SEARCH
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      data = data.filter((row) => {
        const inText = SEARCH_KEYS.some((k) =>
          String(row[k] ?? '').toLowerCase().includes(q)
        )
        const inTotal = String(row.Total ?? '').includes(q)
        const inYear = String(row.year ?? '').includes(q)
        const inYm = String(row.YearMonth ?? '').includes(q)
        return inText || inTotal || inYear || inYm
      })
    }

    // 📦 CATEGORY FILTER
    if (categoryFilter) {
      data = data.filter((r) => r['Product Category'] === categoryFilter)
    }

    // 🌍 STATE FILTER
    if (stateFilter) {
      data = data.filter((r) => r['State'] === stateFilter)
    }

    // 👤 CUSTOMER TYPE FILTER
    if (customerTypeFilter) {
      data = data.filter((r) => r['Customer Type'] === customerTypeFilter)
    }

    return data
  }, [
    yearFiltered,
    searchQuery,
    categoryFilter,
    stateFilter,
    customerTypeFilter,
  ])

  // 🔥 DROPDOWN VALUES
  const categories = useMemo(
    () => [...new Set(rows.map((r) => r['Product Category']).filter(Boolean))],
    [rows]
  )

  const states = useMemo(
    () => [...new Set(rows.map((r) => r['State']).filter(Boolean))],
    [rows]
  )

  const customerTypes = useMemo(
    () => [...new Set(rows.map((r) => r['Customer Type']).filter(Boolean))],
    [rows]
  )

  const salesYears = useMemo(
    () => [...new Set(rows.map((r) => r.year).filter(Boolean))].sort(),
    [rows]
  )

  const value = {
    rows,
    loading,
    error,

    searchQuery,
    setSearchQuery,

    yearFilter,
    setYearFilter,

    // 🔥 NEW FILTERS
    categoryFilter,
    setCategoryFilter,
    stateFilter,
    setStateFilter,
    customerTypeFilter,
    setCustomerTypeFilter,

    // 🔥 DROPDOWN DATA
    categories,
    states,
    customerTypes,

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