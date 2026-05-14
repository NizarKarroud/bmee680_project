import { useState } from "react";
import { C, FONTS } from "../constants/theme";

const VARIANTS = {
  primary: { bg: "#0d2e38", hover: "#0f3d4d", text: C.accent  },
  success: { bg: "#0d2a1e", hover: "#0f3828", text: C.gas     },
  danger:  { bg: "#2a1a1a", hover: "#3a2020", text: C.error   },
  default: { bg: C.border,  hover: "#2a3050", text: C.text    },
};

function ActionButton({ label, icon, onClick, variant = "default", loading }) {
  const [hovered, setHovered] = useState(false);
  const col = VARIANTS[variant];

  return (
    <button
      onClick={onClick}
      disabled={loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? col.hover : col.bg,
        border: `1px solid ${col.text}28`,
        borderRadius: 8,
        color: loading ? C.muted : col.text,
        fontFamily: FONTS.sans,
        fontSize: 13, fontWeight: 500,
        padding: "10px 18px",
        cursor: loading ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", gap: 8,
        transition: "background 0.18s ease, border-color 0.18s ease",
        whiteSpace: "nowrap",
        width: "100%",
        letterSpacing: "0.02em",
      }}
    >
      <span style={{ fontSize: 15 }}>{loading ? "⏳" : icon}</span>
      {label}
    </button>
  );
}

export default function ControlPanel({ loading, actions }) {
  const { handleGetReading, handleReset, handleClearDB, handleExport } = actions;

  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: "20px 22px",
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      <div style={{
        fontFamily: FONTS.sans, fontSize: 11,
        color: C.textDim, textTransform: "uppercase",
        letterSpacing: "0.12em", fontWeight: 500, marginBottom: 6,
      }}>
        Controls
      </div>

      <ActionButton
        label="Get Reading" icon="📡" variant="primary"
        onClick={handleGetReading} loading={loading.read}
      />
      <ActionButton
        label="Reset Sensor" icon="🔄" variant="success"
        onClick={handleReset} loading={loading.reset}
      />
      <ActionButton
        label="Clear Database" icon="🗑" variant="danger"
        onClick={handleClearDB} loading={loading.clear}
      />
      <ActionButton
        label="Export CSV" icon="⬇" variant="default"
        onClick={handleExport}
      />
    </div>
  );
}
