import { C, FONTS } from "../constants/theme";
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

function ChartTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 6, padding: "8px 14px",
      fontFamily: FONTS.mono, fontSize: 12, color: C.text,
    }}>
      <div style={{ color: C.textDim, marginBottom: 4 }}>{label}</div>
      <div style={{ color: payload[0].color, fontWeight: 700 }}>
        {payload[0].value}
        <span style={{ color: C.textDim, marginLeft: 4 }}>{unit}</span>
      </div>
    </div>
  );
}

export default function ChartPanel({ title, data, dataKey, color, unit, yDomain }) {
  const gradId = `grad-${dataKey}`;

  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: "18px 20px",
    }}>
      <div style={{
        fontFamily: FONTS.sans, fontSize: 11,
        color: C.textDim, textTransform: "uppercase",
        letterSpacing: "0.12em", fontWeight: 500, marginBottom: 16,
      }}>
        {title}
      </div>

      <ResponsiveContainer width="100%" height={130}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0.01} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3" stroke={C.border} vertical={false}
          />
          <XAxis
            dataKey="time"
            tick={{ fill: C.muted, fontSize: 9, fontFamily: FONTS.mono }}
            tickLine={false} axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={yDomain}
            tick={{ fill: C.muted, fontSize: 9, fontFamily: FONTS.mono }}
            tickLine={false} axisLine={false}
          />
          <Tooltip content={<ChartTooltip unit={unit} />} />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradId})`}
            dot={false}
            activeDot={{ r: 4, fill: color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
