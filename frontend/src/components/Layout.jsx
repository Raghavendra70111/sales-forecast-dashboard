import { NavLink, Outlet } from 'react-router-dom'
import { useSalesData } from '../context/SalesDataContext'

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
    isActive ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-300 hover:bg-white/5 border border-transparent'
  }`

export default function Layout() {
  const { searchQuery, setSearchQuery, yearFilter, setYearFilter, salesYears, loading, error } = useSalesData()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(14,116,144,0.22),transparent_42%),radial-gradient(circle_at_80%_0%,rgba(30,64,175,0.28),transparent_38%),radial-gradient(circle_at_50%_100%,rgba(20,184,166,0.16),transparent_42%)]" />

      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2 lg:gap-6">
            <NavLink to="/" className="text-lg font-semibold text-cyan-400 tracking-tight">
              ForecastPro
            </NavLink>
            <nav className="flex flex-wrap gap-1">
              <NavLink to="/" end className={linkClass}>
                Overview
              </NavLink>
              <NavLink to="/trends" className={linkClass}>
                Trends
              </NavLink>
              <NavLink to="/forecast" className={linkClass}>
                SARIMA Forecast
              </NavLink>
              <NavLink to="/reports" className={linkClass}>
                Reports & PDF
              </NavLink>
              <NavLink to="/records" className={linkClass}>
                Sales Records
              </NavLink>
              <NavLink to="/ai" className={linkClass}>
                AI Assistant
              </NavLink>
            </nav>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto lg:min-w-[420px]">
            <label className="sr-only" htmlFor="global-search">
              Search
            </label>
            <input
              id="global-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search orders, customers, products, states…"
              className="flex-1 rounded-xl bg-slate-900/90 border border-white/10 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/60"
            />
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="rounded-xl bg-slate-900/90 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/60 min-w-[120px]"
              aria-label="Filter by year"
            >
              <option value="">All years</option>
              {salesYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
        {error && (
          <div className="max-w-7xl mx-auto px-4 pb-2 text-amber-300 text-sm">{error}</div>
        )}
        {loading && (
          <div className="max-w-7xl mx-auto px-4 pb-2 text-slate-400 text-sm">Loading dataset…</div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 relative z-10">
        <Outlet />
      </main>
    </div>
  )
}
