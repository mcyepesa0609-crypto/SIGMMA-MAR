import React from "react";
import { ROUTE_B_STAGES } from "./routeBStages.js";

const ROUTE_B_STAGE_PALETTE = [
  { bg: "rgba(56, 189, 248, 0.12)", border: "rgba(56, 189, 248, 0.4)" },
  { bg: "rgba(16, 185, 129, 0.12)", border: "rgba(16, 185, 129, 0.4)" },
  { bg: "rgba(251, 191, 36, 0.15)", border: "rgba(251, 191, 36, 0.5)" },
  { bg: "rgba(239, 68, 68, 0.08)", border: "rgba(239, 68, 68, 0.35)" },
  { bg: "rgba(129, 140, 248, 0.12)", border: "rgba(129, 140, 248, 0.4)" },
  { bg: "rgba(59, 130, 246, 0.12)", border: "rgba(59, 130, 246, 0.4)" },
];

const getStagePalette = (idx) => ROUTE_B_STAGE_PALETTE[idx % ROUTE_B_STAGE_PALETTE.length];

export function RouteBStagesFigure() {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontWeight: 600, fontSize: 18 }}>Figura 7: Etapas del proceso automatizado</div>
      <div
        style={{
          marginTop: 10,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {ROUTE_B_STAGES.map((stage, idx, arr) => {
          const palette = getStagePalette(idx);
          return (
            <React.Fragment key={stage.title}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 24px 1fr",
                  alignItems: "flex-start",
                  columnGap: 14,
                  width: "100%",
                  maxWidth: 980,
                }}
              >
                <div
                  style={{
                    borderRadius: 10,
                    padding: "10px 14px",
                    flex: "1 1 0",
                    fontSize: 15,
                    lineHeight: 1.4,
                    fontFamily: "inherit",
                    textAlign: "left",
                    background: palette.bg,
                    border: `1px solid ${palette.border}`,
                    cursor: "pointer",
                  }}
                  onClick={() => handleStageClick(idx)}
                >
                  <div style={{ fontWeight: 800 }}>{stage.title}</div>
                  <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                    {stage.highlights.map((highlight) => (
                      <div key={highlight} style={{ display: "flex", gap: 6 }}>
                        <span style={{ fontWeight: 600 }}>•</span>
                        <span>{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: 24, lineHeight: 1, textAlign: "center" }} />
                <div
                  style={{
                    borderRadius: 10,
                    padding: "10px 14px",
                    flex: "1 1 0",
                    fontSize: 15,
                    lineHeight: 1.4,
                    fontFamily: "inherit",
                    textAlign: "left",
                    background: palette.bg,
                    border: `1px solid ${palette.border}`,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>Propósito</div>
                  <div style={{ fontSize: 14, lineHeight: 1.5 }}>{stage.purpose}</div>
                  <div style={{ marginTop: 8, fontWeight: 700 }}>Resultado</div>
                  <div style={{ fontSize: 14, lineHeight: 1.5 }}>{stage.result}</div>
                </div>
              </div>
              {idx < arr.length - 1 ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 24px 1fr",
                    columnGap: 14,
                    width: "100%",
                    maxWidth: 980,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <div style={{ fontSize: 24, lineHeight: 1 }}>↓</div>
                  </div>
                  <div />
                </div>
              ) : null}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
