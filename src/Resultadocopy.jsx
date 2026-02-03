import React, { useMemo, useCallback, useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import { CATALOG, computeRouteAScores, validateMinimumScenario, MIN_REQUIRED } from "./catalog/catalog.js";
import { useCasesStore } from "./store/useCasesStore.js";
import { TECH_GROUPS } from "./marTechniques.js";

const SCENARIO1_REQUIRED_IDS = ["V8", "V14", "V15", "V16", "V22", "V23"];
const PHASE2_REQUIRED_IDS = [
  "V2",
  "V3",
  "V4",
  "V5",
  "V6",
  "V8",
  "V11",
  "V12",
  "V13",
  "V14",
  "V15",
  "V16",
  "V36",
  "V37",
  "V17",
  "V18",
];
const SCENARIO2_REQUIRED_IDS = Array.from(new Set([...SCENARIO1_REQUIRED_IDS, ...PHASE2_REQUIRED_IDS]));
const SCENARIO_TITLES = {
  1: "Escenario 1 - Mínimo operativo",
  2: "Escenario 2 - Intermedio verificado",
  3: "Escenario 3 - Completo robusto",
};
const SCENARIO_BLURBS = {
  1: "Solo los 5 criterios obligatorios están listos; el resto de los insumos sigue pendiente.",
  2: "Las variables clave de la ruta metodológica están disponibles para este Escenario 2",
  3: "Todos los insumos están registrados y listos para el análisis completo del Escenario 3.",
};

const ROUTE_A_ITEMS = [
  "Puntaje por criterios",
  "Matriz de pesos AHP",
  "Tabla combinación lineal ponderada (WLC)",
  "Podio idoneidad MAR",
];
const ROUTE_WLC_ITEM = "Tabla combinación lineal ponderada (WLC)";

const ROUTE_GROUPS = ["G1", "G2", "G3"];
const WLC_GROUP_KEYS = ["G1", "G2", "G3"];
const WLC_DETAIL_COLUMNS = WLC_GROUP_KEYS.flatMap((group) => [
  { key: `${group}-score`, label: `S_Ci^${group}`, type: "score", group },
  { key: `${group}-contrib`, label: `w_i x S_Ci^${group}`, type: "contribution", group },
]);
const PODIUM_GROUPS = [
  { id: "G1", label: "G1 - Intervención de cauces" },
  { id: "G2", label: "G2 - Recarga por pozos" },
  { id: "G3", label: "G3 - Infiltración superficial" },
];
const PODIUM_HEIGHTS = { 1: 140, 2: 110, 3: 95 };
const PODIUM_COLORS = { 1: "#bbf7d0", 2: "#fed7aa", 3: "#fecaca" };
const RANK_LABELS = { 1: "Primero", 2: "Segundo", 3: "Tercero" };
const CRITERION_ORDER = ["C1", "C2", "C3", "C4", "C5"];
const CRITERION_TITLES = {
  C1: "Criterio C1 - Objetivo",
  C2: "Criterio C2 - Condiciones hidrogeológicas",
  C3: "Criterio C3 - Fuente y calidad del agua",
  C4: "Criterio C4 - Viabilidad técnica",
  C5: "Criterio C5 - Aspectos socioambientales",
};

const HERO_ICON_PATH = "/images/hero-mountains.png";

const MAP_LAYER_DEFINITIONS = (() => {
  const map = new Map();
  (CATALOG.modules || []).forEach((module) => {
    (module.maps || []).forEach((layer) => {
      if (layer?.layerId) {
        map.set(layer.layerId, { label: layer.label, moduleId: module.id });
      }
    });
  });
  return map;
})();

const CRITERION_VARIABLE_IDS = {
  C1: ["V1"],
  C2: ["V2", "V3", "V4", "V5", "V6", "V7", "V8", "V9", "V11", "V12", "V24", "V25"],
  C3: ["V13", "V14", "V15", "V16", "V17", "V18"],
  C4: ["V19", "V20", "V21", "V26", "V28", "V29", "V32", "V33"],
  C5: ["V22", "V23", "V34", "V35"],
};

async function fetchImageAsDataUrl(src) {
  if (typeof window === "undefined" || !src) return null;
  try {
    const response = await fetch(src);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    return null;
  }
}

function isEmptyValue(v) {
  if (v === null || v === undefined) return true;
  const normalized = String(v).trim();
  if (!normalized) return true;
  if (normalized === "No_reportado" || normalized === "No reportado") return true;
  return false;
}

function normalizeToken(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getTechniqueIcon(tech) {
  if (!tech) return null;
  if (tech.icon) return tech.icon;
  if (tech.id && TECH_ICON_BY_ID[tech.id]) return TECH_ICON_BY_ID[tech.id];
  const nameKey = normalizeToken(tech.name);
  const iconMap = {
    "presas de recarga": "/images/Presas_de_recarga.png",
    "presas subterraneas": "/images/Presas_subterraneas.png",
    "presas de arena": "/images/Presas_de_arena.png",
    "filtracion de ribera": "/images/Filtracion_de_ribera.png",
    asr: "/images/ASR.png",
    astr: "/images/ASTR.png",
    "pozos secos": "/images/Pozos_secos.png",
    "estanques y cuencas de infiltracion": "/images/Estanque_infiltracion.png",
    "tratamiento suelo-acuifero": "/images/SAT.png",
    "galerias de infiltracion": "/images/Galerias_infiltracion.png",
    "inundaciones controladas": "/images/Inundaciones_controladas.png",
    "exceso de riego": "/images/Exceso_de_irrigacion.png",
    "dunas de infiltracion": "/images/Dunas_de_infiltracion.png",
    lluvia: "/images/Lluvia.png",
  };
  return iconMap[nameKey] || null;
}

function describeVariableValue(variable) {
  if (!variable) return "Sin información registrada";
  const pieces = [];
  if (Array.isArray(variable.inputs)) {
    variable.inputs.forEach((input) => {
      if (!input) return;
      const value = input.value;
      if (isEmptyValue(value)) return;
      const label = input.label || input.key || "Dato";
      pieces.push(`${label}: ${String(value)}`);
    });
  }
  if (Array.isArray(variable.maps)) {
    const presentLayers = variable.maps
      .filter((map) => map?.hasFile)
      .map((map) => map.label || map.layerId || "Mapa");
    if (presentLayers.length) pieces.push(`Mapas: ${presentLayers.join(", ")}`);
  }
  if (pieces.length) return pieces.join(" | ");
  if (variable.reason && !isEmptyValue(variable.reason)) return variable.reason;
  return "Sin datos visibles";
}

const TECH_ICON_BY_ID = {
  "1.1": "/images/Presas_de_recarga.png",
  "1.2": "/images/Presas_subterraneas.png",
  "1.3": "/images/Presas_de_arena.png",
  "1.4": "/images/Filtracion_de_ribera.png",
  "2.1": "/images/ASR.png",
  "2.2": "/images/ASTR.png",
  "2.3": "/images/Pozos_secos.png",
  "3.1": "/images/Estanque_infiltracion.png",
  "3.2": "/images/SAT.png",
  "3.3": "/images/Galerias_infiltracion.png",
  "3.4": "/images/Inundaciones_controladas.png",
  "3.5": "/images/Exceso_de_irrigacion.png",
  "3.6": "/images/Dunas_de_infiltracion.png",
  "3.7": "/images/Lluvia.png",
};

function serializeCaseForFingerprint(caseData) {
  if (!caseData || typeof caseData !== "object") return "";
  try {
    return JSON.stringify({
      id: caseData.id,
      weights: caseData.weights,
      phase1: caseData.phase1,
      phase2: caseData.phase2,
      mapUploads: caseData.mapUploads,
      mapMeta: caseData.mapMeta,
    });
  } catch {
    return "";
  }
}

function buildScenario1Overrides(caseData, readCaseValue) {
  if (!caseData || typeof readCaseValue !== "function") return new Map();
  const overrides = new Map();
  const setOverride = (id, scoreByGroup, { round = false, floor = false } = {}) => {
    if (!scoreByGroup) return;
    const avg = (scoreByGroup.G1 + scoreByGroup.G2 + scoreByGroup.G3) / 3;
    let score04 = avg;
    if (round) score04 = Math.round(avg);
    else if (floor) score04 = Math.floor(avg);
    overrides.set(id, { scoreByGroup, score04 });
  };

  const v8Token = normalizeToken(readCaseValue(caseData, "hidraulico", "Tipo_unidad"));
  if (v8Token.includes("libre")) {
    setOverride("V8", { G1: 4, G2: 3, G3: 4 }, { round: true });
  } else if (v8Token.includes("confinado") || v8Token.includes("semiconfinado")) {
    setOverride("V8", { G1: 2, G2: 4, G3: 2 }, { round: true });
  }

  const v14Token = normalizeToken(readCaseValue(caseData, "fuente", "tipo_de_fuente"));
  if (v14Token.includes("superficial")) {
    setOverride("V14", { G1: 4, G2: 3, G3: 3 }, { floor: true });
  } else if (v14Token.includes("escorrentia") && v14Token.includes("estacional")) {
    setOverride("V14", { G1: 2, G2: 3, G3: 4 }, { floor: true });
  } else if (v14Token.includes("residual")) {
    setOverride("V14", { G1: 1, G2: 4, G3: 4 }, { floor: true });
  } else if (v14Token.includes("subterranea")) {
    setOverride("V14", { G1: 0, G2: 3, G3: 2 }, { floor: true });
  } else if (v14Token) {
    setOverride("V14", { G1: 4, G2: 4, G3: 4 }, { floor: true });
  }

  const v15Token = normalizeToken(readCaseValue(caseData, "fuente", "categoria_calidad_mar"));
  if (v15Token.includes("no apta") || v15Token.includes("no evaluada")) {
    setOverride("V15", { G1: 0, G2: 0, G3: 0 }, { floor: true });
  } else if (
    v15Token.includes("apta con") ||
    v15Token.includes("pretratamiento") ||
    v15Token.includes("con tratamiento")
  ) {
    setOverride("V15", { G1: 3, G2: 3, G3: 4 }, { floor: true });
  } else if (v15Token.includes("apta")) {
    setOverride("V15", { G1: 4, G2: 4, G3: 3 }, { floor: true });
  }

  const v16Token = normalizeToken(readCaseValue(caseData, "fuente", "cumple_norma_para_uso"));
  if (v16Token.includes("no evaluado")) {
    setOverride("V16", { G1: 0, G2: 0, G3: 0 }, { floor: true });
  } else if (v16Token.includes("parcial")) {
    setOverride("V16", { G1: 2, G2: 1, G3: 2 }, { floor: true });
  } else if (v16Token.includes("si")) {
    setOverride("V16", { G1: 4, G2: 4, G3: 4 }, { floor: true });
  } else if (v16Token.includes("no")) {
    setOverride("V16", { G1: 0, G2: 0, G3: 0 }, { floor: true });
  }

  const v23Token = normalizeToken(readCaseValue(caseData, "comunidad", "uso_final_del_agua"));
  if (v23Token.includes("domestico")) {
    setOverride("V23", { G1: 4, G2: 3, G3: 2 });
  } else if (v23Token.includes("industrial")) {
    setOverride("V23", { G1: 2, G2: 4, G3: 3 });
  } else if (v23Token.includes("ambiental")) {
    setOverride("V23", { G1: 3, G2: 2, G3: 4 });
  } else if (v23Token.includes("agricola")) {
    setOverride("V23", { G1: 3, G2: 3, G3: 4 });
  } else if (v23Token.includes("mixto")) {
    setOverride("V23", { G1: 4, G2: 3, G3: 4 });
  }

  if (v23Token) {
    setOverride("V22", { G1: 4, G2: 4, G3: 4 });
  }

  if (v14Token.includes("superficial")) {
    const v36Token = normalizeToken(readCaseValue(caseData, "fuente", "tipo_fuente_superficial"));
    if (
      v36Token.includes("rio ganador") ||
      (v36Token.includes("rio") && v36Token.includes("permanente"))
    ) {
      setOverride("V36", { G1: 4, G2: 3, G3: 3 });
    } else if (v36Token.includes("estacional")) {
      setOverride("V36", { G1: 2, G2: 3, G3: 4 });
    } else if (v36Token.includes("efimero")) {
      setOverride("V36", { G1: 0, G2: 3, G3: 3 });
    } else if (v36Token.includes("lago") || v36Token.includes("embalse")) {
      setOverride("V36", { G1: 3, G2: 3, G3: 3 });
    }

    const v37Token = normalizeToken(readCaseValue(caseData, "fuente", "conexion_hidraulica"));
    if (v37Token.includes("ganador")) {
      setOverride("V37", { G1: 4, G2: 3, G3: 3 });
    } else if (v37Token.includes("perdedor")) {
      setOverride("V37", { G1: 2, G2: 2, G3: 2 });
    } else if (v37Token.includes("sin")) {
      setOverride("V37", { G1: 0, G2: 3, G3: 1 });
    }
  }

  return overrides;
}

function buildScenario2Overrides(caseData, scoreById, readCaseValue) {
  if (!caseData || !scoreById || typeof readCaseValue !== "function") return new Map();
  const overrides = new Map();
  const setOverride = (id, scoreByGroup) => {
    if (!scoreByGroup) return;
    const score04 = (scoreByGroup.G1 + scoreByGroup.G2 + scoreByGroup.G3) / 3;
    overrides.set(id, { scoreByGroup, score04 });
  };
  const getInputValue = (id, key) => {
    const vInfo = scoreById.get(id);
    const inputs = Array.isArray(vInfo?.inputs) ? vInfo.inputs : [];
    return inputs.find((inp) => inp?.key === key)?.value ?? "";
  };
  const getEvidence = (id) => {
    const isPresent = (value) => {
      if (value === null || value === undefined) return false;
      const s = String(value).trim();
      if (!s) return false;
      if (s === "No_reportado" || s === "No reportado") return false;
      return true;
    };
    if (id === "V3") {
      const keys = [
        "nombre_unidad_geologica",
        "descripcion_unidad_geologica",
        "profundidad_unidad_geologica_m",
        "escala_mapa_geologico",
      ];
      const inputsPresent = keys.filter((key) => isPresent(readCaseValue(caseData, "geologico", key))).length;
      const vInfo = scoreById.get(id);
      const maps = Array.isArray(vInfo?.maps) ? vInfo.maps : [];
      const mapsPresent = maps.filter((mp) => mp && mp.hasFile).length;
      return { present: inputsPresent + (mapsPresent > 0 ? 1 : 0), total: 5 };
    }
    const vInfo = scoreById.get(id);
    const inputs = Array.isArray(vInfo?.inputs) ? vInfo.inputs : [];
    const maps = Array.isArray(vInfo?.maps) ? vInfo.maps : [];
    const inputsPresent = inputs.filter((inp) => !inp?.missing).length;
    const mapsPresent = maps.filter((mp) => mp && mp.hasFile).length;
    const groupedMapsPresent =
      id === "V4"
        ? mapsPresent > 0
          ? 1
          : 0
        : id === "V5"
        ? maps.length && mapsPresent === maps.length
          ? 1
          : 0
        : mapsPresent;
    const total =
      id === "V4" || id === "V5" ? inputs.length + (maps.length ? 1 : 0) : inputs.length + maps.length;
    const present =
      id === "V4" || id === "V5" ? inputsPresent + groupedMapsPresent : inputsPresent + mapsPresent;
    return { present, total };
  };

  const fuenteToken = normalizeToken(readCaseValue(caseData, "fuente", "tipo_de_fuente"));
  const isSuperficialSource = fuenteToken.includes("superficial");

  const v2Token = normalizeToken(readCaseValue(caseData, "caracterizacion", "clasificacion_hidrogeologica_uhg"));
  const v2Evidence = getEvidence("V2");
  let v2EvidenceScore = 0;
  if (v2Evidence.total > 0) {
    if (v2Evidence.present === v2Evidence.total) v2EvidenceScore = 4;
    else {
      const ratio = v2Evidence.present / v2Evidence.total;
      if (ratio >= 0.75) v2EvidenceScore = 3;
      else if (ratio >= 0.5) v2EvidenceScore = 2;
      else if (v2Evidence.present > 0) v2EvidenceScore = 1;
    }
  }
  if (v2Token.includes("acuifero")) {
    setOverride("V2", {
      G1: Math.min(4, v2EvidenceScore),
      G2: Math.min(4, v2EvidenceScore),
      G3: Math.min(4, v2EvidenceScore),
    });
  } else if (v2Token.includes("acuitardo")) {
    setOverride("V2", {
      G1: Math.min(1, v2EvidenceScore),
      G2: Math.min(3, v2EvidenceScore),
      G3: Math.min(2, v2EvidenceScore),
    });
  } else if (v2Token.includes("acuicludo") || v2Token.includes("acuifugo")) {
    setOverride("V2", { G1: 0, G2: 0, G3: 0 });
  }

  const v9StudyRaw =
    readCaseValue(caseData, "volumen", "cap_infiltracion_zona_no_saturada") ||
    getInputValue("V9", "cap_infiltracion_zona_no_saturada");
  const v9CategoryRaw =
    readCaseValue(caseData, "volumen", "cap_infiltracion_categoria") ||
    getInputValue("V9", "cap_infiltracion_categoria");
  const v9StudyToken = normalizeToken(v9StudyRaw);
  const v9CategoryToken = normalizeToken(v9CategoryRaw);
  if (v9StudyToken.includes("si")) {
    if (v9CategoryToken.includes("muy alta")) {
      setOverride("V9", { G1: 3, G2: 0, G3: 4 });
    } else if (v9CategoryToken.includes("alta")) {
      setOverride("V9", { G1: 4, G2: 1, G3: 4 });
    } else if (v9CategoryToken.includes("media") || v9CategoryToken.includes("moderad")) {
      setOverride("V9", { G1: 3, G2: 1, G3: 3 });
    } else if (v9CategoryToken.includes("baja")) {
      setOverride("V9", { G1: 2, G2: 1, G3: 1 });
    } else if (v9CategoryToken.includes("no evaluado") || v9CategoryToken.includes("no evaluada")) {
      setOverride("V9", { G1: 0, G2: 0, G3: 0 });
    }
  } else if (v9StudyToken.includes("no")) {
    setOverride("V9", { G1: 0, G2: 0, G3: 0 });
  }

  const v3Evidence = getEvidence("V3");
  if (v3Evidence.present >= 5) setOverride("V3", { G1: 4, G2: 4, G3: 3 });
  else if (v3Evidence.present >= 2) setOverride("V3", { G1: 3, G2: 3, G3: 2 });
  else if (v3Evidence.present >= 1) setOverride("V3", { G1: 1, G2: 1, G3: 1 });

  const v5Evidence = getEvidence("V5");
  let v5Base = null;
  if (v5Evidence.present >= 6) v5Base = { G1: 4, G2: 4, G3: 4 };
  else if (v5Evidence.present >= 2) v5Base = { G1: 3, G2: 3, G3: 3 };
  else if (v5Evidence.present >= 1) v5Base = { G1: 1, G2: 1, G3: 1 };
  const poroToken = normalizeToken(
    readCaseValue(caseData, "hidraulico", "porosidad") ||
      readCaseValue(caseData, "caracterizacion", "porosidad")
  );
  const permToken = normalizeToken(
    readCaseValue(caseData, "hidraulico", "permeabilidad") ||
      readCaseValue(caseData, "caracterizacion", "permeabilidad")
  );
  const poroMap = {
    "muy alta (>50%)": { G1: 2, G2: 3, G3: 3 },
    "alta (30-50%)": { G1: 3, G2: 4, G3: 4 },
    "regular (10-30%)": { G1: 3, G2: 3, G3: 3 },
    "mala (0-10%)": { G1: 2, G2: 2, G3: 1 },
  };
  const permMap = {
    "muy alta (100<k)": { G1: 4, G2: 3, G3: 4 },
    "alta (10<k<100)": { G1: 4, G2: 4, G3: 4 },
    "media (1<k<10)": { G1: 3, G2: 3, G3: 3 },
    "baja (0.01<k<1)": { G1: 1, G2: 1, G3: 1 },
    "baja a muy baja (10^-2<k<1)": { G1: 1, G2: 1, G3: 1 },
  };
  const poroScore = poroMap[Object.keys(poroMap).find((k) => normalizeToken(k) === poroToken)];
  const permScore = permMap[Object.keys(permMap).find((k) => normalizeToken(k) === permToken)];
  if (permScore) {
    setOverride("V11", permScore);
  }
  if (poroScore) {
    setOverride("V12", poroScore);
  }
  if (poroScore || permScore) {
    const combined =
      poroScore && permScore
        ? {
            G1: Math.min(poroScore.G1, permScore.G1),
            G2: Math.min(poroScore.G2, permScore.G2),
            G3: Math.min(poroScore.G3, permScore.G3),
          }
        : poroScore || permScore;
    const capped = v5Base
      ? {
          G1: Math.min(v5Base.G1, combined.G1),
          G2: Math.min(v5Base.G2, combined.G2),
          G3: Math.min(v5Base.G3, combined.G3),
        }
      : combined;
    setOverride("V5", capped);
  } else if (v5Base) {
    setOverride("V5", v5Base);
  }

  const v4Evidence = getEvidence("V4");
  if (v4Evidence.present >= 3) {
    setOverride("V4", { G1: 4, G2: isSuperficialSource ? 3 : 2, G3: 4 });
  } else if (v4Evidence.present >= 2) {
    setOverride("V4", { G1: 3, G2: 2, G3: 3 });
  } else if (v4Evidence.present >= 1) {
    setOverride("V4", { G1: 1, G2: 1, G3: 1 });
  }

  const v6Evidence = getEvidence("V6");
  if (v6Evidence.present >= 12) setOverride("V6", { G1: 4, G2: 4, G3: 3 });
  else if (v6Evidence.present >= 9) setOverride("V6", { G1: 3, G2: 2, G3: 2 });
  else if (v6Evidence.present >= 2) setOverride("V6", { G1: 1, G2: 1, G3: 1 });

  if (isSuperficialSource) {
    const v36Token = normalizeToken(readCaseValue(caseData, "fuente", "tipo_fuente_superficial"));
    if (
      v36Token.includes("rio ganador") ||
      (v36Token.includes("rio") && v36Token.includes("permanente"))
    ) {
      setOverride("V36", { G1: 4, G2: 3, G3: 3 });
    } else if (v36Token.includes("estacional")) {
      setOverride("V36", { G1: 2, G2: 3, G3: 4 });
    } else if (v36Token.includes("efimero")) {
      setOverride("V36", { G1: 0, G2: 3, G3: 3 });
    } else if (v36Token.includes("lago") || v36Token.includes("embalse")) {
      setOverride("V36", { G1: 3, G2: 3, G3: 3 });
    }

    const v37Token = normalizeToken(readCaseValue(caseData, "fuente", "conexion_hidraulica"));
    if (v37Token.includes("ganador")) {
      setOverride("V37", { G1: 4, G2: 3, G3: 3 });
    } else if (v37Token.includes("perdedor")) {
      setOverride("V37", { G1: 2, G2: 2, G3: 2 });
    } else if (v37Token.includes("sin")) {
      setOverride("V37", { G1: 0, G2: 3, G3: 1 });
    }
  }

  return overrides;
}

const BASE_CARD_STYLE = {
  flex: 1,
  padding: 24,
  borderRadius: 16,
  background: "#ffffff",
  boxShadow: "0 20px 45px rgba(15,23,42,0.08)",
};

export default function Resultados({ ready = false }) {
  const { activeCase } = useCasesStore();
  console.log("Datos AHP en Fase 3:", activeCase?.phase2?.ahpResults);
  console.log("Datos AHP en Fase 3:", activeCase?.phase2?.ahpResults);
  const mapUploads = activeCase?.mapUploads || {};
  const mapMeta = activeCase?.mapMeta || {};
  const title = "Fase 3 - Resultados";
  const statusLabel = ready ? "Resultados habilitados" : "Fase 3 bloqueada";
  const description = ready
    ? "Esta sección resume y consolida la información definitiva del estudio; úsala como tu ficha oficial de cierre."
    : "Solo se habilita la Fase 3 una vez se diligencien completamente las rutas metodológicas de la Fase 2.";

  const readCaseValue = useCallback(
    (moduleId, key) => {
      if (!activeCase) return "";
      const moduleObj = activeCase?.phase1?.modules?.[moduleId] || activeCase?.[moduleId] || {};
      if (!moduleObj || typeof moduleObj !== "object") return "";
      if (key in moduleObj) return moduleObj[key];
      const aliases = CATALOG.aliases || {};
      for (const [oldKey, canon] of Object.entries(aliases)) {
        if (canon === key && oldKey in moduleObj) return moduleObj[oldKey];
      }
      const canon = aliases[key];
      if (canon && canon in moduleObj) return moduleObj[canon];
      return "";
    },
    [activeCase]
  );

  const caseInfo = useMemo(() => {
    const name = activeCase?.nombre || activeCase?.caseName || "Sin título";
    const id = activeCase?.id || activeCase?.caseId || "N/A";
    const user = activeCase?.usuario || activeCase?.usuarioResponsable || "Anon.";
    const location = activeCase?.ubicacion || "No definida";
    const dateLabel = new Date().toLocaleString(undefined, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    return [
      { label: "Nombre del caso", value: name },
      { label: "ID", value: id },
      { label: "Usuario", value: user },
      { label: "Ubicación", value: location },
      { label: "Fecha", value: dateLabel },
    ];
  }, [activeCase]);

  const caseFingerprint = serializeCaseForFingerprint(activeCase);
  const storedComputedScores = activeCase?.phase2?.computedScores;
  const routeAScores = useMemo(() => {
    if (
      storedComputedScores &&
      Array.isArray(storedComputedScores.variables) &&
      storedComputedScores.variables.length
    )
      return storedComputedScores;
    if (!activeCase || activeCase?.id === "nuevo") return null;
    return computeRouteAScores(activeCase, activeCase?.weights || {});
  }, [activeCase, caseFingerprint, storedComputedScores]);

  const routeAVariables = routeAScores?.variables || [];
  const routeACriteria = routeAScores?.criteria || {};
  const storedScoreById = useMemo(() => {
    if (!storedComputedScores?.scoreById) return null;
    const map = new Map();
    Object.entries(storedComputedScores.scoreById).forEach(([id, value]) => {
      map.set(id, value);
    });
    return map;
  }, [storedComputedScores]);
  const formatScore = useCallback((value) => {
    if (!Number.isFinite(value)) return "-";
    return Number(value).toFixed(2);
  }, []);
  const formatPercent = useCallback((value) => {
    if (!Number.isFinite(value)) return "-";
    return `${(Number(value) * 100).toFixed(1)}%`;
  }, []);
  const formatDecimal = useCallback((value, decimals = 3) => {
    if (!Number.isFinite(value)) return "-";
    return Number(value).toFixed(decimals);
  }, []);
  const baseScoreById = useMemo(() => {
    const map = new Map();
    routeAVariables.forEach((variable) => {
      if (variable?.id) map.set(variable.id, variable);
    });
    return map;
  }, [routeAVariables]);

  const [activeRouteItem, setActiveRouteItem] = useState(ROUTE_WLC_ITEM);
  const showPuntaje = activeRouteItem === "Puntaje por criterios";
  const showAHPMatrix = activeRouteItem === "Matriz de pesos AHP";
  const showWLC = activeRouteItem === "Tabla combinación lineal ponderada (WLC)";
  const showPodio = activeRouteItem === "Podio idoneidad MAR";
  const ahpResults = useMemo(() => {
    if (!activeCase?.phase2?.ahpResults) return null;
    return activeCase.phase2.ahpResults;
  }, [activeCase]);
  const ahpMatrixIds = useMemo(() => (Array.isArray(ahpResults?.ids) ? ahpResults.ids : []), [ahpResults]);
  const ahpMatrixValues = useMemo(() => (Array.isArray(ahpResults?.matrix) ? ahpResults.matrix : []), [ahpResults]);
  const ahpWeightRows = useMemo(() => {
    const rows = ahpMatrixIds.map((id, idx) => ({
      id,
      label: CRITERION_TITLES[id] || id,
      weight: Number.isFinite(ahpResults?.weights?.[idx]) ? Number(ahpResults?.weights[idx]) : 0,
    }));
    const sorted = [...rows].sort((a, b) => b.weight - a.weight);
    const rankMap = new Map(sorted.map((row, idx) => [row.id, idx + 1]));
    return rows.map((row) => ({ ...row, rank: rankMap.get(row.id) || "-" }));
  }, [ahpMatrixIds, ahpResults]);
  const wlcResults = useMemo(() => activeCase?.phase2?.wlcResults ?? null, [activeCase]);
  useEffect(() => {
    console.log("Datos WLC recibidos:", activeCase?.phase2?.wlcResults);
  }, [activeCase?.phase2?.wlcResults]);
  const wlcGroupKeys = useMemo(() => {
    if (!Array.isArray(wlcResults?.rows) || !wlcResults.rows.length) return [];
    const firstScores = wlcResults.rows[0].scores || {};
    return Object.keys(firstScores)
      .filter((key) => String(key).trim().length)
      .sort();
  }, [wlcResults]);
  const renderPodioSection = () => {
    if (!wlcRankingRows.length) return null;
    const podiumOrder = [2, 1, 3];
    const podium = podiumOrder
      .map((rank) => wlcRankingRows.find((row) => row.rank === rank))
      .filter(Boolean);
    if (!podium.length) return null;
    return (
      <div
        style={{
          marginTop: 16,
          padding: 16,
          borderRadius: 16,
          background: "#f8fafc",
          border: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 16 }}>Podio de Idoneidad</div>
        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>Resultados ordenados por idoneidad (mayor a menor).</div>
        <style>{`
@keyframes podiumGlow {
  0%, 100% {
    text-shadow: 0 1px 0 #ffffff, 0 2px 0 rgba(245, 158, 11, 0.45), 0 6px 12px rgba(0,0,0,0.3);
  }
  50% {
    text-shadow: 0 1px 0 #ffffff, 0 2px 0 rgba(245, 158, 11, 0.7), 0 8px 16px rgba(0,0,0,0.45);
  }
}
@keyframes podiumHalo {
  0%, 100% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
}
@keyframes podiumSparkle {
  0%, 70% {
    transform: translateY(0) scale(0.8) rotate(45deg);
    opacity: 0;
  }
  78% {
    transform: translateY(-4px) scale(1.3) rotate(45deg);
    opacity: 1;
  }
  86% {
    transform: translateY(-1px) scale(1.1) rotate(45deg);
    opacity: 0.8;
  }
  100% {
    transform: translateY(0) scale(0.8) rotate(45deg);
    opacity: 0;
  }
}
@keyframes podiumShine {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 100% 50%;
  }
}
`}</style>
        <div
          style={{
            marginTop: 14,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          {podium.map((group) => (
            <div key={group.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 160 }}>
              <div style={{ position: "relative", marginBottom: 6, overflow: "visible" }}>
                <div
                  style={{
                    position: "absolute",
                    inset: -12,
                    borderRadius: 999,
                    background: "radial-gradient(circle, rgba(255,255,255,1), rgba(255,255,255,0))",
                    filter: "blur(4px)",
                    animation: "podiumHalo 2.4s ease-in-out infinite",
                  }}
                />
                {group.rank === 1 ? (
                  <>
                    <span
                      style={{
                        position: "absolute",
                        left: -16,
                        top: -14,
                        width: 12,
                        height: 12,
                        background: "linear-gradient(135deg, #fff7ed, #f59e0b)",
                        boxShadow: "0 0 10px rgba(245, 158, 11, 0.9)",
                        transform: "rotate(45deg)",
                        opacity: 0,
                        animation: "podiumSparkle 2.8s ease-in-out infinite",
                        animationDelay: "0.2s",
                        zIndex: 3,
                        pointerEvents: "none",
                      }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        right: -18,
                        bottom: -12,
                        width: 10,
                        height: 10,
                        background: "linear-gradient(135deg, #fff7ed, #f59e0b)",
                        boxShadow: "0 0 10px rgba(245, 158, 11, 0.9)",
                        transform: "rotate(45deg)",
                        opacity: 0,
                        animation: "podiumSparkle 3.1s ease-in-out infinite",
                        animationDelay: "0.8s",
                        zIndex: 3,
                        pointerEvents: "none",
                      }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        right: -6,
                        top: -18,
                        width: 9,
                        height: 9,
                        background: "linear-gradient(135deg, #fff7ed, #f59e0b)",
                        boxShadow: "0 0 10px rgba(245, 158, 11, 0.9)",
                        transform: "rotate(45deg)",
                        opacity: 0,
                        animation: "podiumSparkle 3.4s ease-in-out infinite",
                        animationDelay: "1.3s",
                        zIndex: 3,
                        pointerEvents: "none",
                      }}
                    />
                  </>
                ) : null}
                <div
                  style={{
                    position: "relative",
                    display: "inline-block",
                    fontWeight: 900,
                    fontSize: 14,
                    letterSpacing: 0.3,
                    padding: "3px 12px",
                    borderRadius: 999,
                    background: "linear-gradient(120deg, #fff7ed, #fde68a, #fff7ed)",
                    border: "1px solid rgba(245, 158, 11, 0.5)",
                    color: "#7c2d12",
                    textShadow: "0 1px 0 #ffffff, 0 2px 0 rgba(245, 158, 11, 0.6), 0 6px 12px rgba(0,0,0,0.35)",
                    boxShadow: "0 6px 14px rgba(245, 158, 11, 0.25)",
                    animation: "podiumGlow 2.2s ease-in-out infinite, podiumShine 3.4s ease-in-out infinite",
                  }}
                >
                  {RANK_LABELS[group.rank] || "Posición"}
                </div>
              </div>
              <div
                style={{
                  width: 160,
                  height: PODIUM_HEIGHTS[group.rank] || 110,
                  borderRadius: 12,
                  background: PODIUM_COLORS[group.rank] || "#e2e8f0",
                  border: "1px solid rgba(0,0,0,0.1)",
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  padding: "10px 8px",
                  boxShadow: "0 10px 18px rgba(0,0,0,0.08)",
                }}
              >
                <div style={{ fontSize: 21, fontWeight: 900, lineHeight: 1.1 }}>{String(group.id || "").replace("G", "")}</div>
                <div style={{ fontWeight: 400, fontSize: 14, lineHeight: 1.2, textAlign: "center" }}>{group.label}</div>
                <div style={{ fontSize: 17, fontWeight: 900, lineHeight: 1.1 }}>{formatDecimal(group.total, 3)}</div>
              </div>
            </div>
          ))}
        </div>
        {rankingString ? (
          <div style={{ marginTop: 10, fontSize: 13, fontWeight: 600 }}>
            {rankingString}
          </div>
        ) : null}
      </div>
    );
  };
  const renderPodioTechniques = () => {
    if (!topPodiumGroup) return null;
    return (
      <div
        style={{
          marginTop: 16,
          padding: 14,
          borderRadius: 14,
          border: "1px solid rgba(15, 23, 42, 0.08)",
          background: "#ffffff",
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 16 }}>Técnicas MAR recomendadas para {topPodiumGroup.name}</div>
        <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85 }}>{topPodiumGroup.short}</div>
        <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
          {topPodiumGroup.techniques.map((tech) => {
            const iconSrc = getTechniqueIcon(tech);
            return (
              <div
                key={tech.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: iconSrc ? "120px 1fr" : "1fr",
                  gap: 12,
                  alignItems: "center",
                  padding: 12,
                  borderRadius: 12,
                  background: "#f8fafc",
                  border: "1px solid rgba(0,0,0,0.08)",
                }}
              >
                {iconSrc ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img
                      src={iconSrc}
                      alt={tech.name}
                      style={{ width: "100%", maxWidth: 110, height: "auto", borderRadius: 10 }}
                    />
                  </div>
                ) : null}
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>
                      {tech.id} {tech.name}
                    </div>
                    <div
                      style={{
                        marginTop: tech.id === "2.2" ? 18 : 6,
                        fontSize: 13,
                        lineHeight: 1.5,
                      }}
                    >
                      {tech.definition}
                    </div>
                  </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  const wlcRankingRows = useMemo(() => {
    if (!wlcResults?.commitTotals) return [];
    const totals = wlcResults.commitTotals || {};
    const entries = PODIUM_GROUPS.map((group) => ({
      ...group,
      total: Number(totals[group.id] ?? 0),
    }));
    const ranked = [...entries].sort((a, b) => b.total - a.total);
    return ranked.map((entry, index) => ({ ...entry, rank: index + 1 }));
  }, [wlcResults]);
  const rankingString = wlcRankingRows.length ? wlcRankingRows.map((row) => row.id).join(" > ") : "";
  const topPodiumGroup = useMemo(() => {
    const winner = wlcRankingRows.find((row) => row.rank === 1);
    if (!winner) return null;
    const techId = String(winner.id || "").replace("G", "");
    return TECH_GROUPS.find((group) => group.id === techId) || null;
  }, [wlcRankingRows]);

  const renderWLCContent = () => {
    if (!wlcResults || !Array.isArray(wlcResults.rows) || !wlcResults.rows.length) {
      return (
        <div
          style={{
            marginTop: 16,
            borderRadius: 14,
            border: "1px dashed rgba(113, 128, 150, 0.6)",
            padding: "18px 20px",
            fontSize: 13,
            color: "#475569",
          }}
        >
          Cargando datos o datos no encontrados. Verifica fase 2 para asegurar el cálculo WLC.
        </div>
      );
    }

    return (
      <div
        style={{
          marginTop: 16,
          borderRadius: 16,
          border: "1px solid rgba(15, 23, 42, 0.08)",
          background: "#ffffff",
          padding: "20px",
          width: "100%",
          boxShadow: "0 20px 45px rgba(15,23,42,0.08)",
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>
          Combinación Lineal Ponderada (WLC)
        </div>
        <div style={{ fontSize: 13, color: "#475569", marginBottom: 16 }}>
          Cada idoneidad se obtiene multiplicando el peso AHP (w_i) por el score del criterio (S_Ci^G) y sumando los aportes por criterio.
        </div>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 14,
              minWidth: 800,
            }}
          >
            <thead>
              <tr>
                {[
                  "Criterio",
                  "w_i (AHP)",
                  ...WLC_DETAIL_COLUMNS.map((col) => col.label),
                ].map((label) => (
                  <th
                    key={`wlc-detail-header-${label}`}
                    style={{
                      textAlign: "left",
                      padding: "10px 14px",
                      borderBottom: "2px solid rgba(148, 163, 184, 0.6)",
                      fontSize: 12,
                      whiteSpace: "nowrap",
                      minWidth: label === "Criterio" ? 180 : 110,
                    }}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {wlcResults.rows.map((row, idx) => {
                const isTotalRow = row.id === "TOTAL_IDONEIDAD";
                const rowBackground = isTotalRow ? "#eef2ff" : idx % 2 === 0 ? "#ffffff" : "#f8fafc";
                return (
                  <tr key={`wlc-detail-row-${row.id || idx}`} style={{ background: rowBackground }}>
                    <td
                      style={{
                        padding: "12px 14px",
                        borderBottom: "1px solid rgba(148, 163, 184, 0.35)",
                        fontWeight: isTotalRow ? 800 : 600,
                        fontSize: 13,
                      }}
                    >
                      {row.label || row.id}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        borderBottom: "1px solid rgba(148, 163, 184, 0.35)",
                        textAlign: "center",
                        fontSize: 13,
                        fontWeight: isTotalRow ? 700 : 600,
                      }}
                    >
                      {Number.isFinite(row.weight) ? formatDecimal(row.weight, 3) : "-"}
                    </td>
                    {WLC_DETAIL_COLUMNS.map((col) => {
                      const rawValue =
                        col.type === "score"
                          ? row.groupScores?.[col.group]
                          : row.scores?.[col.group];
                      return (
                        <td
                          key={`wlc-detail-cell-${row.id || idx}-${col.key}`}
                          style={{
                            padding: "12px 14px",
                            borderBottom: "1px solid rgba(148, 163, 184, 0.35)",
                            textAlign: "center",
                            fontWeight: col.type === "contribution" ? 700 : 600,
                            fontSize: 13,
                          }}
                        >
                          {formatDecimal(rawValue, 3)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  const [expandedCriteria, setExpandedCriteria] = useState(() => new Set([CRITERION_ORDER[0]]));

  const nivelFuente = useMemo(() => {
    const raw = readCaseValue("fuente", "tipo_de_fuente");
    return normalizeToken(raw);
  }, [readCaseValue]);
  const isSuperficialSource = nivelFuente.includes("superficial");

  const variablesById = useMemo(() => {
    const map = new Map();
    routeAVariables.forEach((v) => {
      if (v?.id) map.set(v.id, v);
    });
    return map;
  }, [routeAVariables]);

  const minInputsById = useMemo(() => {
    const map = new Map();
    routeAVariables.forEach((v) => {
      if (v?.id) map.set(v.id, v.minInputsPresent);
    });
    return map;
  }, [routeAVariables]);

  const isInputComplete = useCallback((variable) => {
    if (!variable) return false;
    if (typeof variable.missing === "boolean" && variable.missing === false) return true;
    if (Array.isArray(variable.inputs) && variable.inputs.length) {
      return variable.inputs.every((input) => input && input.missing === false);
    }
    return typeof variable.missing === "boolean" ? !variable.missing : true;
  }, []);

  const isInputCompleteScenario2 = useCallback(
    (variable) => {
      if (!variable) return false;
      if (Array.isArray(variable.inputs) && variable.inputs.length) {
        const hasValidInput = (input) => {
          if (!input) return false;
          if (input.missing === false) return true;
          const raw = input.value;
          if (raw === null || raw === undefined) return false;
          const text = String(raw).trim();
          if (!text) return false;
          if (text === "No_reportado" || text === "No reportado") return false;
          return true;
        };
        if (["V26", "V28", "V29", "V32", "V33"].includes(variable.id)) {
          const infraInput = variable.inputs.find((inp) => inp?.key === "tipo_infraestructura");
          const infraToken = normalizeToken(infraInput?.value);
          if (infraToken.includes("no hay infraestructura") || infraToken.includes("sin infraestructura")) {
            return true;
          }
        }
        const inputsPresent = variable.inputs.filter(hasValidInput).length;
        const minInputs = minInputsById.get(variable.id);
        const inputsRequired = Number.isFinite(minInputs) ? minInputs : Math.min(1, variable.inputs.length);
        if (variable.id === "V9") {
          const study = variable.inputs.find((inp) => inp?.key === "cap_infiltracion_zona_no_saturada");
          const category = variable.inputs.find((inp) => inp?.key === "cap_infiltracion_categoria");
          if (!hasValidInput(study)) return false;
          const token = normalizeToken(study?.value);
          if (token.includes("si")) return hasValidInput(category);
          return true;
        }
        return inputsPresent >= inputsRequired;
      }
      return true;
    },
    [minInputsById]
  );

  const isInputCompleteNoMaps = useCallback(
    (variable) => {
      if (!variable) return false;
      if (Array.isArray(variable.inputs) && variable.inputs.length) {
        const inputsPresent = variable.inputs.filter((inp) => inp && inp.missing === false).length;
        const minInputs = minInputsById.get(variable.id);
        let required = Number.isFinite(minInputs) ? minInputs : variable.inputs.length;
        if (variable.id === "V9") {
          const study = variable.inputs.find((inp) => inp?.key === "cap_infiltracion_zona_no_saturada");
          const token = normalizeToken(study?.value);
          required = token.includes("si") ? 2 : 1;
        }
        return inputsPresent >= required;
      }
      return true;
    },
    [minInputsById]
  );

  const minimumScenario = useMemo(() => validateMinimumScenario(activeCase), [activeCase]);
  const scenario1Ready = useMemo(
    () =>
      minimumScenario.ok &&
      SCENARIO1_REQUIRED_IDS.every((id) => isInputComplete(variablesById.get(id))),
    [minimumScenario, isInputComplete, variablesById]
  );
  const scenario2Ready = useMemo(() => {
    const mandatory = new Set(SCENARIO2_REQUIRED_IDS);
    if (!isSuperficialSource) {
      ["V36", "V37"].forEach((id) => mandatory.delete(id));
    }
    return Array.from(mandatory).every((id) => isInputCompleteScenario2(variablesById.get(id)));
  }, [isInputCompleteScenario2, variablesById, isSuperficialSource]);
  const fullReady = useMemo(
    () => routeAVariables.length > 0 && routeAVariables.every((v) => isInputCompleteNoMaps(v)),
    [routeAVariables, isInputCompleteNoMaps]
  );
  const scenarioId = useMemo(() => {
    if (fullReady) return 3;
    if (scenario2Ready) return 2;
    if (scenario1Ready) return 1;
    return 0;
  }, [fullReady, scenario2Ready, scenario1Ready]);
  const completedScenario2 = useMemo(
    () => SCENARIO2_REQUIRED_IDS.filter((id) => isInputCompleteScenario2(variablesById.get(id))).length,
    [isInputCompleteScenario2, variablesById]
  );

  const scenario2TargetIds = useMemo(
    () => (isSuperficialSource ? SCENARIO2_REQUIRED_IDS : SCENARIO2_REQUIRED_IDS.filter((id) => !["V36", "V37"].includes(id))),
    [isSuperficialSource]
  );
  const scenario2TargetSet = useMemo(() => new Set(scenario2TargetIds), [scenario2TargetIds]);
  const isScenario1Active = scenario1Ready && !scenario2Ready && !fullReady;
  const isScenario2Active = scenario2Ready && !fullReady;
  const isScenarioBlockedVar = useCallback(
    (variableId) => {
      if (!variableId) return false;
      if (isScenario1Active) return !SCENARIO1_REQUIRED_IDS.includes(variableId);
      if (isScenario2Active) return !scenario2TargetSet.has(variableId);
      return false;
    },
    [isScenario1Active, isScenario2Active, scenario2TargetSet]
  );
  const manualScores = activeCase?.phase2?.manualScores || {};
  const manualOverrides = activeCase?.phase2?.manualOverrides || {};
  const customInfluenceEnabled = activeCase?.phase2?.useCustomInfluence ?? false;
  const customInfluenceByVar = activeCase?.phase2?.customInfluenceByVar || {};
  const manualLockedIds = useMemo(() => new Set(["V11", "V12"]), []);
  const summarizeGroupScores = useCallback((entries) => {
    if (!Array.isArray(entries)) return { scores: [], denom: 0, sc: null };
    const filtered = entries
      .filter((entry) => entry && entry.include && Number.isFinite(entry.value))
      .map((entry) => Number(entry.value));
    const denom = filtered.length;
    const total = filtered.reduce((acc, v) => acc + v, 0);
    const sc = denom > 0 ? total / denom : null;
    return { scores: filtered, denom, sc };
  }, []);
  const getManualOverride = useCallback(
    (id) => {
      if (!id || manualLockedIds.has(id)) return null;
      if (manualOverrides?.[id] !== true) return null;
      const override = manualScores?.[id];
      if (override === undefined || override === null || override === "") return null;
      const numeric = Number(override);
      return Number.isFinite(numeric) ? numeric : null;
    },
    [manualLockedIds, manualOverrides, manualScores]
  );
  const getOverrideGroupScore = useCallback(
    (varId, groupId) => {
      if (!customInfluenceEnabled) return null;
      const raw = customInfluenceByVar?.[varId]?.[groupId];
      return Number.isFinite(raw) ? Number(raw) : null;
    },
    [customInfluenceByVar, customInfluenceEnabled]
  );
  const getEffectiveGroupScore = useCallback(
    (varId, groupId, fallback) => {
      if (isScenarioBlockedVar(varId)) return 0;
      const custom = getOverrideGroupScore(varId, groupId);
      if (Number.isFinite(custom)) return custom;
      return Number.isFinite(fallback) ? Number(fallback) : fallback;
    },
    [getOverrideGroupScore, isScenarioBlockedVar]
  );
  const scoreById = useMemo(() => {
    if (storedScoreById) return storedScoreById;
    if (!baseScoreById.size) return baseScoreById;
    let overrides = null;
    if (isScenario1Active) overrides = buildScenario1Overrides(activeCase, readCaseValue);
    else if (isScenario2Active)
      overrides = buildScenario2Overrides(activeCase, baseScoreById, readCaseValue);
    if (!overrides || !overrides.size) return baseScoreById;
    const next = new Map(baseScoreById);
    for (const [id, patch] of overrides.entries()) {
      const current = baseScoreById.get(id);
      if (!current) continue;
      next.set(id, { ...current, ...patch });
    }
    return next;
  }, [storedScoreById, activeCase, baseScoreById, isScenario1Active, isScenario2Active]);
  const c1Var = useMemo(() => variablesById.get("V1") || null, [variablesById]);
  const c1IsBlocked = useMemo(() => isScenarioBlockedVar("V1"), [isScenarioBlockedVar]);
  const c1IsComplete = useMemo(() => isInputComplete(c1Var), [c1Var, isInputComplete]);
  const getAdjustedGroupScore = useCallback(
    (variableId, groupId) => {
    if (!variableId) return null;
    const variable = scoreById.get(variableId);
    const raw = variable?.scoreByGroup?.[groupId];
    const fallback = Number.isFinite(raw) ? Number(raw) : Number(variable?.score04 || 0);
    return getEffectiveGroupScore(variableId, groupId, fallback);
  },
    [getEffectiveGroupScore, scoreById]
  );

  const criterionSummaries = useMemo(() => {
    return CRITERION_ORDER.map((criterionId) => {
      const varIds = CRITERION_VARIABLE_IDS[criterionId] || [];
      const variables = varIds
        .map((id) => ({
          id,
          isBlocked: isScenarioBlockedVar(id),
          isComplete: isInputComplete(variablesById.get(id)),
        }))
        .filter((v) => v.id);
      const groups = ROUTE_GROUPS.map((gid) => {
        const scoresByVar = {};
        const entries = [];
        const missingCount = variables.filter((v) => !v.isBlocked && !v.isComplete).length;
        variables.forEach((variable) => {
          const id = variable.id;
          const manual = getManualOverride(id);
          const baseVariable = scoreById.get(id);
          const groupScore = baseVariable?.scoreByGroup?.[gid];
          const fallback = Number.isFinite(groupScore) ? Number(groupScore) : Number(baseVariable?.score04 || 0);
          const score =
            manual !== null ? manual : getEffectiveGroupScore(id, gid, fallback);
          const display = Number.isFinite(score) ? score : null;
          scoresByVar[id] = display;
          const include = Number.isFinite(score) && score !== 0;
          if (include) {
            entries.push({ value: score, include });
          }
        });
        const { sc } = summarizeGroupScores(entries);
        const observation = missingCount
          ? `Confianza reducida (${missingCount} faltantes)`
          : `Condiciones compatibles con ${gid}`;
        return { id: gid, scoresByVar, sc: sc ?? 0, observation };
      });
      const label = CRITERION_TITLES[criterionId] || routeACriteria[criterionId]?.label || criterionId;
      return { id: criterionId, label, varIds, groups };
    });
  }, [
    getEffectiveGroupScore,
    isInputComplete,
    isScenarioBlockedVar,
    routeACriteria,
    scoreById,
    summarizeGroupScores,
    variablesById,
    getManualOverride,
  ]);

  const insumosSection = useMemo(() => {
    let description = SCENARIO_BLURBS[scenarioId] || "Completa los insumos para habilitar un escenario.";
    if (scenarioId === 0) {
      description = "Aún no hay un escenario definido; completa los insumos para continuar.";
    }
    const targetIds =
      scenarioId === 1
        ? SCENARIO1_REQUIRED_IDS
        : scenarioId === 2
        ? scenario2TargetIds
        : scenarioId === 3
        ? routeAVariables.map((variable) => variable?.id).filter(Boolean)
        : [];

    const isFilledValue = (value) => {
      if (!value) return false;
      const normalized = String(value).trim().toLowerCase();
      if (!normalized) return false;
      if (normalized.startsWith("sin ")) return false;
      if (normalized.includes("sin datos visibles")) return false;
      if (/^\d+\/\d+$/.test(normalized)) return false;
      return true;
    };

    const tablesMap = new Map();
    targetIds.forEach((id) => {
      const variable = variablesById.get(id);
      if (!variable) return;
      const criterionLabel = routeACriteria[variable.criterionId]?.label || variable.criterionId;
      const label = `${criterionLabel} • ${variable.label}`;
      const value = describeVariableValue(variable);
      const detail =
        scenarioId === 1
          ? "Variable mínima del Escenario 1."
          : scenarioId === 2
          ? "Variable necesaria para la ruta metodológica."
          : "Variable incluida en el Escenario 3 completo.";
      const tableTitle = criterionLabel || "Variables";
      if (!isFilledValue(value)) return;
      if (!tablesMap.has(tableTitle)) {
        tablesMap.set(tableTitle, { title: tableTitle, entries: [] });
      }
      tablesMap.get(tableTitle).entries.push({
        id: variable.id,
        label: variable.label,
        value,
        detail,
      });
    });

    if (scenarioId === 1 && tablesMap.size === 0) {
      const table = { title: "Variables mínimas", entries: [] };
      MIN_REQUIRED.forEach((entry) => {
        const rawValue = readCaseValue(entry.moduleId, entry.key);
        if (!isFilledValue(rawValue)) return;
        const value = rawValue;
        table.entries.push({
          id: `${entry.moduleId}-${entry.key}`,
          label: entry.label,
          value,
          detail: "Variable del Escenario 1.",
        });
      });
      tablesMap.set(table.title, table);
    }

    const tables = Array.from(tablesMap.values());

    return {
      tables,
      description,
      title: scenarioId ? `Insumos · ${SCENARIO_TITLES[scenarioId]}` : "Insumos · Escenario pendiente",
    };
  }, [
    scenarioId,
    minimumScenario,
    routeAVariables,
    routeACriteria,
    variablesById,
    isInputCompleteScenario2,
    isInputCompleteNoMaps,
    scenario2TargetIds,
    readCaseValue,
    mapUploads,
    mapMeta,
  ]);

  const handleExport = useCallback(async () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });
    const padding = 40;
    const heroIconData = await fetchImageAsDataUrl(HERO_ICON_PATH);
    const pageWidth = doc.internal.pageSize.getWidth();
    const brandWidth = 140;
    const brandHeight = 72;
    const brandX = pageWidth - padding - brandWidth;
    const brandY = padding - 12;
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(brandX, brandY, brandWidth, brandHeight, 16, 16, "FD");
    doc.setFontSize(9);
    doc.setFont(undefined, "bold");
    doc.setTextColor("#0f172a");
    doc.text("SIGMMA-MAR", brandX + brandWidth / 2, brandY + 18, { align: "center" });
    if (heroIconData) {
      const iconWidth = 84;
      const iconHeight = 40;
      const iconX = brandX + (brandWidth - iconWidth) / 2;
      const iconY = brandY + 26;
      doc.addImage(heroIconData, "PNG", iconX, iconY, iconWidth, iconHeight);
    }
    doc.setFont("Inter", "bold");
    doc.setFontSize(22);
    doc.text("Ficha MAR", padding, padding);
    doc.setFont("Inter", "normal");
    doc.setFontSize(18);
    doc.text(title, padding, padding + 32);
    doc.setFontSize(12);
    doc.setTextColor(ready ? "#0f172a" : "#b91c1c");
    doc.text(statusLabel, padding, padding + 54);
    doc.setTextColor("#475569");
    doc.setFontSize(12);
    doc.text(description, padding, padding + 78, { maxWidth: 500 });

    let y = padding + 110;
    const techniqueIconCache = new Map();
    if (topPodiumGroup?.techniques?.length) {
      await Promise.all(
        topPodiumGroup.techniques.map(async (tech) => {
          const iconSrc = getTechniqueIcon(tech);
          if (!iconSrc) return;
          const iconData = await fetchImageAsDataUrl(iconSrc);
          if (iconData) techniqueIconCache.set(tech.id, iconData);
        })
      );
    }
    const caseInfoFontSize = 13;
    doc.setFontSize(caseInfoFontSize);
    doc.setTextColor("#1e293b");
    caseInfo.forEach((item) => {
      doc.setFont(undefined, "bold");
      doc.text(item.label, padding, y);
      doc.setFont(undefined, "normal");
      doc.text(`${item.value}`, padding + 160, y);
      y += caseInfoFontSize + 11;
    });
    y += 20;
    const boxTop = y - 10;
    const boxHeight = 120;
    const boxLeft = padding - 8;
    const boxWidth = 460;
    doc.setDrawColor(29, 78, 216);
    doc.setFillColor(238, 244, 255);
    doc.roundedRect(boxLeft, boxTop, boxWidth, boxHeight, 10, 10, "FD");
    const textX = boxLeft + 14;
    let textY = boxTop + 28;
    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.setTextColor("#0f172a");
    doc.text("Escenario de información", textX, textY);
    textY += 20;
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.setTextColor("#1d4ed8");
    doc.text(SCENARIO_TITLES[scenarioId] || "Ruta metodológica", textX, textY);
    textY += 18;
    doc.setFont(undefined, "normal");
    doc.setTextColor("#475569");
    doc.text(
      SCENARIO_BLURBS[scenarioId] ||
        "Esquema heredado de la Fase 2 que consolida las variables necesarias para definir el estudio final.",
      textX,
      textY,
      { maxWidth: 420 }
    );
    textY += 36;
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.setTextColor("#1d4ed8");
    doc.text(`Variables diligenciadas ${completedScenario2}/${SCENARIO2_REQUIRED_IDS.length}`, textX, textY);
    y += boxHeight + 20;

    if (insumosSection.tables.length) {
      y += 10;
      doc.setFontSize(16);
      doc.setFont(undefined, "bold");
      doc.setTextColor("#0f172a");
      doc.text(insumosSection.title, padding, y);
      y += 18;
      doc.setFontSize(14);
      doc.setFont(undefined, "normal");
      doc.setTextColor("#475569");
      doc.text(insumosSection.description, padding, y, { maxWidth: 500 });
      y += 20;
      const tableLeft = padding;
      const tableWidth = 520;
      const labelColWidth = 230;
      const valueColX = tableLeft + labelColWidth + 14;
      const valueColWidth = tableWidth - labelColWidth - 14;
      insumosSection.tables.forEach((table) => {
        if (y > 720) {
          doc.addPage();
          y = padding;
        }
        doc.setFontSize(12);
        doc.setFont(undefined, "bold");
        doc.setTextColor("#0f172a");
        doc.text(table.title, tableLeft, y);
        y += 16;
        doc.setDrawColor(0,0,0,0);
        const contentFontSize = 13;
        const contentLineHeight = 14;
        doc.setFontSize(contentFontSize);
        doc.setFont(undefined, "normal");
        doc.setTextColor("#1e293b");
        table.entries.forEach((entry) => {
          const labelLines = doc.splitTextToSize(entry.label, labelColWidth);
          const valueLines = doc.splitTextToSize(entry.value, valueColWidth);
          const maxLines = Math.max(labelLines.length, valueLines.length);
          const rowHeight = maxLines * contentLineHeight + 8;
          if (y + rowHeight > 750) {
            doc.addPage();
            y = padding;
          }
          labelLines.forEach((line, index) => {
            doc.text(line, tableLeft + 4, y + index * contentLineHeight);
          });
          valueLines.forEach((line, index) => {
            doc.text(line, valueColX, y + index * contentLineHeight);
          });
          y += rowHeight;
        });
        y += 18;
      });
    }

    let currentY = y;

    const ensureSpaceFor = (height) => {
      const pageHeight = doc.internal.pageSize.getHeight();
      if (currentY + height > pageHeight - padding) {
        doc.addPage();
        currentY = padding;
      }
    };

    const docWidth = doc.internal.pageSize.getWidth();
    const routeCardLeft = padding;
    const routeCardWidth = docWidth - padding * 2;
    const routeCardItemHeight = 18;
    const routeCardSpacing = 16;
    const estimatedRouteCardHeight = 72 + ROUTE_A_ITEMS.length * (routeCardItemHeight + 4);
    ensureSpaceFor(estimatedRouteCardHeight + routeCardSpacing);
    const routeCardTop = currentY + routeCardSpacing;
    const routeCardHeight = estimatedRouteCardHeight;
    doc.setDrawColor(148, 163, 184);
    doc.setFillColor(236, 244, 255);
    doc.roundedRect(routeCardLeft, routeCardTop, routeCardWidth, routeCardHeight, 18, 18, "FD");
    doc.setFontSize(16);
    doc.setFont(undefined, "bold");
    doc.setTextColor("#0f172a");
    doc.text("Ruta ejecutada", routeCardLeft + 16, routeCardTop + 28);
    doc.setFontSize(18);
    doc.text("Ruta A", routeCardLeft + 16, routeCardTop + 52);
    let routeCardBottom = routeCardTop + routeCardHeight;
    ROUTE_A_ITEMS.forEach((item, index) => {
      const itemY = routeCardTop + 70 + index * (routeCardItemHeight + 4);
      routeCardBottom = Math.max(routeCardBottom, itemY + routeCardItemHeight);
      const isActive = item === activeRouteItem;
      doc.setFontSize(12);
      doc.setFont(undefined, isActive ? "bold" : "normal");
      doc.setTextColor("#0f172a");
      doc.text("•", routeCardLeft + 20, itemY);
      doc.text(item, routeCardLeft + 30, itemY);
    });
    currentY = routeCardBottom + routeCardSpacing;

    const tableLeft = padding;
    let currentOrientation = "portrait";
    let tablePageWidth = doc.internal.pageSize.getWidth();
    let tablePageHeight = doc.internal.pageSize.getHeight();
    const isScenario3 = scenarioId === 3;
    const startTableHeader = () => {
      const headerSpacing = 12;
      const pageWidth = doc.internal.pageSize.getWidth();
      const tableWidth = pageWidth - padding * 2;
      currentY += headerSpacing * 2;
      doc.setFontSize(18);
      doc.setFont(undefined, "bold");
      doc.setTextColor("#0f172a");
      doc.text("Puntaje por criterio", tableLeft, currentY);
      currentY += 24;
      doc.setFontSize(12);
      doc.setFont(undefined, "normal");
      doc.setTextColor("#475569");
      doc.text(
        "Aquí se consolidan los puntajes y observaciones que luego se usan para ponderar cada criterio y priorizar la decisión final de ruta.",
        tableLeft,
        currentY,
        { maxWidth: tableWidth }
      );
      currentY += 32; // add extra vertical spacing before the table
      doc.setFont(undefined, "bold");
      doc.setTextColor("#0f172a");
    };
    const ensureTablePage = (orientation) => {
      if (currentOrientation === orientation) return false;
      doc.addPage("a4", orientation);
      currentOrientation = orientation;
      tablePageWidth = doc.internal.pageSize.getWidth();
      tablePageHeight = doc.internal.pageSize.getHeight();
      currentY = padding;
      return true;
    };
    const changeOrientation = (orientation) => {
      if (currentOrientation === orientation) return false;
      doc.addPage("a4", orientation);
      currentOrientation = orientation;
      tablePageWidth = doc.internal.pageSize.getWidth();
      tablePageHeight = doc.internal.pageSize.getHeight();
      currentY = padding;
      return true;
    };
    const mmToPt = (mm) => (mm / 25.4) * 72;
    const ensureSpace = (height) => {
      if (currentY + height > tablePageHeight - padding) {
        doc.addPage("a4", currentOrientation);
        tablePageWidth = doc.internal.pageSize.getWidth();
        tablePageHeight = doc.internal.pageSize.getHeight();
        currentY = padding;
        return true;
      }
      return false;
    };
    const drawAHPMatrix = (doc, results) => {
      const matrixIds = Array.isArray(results?.ids) ? results.ids : [];
      if (!matrixIds.length) return;
      const matrixValues = Array.isArray(results?.matrix) ? results.matrix : [];
      const weights = Array.isArray(results?.weights) ? results.weights : [];
      const weightRows = matrixIds.map((id, idx) => ({
        id,
        label: CRITERION_TITLES[id] || id,
        weight: Number.isFinite(weights[idx]) ? Number(weights[idx]) : 0,
      }));
      const sorted = [...weightRows].sort((a, b) => b.weight - a.weight);
      const rankMap = new Map(sorted.map((row, idx) => [row.id, idx + 1]));
      weightRows.forEach((row) => {
        row.rank = rankMap.get(row.id) || "-";
      });
      const sectionOrientation = matrixIds.length > 5 ? "landscape" : "portrait";
      const orientationChanged = changeOrientation(sectionOrientation);
      if (!orientationChanged) ensureSpace(32);
      else currentY += 12;
      currentY += 12;
      const sectionWidth = doc.internal.pageSize.getWidth() - padding * 2;
      doc.setFontSize(18);
      doc.setFont(undefined, "bold");
      doc.setTextColor("#0f172a");
      doc.text("Matriz de pesos AHP", tableLeft, currentY);
      currentY += 22;
      doc.setFontSize(12);
      doc.setFont(undefined, "normal");
      doc.setTextColor("#475569");
      const lambdaLabel = Number.isFinite(results.lambdaMax) ? results.lambdaMax.toFixed(3) : "-";
      const ciLabel = Number.isFinite(results.ci) ? results.ci.toFixed(3) : "-";
      const crLabel = Number.isFinite(results.cr) ? formatPercent(results.cr) : "-";
      doc.text(`λmax: ${lambdaLabel} · CI: ${ciLabel} · CR: ${crLabel}`, tableLeft, currentY, {
        maxWidth: sectionWidth,
      });
      currentY += 16;
      const matrixHeaderHeight = 18;
      const matrixRowHeight = 16;
      const matrixHeight = matrixHeaderHeight + matrixIds.length * matrixRowHeight;
      ensureSpace(matrixHeight + 24);
      const matrixY = currentY;
      const matrixColWidth = sectionWidth / (matrixIds.length + 1);
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.setTextColor("#0f172a");
      doc.setFillColor(229, 231, 235);
      doc.rect(tableLeft, matrixY, sectionWidth, matrixHeaderHeight, "F");
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.4);
      doc.line(tableLeft, matrixY, tableLeft + sectionWidth, matrixY);
      doc.line(tableLeft, matrixY + matrixHeaderHeight, tableLeft + sectionWidth, matrixY + matrixHeaderHeight);
      doc.line(tableLeft, matrixY + matrixHeight, tableLeft + sectionWidth, matrixY + matrixHeight);
      for (let rowIndex = 0; rowIndex <= matrixIds.length; rowIndex += 1) {
        const y = matrixY + matrixHeaderHeight + rowIndex * matrixRowHeight;
        doc.line(tableLeft, y, tableLeft + sectionWidth, y);
      }
      for (let colIndex = 0; colIndex < matrixIds.length + 2; colIndex += 1) {
        const x = tableLeft + colIndex * matrixColWidth;
        doc.line(x, matrixY, x, matrixY + matrixHeight);
      }
      doc.text("Criterio", tableLeft + 4, matrixY + matrixHeaderHeight - 4);
      matrixIds.forEach((id, idx) => {
        doc.text(id, tableLeft + (idx + 1) * matrixColWidth + matrixColWidth / 2, matrixY + matrixHeaderHeight - 4, {
          align: "center",
        });
      });
      matrixIds.forEach((rowId, rowIndex) => {
        const rowTop = matrixY + matrixHeaderHeight + rowIndex * matrixRowHeight;
        doc.setFont(undefined, "bold");
        doc.text(rowId, tableLeft + 4, rowTop + matrixRowHeight - 4);
        doc.setFont(undefined, "normal");
        const rowValues = Array.isArray(matrixValues[rowIndex]) ? matrixValues[rowIndex] : [];
        matrixIds.forEach((colId, colIndex) => {
          const value = rowValues[colIndex];
          const text = Number.isFinite(value) ? Number(value).toFixed(2) : "-";
          const cellX = tableLeft + (colIndex + 1) * matrixColWidth;
          const isDiagonal = rowIndex === colIndex;
          if (isDiagonal) {
            doc.setFillColor(240, 240, 240);
            doc.rect(cellX, rowTop, matrixColWidth, matrixRowHeight, "F");
            doc.setFillColor(255, 255, 255);
          }
          doc.setFontSize(12);
          doc.text(text, cellX + matrixColWidth / 2, rowTop + matrixRowHeight - 4, {
            align: "center",
          });
        });
      });
      currentY = matrixY + matrixHeight + 16;
      doc.setFontSize(14);
      doc.setFont(undefined, "normal");
      doc.setTextColor("#475569");
      doc.text("CR ≤ 10% se considera aceptable según Saaty.", tableLeft, currentY);
      currentY += 14;
      currentY += 12;
      const weightTableTitle = "Pesos (prioridades)";
      doc.setFontSize(16);
      doc.setFont(undefined, "bold");
      doc.setTextColor("#0f172a");
      doc.text(weightTableTitle, tableLeft, currentY);
      currentY += 18;
      const weightHeaderHeight = 18;
      const weightRowHeight = 16;
      const weightTableHeight = weightHeaderHeight + weightRows.length * weightRowHeight;
      ensureSpace(weightTableHeight + 20);
      const weightTableTop = currentY;
      doc.setFillColor(235, 244, 255);
      doc.rect(tableLeft, weightTableTop, sectionWidth, weightHeaderHeight, "F");
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.setTextColor("#0f172a");
      const weightColProportions = [0.45, 0.18, 0.18, 0.19];
      const weightColWidthMap = weightColProportions.map((prop) => sectionWidth * prop);
      const weightColPositions = [];
      let acc = tableLeft;
      weightColWidthMap.forEach((width) => {
        weightColPositions.push(acc);
        acc += width;
      });
      const weightHeaders = ["Criterio", "Peso (%)", "Peso (w_i)", "Jerarquía"];
      weightHeaders.forEach((label, idx) => {
        doc.text(label, weightColPositions[idx] + 4, weightTableTop + weightHeaderHeight - 4);
      });
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.4);
      doc.line(tableLeft, weightTableTop, tableLeft + sectionWidth, weightTableTop);
      let rowY = weightTableTop + weightHeaderHeight;
      weightRows.forEach((row, rowIndex) => {
        if (rowIndex % 2) {
          doc.setFillColor(248, 250, 255);
          doc.rect(tableLeft, rowY, sectionWidth, weightRowHeight, "F");
        }
        doc.setFont(undefined, "bold");
        doc.setFontSize(11);
        doc.text(`${row.id} - ${row.label}`, weightColPositions[0] + 4, rowY + weightRowHeight - 4);
        doc.setFont(undefined, "normal");
        doc.setFontSize(12);
        doc.text(formatPercent(row.weight), weightColPositions[1] + 4, rowY + weightRowHeight - 4);
        doc.text(Number.isFinite(row.weight) ? row.weight.toFixed(3) : "-", weightColPositions[2] + 4, rowY + weightRowHeight - 4);
        doc.text(`${row.rank}`, weightColPositions[3] + 4, rowY + weightRowHeight - 4);
        doc.line(tableLeft, rowY, tableLeft + sectionWidth, rowY);
        rowY += weightRowHeight;
      });
      doc.line(tableLeft, rowY, tableLeft + sectionWidth, rowY);
      weightColPositions.forEach((x) => {
        doc.line(x, weightTableTop, x, rowY);
      });
      doc.line(tableLeft + sectionWidth, weightTableTop, tableLeft + sectionWidth, rowY);
      currentY = rowY + 18;

      const renderPriorityChartImage = () => {
        const barHeight = 12;
        const barGap = 10;
        const labelBlock = 18;
        const descriptionHeight = 20;
        const rowsHeight = ahpWeightRows.length * (barHeight + barGap);
        const requiredSpace = descriptionHeight + labelBlock + rowsHeight + 24;
        ensureSpace(requiredSpace);
        doc.setFontSize(18);
        doc.setFont(undefined, "bold");
        doc.setTextColor("#0f172a");
        currentY += 12;
        doc.text("Gráfico de prioridades", tableLeft, currentY);
        currentY += 18;
        doc.setFontSize(12);
        doc.setFont(undefined, "normal");
        doc.setTextColor("#475569");
        doc.text(
          "Los pesos AHP alimentan la etapa WLC para priorizar la ruta final y asegurar coherencia metodológica.",
          tableLeft,
          currentY,
          { maxWidth: sectionWidth }
        );
        currentY += descriptionHeight;
        const barAreaWidth = sectionWidth - 120;
        const percentX = tableLeft + sectionWidth - 18;
        ahpWeightRows.forEach((row) => {
          const percent = Math.max(0, Math.min(100, Number(row.weight) * 100));
          doc.setFontSize(11);
          doc.setFont(undefined, "bold");
          doc.setTextColor("#0f172a");
          doc.text(row.id, tableLeft, currentY + barHeight - 2);
          const barX = tableLeft + 40;
          doc.setFillColor(229, 231, 235);
          doc.rect(barX, currentY, barAreaWidth, barHeight, "F");
          const fillWidth = (percent / 100) * barAreaWidth;
          doc.setFillColor(37, 99, 235);
          doc.rect(barX, currentY, fillWidth, barHeight, "F");
          doc.setFont(undefined, "normal");
          doc.setFontSize(10);
          doc.setTextColor("#0f172a");
          doc.text(`${percent.toFixed(1)}%`, percentX, currentY + barHeight - 2, { align: "right" });
          currentY += barHeight + barGap;
        });
      };

    const drawWLCTable = (doc, results) => {
      const rows = Array.isArray(results?.rows) ? results.rows : [];
      if (!rows.length) return;
      const detailColumns = WLC_DETAIL_COLUMNS;
      doc.addPage("a4", "landscape");
      currentOrientation = "landscape";
      tablePageWidth = doc.internal.pageSize.getWidth();
      tablePageHeight = doc.internal.pageSize.getHeight();
      currentY = padding;
      const docWidth = doc.internal.pageSize.getWidth();
      const tableWidth = docWidth - padding * 2;
      const tableLeft = padding;
      doc.setFontSize(16);
      doc.setFont(undefined, "bold");
      doc.setTextColor("#0f172a");
      doc.text("Combinación Lineal Ponderada (WLC)", tableLeft, currentY);
      currentY += 22;
      doc.setFontSize(12);
      doc.setFont(undefined, "normal");
      doc.setTextColor("#475569");
      doc.text(
        "Este resumen cruza los pesos AHP con los puntajes por grupo obtenidos en la Fase 2 para priorizar las rutas finales.",
        tableLeft,
        currentY,
        { maxWidth: tableWidth }
      );
      currentY += 28;
      const minDetailWidth = 70;
      let criteriaColWidth = Math.max(170, tableWidth * 0.22);
      const weightColWidth = 90;
      const detailCount = detailColumns.length;
      let availableDetailWidth = tableWidth - criteriaColWidth - weightColWidth;
      if (detailCount > 0 && availableDetailWidth < detailCount * minDetailWidth) {
        const deficit = detailCount * minDetailWidth - availableDetailWidth;
        criteriaColWidth = Math.max(130, criteriaColWidth - deficit);
        availableDetailWidth = tableWidth - criteriaColWidth - weightColWidth;
      }
      const detailColWidth = detailCount
        ? Math.max(minDetailWidth, availableDetailWidth / detailCount)
        : 0;
      const columnDefs = [
        { key: "label", label: "Criterio", width: criteriaColWidth },
        { key: "weight", label: "w_i (AHP)", width: weightColWidth },
        ...detailColumns.map((col) => ({ ...col, width: detailColWidth })),
      ];
      const columnPositions = [];
      let colX = tableLeft;
      columnDefs.forEach((col) => {
        columnPositions.push({ ...col, x: colX });
        colX += col.width;
      });
      if (columnPositions.length) {
        const lastCol = columnPositions[columnPositions.length - 1];
        const targetRight = tableLeft + tableWidth;
        lastCol.width = targetRight - lastCol.x;
      }
      const headerHeight = 26;
      const renderHeaderRow = () => {
        doc.setFillColor(235, 244, 255);
        doc.rect(tableLeft, currentY - 6, tableWidth, headerHeight, "F");
        doc.setDrawColor(148, 163, 184);
        doc.setLineWidth(0.4);
        doc.line(tableLeft, currentY - 6, tableLeft + tableWidth, currentY - 6);
        doc.line(tableLeft, currentY + headerHeight - 6, tableLeft + tableWidth, currentY + headerHeight - 6);
        doc.setFontSize(12);
        doc.setFont(undefined, "bold");
        doc.setTextColor("#0f172a");
        columnPositions.forEach((col) => {
          doc.text(col.label, col.x + 4, currentY + headerHeight - 12);
        });
        currentY += headerHeight + 8;
      };
      renderHeaderRow();
      rows.forEach((row, rowIndex) => {
        const rowLabel = row.label || row.id || "Criterio";
        const isTotalRow = row.id === "TOTAL_IDONEIDAD";
        const labelLines = doc.splitTextToSize(rowLabel, criteriaColWidth - 10);
        const lineHeight = 14;
        const rowHeight = Math.max(headerHeight, labelLines.length * lineHeight + 10);
        const projectedBottom = currentY + rowHeight + 6;
        if (projectedBottom > tablePageHeight - padding) {
          doc.addPage("a4", "landscape");
          currentOrientation = "landscape";
          tablePageWidth = doc.internal.pageSize.getWidth();
          tablePageHeight = doc.internal.pageSize.getHeight();
          currentY = padding;
          renderHeaderRow();
        }
        const rowBackground = isTotalRow ? "#eef2ff" : rowIndex % 2 === 0 ? "#ffffff" : "#f8fafc";
        doc.setFillColor(rowBackground);
        doc.rect(tableLeft, currentY, tableWidth, rowHeight + 2, "F");
        doc.setFontSize(12);
        doc.setFont(undefined, isTotalRow ? "bold" : "normal");
        doc.setTextColor("#0f172a");
        labelLines.forEach((line, idx) => {
          doc.text(line, tableLeft + 4, currentY + 12 + idx * lineHeight);
        });
        columnPositions.forEach((col) => {
          if (col.key === "label") return;
          const centerX = col.x + col.width / 2;
          let value = "-";
          if (col.key === "weight") {
            value = Number.isFinite(row.weight) ? formatDecimal(row.weight, 3) : "-";
          } else {
            const rawValue = col.type === "score" ? row.groupScores?.[col.group] : row.scores?.[col.group];
            value = formatDecimal(rawValue, 3);
          }
          const valueFontSize = isTotalRow ? 12 : 12;
          doc.setFontSize(valueFontSize);
          doc.setFont(undefined, isTotalRow ? "bold" : "normal");
          doc.text(
            value,
            centerX,
            currentY + rowHeight / 2 + 4,
            { align: "center" }
          );
        });
        doc.setDrawColor(225, 232, 240);
        doc.line(tableLeft, currentY + rowHeight + 2, tableLeft + tableWidth, currentY + rowHeight + 2);
        currentY += rowHeight + 8;
      });
      doc.addPage("a4", "portrait");
      currentOrientation = "portrait";
      tablePageWidth = doc.internal.pageSize.getWidth();
      tablePageHeight = doc.internal.pageSize.getHeight();
      currentY = padding + 12;
    };

    const drawPodioSection = (doc, ranking) => {
      if (!Array.isArray(ranking) || !ranking.length) return;
      const tableWidth = doc.internal.pageSize.getWidth() - padding * 2;
      const sectionHeight = 270;
      ensureSpace(sectionHeight + 24);
      const sectionTop = currentY;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.4);
      doc.roundedRect(tableLeft, sectionTop, tableWidth, sectionHeight, 16, 16, "F");
      doc.setFontSize(16);
      doc.setFont(undefined, "bold");
      doc.setTextColor("#0f172a");
      doc.text("Podio de Idoneidad", tableLeft + 12, sectionTop + 26);
      doc.setFontSize(12);
      doc.setFont(undefined, "normal");
      doc.setTextColor("#475569");
      doc.text("Resultados ordenados por idoneidad (mayor a menor).", tableLeft + 12, sectionTop + 40);
      const podiumRows = [2, 1, 3]
        .map((rank) => ranking.find((row) => row.rank === rank))
        .filter(Boolean);
      const boxWidth = 140;
      const boxGap = 16;
      const totalWidth = podiumRows.length * boxWidth + (podiumRows.length - 1) * boxGap;
      let boxX = tableLeft + (tableWidth - totalWidth) / 2;
      const boxTop = sectionTop + 96;
      podiumRows.forEach((group) => {
        const color = PODIUM_COLORS[group.rank] || "#e2e8f0";
        const label = RANK_LABELS[group.rank] || "Posición";
        doc.setFillColor(255, 247, 237);
        doc.roundedRect(boxX, boxTop - 30, boxWidth, 28, 14, 14, "F");
        doc.setFontSize(12);
        doc.setFont(undefined, "bold");
        doc.setTextColor("#7c2d12");
        doc.text(label, boxX + boxWidth / 2, boxTop - 12, { align: "center" });
        const hex = color.replace("#", "");
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        doc.setFillColor(r, g, b);
        doc.roundedRect(boxX, boxTop, boxWidth, PODIUM_HEIGHTS[group.rank] || 110, 12, 12, "F");
        doc.setFontSize(20);
        doc.setFont(undefined, "bold");
        doc.setTextColor("#0f172a");
        doc.text(String(group.id || "").replace("G", ""), boxX + boxWidth / 2, boxTop + 34, {
          align: "center",
        });
        doc.setFontSize(12);
        doc.setFont(undefined, "normal");
        doc.setTextColor("#0f172a");
        doc.text(group.label, boxX + boxWidth / 2, boxTop + 54, { align: "center" });
        doc.setFontSize(16);
        doc.setFont(undefined, "bold");
        doc.text(formatDecimal(group.total, 3), boxX + boxWidth / 2, boxTop + 78, { align: "center" });
        boxX += boxWidth + boxGap;
      });
      const rankingString = ranking.map((row) => row.id).join(" > ");
      if (rankingString) {
        doc.setFontSize(10);
        doc.setFont(undefined, "bold");
        doc.setTextColor("#475569");
        doc.text(rankingString, tableLeft + 12, sectionTop + sectionHeight - 12);
      }
      currentY = sectionTop + sectionHeight + 18;
    };

    const drawPodioTechniques = (doc, group, iconMap) => {
      if (!group) return;
      const sectionWidth = doc.internal.pageSize.getWidth() - padding * 2;
      const estimatedHeight = 60 + (group.techniques?.length || 0) * 90;
      ensureSpace(estimatedHeight + 12);
      const sectionTop = currentY;
      doc.setFontSize(16);
      doc.setFont(undefined, "bold");
      doc.setTextColor("#0f172a");
      doc.text(`Técnicas MAR recomendadas para ${group.name}`, tableLeft, sectionTop);
      doc.setFontSize(11);
      doc.setFont(undefined, "normal");
      doc.setTextColor("#475569");
      doc.text(group.short, tableLeft, sectionTop + 16, { maxWidth: sectionWidth });
      let y = sectionTop + 34;
      (group.techniques || []).forEach((tech) => {
        const iconSrc = iconMap.get(tech.id);
        const textX = iconSrc ? tableLeft + 12 + 58 + 12 : tableLeft + 12;
        const pdfTechTitle = `${tech.id} ${tech.name}`.replace(/\s*\n\s*/g, " ");
        const descLines = doc.splitTextToSize(tech.definition, sectionWidth - (textX - tableLeft) - 16);
        const cardHeight = Math.max(78, descLines.length * 12 + 32);
        ensureSpace(cardHeight + 10);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.4);
        doc.roundedRect(tableLeft, y, sectionWidth, cardHeight, 12, 12, "F");
        if (iconSrc) {
          doc.addImage(iconSrc, "PNG", tableLeft + 12, y + 10, 58, 58);
        }
        doc.setFontSize(13);
        doc.setFont(undefined, "bold");
        doc.setTextColor("#0f172a");
        doc.text(pdfTechTitle, textX, y + 24);
        doc.setFont(undefined, "normal");
        doc.setFontSize(11);
        doc.setTextColor("#475569");
        let lineY = y + 40;
        descLines.forEach((line) => {
          doc.text(line, textX, lineY);
          lineY += 12;
        });
        y += cardHeight + 10;
      });
      currentY = y + 10;
    };

      renderPriorityChartImage();
      ensureSpace(14);
      currentY += 12;
      drawWLCTable(doc, activeCase?.phase2?.wlcResults);
      drawPodioSection(doc, wlcRankingRows);
      drawPodioTechniques(doc, topPodiumGroup, techniqueIconCache);
    };
    ensureSpace(24);
    startTableHeader();
    const shouldIncludeVariable = (id, criterion) => {
      return criterion.groups.some((row) => Number(row.scoresByVar[id]) > 0);
    };
    criterionSummaries.forEach((criterion) => {
      const filteredVarIds = criterion.varIds.filter((id) => shouldIncludeVariable(id, criterion));
      if (!filteredVarIds.length) return;
      const needsLandscape = isScenario3 || filteredVarIds.length > 5;
      const orientationChanged = ensureTablePage(needsLandscape ? "landscape" : "portrait");
      if (orientationChanged) {
        startTableHeader();
      }
      const tableWidth = tablePageWidth - padding * 2;
      const cellPadding = 2;
      const scoreHeaders = filteredVarIds.map((id) => `Score(${id})G`);
      doc.setFont(undefined, "bold");
      doc.setFontSize(10);
      const groupColWidth = Math.max(doc.getTextWidth("Grupo"), 40) + cellPadding * 2;
      const scLabel = "Sc1G";
      const scColWidth = Math.max(doc.getTextWidth(scLabel), 36) + cellPadding * 2;
      const scoreColWidths = scoreHeaders.map((label) => {
        const textWidth = Math.max(doc.getTextWidth(label), doc.getTextWidth("Score(VX)G"), 30);
        return textWidth + cellPadding * 2;
      });
      const totalScoreWidth = scoreColWidths.reduce((total, width) => total + width, 0);
      const minObsWidth = 140;
      let obsColWidth = Math.max(minObsWidth, tableWidth - groupColWidth - scColWidth - totalScoreWidth);
      const overflow = groupColWidth + scColWidth + totalScoreWidth + obsColWidth - tableWidth;
      if (overflow > 0) {
        obsColWidth = Math.max(minObsWidth, obsColWidth - overflow);
      }
      const obsInnerWidth = Math.max(obsColWidth - cellPadding * 2, 60);
      doc.setFont(undefined, "normal");
      const headerHeight = 26;
      if (ensureSpace(headerHeight + 8)) {
        startTableHeader();
      }
      doc.setDrawColor(148, 163, 184);
      doc.setFillColor(224, 235, 255);
      doc.roundedRect(tableLeft, currentY, tableWidth, headerHeight, 8, 8, "FD");
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.setTextColor("#1d4ed8");
      doc.text(criterion.label, tableLeft + 10, currentY + 17);
      currentY += headerHeight + 8;
      const headerRowHeight = 20;
      const renderColumnHeaderRow = () => {
        if (ensureSpace(headerRowHeight + 6)) {
          startTableHeader();
        }
        doc.setFontSize(10);
        doc.setFont(undefined, "bold");
        doc.setTextColor("#0f172a");
        doc.setFillColor(255, 255, 255);
        doc.rect(tableLeft, currentY - 2, tableWidth, headerRowHeight + 4, "F");
        let columnX = tableLeft;
        doc.text("Grupo", columnX + cellPadding, currentY + 12);
        columnX += groupColWidth;
        filteredVarIds.forEach((id, idx) => {
          doc.text(scoreHeaders[idx], columnX + cellPadding, currentY + 12);
          columnX += scoreColWidths[idx];
        });
        doc.text(scLabel, columnX + cellPadding, currentY + 12);
        columnX += scColWidth;
        doc.text("Observaciones", columnX + cellPadding, currentY + 12);
        currentY += headerRowHeight + 6;
      };
      renderColumnHeaderRow();
      criterion.groups.forEach((row, rowIndex) => {
        const rowHeight = 18;
        const obsLines = doc.splitTextToSize(row.observation || "", obsInnerWidth);
        const obsHeight = obsLines.length * 9;
        const dynamicRowHeight = Math.max(18, obsHeight + 8);
        if (ensureSpace(dynamicRowHeight + 6)) {
          startTableHeader();
          renderColumnHeaderRow();
        }
        doc.setFontSize(12);
        doc.setFont(undefined, "normal");
        const isEven = rowIndex % 2 === 0;
        doc.setFillColor(isEven ? 255 : 236, 244, 255);
        doc.rect(tableLeft, currentY - 2, tableWidth, dynamicRowHeight + 4, "F");
        let colX = tableLeft;
        doc.setTextColor("#0f172a");
        doc.text(row.id, colX + cellPadding, currentY + 12);
        colX += groupColWidth;
        filteredVarIds.forEach((id, idx) => {
          doc.text(`${formatScore(row.scoresByVar[id])}`, colX + cellPadding, currentY + 12);
          colX += scoreColWidths[idx];
        });
        doc.setFont(undefined, "bold");
        doc.text(`${formatScore(row.sc)}`, colX + cellPadding, currentY + 12);
        doc.setFont(undefined, "normal");
        colX += scColWidth;
        let obsTextY = currentY + 6;
        obsLines.forEach((line) => {
          doc.text(line, colX + cellPadding, obsTextY);
          obsTextY += 9;
        });
        currentY += dynamicRowHeight + 6;
      });
      currentY += 12;
    });

    drawAHPMatrix(doc, activeCase?.phase2?.ahpResults);

    doc.save(`Ficha-MAR-${caseInfo[1]?.value || "caso"}.pdf`);
  }, [
    activeRouteItem,
    caseInfo,
    criterionSummaries,
    description,
    formatScore,
    insumosSection,
    ready,
    scenarioId,
    statusLabel,
    title,
    completedScenario2,
  ]);
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    window.sigmmaExportRouteA = handleExport;
    return () => {
      if (window.sigmmaExportRouteA === handleExport) {
        delete window.sigmmaExportRouteA;
      }
    };
  }, [handleExport]);

  return (
    <section
      style={{
        width: "100%",
        padding: 26,
        background: "#eef2f7",
        borderRadius: 24,
        border: "1px solid rgba(37, 99, 235, 0.2)",
        display: "flex",
        flexDirection: "column",
        gap: 20,
        boxShadow: "0 45px 80px rgba(15, 23, 42, 0.08)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 8,
        }}
      >
        <div
          style={{
            width: 140,
            height: 72,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            padding: "8px 0",
            borderRadius: 16,
            background: "#ffffff",
            color: "#0f172a",
            border: "1px solid rgba(226, 232, 240, 0.9)",
            boxShadow: "0 6px 18px rgba(15, 23, 42, 0.08)",
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textAlign: "center" }}>SIGMMA-MAR</span>
          <img
            src="/images/hero-mountains.png"
            alt="Marca SIGMMA-MAR"
            style={{ width: 56, height: "auto", display: "block" }}
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 14,
          justifyContent: "space-between",
        }}
      >
        {caseInfo.map((item) => (
          <div
            key={item.label}
            style={{
              flex: "1 1 220px",
              minWidth: 210,
              borderRadius: 16,
              background: "#ffffff",
              border: "1px solid rgba(148, 163, 184, 0.35)",
              padding: "16px 20px",
              boxShadow: "0 10px 28px rgba(15,23,42,0.08)",
            }}
          >
            <div style={{ fontSize: 16, color: "#0f172a", marginBottom: 6, fontWeight: 800 }}>{item.label}</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: "#4b5563" }}>{item.value}</div>
          </div>
        ))}
      </div>
      <div
        style={{
          background: "#eef4ff",
          borderRadius: 24,
          border: "2px solid #1d4ed8",
          padding: 26,
          display: "flex",
          flexDirection: "column",
          gap: 18,
          boxShadow: "0 25px 55px rgba(37, 99, 235, 0.25)",
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 700, color: "#0a1b43" }}>Escenario de información</div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1d4ed8" }}>
              {SCENARIO_TITLES[scenarioId] || "Ruta metodológica en construcción"}
            </div>
            <div style={{ fontSize: 14, color: "#1f2937", maxWidth: 520 }}>
              {SCENARIO_BLURBS[scenarioId] ||
                "Esquema heredado de la Fase 2, integra las variables necesarias para consolidar la información definitiva del estudio."}
            </div>
          </div>
          <div
            style={{
              borderRadius: 14,
              padding: "10px 18px",
              background: "#1d4ed8",
              color: "#fff",
              fontWeight: 800,
              fontSize: 14,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>Variables diligenciadas</span>
            <strong>
              {completedScenario2}/{SCENARIO2_REQUIRED_IDS.length}
            </strong>
          </div>
        </div>
      </div>
      <div
        style={{
          background: "#ffffff",
          borderRadius: 20,
          border: "1px solid rgba(15, 23, 42, 0.08)",
          padding: "24px 22px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>{insumosSection.title}</div>
        <div style={{ fontSize: 14, color: "#475569" }}>{insumosSection.description}</div>
        {insumosSection.tables.length ? (
          <div
            style={{
              borderRadius: 16,
              background: "#f8fafc",
              border: "1px solid rgba(148, 163, 184, 0.35)",
              padding: "12px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {insumosSection.tables.map((table) => (
              <div key={table.title}>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#1d4ed8",
                    marginBottom: 14,
                  }}
                >
                  {table.title}
                </div>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    borderSpacing: 0,
                    minWidth: 480,
                    border: "1px solid rgba(148, 163, 184, 0.35)",
                  }}
                >
                  <tbody>
                    {table.entries.map((entry) => (
                      <tr
                        key={entry.id}
                        style={{
                          borderBottom: "1px solid rgba(148, 163, 184, 0.35)",
                          paddingTop: 4,
                        }}
                      >
                        <td
                          style={{
                            width: "60%",
                            padding: "8px 12px",
                            borderBottom: "1px solid rgba(148, 163, 184, 0.35)",
                            borderRight: "1px solid rgba(148, 163, 184, 0.35)",
                          }}
                        >
                          <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{entry.label}</div>
                        </td>
                        <td
                          style={{
                            padding: "8px 12px",
                            borderBottom: "1px solid rgba(148, 163, 184, 0.35)",
                          }}
                        >
                          <div style={{ fontSize: 16, fontWeight: 600, color: "#0f172a" }}>{entry.value}</div>
                        </td>
                  </tr>
                ))}
              </tbody>
                </table>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              borderRadius: 16,
              border: "1px dashed rgba(148, 163, 184, 0.45)",
              padding: "18px 20px",
              fontSize: 13,
              color: "#64748b",
            }}
          >
            Completa los insumos para que esta tabla refleje el nivel mínimo requerido en cada escenario.
          </div>
        )}
      </div>

      <div
        style={{
          background: "#0f172a",
          borderRadius: 20,
          padding: "22px 24px",
          border: "1px solid rgba(15, 23, 42, 0.2)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: "#f8fafc" }}>Ruta ejecutada</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#ffffff" }}>Ruta A</div>
        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: "none",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {ROUTE_A_ITEMS.map((item) => {
            const isActive = activeRouteItem === item;
            return (
              <li key={item}>
                <button
                  type="button"
                  onClick={() => setActiveRouteItem(item)}
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    textAlign: "left",
                    fontSize: 14,
                    fontWeight: isActive ? 700 : 600,
                    color: isActive ? "#ffffff" : "#cbd5f5",
                    padding: "6px 0",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
                    cursor: "pointer",
                  }}
                >
                  {item}
                </button>
              </li>
            );
          })}
        </ul>


        <div style={{ marginTop: 18 }}>
          {showPuntaje ? (
            <div
              style={{
                background: "#ffffff",
                borderRadius: 20,
                border: "1px solid rgba(37, 99, 235, 0.45)",
                padding: "24px 22px",
                display: "flex",
                flexDirection: "column",
                gap: 0,
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", padding: "16px 0" }}>Puntaje por criterio</div>
              {criterionSummaries.map((criterion) => {
                const isExpanded = expandedCriteria.has(criterion.id);
                return (
                  <div
                    key={criterion.id}
                    style={{
                      borderRadius: 16,
                      border: "1px solid rgba(148, 163, 184, 0.35)",
                      background: "#f8fafc",
                      overflow: "hidden",
                      marginBottom: 12,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedCriteria((prev) => {
                          const next = new Set(prev);
                          if (next.has(criterion.id)) next.delete(criterion.id);
                          else next.add(criterion.id);
                          return next;
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        background: isExpanded ? "#e0e7ff" : "#dbeafe",
                        border: "none",
                        borderBottom: "1px solid rgba(148, 163, 184, 0.35)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#1d4ed8",
                        cursor: "pointer",
                      }}
                    >
                      <span>{criterion.label}</span>
                      <span>{isExpanded ? "▲" : "▼"}</span>
                    </button>
                    {isExpanded && (
                      <div style={{ padding: "16px" }}>
                        {criterion.varIds.length ? (
                          <div style={{ overflowX: "auto" }}>
                            <table
                              style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                fontSize: 16,
                                minWidth: 900,
                              }}
                            >
                              <thead>
                                <tr>
                                  <th
                                    style={{
                                      textAlign: "left",
                                      padding: "10px 14px",
                                      borderBottom: "1px solid rgba(148, 163, 184, 0.35)",
                                      fontSize: 16,
                                    }}
                                  >
                                    Grupo
                                  </th>
                                  {criterion.varIds.map((id) => (
                                    <th
                                      key={`header-${criterion.id}-${id}`}
                                      style={{
                                        textAlign: "center",
                                        padding: "10px 14px",
                                        borderBottom: "1px solid rgba(148, 163, 184, 0.35)",
                                        fontSize: 16,
                                      }}
                                    >
                                      <span>
                                        Score({id})<sup>G</sup>
                                      </span>
                                    </th>
                                  ))}
                                  <th
                                    style={{
                                      textAlign: "center",
                                      padding: "10px 14px",
                                      borderBottom: "1px solid rgba(148, 163, 184, 0.35)",
                                      fontSize: 16,
                                    }}
                                  >
                                    Sc1G
                                  </th>
                                  <th
                                    style={{
                                      textAlign: "left",
                                      padding: "8px 12px",
                                      borderBottom: "1px solid rgba(148, 163, 184, 0.35)",
                                    }}
                                  >
                                    Observaciones
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {criterion.groups.map((row, rowIndex) => (
                                  <tr
                                    key={`${criterion.id}-${row.id}`}
                                    style={{ background: rowIndex % 2 === 0 ? "#ffffff" : "#edf2ff" }}
                                  >
                                    <td
                                    style={{
                                      padding: "12px 14px",
                                      borderBottom: "1px solid rgba(148, 163, 184, 0.35)",
                                      fontWeight: 700,
                                      fontSize: 16,
                                    }}
                                  >
                                    {row.id}
                                  </td>
                                    {criterion.varIds.map((id) => (
                                      <td
                                        key={`${criterion.id}-${row.id}-${id}`}
                                      style={{
                                        padding: "12px 14px",
                                        borderBottom: "1px solid rgba(148, 163, 184, 0.35)",
                                        textAlign: "center",
                                        fontSize: 16,
                                      }}
                                    >
                                      {formatScore(row.scoresByVar[id])}
                                      </td>
                                    ))}
                                    <td
                                    style={{
                                      padding: "12px 14px",
                                      borderBottom: "1px solid rgba(148, 163, 184, 0.35)",
                                      textAlign: "center",
                                      fontWeight: 700,
                                      fontSize: 16,
                                    }}
                                  >
                                    {formatScore(row.sc)}
                                    </td>
                                    <td
                                    style={{
                                      padding: "12px 14px",
                                      borderBottom: "1px solid rgba(148, 163, 184, 0.35)",
                                      fontSize: 16,
                                    }}
                                  >
                                    {row.observation}
                                  </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div
                            style={{
                              borderRadius: 12,
                              border: "1px dashed rgba(148, 163, 184, 0.45)",
                              padding: "12px 14px",
                              fontSize: 13,
                              color: "#64748b",
                            }}
                          >
                            A?n no hay variables configuradas para este criterio.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : showAHPMatrix ? (
            <div
              style={{
                background: "#0f172a",
                borderRadius: 20,
                border: "1px solid rgba(15, 23, 42, 0.2)",
                padding: "24px 22px",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {ahpMatrixIds.length ? (
                <>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#f8fafc" }}>Matriz de pesos AHP</div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ minWidth: 160, fontSize: 13, color: "#dbeafe" }}>
                      λmax: {Number.isFinite(ahpResults.lambdaMax) ? ahpResults.lambdaMax.toFixed(3) : "-"}
                    </div>
                    <div style={{ minWidth: 160, fontSize: 13, color: "#dbeafe" }}>
                      CI: {Number.isFinite(ahpResults.ci) ? ahpResults.ci.toFixed(3) : "-"}
                    </div>
                    <div style={{ minWidth: 160, fontSize: 13, color: "#dbeafe" }}>
                      CR: {Number.isFinite(ahpResults.cr) ? formatPercent(ahpResults.cr) : "-"}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gap: 16,
                    }}
                  >
                    <div
                      style={{
                        border: "1px solid rgba(248, 250, 255, 0.6)",
                        borderRadius: 14,
                        padding: "12px",
                        background: "#ffffff",
                        color: "#0f172a",
                        overflowX: "auto",
                      }}
                    >
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          fontSize: 12,
                          minWidth: 480,
                        }}
                      >
                        <thead>
                          <tr>
                            <th style={{ padding: "8px 10px", borderBottom: "1px solid rgba(148, 163, 184, 0.45)" }}>
                              Criterio
                            </th>
                            {ahpMatrixIds.map((id) => (
                              <th
                                key={`matrix-header-${id}`}
                                style={{
                                  padding: "8px 10px",
                                  borderBottom: "1px solid rgba(148, 163, 184, 0.45)",
                                  textAlign: "center",
                                }}
                              >
                                {id}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {ahpMatrixValues.map((row, rowIndex) => (
                            <tr key={`matrix-row-${rowIndex}`}>
                              <td
                                style={{
                                  padding: "6px 10px",
                                  borderBottom: "1px solid rgba(148, 163, 184, 0.35)",
                                  fontWeight: 700,
                                }}
                              >
                                {ahpMatrixIds[rowIndex]}
                              </td>
                          {ahpMatrixIds.map((colId, colIndex) => {
                            const isDiagonal = rowIndex === colIndex;
                            return (
                              <td
                                key={`matrix-cell-${rowIndex}-${colIndex}`}
                                style={{
                                  padding: "6px 10px",
                                  borderBottom: "1px solid rgba(148, 163, 184, 0.35)",
                                  textAlign: "center",
                                  background: isDiagonal ? "#f3f4f6" : "transparent",
                                }}
                              >
                                {Number.isFinite(row?.[colIndex]) ? Number(row[colIndex]).toFixed(2) : "-"}
                              </td>
                            );
                          })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div
                      style={{
                        border: "1px solid rgba(248, 250, 255, 0.6)",
                        borderRadius: 14,
                        padding: "12px",
                        background: "#ffffff",
                        color: "#0f172a",
                        overflowX: "auto",
                      }}
                    >
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          fontSize: 14,
                          minWidth: 360,
                        }}
                      >
                        <thead>
                          <tr>
                            {["Criterio", "Peso (%)", "Peso (w_i)", "Jerarquía"].map((label) => (
                              <th
                                key={`weight-header-${label}`}
                                style={{
                                  padding: "8px 10px",
                                  borderBottom: "1px solid rgba(148, 163, 184, 0.45)",
                                  textAlign: "left",
                                }}
                              >
                                {label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {ahpWeightRows.map((row, idx) => (
                            <tr
                              key={`weight-row-${row.id}`}
                              style={{ background: idx % 2 === 0 ? "#f8fafc" : "#ffffff" }}
                            >
                              <td style={{ padding: "6px 10px", borderBottom: "1px solid rgba(148, 163, 184, 0.35)", fontSize: 13 }}>
                                {row.id} - {row.label}
                              </td>
                              <td style={{ padding: "6px 10px", borderBottom: "1px solid rgba(148, 163, 184, 0.35)", fontSize: 13 }}>
                                {formatPercent(row.weight)}
                              </td>
                              <td style={{ padding: "6px 10px", borderBottom: "1px solid rgba(148, 163, 184, 0.35)", fontSize: 13 }}>
                                {Number.isFinite(row.weight) ? row.weight.toFixed(3) : "-"}
                              </td>
                              <td style={{ padding: "6px 10px", borderBottom: "1px solid rgba(148, 163, 184, 0.35)", fontSize: 13 }}>
                                {row.rank}
                              </td>
                            </tr>
                  ))}
                </tbody>
              </table>
            </div>
                    <div
                      style={{
                        borderRadius: 14,
                        padding: "12px",
                        background: "#e0f2ff",
                        color: "#0b1e40",
                        fontSize: 13,
                        lineHeight: 1.6,
                      }}
                    >
                      Los pesos presentados aquí se usan directamente en la siguiente fase WLC para ponderar cada criterio y priorizar la ruta definitiva.
                    </div>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    borderRadius: 12,
                    border: "1px dashed rgba(248, 250, 255, 0.6)",
                    padding: "18px 20px",
                    fontSize: 13,
                    color: "#f8fafc",
                  }}
                >
                  Aún no se han generado los pesos AHP de la Fase 2; completa esa ruta para verlos aquí.
                </div>
              )}
            </div>
          ) : showWLC ? (
            <div
              style={{
                background: "#0f172a",
                borderRadius: 20,
                border: "1px solid rgba(15, 23, 42, 0.2)",
                padding: "24px 22px",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 700, color: "#f8fafc" }}>
                Combinación Lineal Ponderada (WLC)
              </div>
              {renderWLCContent()}
            </div>
          ) : showPodio ? (
            <div
              style={{
                background: "#0f172a",
                borderRadius: 20,
                border: "1px solid rgba(15, 23, 42, 0.2)",
                padding: "24px 22px",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 700, color: "#f8fafc" }}>Podio idoneidad MAR</div>
              {renderPodioSection()}
              {renderPodioTechniques()}
            </div>
          ) : (
            <div
              style={{
                background: "#f1f5f9",
                borderRadius: 18,
                border: "1px solid rgba(148, 163, 184, 0.4)",
                padding: "18px 20px",
                fontSize: 14,
                color: "#475569",
              }}
            >
              Selecciona "Puntaje por criterios" en la Ruta A para ver los cuadros de diagnóstico.
            </div>
          )}
        </div>
      </div>
      <div
        style={{
          ...BASE_CARD_STYLE,
          borderRadius: 22,
          padding: 32,
          border: "1px solid rgba(15, 23, 42, 0.08)",
          background: "#ffffff",
          display: "flex",
          flexWrap: "wrap",
          gap: 28,
        }}
      >
        <div style={{ flex: "1 1 320px", minWidth: 260, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a" }}>{title}</div>
          <div style={{ fontSize: 15, color: ready ? "#0f172a" : "#b91c1c", fontWeight: 700 }}>{statusLabel}</div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 320px" }}>
              <p style={{ fontSize: 17, color: "#475569", lineHeight: 1.8, margin: 0 }}>{description}</p>
              <div style={{ fontSize: 14, color: "#64748b", marginTop: 10 }}>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                void handleExport();
              }}
              style={{
                padding: "12px 20px",
                borderRadius: 14,
                border: "none",
                background: "#0f172a",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Exportar ficha
            </button>
          </div>
        </div>
        <div
          style={{
            flex: "0 0 320px",
            minWidth: 260,
            borderRadius: 16,
            overflow: "hidden",
            background: "#e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <img
            src="/images/Recarga_ejemplo.png"
            alt="Visualización en construcción"
            style={{ width: "100%", height: "auto", objectFit: "cover", borderRadius: 12 }}
          />
        </div>
      </div>
    </section>
  );
}
