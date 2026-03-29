import { formatMoney } from '../utils/format'

const TABLE_HEADERS = [
  'Order No',
  'Order Date',
  'Customer Name',
  'City',
  'State',
  'Product Name',
  'Product Category',
  'Customer Type',
  'Total',
]

const SalesRecordsTable = ({ rows, totalCount, showingCount }) => (
  <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
    <div className="p-4 border-b border-white/10">
      <h2 className="text-lg font-semibold">Sales records ({totalCount} match filters)</h2>
      <p className="text-sm text-slate-300">
        Showing {showingCount ?? rows.length} rows. Adjust &quot;Rows to show&quot; on the Records page to see more (up to all line items from the notebook CSV).
      </p>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-sm">
        <thead className="bg-slate-900/70">
          <tr>
            {TABLE_HEADERS.map((header) => (
              <th key={header} className="text-left px-4 py-3 text-slate-300 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row['Order No']}-${row['Order Date']}-${index}`} className="border-t border-white/5 hover:bg-white/5 transition-colors">
              <td className="px-4 py-3">{row['Order No']}</td>
              <td className="px-4 py-3">{row['Order Date']}</td>
              <td className="px-4 py-3">{row['Customer Name']}</td>
              <td className="px-4 py-3">{row.City}</td>
              <td className="px-4 py-3">{row.State}</td>
              <td className="px-4 py-3">{row['Product Name']}</td>
              <td className="px-4 py-3">{row['Product Category']}</td>
              <td className="px-4 py-3">{row['Customer Type']}</td>
              <td className="px-4 py-3">{formatMoney(row.Total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
)

export default SalesRecordsTable
