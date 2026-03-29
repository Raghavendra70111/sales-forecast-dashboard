import { useEffect, useState } from "react";
import axios from "axios";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const API_BASE = "http://127.0.0.1:5000/api";

export default function ForecastPage() {
  const [chart, setChart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API_BASE}/sarima-forecast`);

        console.log("API RESPONSE:", res.data); // 🔥 DEBUG

        // SAFE DATA
        const safeData = (res.data.chart || []).map((item) => ({
          name: item.name,
          train: item.train ?? null,
          actual: item.actual ?? null,
          forecast: item.forecast ?? null,
          upper: item.upper ?? null,
          lower: item.lower ?? null,
        }));

        setChart(safeData);
      } catch (err) {
        console.error(err);
        setError("Failed to load forecast data");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // 🔹 LOADING
  if (loading) {
    return <p style={{ color: "white" }}>Loading forecast...</p>;
  }

  // 🔹 ERROR
  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  // 🔹 EMPTY DATA
  if (!chart || chart.length === 0) {
    return <p style={{ color: "orange" }}>No data available</p>;
  }

  return (
    <div style={{ width: "100%", height: 420 }}>
      <h2 style={{ color: "white", marginBottom: "10px" }}>
        SARIMA Forecast
      </h2>

      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chart}>
          <CartesianGrid stroke="#444" strokeDasharray="3 3" />

          <XAxis dataKey="name" />
          <YAxis />

          <Tooltip
            formatter={(value) =>
              value == null ? "—" : `₹${value.toFixed(2)}`
            }
          />

          <Legend />

          {/* TRAIN */}
          <Line
            type="monotone"
            dataKey="train"
            stroke="#38bdf8"
            strokeWidth={2}
            dot={false}
            connectNulls
          />

          {/* ACTUAL */}
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#4ade80"
            strokeWidth={2}
            dot={false}
            connectNulls
          />

          {/* FORECAST */}
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            connectNulls
          />

          {/* CONFIDENCE INTERVAL */}
          <Area
            type="monotone"
            dataKey="upper"
            stroke="none"
            fill="#ef4444"
            fillOpacity={0.1}
          />
          <Area
            type="monotone"
            dataKey="lower"
            stroke="none"
            fill="#ef4444"
            fillOpacity={0.1}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}