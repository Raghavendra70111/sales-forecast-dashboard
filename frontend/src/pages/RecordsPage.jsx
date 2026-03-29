import { useState } from 'react'
import { useSalesData } from '../context/SalesDataContext'
import SalesRecordsTable from '../components/SalesRecordsTable'

const LIMIT_OPTIONS = [25, 50, 100, 250, 500, 5000]

export default function RecordsPage() {
  const { filteredRows } = useSalesData()
  const [limit, setLimit] = useState(50)

  const display = limit >= filteredRows.length ? filteredRows : filteredRows.slice(0, limit)

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-white">Sales records</h1>
          <p className="text-slate-400 mt-1 text-sm">
            Full dataset from <code className="text-cyan-400/90">content/data.csv</code> (same as the notebook). Use the navbar search and year filter to narrow rows.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="record-limit" className="text-sm text-slate-400">
            Rows to show
          </label>
          <select
            id="record-limit"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="rounded-xl bg-slate-900 border border-white/10 px-3 py-2 text-sm"
          >
            {LIMIT_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n === 5000 ? 'All' : n}
              </option>
            ))}
          </select>
        </div>
      </div>

      <SalesRecordsTable rows={display} totalCount={filteredRows.length} showingCount={display.length} />
    </div>
  )
}
