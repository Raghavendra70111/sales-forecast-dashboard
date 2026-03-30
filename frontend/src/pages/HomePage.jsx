import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useSalesData } from '../context/SalesDataContext'
import { useDerivedSales } from '../hooks/useDerivedSales'
import { ChartCard, StatCard } from '../components/ui/Cards'
import { formatMoney } from '../utils/format'
import { tooltipProps, axisTick } from '../utils/chartTheme'

export default function HomePage() {
  const {
    filteredRows,
    yearFilter,

    // 🔥 ADD THESE
    categories,
    states,
    customerTypes,
    setCategoryFilter,
    setStateFilter,
    setCustomerTypeFilter,
  } = useSalesData()

  const m = useDerivedSales(filteredRows)

  return (
    <div className="animate-fade-in space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-white">Overview</h1>
        <p className="text-slate-400 mt-1 text-sm md:text-base">
          KPIs and monthly revenue trend{yearFilter ? ` (filtered to ${yearFilter})` : ''}.
        </p>
      </div>

      {/* 🔥 FILTERS UI */}
      <div className="flex gap-3 flex-wrap">

        {/* Category */}
        <select
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        {/* State */}
        <select
          onChange={(e) => setStateFilter(e.target.value)}
          className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
        >
          <option value="">All States</option>
          {states.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>

        {/* Customer Type */}
        <select
          onChange={(e) => setCustomerTypeFilter(e.target.value)}
          className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
        >
          <option value="">All Customers</option>
          {customerTypes.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

      </div>

      {/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Sales" value={formatMoney(m.totalSales)} />
        <StatCard title="Line items" value={m.numOrders.toLocaleString()} />
        <StatCard title="Avg order" value={formatMoney(m.avgOrder)} />
        <StatCard title="MoM growth (series)" value={`${m.monthlyGrowth.toFixed(1)}%`} />
        <StatCard title="Year scope" value={yearFilter || 'All years'} />
      </section>

      {/* Chart */}
      <ChartCard title="Monthly Sales Trend (Σ Total by Year-Month)">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={m.salesData}>
            <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={axisTick} interval="preserveStartEnd" />
            <YAxis tick={axisTick} />
            <Tooltip
              {...tooltipProps}
              formatter={(v) => formatMoney(v)}
              labelFormatter={(l) => `Period ${l}`}
            />
            <Line
              type="monotone"
              dataKey="sales"
              stroke="#22d3ee"
              strokeWidth={2.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}