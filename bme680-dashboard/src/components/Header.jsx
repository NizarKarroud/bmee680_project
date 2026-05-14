import { C, FONTS } from "../constants/theme";
import StatusBar from "./StatusBar";

export default function Header({ connected, lastTimestamp, sampleCount }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between",
      alignItems: "flex-start", marginBottom: 32,
      flexWrap: "wrap", gap: 16,
    }}>
      <div>
        <div style={{
          fontFamily: FONTS.mono, fontSize: 11,
          color: C.accent, letterSpacing: "0.2em",
          textTransform: "uppercase", marginBottom: 6,
        }}>
          STM32F411 · BME680
        </div>
        <h1 style={{
          fontFamily: FONTS.mono, fontSize: 26,
          fontWeight: 700, color: C.text, margin: 0, lineHeight: 1.1,
        }}>
          Environmental Monitor
        </h1>
      </div>

      <StatusBar
        connected={connected}
        lastTimestamp={lastTimestamp}
        sampleCount={sampleCount}
      />
    </div>
  );
}
