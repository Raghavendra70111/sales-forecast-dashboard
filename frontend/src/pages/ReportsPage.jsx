import { jsPDF } from 'jspdf'
import { useSalesData } from '../context/SalesDataContext'
import { useDerivedSales } from '../hooks/useDerivedSales'
import { formatMoney } from '../utils/format'

/** Brand colors (RGB) — slate + cyan forecasting theme */
const C = {
  headerBg: [15, 23, 42],
  accent: [6, 182, 212],
  text: [241, 245, 249],
  muted: [148, 163, 184],
  band: [30, 41, 59],
}

export default function ReportsPage() {
  const { filteredRows, yearFilter } = useSalesData()
  const m = useDerivedSales(filteredRows)

  const downloadPdf = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()

    doc.setFillColor(...C.headerBg)
    doc.rect(0, 0, pageW, 38, 'F')
    doc.setTextColor(...C.accent)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('Sales forecasting report', 14, 22)

    doc.setTextColor(...C.muted)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generated · Year filter: ${yearFilter || 'All years'}`, 14, 32)

    let y = 48
    doc.setTextColor(...C.text)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Executive summary', 14, y)
    y += 8
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.muted)
    const summaryLines = doc.splitTextToSize(m.summaryText, pageW - 28)
    doc.text(summaryLines, 14, y)
    y += 6 + summaryLines.length * 5

    doc.setFillColor(...C.band)
    doc.roundedRect(14, y, pageW - 28, 36, 2, 2, 'F')
    doc.setTextColor(...C.accent)
    doc.setFont('helvetica', 'bold')
    doc.text('Key figures', 18, y + 8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.text)
    doc.setFontSize(10)
    doc.text(`Total sales: ${formatMoney(m.totalSales)}`, 18, y + 16)
    doc.text(`Line items: ${m.numOrders.toLocaleString()}`, 18, y + 22)
    doc.text(`Average order: ${formatMoney(m.avgOrder)}`, 18, y + 28)
    doc.text(`MoM growth (on series): ${m.monthlyGrowth.toFixed(1)}%`, 18, y + 34)

    y += 44
    if (y > 250) {
      doc.addPage()
      y = 20
    }

    doc.setTextColor(...C.text)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('Yearly totals (current filter)', 14, y)
    y += 8
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...C.muted)
    m.yearlyData.forEach((row) => {
      if (y > 275) {
        doc.addPage()
        y = 20
      }
      doc.text(`${row.year}: ${formatMoney(row.sales)}`, 14, y)
      y += 6
    })

    doc.save(`forecast-report-${yearFilter || 'all'}.pdf`)
  }

  return (
    <div className="animate-fade-in space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-white">Reports & PDF</h1>
        <p className="text-slate-400 mt-1">
          Printable summary using the same numbers as the dashboard. PDF uses slate header, cyan accents, and readable body text.
        </p>
      </div>

      <section className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-slate-900/90 to-slate-950 p-6 shadow-xl">
        <h2 className="text-cyan-400 font-semibold text-sm uppercase tracking-wider mb-2">Summary</h2>
        <p className="text-slate-200 leading-relaxed text-sm md:text-base border-l-2 border-cyan-500/60 pl-4">{m.summaryText}</p>
        <button
          type="button"
          onClick={downloadPdf}
          className="mt-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold px-5 py-2.5 transition-colors"
        >
          Download PDF report
        </button>
      </section>
    </div>
  )
}
