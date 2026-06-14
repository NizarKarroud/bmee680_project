import { useState, useEffect, useRef, useCallback } from "react";
import { MAX_HISTORY, POLL_INTERVAL_MS } from "../constants/theme";

const BASE_URL = "http://localhost:8000/sensor";

const fmtTime = (iso) => {
  if (!iso) return "--:--:--";
  return new Date(iso).toLocaleTimeString("en-GB", { hour12: false });
};

const API = {
  async fetch(limit = MAX_HISTORY) {
    const res = await fetch(`${BASE_URL}/data/fetch?limit=${limit}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async export(format = "csv") {
    const res = await fetch(`${BASE_URL}/data/export?format=${format}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.blob();
  },
};

export function useSensorData() {
  const [latest,    setLatest]    = useState(null);
  const [history,   setHistory]   = useState([]);
  const [total,     setTotal]     = useState(0);
  const [connected, setConnected] = useState(true);
  const [loading,   setLoading]   = useState({});
  const [log,       setLog]       = useState([]);

  const intervalRef = useRef(null);

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
      const data = await API.fetch(MAX_HISTORY);
      setLatest(data.latest);
      setTotal(data.total);
      const ordered = [...data.history].reverse().map(r => ({
        ...r,
        time: fmtTime(r.timestamp),
      }));
      setHistory(ordered);
      setConnected(true);
    } catch (err) {
      setConnected(false);
      addLog(`Fetch failed: ${err.message}`, "error");
    }
  }, [addLog]);

  useEffect(() => {
    fetchReading();
    intervalRef.current = setInterval(fetchReading, POLL_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, [fetchReading]);

  const handleExport = async () => {
    addLog("Exporting CSV…");
    try {
      const blob = await API.export("csv");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `bme680_${Date.now()}.csv`;
      a.click();
      addLog("CSV exported ✓", "success");
    } catch (err) {
      addLog(`Export failed: ${err.message}`, "error");
    }
  };

  return {
    latest,
    history,
    total,
    connected,
    loading,
    log,
    actions: { handleExport },
  };
}