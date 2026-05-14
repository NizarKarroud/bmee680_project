import { C, FONTS } from "../constants/theme";

const fmtTime = (iso) => {
  if (!iso) return "--:--:--";
  return new Date(iso).toLocaleTimeString("en-GB", { hour12: false });
};

export default function StatusBar({ connected, lastTimestamp, sampleCount }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 20,
      fontFamily: FONTS.mono, fontSize: 11, color: C.textDim,
      flexWrap: "wrap",
    }}>
      <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{
          width: 7, height: 7, borderRadius: "50%", display: "inline-block",
          background: connected ? C.gas : C.error,
          boxShadow: connected ? `0 0 7px ${C.gas}` : "none",
          transition: "background 0.3s, box-shadow 0.3s",
        }} />
        {connected ? "LIVE" : "OFFLINE"}
      </span>
      <span>LAST · {fmtTime(lastTimestamp)}</span>
      <span>SAMPLES · {sampleCount}</span>
      <span>NODE · BME680-01</span>
    </div>
  );
}
