import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useSalesData } from '../context/SalesDataContext'
import { useDerivedSales } from '../hooks/useDerivedSales'
import { ChartCard, StatCard } from '../components/ui/Cards'
import { formatMoney } from '../utils/format'
import { tooltipProps, axisTick } from '../utils/chartTheme'

export default function HomePage() {
  const { filteredRows, yearFilter } = useSalesData()
  const m = useDerivedSales(filteredRows)

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-white">Overview</h1>
        <p className="text-slate-400 mt-1 text-sm md:text-base">
          KPIs and monthly revenue trend{yearFilter ? ` (filtered to ${yearFilter})` : ''}. Data matches{' '}
          <code className="text-cyan-400/90">sales.ipynb</code> aggregates.
        </p>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Sales" value={formatMoney(m.totalSales)} />
        <StatCard title="Line items" value={m.numOrders.toLocaleString()} />
        <StatCard title="Avg order" value={formatMoney(m.avgOrder)} />
        <StatCard title="MoM growth (series)" value={`${m.monthlyGrowth.toFixed(1)}%`} />
        <StatCard title="Year scope" value={yearFilter || 'All years'} />
      </section>

      <ChartCard title="Monthly Sales Trend (Σ Total by Year-Month)">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={m.salesData}>
            <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={axisTick} interval="preserveStartEnd" />
            <YAxis tick={axisTick} />
            <Tooltip {...tooltipProps} formatter={(v) => formatMoney(v)} labelFormatter={(l) => `Period ${l}`} />
            <Line type="monotone" dataKey="sales" name="Sales" stroke="#22d3ee" strokeWidth={2.5} dot={false} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}
