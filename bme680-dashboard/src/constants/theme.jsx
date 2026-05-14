export const C = {
  bg:      "#0a0c10",
  surface: "#111318",
  border:  "#1e2230",
  accent:  "#00d8ff",
  temp:    "#ff6b35",
  hum:     "#00d8ff",
  pres:    "#a78bfa",
  gas:     "#34d399",
  muted:   "#4b5578",
  text:    "#e2e8f0",
  textDim: "#7c8aaa",
  warn:    "#fbbf24",
  error:   "#f87171",
};

export const FONTS = {
  mono:  "'Space Mono', monospace",
  sans:  "'DM Sans', sans-serif",
};

export const MAX_HISTORY = 40;
export const POLL_INTERVAL_MS = 5000;

export const METRICS = [
  { key: "temperature",    label: "Temperature",    unit: "°C",  color: C.temp, icon: "🌡" },
  { key: "humidity",       label: "Humidity",       unit: "%",   color: C.hum,  icon: "💧" },
  { key: "pressure",       label: "Pressure",       unit: "hPa", color: C.pres, icon: "🔵" },
  { key: "gas_resistance", label: "Gas Resistance", unit: "Ω",   color: C.gas,  icon: "🌿" },
];