import { useEffect } from "react";
import { C, FONTS, METRICS, MAX_HISTORY } from "./constants/theme";
import { useSensorData } from "./hooks/useSensorData";
import Header       from "./components/Header";
import MetricCard   from "./components/MetricCard";
import ChartPanel   from "./components/ChartPanel";
import ControlPanel from "./components/ControlPanel";
import ActivityLog  from "./components/ActivityLog";

const injectFonts = () => {
  if (document.getElementById("bme-fonts")) return;
  const link = document.createElement("link");
  link.id   = "bme-fonts";
  link.rel  = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap";
  document.head.appendChild(link);
};

const getSublabel = (key, latest) => {
  if (!latest) return null;
  if (key === "gas_resistance") {
    return `${(latest.gas_resistance / 1000).toFixed(1)} kΩ · ${latest.air_quality ?? "—"}`;
  }
  return null;
};

const Y_DOMAINS = {
  temperature:    ["auto", "auto"],
  humidity:       [0, 100],
  pressure:       ["auto", "auto"],
  gas_resistance: ["auto", "auto"],
};

export default function App() {
  useEffect(() => { injectFonts(); }, []);

  const { latest, history, total, connected, loading, log, actions } = useSensorData();

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      padding: "32px 28px",
      boxSizing: "border-box",
      fontFamily: FONTS.sans,
    }}>
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto" }}>

        <Header
          connected={connected}
          lastTimestamp={latest?.timestamp}
          sampleCount={total}
        />

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16, marginBottom: 24,
        }}>
          {METRICS.map(({ key, label, unit, color, icon }) => (
            <MetricCard
              key={key}
              label={label}
              value={latest?.[key] ?? null}
              unit={unit}
              color={color}
              icon={icon}
              sublabel={getSublabel(key, latest)}
            />
          ))}
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16, marginBottom: 24,
        }}>
          {METRICS.map(({ key, label, unit, color, icon }) => (
            <ChartPanel
              key={key}
              title={`${icon} ${label} (${unit})`}
              data={history}
              dataKey={key}
              color={color}
              unit={unit}
              yDomain={Y_DOMAINS[key]}
            />
          ))}
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "200px 1fr",
          gap: 16, alignItems: "start",
        }}>
          <ControlPanel loading={loading} actions={actions} />
          <ActivityLog log={log} />
        </div>

        <div style={{
          marginTop: 28, paddingTop: 20,
          borderTop: `1px solid ${C.border}`,
          display: "flex", justifyContent: "space-between",
          fontFamily: FONTS.mono, fontSize: 10,
          color: C.muted, flexWrap: "wrap", gap: 8,
        }}>
          <span>BME680 DASHBOARD · POLLING 2s · HISTORY {MAX_HISTORY} pts</span>
          <span>STM32F411 → UART → FASTAPI → REACT</span>
        </div>

      </div>
    </div>
  );
}