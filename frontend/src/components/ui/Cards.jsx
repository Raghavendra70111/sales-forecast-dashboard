export const StatCard = ({ title, value }) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-lg animate-rise">
    <p className="text-xs uppercase tracking-wide text-slate-300">{title}</p>
    <p className="mt-2 text-xl font-semibold">{value}</p>
  </div>
)

export const ChartCard = ({ title, children }) => (
  <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 md:p-6 shadow-xl animate-rise">
    <h2 className="text-lg font-semibold mb-3">{title}</h2>
    {children}
  </section>
)

export const ListCard = ({ title, children }) => (
  <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 md:p-6 shadow-xl animate-rise">
    <h2 className="text-lg font-semibold mb-3">{title}</h2>
    <div className="space-y-2">{children}</div>
  </section>
)

export const ListRow = ({ label, value }) => (
  <div className="flex items-center justify-between rounded-xl bg-slate-900/40 px-3 py-2 border border-white/5">
    <span className="text-sm text-slate-200 truncate max-w-[78%]">{label}</span>
    <span className="text-sm font-medium text-cyan-300">{value}</span>
  </div>
)

