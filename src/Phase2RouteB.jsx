import React, { useCallback, useEffect, useState } from "react";
import { SCENARIO_INFO } from "./phase2Scenarios.js";
import { RouteBStagesFigure } from "./RouteBStagesFigure.jsx";

export default function Phase2RouteB() {
  const [scenarioId, setScenarioId] = useState(() => {
    if (typeof window === "undefined") return 0;
    return Number(window.sigmmaCurrentScenarioId || 0);
  });

  useEffect(() => {
    if (typeof window === "undefined") return () => {};
    const handler = (event) => {
      const next = Number(event?.detail?.scenarioId) || 0;
      setScenarioId(next);
    };
    window.addEventListener("sigmma:scenario-changed", handler);
    return () => window.removeEventListener("sigmma:scenario-changed", handler);
  }, []);

  const requestScenarioChange = useCallback((target) => {
    if (typeof window === "undefined") return;
    try {
      window.dispatchEvent(
        new CustomEvent("sigmma:scenario-request", { detail: { targetScenario: target } })
      );
    } catch {}
  }, []);

  const renderScenarioCard = (scenario) => {
    const isSelected = scenario.id === scenarioId;
    return (
      <div
        key={scenario.id}
        style={{
          border: isSelected ? "2px solid #2563eb" : "1px solid rgba(0,0,0,.12)",
          borderRadius: 14,
          padding: 16,
          background: isSelected ? "#eef5ff" : "#ffffff",
          boxShadow: "0 1px 0 rgba(0,0,0,0.04)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{scenario.title}</div>
          <div
            style={{
              marginTop: 6,
              fontSize: 13,
              color: scenario.id < 3 ? "#b91c1c" : "#15803d",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {scenario.id < 3 ? "⚠" : "✔"}
            <span>{scenario.warn}</span>
          </div>
          <p style={{ fontSize: 13, opacity: 0.85, marginTop: 10 }}>{scenario.desc}</p>
        </div>
        <button
          type="button"
          onClick={() => requestScenarioChange(scenario.id)}
          style={{
            borderRadius: 12,
            padding: "8px 14px",
            border: "1.5px solid #1d4ed8",
            background: isSelected ? "#1d4ed8" : "#fff",
            color: isSelected ? "#fff" : "#111827",
            fontWeight: 700,
            marginTop: 10,
            cursor: "pointer",
          }}
        >
          {isSelected ? "Escenario actual" : "Usar escenario"}
        </button>
      </div>
    );
  };

  return (
    <section className="panel-card" style={{ marginTop: 16 }}>
      <div style={{ fontWeight: 800, fontSize: 20 }}>Escenarios de información</div>
      <p style={{ marginTop: 8, opacity: 0.9 }}>
        La configuración de los Escenarios de Información representa el puente entre la fase de recolección de datos y el análisis avanzado.
        El objetivo de esta sección es permitir una transición hacia la evaluación técnica, ajustando el nivel de profundidad según la calidad y cantidad de los insumos disponibles.
      </p>
      <p style={{ marginTop: 6, opacity: 0.9 }}>
        Al diligenciar la fase de insumos, el sistema determina por defecto el escenario correspondiente, sincronizando automáticamente los datos y evidencias cargados para articular las fases metodológicas de manera coherente.
        No obstante, el usuario mantiene la flexibilidad de elegir el escenario en el cual situarse, siempre que cumpla estrictamente con el Índice de Completitud y los insumos requeridos para dicho nivel de análisis.
      </p>
      <p style={{ marginTop: 6, opacity: 0.9 }}>
        Esta integración asegura que la Ruta B procese variables estandarizadas bajo un esquema conceptual validado, optimizando la precisión del cálculo final y permitiendo una gestión robusta de los niveles de incertidumbre y confiabilidad de los resultados obtenidos.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginTop: 12 }}>
        {SCENARIO_INFO.map(renderScenarioCard)}
      </div>

      <p style={{ marginTop: 10, opacity: 0.9 }}>
        El sistema opera bajo dos dimensiones complementarias: primero, los Escenarios de Información (macro), que ofrecen un resumen del avance general del caso; y segundo, la Guía del Esquema (micro), la cual valida cada insumo y pregunta de manera detallada.
        Este análisis permite evaluar la idoneidad de las condiciones, identificar faltantes de información y justificar técnicamente el puntaje asignado a cada variable.
      </p>

      <div style={{ marginTop: 12 }}>
        <p style={{ marginTop: 0, opacity: 0.8 }}>
          Conceptos a tener en cuenta para facilitar la comprensión de la ruta.
        </p>
        <div
          style={{
            marginTop: 8,
            padding: 12,
            borderRadius: 12,
            background: "#f8fafc",
            border: "1px solid rgba(0,0,0,.08)",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 20 }}>Glosario</div>
          <div style={{ fontSize: 16 }}>
            <strong>Grupo (G1)</strong>: Infiltración superficial.
          </div>
          <div style={{ fontSize: 16 }}>
            <strong>Grupo (G2)</strong>: Recarga mediante pozos y perforaciones.
          </div>
          <div style={{ fontSize: 16 }}>
            <strong>Grupo (G3)</strong>: Intervención del cauce.
          </div>
          <div style={{ fontSize: 16 }}>
            <strong>V</strong>: variables/preguntas del esquema conceptual (V1-V35), descritos en la Introducción.
          </div>
          <div style={{ fontSize: 16 }}>
            <strong>C</strong>: criterios de evaluación (C1-C5), descritos en la Introducción.
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 20 }}>Ruta B: Proceso Automatizado de Decisión</div>
          <p style={{ marginTop: 6, opacity: 0.92 }}>
            Esta ruta constituye el marco metodológico para evaluar sistemáticamente la idoneidad de los grupos de Recarga Gestionada mediante un proceso computacional basado en reglas de decisión. El proceso se desarrolla en dos dimensiones integradas: (1) <strong>Estructura de Decisión Secuencial</strong>: organiza la evaluación mediante un árbol de decisión que procesa las variables específicas (V1-V35) a través de reglas lógicas predefinidas, conduciendo directamente a la recomendación de grupos (G1, G2 y/o G3); y (2) <strong>Flujo Operativo</strong>: avanza a través de seis etapas consecutivas (Figura 7), desde la captura de datos hasta la generación de recomendaciones automatizadas.
          </p>
          <RouteBStagesFigure />
          <div style={{ marginTop: 6, fontSize: 14, textAlign: "center" }}>
            Figura 7. Esquema conceptual de la ruta jerárquica (B). Fuente. Elaboración propia.
          </div>
        </div>
      </div>

      <p style={{ marginTop: 10, fontWeight: 700 }}>Faltan insumos para Escenario 3: Volumen - Capacidad, Infraestructura, Comunidad - uso final, Relieve - Clima</p>

      <p style={{ marginTop: 10, opacity: 0.9 }}>
        Con la información consolidada en Insumos, el sistema habilita dos rutas de procesamiento alineadas con el mismo esquema conceptual de decisión. Ambas buscan producir resultados comparables, trazables y justificables; sin embargo, se diferencian en la forma de estructurar la evaluación y, por tanto, en el papel que asume el usuario durante el proceso.
      </p>

      <p style={{ marginTop: 4, opacity: 0.92 }}>
        <strong>¡Selecciona la ruta de tu preferencia!</strong>
      </p>

      <p style={{ marginTop: 10, fontWeight: 700 }}>
        Porque la fase automatizada también trabaja con estos escenarios.
      </p>
    </section>
  );
}
