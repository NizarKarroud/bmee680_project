import { useState, useEffect, useRef } from "react";
import { C, FONTS } from "../constants/theme";

export default function MetricCard({ label, value, unit, color, icon, sublabel }) {
  const [pulse, setPulse] = useState(false);
  const prevVal = useRef(value);

  useEffect(() => {
    if (value !== null && prevVal.current !== value) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 600);
      prevVal.current = value;
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${pulse ? color : C.border}`,
      borderRadius: 12, padding: "22px 24px",
      position: "relative", overflow: "hidden",
      transition: "border-color 0.4s ease",
    }}>
      {/* top glow line */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        opacity: 0.8,
      }} />

      {/* bg radial glow */}
      <div style={{
        position: "absolute", right: -20, top: -20,
        width: 100, height: 100, borderRadius: "50%",
        background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      {/* header row */}
      <div style={{
        fontFamily: FONTS.sans, fontSize: 11,
        color: C.textDim, textTransform: "uppercase",
        letterSpacing: "0.12em", fontWeight: 500,
        marginBottom: 10, display: "flex", alignItems: "center", gap: 6,
      }}>
        <span>{icon}</span>
        {label}
      </div>

      {/* value */}
      <div style={{
        fontFamily: FONTS.mono, fontSize: 32, fontWeight: 700,
        color: pulse ? color : C.text,
        transition: "color 0.4s ease", lineHeight: 1,
      }}>
        {value ?? "—"}
        <span style={{
          fontSize: 14, color: C.textDim,
          marginLeft: 6, fontWeight: 400,
        }}>
          {unit}
        </span>
      </div>

      {/* sublabel */}
      {sublabel && (
        <div style={{
          fontFamily: FONTS.sans, fontSize: 11,
          color: C.textDim, marginTop: 10,
        }}>
          {sublabel}
        </div>
      )}
    </div>
  );
}
