import { C, FONTS } from "../constants/theme";

const TYPE_COLOR = {
  success: C.gas,
  warn:    C.warn,
  error:   C.error,
  info:    C.textDim,
};

function LogEntry({ entry, index }) {
  return (
    <div style={{
      display: "flex", gap: 12, alignItems: "flex-start",
      fontFamily: FONTS.mono, fontSize: 11,
      opacity: Math.max(1 - index * 0.13, 0.2),
      transition: "opacity 0.3s",
    }}>
      <span style={{ color: C.muted, minWidth: 64, flexShrink: 0 }}>
        {entry.time}
      </span>
      <span style={{ color: TYPE_COLOR[entry.type] ?? C.textDim }}>
        {entry.msg}
      </span>
    </div>
  );
}

export default function ActivityLog({ log }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: "20px 22px",
      minHeight: 200, flex: 1,
    }}>
      <div style={{
        fontFamily: FONTS.sans, fontSize: 11,
        color: C.textDim, textTransform: "uppercase",
        letterSpacing: "0.12em", fontWeight: 500, marginBottom: 16,
      }}>
        Activity Log
      </div>

      {log.length === 0 ? (
        <div style={{
          fontFamily: FONTS.mono, fontSize: 11,
          color: C.muted, paddingTop: 4,
        }}>
          Awaiting events…
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {log.map((entry, i) => (
            <LogEntry key={i} entry={entry} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
