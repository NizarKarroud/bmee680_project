import { useState, useEffect, useRef, useCallback } from "react";
import { MAX_HISTORY, POLL_INTERVAL_MS } from "../constants/theme";

// ─── Mock generator (remove once FastAPI is live) ───────────────────────────
const generateMock = (prev) => ({
  timestamp:      new Date().toISOString(),
  temperature:    +(( prev?.temperature    ?? 24)    + (Math.random() - 0.5) * 0.4).toFixed(2),
  humidity:       +(( prev?.humidity       ?? 58)    + (Math.random() - 0.5) * 1.2).toFixed(2),
  pressure:       +(( prev?.pressure       ?? 1013)  + (Math.random() - 0.5) * 0.3).toFixed(2),
  gas_resistance: +(( prev?.gas_resistance ?? 42000) + (Math.random() - 0.5) * 800).toFixed(0),
});

const fmtTime = (iso) => {
  if (!iso) return "--:--:--";
  return new Date(iso).toLocaleTimeString("en-GB", { hour12: false });
};

// ─── API calls — swap URLs to your FastAPI host ──────────────────────────────
const API = {
  async getLatest(prev) {
    // const res = await fetch("http://YOUR_HOST:8000/sensor-data");
    // return res.json();
    return generateMock(prev);
  },
  async reset() {
    // await fetch("http://YOUR_HOST:8000/sensor/reset", { method: "POST" });
    await new Promise(r => setTimeout(r, 1000));
  },
  async clearDB() {
    // await fetch("http://YOUR_HOST:8000/sensor-data/clear", { method: "DELETE" });
    await new Promise(r => setTimeout(r, 800));
  },
};

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useSensorData() {
  const [latest,    setLatest]    = useState(null);
  const [history,   setHistory]   = useState([]);
  const [connected, setConnected] = useState(true);
  const [loading,   setLoading]   = useState({});
  const [log,       setLog]       = useState([]);

  const latestRef   = useRef(latest);
  const intervalRef = useRef(null);
  latestRef.current = latest;

  const addLog = useCallback((msg, type = "info") => {
    setLog(prev => [
      { msg, type, time: fmtTime(new Date().toISOString()) },
      ...prev,
    ].slice(0, 8));
  }, []);

  const setLoadingKey = (key, val) =>
    setLoading(prev => ({ ...prev, [key]: val }));

  const fetchReading = useCallback(async () => {
    try {
      const data = await API.getLatest(latestRef.current);
      setLatest(data);
      setHistory(prev => {
        const next = [...prev, { ...data, time: fmtTime(data.timestamp) }];
        return next.slice(-MAX_HISTORY);
      });
      setConnected(true);
    } catch {
      setConnected(false);
      addLog("Sensor endpoint unreachable", "error");
    }
  }, [addLog]);

  // auto-poll
  useEffect(() => {
    fetchReading();
    intervalRef.current = setInterval(fetchReading, POLL_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, [fetchReading]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleGetReading = async () => {
    setLoadingKey("read", true);
    addLog("Requesting fresh reading…");
    await fetchReading();
    addLog("Reading acquired ✓", "success");
    setLoadingKey("read", false);
  };

  const handleReset = async () => {
    setLoadingKey("reset", true);
    addLog("Sending reset to STM32…", "warn");
    await API.reset();
    setLatest(null);
    setHistory([]);
    addLog("Sensor reset complete ✓", "success");
    setLoadingKey("reset", false);
  };

  const handleClearDB = async () => {
    setLoadingKey("clear", true);
    addLog("Clearing database…", "warn");
    await API.clearDB();
    setHistory([]);
    addLog("Database cleared ✓", "success");
    setLoadingKey("clear", false);
  };

  const handleExport = () => {
    const csv = [
      "timestamp,temperature,humidity,pressure,gas_resistance",
      ...history.map(r =>
        `${r.timestamp},${r.temperature},${r.humidity},${r.pressure},${r.gas_resistance}`
      ),
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `bme680_${Date.now()}.csv`;
    a.click();
    addLog("CSV exported ✓", "success");
  };

  return {
    latest,
    history,
    connected,
    loading,
    log,
    actions: { handleGetReading, handleReset, handleClearDB, handleExport },
  };
}