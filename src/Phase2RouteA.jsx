// /src/Phase2RouteA.jsx
import React from "react";
import { CATALOG, computeRouteAScores, MIN_REQUIRED, validateMinimumScenario } from "./catalog/catalog.js";
import { RouteBStagesFigure } from "./RouteBStagesFigure.jsx";
import { TECH_GROUPS } from "./marTechniques";
import { useCasesStore } from "./store/useCasesStore.js";
import { SCENARIO_INFO } from "./phase2Scenarios.js";

// Mapeo: módulos del cat&aacute;logo -> m&oacute;dulos legacy de tu Fase 1
const LEGACY_MODULE_MAP = {
  geologico: "geologico",
  hidraulico: "hidraulico",
  hidrologico: "hidrologico",
  hidrogeoquimico: "hidrogeoquimico",
  caracterizacion: "caracterizacion",
  fuente: "fuente",
  volumen: "volumen",
  infraestructura: "infraestructura",
  comunidad: "comunidad",
  relieve: "relieve",
  "mod-geologico": "geologico",
  "mod-hidraulico": "hidraulico",
  "mod-hidrologico": "hidrologico",
  "mod-hidrogeoquimico": "hidrogeoquimico",
  "mod-caracterizacion": "caracterizacion",
  "mod-fuente": "fuente",
  "mod-volumen": "volumen",
  "mod-infraestructura": "infraestructura",
  "mod-comunidad": "comunidad",
  "mod-relieve": "relieve",
};

const DEFAULT_WEIGHTS = Object.freeze({
  C1: 10,
  C2: 35,
  C3: 20,
  C4: 20,
  C5: 15,
});

const CRITERIA_TABLE = Object.freeze([
  {
    id: "C1",
    label: "Objetivo",
    description: "Propósito y claridad del objetivo MAR.",
    variables: "V1",
  },
  {
    id: "C2",
    label: "Condiciones hidrogeológicas",
    description: "Modelos, propiedades del acuífero y contexto físico.",
    variables: "V2, V3, V4, V5, V6, V7, V8, V9, V10, V11, V12, V24, V25",
  },
  {
    id: "C3",
    label: "Fuente y calidad del agua",
    description: "Tipo de fuente, calidad y compatibilidad fuente-acuífero.",
    variables: "V13, V14, V15, V16, V36, V37, V17, V18",
  },
  {
    id: "C4",
    label: "Viabilidad técnica",
    description: "Capacidad, volumen e infraestructura asociada.",
    variables: "V19, V20, V21, V26, V28, V29, V32, V33",
  },
  {
    id: "C5",
    label: "Aspectos socioambientales",
    description: "Uso final, comunidad y beneficio directo.",
    variables: "V22, V23, V34, V35",
  },
]);

const WLC_GROUP_KEYS = ["G1", "G2", "G3"];

const VARIABLE_GUIDE = Object.freeze([
  {
    id: "V1",
    question: "¿Cuál es el objetivo por el que se quiere aplicar MAR?",
    options: [
      "Almacenamiento de excedentes o aumentar disponibilidad",
      "Mitigación de la sobreexplotación",
      "Control de intrusión salina",
      "Mejorar la calidad del agua",
    ],
    inputs: "NA",
  },
  {
    id: "V2",
    question: "¿Existe o realizaron caracterización del acuífero?",
    options: ["Sí", "No"],
    inputs: "Caracterización del acuífero",
  },
  {
    id: "V3",
    question: "¿Existe o realizaron un modelo geológico?",
    options: ["Sí", "No"],
    inputs: "Modelo geológico",
  },
  {
    id: "V4",
    question: "¿Existe o realizaron un modelo hidrológico?",
    options: ["Sí", "No"],
    inputs: "Modelo hidrológico",
  },
  {
    id: "V5",
    question: "¿Existe o realizaron un modelo numérico?",
    options: ["Sí", "No"],
    inputs: "Modelo hidráulico",
  },
  {
    id: "V6",
    question: "¿Existe o realizaron un modelo hidrogeoquímico?",
    options: ["Sí", "No"],
    inputs: "Modelo hidrogeoquímico",
  },
  {
    id: "V7",
    question: "¿Cuál es la escala que define el acuífero del estudio?",
    options: [
      "Muy pequeño (&le; 100 km&sup2;)",
      "Pequeño (100-500 km&sup2;)",
      "Mediano (500-5000 km&sup2;)",
      "Grande (500-50000 km&sup2;)",
    ],
    inputs: "Modelo geológico",
  },
  {
    id: "V8",
    question: "¿Cuál es el tipo de acuífero?",
    options: ["Libre", "Semiconfinado - Confinado"],
    inputs: "Modelo hidráulico",
  },
  {
    id: "V9",
    question: "¿Conoce la capacidad de infiltración de la zona no saturada?",
    options: ["Sí", "No"],
    inputs: "Volumen - capacidad",
  },
  {
    id: "V10",
    question: "¿La técnica viable incluye pozos?",
    options: ["Sí", "No"],
    inputs: "Infraestructura",
  },
  {
    id: "V11",
    question: "¿La permeabilidad (K) del acuífero es?",
    options: ["Muy alta (100<K)", "Alta (10<K<100)", "Media (1<K<10)", "Baja a muy baja (10^-2<K<1)"],
    inputs: "Modelo hidráulico - Caracterización del acuífero",
  },
  {
    id: "V12",
    question: "¿La porosidad del acuífero es?",
    options: ["Muy alta (>50%)", "Alta (30-50%)", "Regular (10-30%)", "Mala (0-10%)"],
    inputs: "Modelo hidráulico - Caracterización del acuífero",
  },
  {
    id: "V13",
    question: "¿Conoce la fuente de agua?",
    options: ["Sí", "No"],
    inputs: "Fuente de agua",
  },
  {
    id: "V14",
    question: "¿Cuál es la fuente de agua a recargar?",
    options: ["Superficial", "Escorrentía estacional", "Agua residual", "Subterránea u otra fuente"],
    inputs: "Fuente de agua",
  },
  {
    id: "V15",
    question: "¿Conoce la calidad del agua fuente?",
    options: ["Sí", "No"],
    inputs: "Fuente de agua",
  },
  {
    id: "V16",
    question: "¿La recarga con esta fuente está permitida por la normativa local?",
    options: ["Sí", "No"],
    inputs: "Fuente de agua",
  },
  {
    id: "V36",
    question: "Si la fuente es superficial, ¿cuál es el tipo?",
    options: ["Río permanente", "Río estacional", "Río efímero", "Lago/Embalse"],
    inputs: "Fuente de agua",
  },
  {
    id: "V37",
    question: "¿Existe conexión hidráulica (río ganador, perdedor o sin conexión)?",
    options: ["Río ganador", "Río perdedor", "Sin conexión"],
    inputs: "Fuente de agua",
  },

  {
    id: "V17",
    question: "¿Conoce la calidad del agua del acuífero? ¿Es vulnerable a la contaminación?",
    options: ["Sí", "No"],
    inputs: "NA",
  },
  {
    id: "V18",
    question: "¿La mezcla fuente-acuífero cumple los límites de calidad aplicables?",
    options: ["Sí", "No"],
    inputs: "NA",
  },
  {
    id: "V19",
    question: "¿Conoce la capacidad de almacenamiento del acuífero?",
    options: ["Sí", "No"],
    inputs: "Volumen - Capacidad",
  },
  {
    id: "V20",
    question: "¿Conoce el volumen de agua a recargar?",
    options: ["Sí", "No"],
    inputs: "Volumen - Capacidad",
  },
  {
    id: "V21",
    question: "¿El volumen de agua a recargar es < que la capacidad de almacenamiento del acuífero?",
    options: ["Sí", "No"],
    inputs: "Volumen - Capacidad",
  },
  {
    id: "V22",
    question: "¿Conoce el uso final del agua?",
    options: ["Sí", "No"],
    inputs: "Comunidad - Uso final",
  },
  {
    id: "V23",
    question: "¿Cuál es el uso final?",
    options: ["Doméstico", "Industrial", "Ambiental", "Agrícola"],
    inputs: "Comunidad - Uso final",
  },
  {
    id: "V24",
    question: "¿Cuál es el relieve que domina la zona de estudio?",
    options: ["Llanura", "Valle", "Colina o meseta", "Montaña"],
    inputs: "Relieve - clima",
  },
  {
    id: "V25",
    question: "¿Cuál es el clima que predomina en su zona de estudio?",
    options: ["Árido o semiárido (seco)", "Cálido (seco)", "Húmedo-semihúmedo (Templado)", "Tropical"],
    inputs: "Relieve - clima",
  },
  {
    id: "V26",
    question: "¿En la zona de estudio existe infraestructura que pueda utilizarse para MAR?",
    options: ["Sí", "No"],
    inputs: "Infraestructura",
  },
  {
    id: "V28",
    question: "¿Existe planta de tratamiento en la zona de estudio?",
    options: ["Sí", "No"],
    inputs: "NA",
  },
  {
    id: "V29",
    question: "¿Existen estanques en la zona de estudio?",
    options: ["Sí", "No"],
    inputs: "NA",
  },
  {
    id: "V32",
    question: "¿Hay obras en cauce (presas) infraestructura de captación de ribera?",
    options: ["Sí", "No"],
    inputs: "NA",
  },
  {
    id: "V33",
    question: "¿Existen pozos operativos o rehabilitables?",
    options: ["Sí", "No"],
    inputs: "NA",
  },
  {
    id: "V34",
    question: "¿Hay una comunidad en el área de influencia?",
    options: ["Sí", "No"],
    inputs: "Comunidad - Uso final",
  },
  {
    id: "V35",
    question: "¿Se identificó un beneficio directo (potable/riego/inundación)?",
    options: ["Sí", "No"],
    inputs: "Comunidad - Uso final",
  },
]);

const STAGE3_STATUS_STYLES = Object.freeze({
  Completo: { bg: "#dcfce7", color: "#166534" },
  Parcial: { bg: "#fef3c7", color: "#92400e" },
  Falta: { bg: "#fee2e2", color: "#b91c1c" },
});

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

const TECH_ICON_BY_NAME = {
  [normalizeToken("Estanques y cuencas de infiltracion")]: "/images/Estanque_infiltracion.png",
  [normalizeToken("Tratamiento suelo - acuifero")]: "/images/SAT.png",
  [normalizeToken("Tratamiento suelo-acuifero")]: "/images/SAT.png",
  [normalizeToken("Tratamiento suelo-acuifero (SAT)")]: "/images/SAT.png",
  [normalizeToken("Galerias de infiltracion")]: "/images/Galerias_infiltracion.png",
  [normalizeToken("Inundaciones controladas")]: "/images/Inundaciones_controladas.png",
  [normalizeToken("Exceso de riego")]: "/images/Exceso_de_irrigacion.png",
  [normalizeToken("Filtracion de dunas")]: "/images/Dunas_de_infiltracion.png",
  [normalizeToken("Captacion de agua lluvia")]: "/images/Lluvia.png",
};

function getTechniqueIcon(tech) {
  if (!tech) return null;
  if (tech.icon) return tech.icon;
  if (TECH_ICON_BY_ID[tech.id]) return TECH_ICON_BY_ID[tech.id];
  const nameKey = normalizeToken(tech.name);
  if (TECH_ICON_BY_NAME[nameKey]) return TECH_ICON_BY_NAME[nameKey];
  return null;
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

function readCaseValue(caseData, moduleId, key) {
  if (!caseData) return "";
  const moduleObj = caseData?.phase1?.modules?.[moduleId] || caseData?.[moduleId] || {};
  if (!moduleObj || typeof moduleObj !== "object") return "";
  if (key in moduleObj) return moduleObj[key];
  const aliases = CATALOG.aliases || {};
  for (const [oldKey, canon] of Object.entries(aliases)) {
    if (canon === key && oldKey in moduleObj) return moduleObj[oldKey];
  }
  const canon = aliases[key];
  if (canon && canon in moduleObj) return moduleObj[canon];
  return "";
}

function buildScenario1Overrides(caseData) {
  if (!caseData) return new Map();
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
  } else if (v15Token.includes("apta con") || v15Token.includes("pretratamiento") || v15Token.includes("con tratamiento")) {
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
    if (v36Token.includes("rio ganador") || (v36Token.includes("rio") && v36Token.includes("permanente"))) {
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
  }return overrides;
}


function buildScenario2Overrides(caseData, scoreById) {
  if (!caseData || !scoreById) return new Map();
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
      const keys = ["nombre_unidad_geologica", "descripcion_unidad_geologica", "profundidad_unidad_geologica_m", "escala_mapa_geologico"];
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
    const total = id === "V4" || id === "V5" ? inputs.length + (maps.length ? 1 : 0) : inputs.length + maps.length;
    const present = id === "V4" || id === "V5" ? inputsPresent + groupedMapsPresent : inputsPresent + mapsPresent;
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
    setOverride("V2", { G1: Math.min(4, v2EvidenceScore), G2: Math.min(4, v2EvidenceScore), G3: Math.min(4, v2EvidenceScore) });
  } else if (v2Token.includes("acuitardo")) {
    setOverride("V2", { G1: Math.min(1, v2EvidenceScore), G2: Math.min(3, v2EvidenceScore), G3: Math.min(2, v2EvidenceScore) });
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
    const combined = poroScore && permScore
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
    if (v36Token.includes("rio ganador") || (v36Token.includes("rio") && v36Token.includes("permanente"))) {
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
function adaptLegacyCaseToCaseData(legacyCase, activeCaseId) {
  const now = new Date().toISOString();
  const isEmptyValue = (v) => {
    if (v === null || v === undefined) return true;
    const s = String(v).trim();
    if (!s) return true;
    if (s === "No_reportado" || s === "No reportado") return true;
    return false;
  };
  const mergeEntries = (base, entries) => {
    const out = { ...(base || {}) };
    const list = Array.isArray(entries) ? entries : [];
    for (const entry of list) {
      if (!entry || typeof entry !== "object") continue;
      for (const [key, value] of Object.entries(entry)) {
        if (isEmptyValue(value)) continue;
        if (isEmptyValue(out[key])) out[key] = value;
      }
    }
    return out;
  };
  const out = {
    schemaVersion: CATALOG.schemaVersion,
    catalogVersion: CATALOG.catalogVersion,
    caseId: legacyCase?.id || activeCaseId || "",
    caseName: legacyCase?.nombre || "",
    createdAtISO: legacyCase?.createdAtISO || now,
    updatedAtISO: now,
    weights: {
      ...DEFAULT_WEIGHTS,
      ...(legacyCase?.weights || {}),
    },
    mapUploads: legacyCase?.mapUploads || {},
    mapMeta: legacyCase?.mapMeta || {},
    mapLayersByModule: legacyCase?.mapLayersByModule || {},
    caracterizacion: legacyCase?.caracterizacion || {},
    phase1: {
      modules: {},
      maps: {},
    },
  };

  for (const mod of CATALOG.modules) {
    const legacyKey = LEGACY_MODULE_MAP[mod.id] || mod.id;
    let moduleObj = {
      ...(legacyCase?.phase1?.modules?.[mod.id] || {}),
      ...(legacyCase?.[legacyKey] || {}),
    };
    moduleObj = mergeEntries(moduleObj, legacyCase?.[`${legacyKey}_entries`]);
    if (mod.id === "caracterizacion") {
      moduleObj = mergeEntries(moduleObj, legacyCase?.caracterizacion?.uhg_entries);
    }
    out.phase1.modules[mod.id] = moduleObj;
  }

  const aliases = CATALOG.aliases || {};
  for (const modId of Object.keys(out.phase1.modules)) {
    const m = out.phase1.modules[modId];
    if (!m || typeof m !== "object") continue;
    for (const oldKey of Object.keys(m)) {
      const canon = aliases[oldKey];
      if (canon && !(canon in m)) m[canon] = m[oldKey];
    }
  }

  const uploads = legacyCase?.mapUploads || {};
  const metaByLayer = legacyCase?.mapMeta || {};
  for (const mod of CATALOG.modules) {
    for (const layer of mod.maps || []) {
      const layerId = layer.layerId;
      const up = uploads[layerId] || null;
      const meta = metaByLayer[layerId] || {};
      const marks = meta.marks || {};
      const hasFile = !!up?.url && !!up?.name;

      out.phase1.maps[layerId] = {
        layerId,
        label: layer.label,
        fileName: hasFile ? up.name : null,
        mimeType: up?.type || null,
        dataUrl: hasFile ? up.url : null,
        uploadedAtISO: hasFile ? now : null,
        validation: {
          hasScale: !!String(meta.scaleText || "").trim() || !!marks.scale,
          hasNorth: !!marks.north,
          hasLegend: !!marks.legend,
          scaleText: String(meta.scaleText || ""),
        },
      };
    }
  }

  return out;
}

function scaleColor(score) {
  const v = Number(score) || 0;
  if (v <= 0) return "#fecaca";
  if (v === 1) return "#fed7aa";
  if (v === 2) return "#fef08a";
  if (v === 3) return "#bbf7d0";
  return "#86efac";
}

export default function Phase2RouteA({ activeRoute = "A", onSelectRoute, onGoPhase3 } = {}) {
  const { cases, setCases, activeCaseId } = useCasesStore();
  const routeARef = React.useRef(null);
  const routeBRef = React.useRef(null);
  const etapa1Ref = React.useRef(null);
  const etapa2Ref = React.useRef(null);
  const etapa5Ref = React.useRef(null);
  const resultadosRef = React.useRef(null);
  const guideRef = React.useRef(null);
  const [activeStage, setActiveStage] = React.useState(1);
  const [cardsHelpOpen, setCardsHelpOpen] = React.useState(false);
  const [headerHelpOpenId, setHeaderHelpOpenId] = React.useState(null);
  const [sigmaMaxParam, setSigmaMaxParam] = React.useState(1.0);
  const [alphaParam, setAlphaParam] = React.useState(1.0);
  const [sensitivityCriterion, setSensitivityCriterion] = React.useState("C2");
  const [sensitivityRange, setSensitivityRange] = React.useState(20);
  const [sensitivityStep, setSensitivityStep] = React.useState(1);
  const [sensitivityRangeInvalid, setSensitivityRangeInvalid] = React.useState(false);
  const [sensitivityStepInvalid, setSensitivityStepInvalid] = React.useState(false);
  const [invertHierarchyEnabled, setInvertHierarchyEnabled] = React.useState(false);
  const [routeBDialogOpen, setRouteBDialogOpen] = React.useState(false);
  const [visitedRoutes, setVisitedRoutes] = React.useState(() => new Set());
  const [resultsBlockedNotice, setResultsBlockedNotice] = React.useState("");

  const activeCase = React.useMemo(() => {
    if (!cases || !activeCaseId) return null;
    return cases[activeCaseId] || null;
  }, [cases, activeCaseId]);

  const patchActiveCase = React.useCallback(
    (patchFn) => {
      if (!activeCaseId) return;
      setCases((prev) => {
        const next = { ...(prev || {}) };
        const current = next[activeCaseId];
        if (!current) return prev;
        const patched = patchFn(current);
        next[activeCaseId] = { ...patched, updatedAtISO: new Date().toISOString() };
        return next;
      });
    },
    [activeCaseId, setCases]
  );

  React.useEffect(() => {
    patchActiveCase((c) => ({
      ...c,
      phase2: {
        ...(c.phase2 || {}),
        sensitivitySettings: {
          criterion: sensitivityCriterion,
          range: sensitivityRange,
          step: sensitivityStep,
        },
      },
    }));
  }, [patchActiveCase, sensitivityCriterion, sensitivityRange, sensitivityStep]);

  const caseData = React.useMemo(() => {
    if (!activeCase || activeCaseId === "nuevo") return null;
    return adaptLegacyCaseToCaseData(activeCase, activeCaseId);
  }, [activeCase, activeCaseId]);

  const routeAScores = React.useMemo(() => {
    if (!caseData) return null;
    return computeRouteAScores(caseData, activeCase?.weights || {});
  }, [caseData, activeCase?.weights]);
  const fuenteToken = React.useMemo(
    () => normalizeToken(readCaseValue(caseData, "fuente", "tipo_de_fuente")),
    [caseData]
  );
  const isSuperficialSource = fuenteToken.includes("superficial");

  React.useEffect(() => {
    setActiveStage(1);
  }, [activeCaseId]);

  const manualScores = activeCase?.phase2?.manualScores || {};
  const manualOverrides = activeCase?.phase2?.manualOverrides || {};
  const manualAdjustmentsEnabled = false;
  const manualOverrideAllowedIds = React.useMemo(() => new Set(["V1", "V17", "V18"]), []);
  const isManualAdjustEnabled = React.useCallback(
    (id) => manualAdjustmentsEnabled || manualOverrideAllowedIds.has(id),
    [manualAdjustmentsEnabled, manualOverrideAllowedIds]
  );
  const useDefaultWeights = activeCase?.phase2?.useDefaultWeights ?? true;
  const weightJustification = activeCase?.phase2?.weightJustification || "";
  const customInfluenceEnabled = activeCase?.phase2?.useCustomInfluence ?? false;
  const customInfluenceByVar = activeCase?.phase2?.customInfluenceByVar || {};
  const pairwiseSelections = activeCase?.phase2?.ahp?.pairs || {};
  const pairwiseRows = React.useMemo(() => {
    const rows = [];
    for (let i = 0; i < CRITERIA_TABLE.length; i += 1) {
      const a = CRITERIA_TABLE[i];
      const bs = CRITERIA_TABLE.slice(i + 1);
      bs.forEach((b, index) => {
        rows.push({
          a,
          b,
          showA: index === 0,
          rowSpan: bs.length,
        });
      });
    }
    return rows;
  }, []);
  const computeAHP = React.useCallback((matrix) => {
    const n = matrix.length;
    if (!n) return { weights: [], lambdaMax: null, ci: null, cr: null };
    let w = Array.from({ length: n }, () => 1 / n);
    for (let iter = 0; iter < 50; iter += 1) {
      const next = Array.from({ length: n }, () => 0);
      for (let i = 0; i < n; i += 1) {
        let sum = 0;
        for (let j = 0; j < n; j += 1) sum += matrix[i][j] * w[j];
        next[i] = sum;
      }
      const total = next.reduce((acc, v) => acc + v, 0);
      w = total > 0 ? next.map((v) => v / total) : w;
    }
    const Aw = Array.from({ length: n }, () => 0);
    for (let i = 0; i < n; i += 1) {
      let sum = 0;
      for (let j = 0; j < n; j += 1) sum += matrix[i][j] * w[j];
      Aw[i] = sum;
    }
    const ratios = Aw.map((v, i) => (w[i] ? v / w[i] : 0));
    const lambdaMax = ratios.reduce((acc, v) => acc + v, 0) / n;
    const ci = n > 1 ? (lambdaMax - n) / (n - 1) : 0;
    const riTable = { 1: 0, 2: 0, 3: 0.58, 4: 0.9, 5: 1.12, 6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49 };
    const ri = riTable[n] ?? 1.49;
    const cr = ri > 0 ? ci / ri : 0;
    return { weights: w, lambdaMax, ci, cr };
  }, []);

  const invertWeightMap = React.useCallback((weightMap) => {
    const entries = [...weightMap.entries()];
    if (!entries.length) return new Map();
    const valuesDesc = entries.map(([, value]) => Number(value)).sort((a, b) => b - a);
    const sortedAsc = [...entries].sort((a, b) => Number(a[1]) - Number(b[1]));
    const next = new Map();
    sortedAsc.forEach(([cid], idx) => {
      next.set(cid, Number.isFinite(valuesDesc[idx]) ? valuesDesc[idx] : 0);
    });
    return next;
  }, []);

  const pairwiseMatrix = React.useMemo(() => {
    const ids = CRITERIA_TABLE.map((c) => c.id);
    const indexById = new Map(ids.map((id, idx) => [id, idx]));
    const n = ids.length;
    const matrix = Array.from({ length: n }, () => Array.from({ length: n }, () => 1));
    for (let i = 0; i < n; i += 1) matrix[i][i] = 1;
    for (let i = 0; i < n; i += 1) {
      for (let j = i + 1; j < n; j += 1) {
        const a = ids[i];
        const b = ids[j];
        const key = `${a}-${b}`;
        const choice = pairwiseSelections[key] || { more: a, scale: 1 };
        const scale = Number(choice.scale) || 1;
        const normalizedMore = choice.more === "A" ? a : choice.more === "B" ? b : choice.more;
        const winner = normalizedMore === b ? b : a;
        const aOverB = winner === a ? scale : 1 / scale;
        const bOverA = 1 / aOverB;
        matrix[i][j] = aOverB;
        matrix[j][i] = bOverA;
      }
    }
    return { matrix, ids, indexById };
  }, [pairwiseSelections]);
  const pairwiseAHP = React.useMemo(() => computeAHP(pairwiseMatrix.matrix), [pairwiseMatrix, computeAHP]);
  const pairwiseCR = Number.isFinite(pairwiseAHP.cr) ? pairwiseAHP.cr : null;
  const isPairwiseCRHigh = Number.isFinite(pairwiseCR) && pairwiseCR > 0.1;
  const pairwiseWeightRows = React.useMemo(() => {
    const weights = pairwiseAHP.weights || [];
    const rows = CRITERIA_TABLE.map((criterion, idx) => ({
      ...criterion,
      weight: Number.isFinite(weights[idx]) ? weights[idx] : 0,
    }));
    const sorted = [...rows].sort((a, b) => b.weight - a.weight);
    const rankById = new Map(sorted.map((row, idx) => [row.id, idx + 1]));
    return rows.map((row) => ({ ...row, rank: rankById.get(row.id) || "-" }));
  }, [pairwiseAHP.weights]);
  const pairwiseWeightRowsByRank = React.useMemo(() => {
    return [...pairwiseWeightRows].sort((a, b) => (a.rank || 0) - (b.rank || 0));
  }, [pairwiseWeightRows]);
  const baseWeightById = React.useMemo(
    () => new Map(pairwiseWeightRows.map((row) => [row.id, row.weight])),
    [pairwiseWeightRows]
  );
  const invertedWeightById = React.useMemo(() => {
    if (!invertHierarchyEnabled) return null;
    return invertWeightMap(baseWeightById);
  }, [invertHierarchyEnabled, baseWeightById, invertWeightMap]);
  const invertedPairwiseMatrix = React.useMemo(() => {
    if (!invertHierarchyEnabled || !invertedWeightById) return null;
    const ids = pairwiseMatrix.ids;
    const matrix = ids.map((idA) =>
      ids.map((idB) => {
        const wa = Number(invertedWeightById.get(idA) || 0);
        const wb = Number(invertedWeightById.get(idB) || 0);
        if (!Number.isFinite(wa) || !Number.isFinite(wb) || wb === 0) {
          return wa || 1;
        }
        return wa / wb;
      })
    );
    return { ids, matrix };
  }, [invertHierarchyEnabled, invertedWeightById, pairwiseMatrix.ids]);
  const invertedPairwiseAHP = React.useMemo(
    () => (invertedPairwiseMatrix ? computeAHP(invertedPairwiseMatrix.matrix) : null),
    [invertedPairwiseMatrix, computeAHP]
  );
  const invertedRankingText = React.useMemo(() => {
    if (!invertedWeightById) return "";
    const entries = [...invertedWeightById.entries()].sort(([, a], [, b]) => Number(b) - Number(a));
    return entries.map(([id]) => id).join(" > ");
  }, [invertedWeightById]);
  const pairwiseWeights = React.useMemo(() => {
    if (!pairwiseAHP.weights?.length) return [];
    const items = CRITERIA_TABLE.map((c, idx) => ({
      id: c.id,
      label: c.label,
      weight: Number(pairwiseAHP.weights[idx] || 0),
    }));
    const sorted = [...items].sort((a, b) => b.weight - a.weight);
    const rankMap = new Map(sorted.map((item, idx) => [item.id, idx + 1]));
    return items.map((item) => ({ ...item, rank: rankMap.get(item.id) || 0 }));
  }, [pairwiseAHP.weights]);
  const weightMapForRouteAScores = React.useMemo(() => {
    const manualWeightRows = CRITERIA_TABLE.map((c) => ({
      id: c.id,
      weight: Number(activeCase?.weights?.[c.id] || 0),
    }));
    const manualSum = manualWeightRows.reduce((acc, row) => acc + row.weight, 0);
    const useManualWeights = manualSum > 0;
    return new Map(
      (useManualWeights
        ? manualWeightRows.map((row) => [row.id, manualSum ? row.weight / manualSum : 0])
        : pairwiseWeightRows.map((row) => [row.id, row.weight]))
    );
  }, [activeCase?.weights, pairwiseWeightRows]);
  const routeAScoreWeightMap = React.useMemo(
    () =>
      invertHierarchyEnabled ? invertWeightMap(weightMapForRouteAScores) : weightMapForRouteAScores,
    [invertHierarchyEnabled, invertWeightMap, weightMapForRouteAScores]
  );
  const routeAScoreWeightsObject = React.useMemo(() => {
    const obj = {};
    for (const [id, weight] of routeAScoreWeightMap.entries()) {
      obj[id] = Number(weight) || 0;
    }
    return obj;
  }, [routeAScoreWeightMap]);
  const invertedRouteAScores = React.useMemo(
    () => computeRouteAScores(caseData, routeAScoreWeightsObject),
    [caseData, routeAScoreWeightsObject]
  );
  const effectiveRouteAScores = invertHierarchyEnabled ? invertedRouteAScores : routeAScores;
  const sensitivityWeightById = React.useMemo(
    () => new Map(routeAScoreWeightMap),
    [routeAScoreWeightMap]
  );
  const canRender = !!(activeCase && activeCaseId !== "nuevo" && effectiveRouteAScores);
  const pairwiseComparisonsCount = React.useMemo(() => {
    const n = CRITERIA_TABLE.length;
    return (n * (n - 1)) / 2;
  }, []);
  const pairwiseSuggestions = React.useMemo(() => {
    const { matrix, ids } = pairwiseMatrix;
    const w = pairwiseAHP.weights || [];
    if (!matrix.length || !w.length) return [];
    const scaleOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const suggestions = [];
    for (let i = 0; i < ids.length; i += 1) {
      for (let j = i + 1; j < ids.length; j += 1) {
        const ratio = w[j] === 0 ? 0 : w[i] / w[j];
        if (!Number.isFinite(ratio) || ratio === 0) continue;
        const suggestedMore = ratio >= 1 ? "A" : "B";
        const target = ratio >= 1 ? ratio : 1 / ratio;
        let best = 1;
        let bestDiff = Infinity;
        for (const s of scaleOptions) {
          const diff = Math.abs(Math.log(target) - Math.log(s));
          if (diff < bestDiff) {
            bestDiff = diff;
            best = s;
          }
        }
        const current = matrix[i][j];
        const error = Math.abs(Math.log(current) - Math.log(ratio));
        suggestions.push({
          pair: `${ids[i]} vs ${ids[j]}`,
          suggestedMore,
          suggestedScale: best,
          error,
        });
      }
    }
    return suggestions.sort((a, b) => b.error - a.error).slice(0, 3);
  }, [pairwiseAHP.weights, pairwiseMatrix]);
  const onPairwiseChange = React.useCallback(
    (key, patch) => {
      patchActiveCase((c) => {
        const ahp = c.phase2?.ahp || {};
        const pairs = { ...(ahp.pairs || {}) };
        pairs[key] = { ...pairs[key], ...patch };
        return {
          ...c,
          phase2: {
            ...(c.phase2 || {}),
            ahp: { ...ahp, pairs },
          },
        };
      });
    },
    [patchActiveCase]
  );

  const renderHeaderWithHelp = React.useCallback(
    (id, label, helpText, style) => {
      const isOpen = headerHelpOpenId === id;
      return (
        <th style={{ ...style, position: "relative", paddingRight: 28 }}>
          <span>{label}</span>
          <button
            type="button"
            onClick={() => setHeaderHelpOpenId((prev) => (prev === id ? null : id))}
            aria-label={`Ayuda: ${typeof label === "string" ? label : "columna"}`}
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 16,
              height: 16,
              padding: 0,
              border: "none",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            <span
              style={{
                display: "block",
                width: 0,
                height: 0,
                borderLeft: "7px solid transparent",
                borderRight: "7px solid transparent",
                borderTop: "9px solid #0f172a",
              }}
            />
          </button>
          {isOpen ? (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: 6,
                background: "#ffffff",
                border: "1px solid rgba(0,0,0,.2)",
                borderRadius: 8,
                padding: "8px 10px",
                fontSize: 12,
                maxWidth: 260,
                lineHeight: 1.4,
                whiteSpace: "normal",
                wordBreak: "break-word",
                boxShadow: "0 4px 12px rgba(0,0,0,.12)",
                zIndex: 5,
              }}
            >
              {helpText}
            </div>
          ) : null}
        </th>
      );
    },
    [headerHelpOpenId]
  );

  const baseScoreById = React.useMemo(() => {
    const map = new Map();
    for (const v of effectiveRouteAScores?.variables || []) map.set(v.id, v);
    return map;
  }, [effectiveRouteAScores]);

  const phase2RequiredIds = React.useMemo(
    () => ["V2", "V3", "V4", "V5", "V6", "V8", "V11", "V12", "V13", "V14", "V15", "V16", "V36", "V37", "V17", "V18"],
    []
  );
  const scenario1RequiredIds = React.useMemo(() => ["V8", "V14", "V15", "V16", "V22", "V23"], []);
  const scenario2RequiredIds = React.useMemo(
    () => Array.from(new Set([...scenario1RequiredIds, ...phase2RequiredIds])),
    [phase2RequiredIds, scenario1RequiredIds]
  );
  const manualScenario1Ids = React.useMemo(
    () => [
      "V1",
      "V2",
      "V3",
      "V4",
      "V5",
      "V6",
      "V7",
      "V8",
      "V9",
      "V11",
      "V12",
      "V13",
      "V14",
      "V15",
      "V16",
      "V17",
      "V18",
      "V36",
      "V37",
      "V19",
      "V20",
      "V21",
      "V22",
      "V23",
      "V24",
      "V25",
      "V26",
      "V28",
      "V29",
      "V32",
      "V33",
      "V34",
      "V35",
    ],
    []
  );
  const manualScenario2Ids = React.useMemo(
    () => [
      "V2",
      "V3",
      "V4",
      "V5",
      "V6",
      "V7",
      "V8",
      "V9",
      "V11",
      "V12",
      "V13",
      "V14",
      "V15",
      "V16",
      "V17",
      "V18",
      "V22",
      "V23",
      "V36",
      "V37",
    ],
    []
  );
  const manualLockedIds = React.useMemo(() => new Set(["V11", "V12"]), []);

    const manualLockedIfCompleteIds = React.useMemo(
    () => new Set([]),
    []
  );

  const layerModuleMap = React.useMemo(() => {
    const map = new Map();
    for (const mod of CATALOG.modules || []) {
      for (const layer of mod.maps || []) {
        map.set(layer.layerId, mod.id);
      }
    }
    return map;
  }, []);
  const minInputsById = React.useMemo(() => {
    const map = new Map();
    const vars = CATALOG?.routeA?.variables || [];
    for (const v of vars) {
      if (v && v.id) map.set(v.id, v.minInputsPresent);
    }
    return map;
  }, []);

  const isInputComplete = React.useCallback((v) => {
    if (!v) return false;
    if (typeof v.missing === "boolean" && !v.missing) return true;
    if (Array.isArray(v.inputs) && v.inputs.length) {
      return v.inputs.every((inp) => !inp.missing);
    }
    return typeof v.missing === "boolean" ? !v.missing : true;
  }, []);

  const minimumScenario = React.useMemo(() => {
    if (!caseData) return { ok: false, missing: [] };
    return validateMinimumScenario(caseData);
  }, [caseData]);
  const scenario1Ready = React.useMemo(() => {
    if (!minimumScenario.ok) return false;
    return scenario1RequiredIds.every((id) => isInputComplete(baseScoreById.get(id)));
  }, [minimumScenario, scenario1RequiredIds, baseScoreById, isInputComplete]);

  const isInputCompleteNoMaps = React.useCallback((v) => {
    if (!v) return false;
    if (Array.isArray(v.inputs) && v.inputs.length) {
      if (["V26", "V28", "V29", "V32", "V33"].includes(v.id)) {
        const infra = v.inputs.find((inp) => inp?.key === "tipo_infraestructura");
        const infraToken = normalizeToken(infra?.value);
        if (infraToken.includes("no hay infraestructura") || infraToken.includes("sin infraestructura")) {
          return true;
        }
      }
      const inputsPresent = v.inputs.filter((inp) => !inp?.missing).length;
      const minInputs = minInputsById.get(v.id);
      let inputsRequired = Number.isFinite(minInputs) ? minInputs : v.inputs.length;
      if (v.id === "V9") {
        const study = v.inputs.find((inp) => inp?.key === "cap_infiltracion_zona_no_saturada");
        const category = v.inputs.find((inp) => inp?.key === "cap_infiltracion_categoria");
        if (study?.missing) return false;
        const token = normalizeToken(study?.value);
        if (token.includes("si")) return !category?.missing;
        return true;
      }
      return inputsPresent >= inputsRequired;
    }
    return true;
  }, [minInputsById]);
  const isInputCompleteScenario2 = React.useCallback(
    (v) => {
      if (!v) return false;
      if (Array.isArray(v.inputs) && v.inputs.length) {
        const isPresentInput = (inp) => {
          if (!inp) return false;
          if (inp.missing === false) return true;
          const raw = inp.value;
          if (raw === null || raw === undefined) return false;
          const text = String(raw).trim();
          if (!text) return false;
          if (text === "No_reportado" || text === "No reportado") return false;
          return true;
        };
        if (["V26", "V28", "V29", "V32", "V33"].includes(v.id)) {
          const infra = v.inputs.find((inp) => inp?.key === "tipo_infraestructura");
          const infraToken = normalizeToken(infra?.value);
          if (infraToken.includes("no hay infraestructura") || infraToken.includes("sin infraestructura")) {
            return true;
          }
        }
        const inputsPresent = v.inputs.filter(isPresentInput).length;
        const minInputs = minInputsById.get(v.id);
        const inputsRequired = Number.isFinite(minInputs) ? minInputs : Math.min(1, v.inputs.length);
        if (v.id === "V9") {
          const study = v.inputs.find((inp) => inp?.key === "cap_infiltracion_zona_no_saturada");
          const category = v.inputs.find((inp) => inp?.key === "cap_infiltracion_categoria");
          if (!isPresentInput(study)) return false;
          const token = normalizeToken(study?.value);
          if (token.includes("si")) return isPresentInput(category);
          return true;
        }
        return inputsPresent >= inputsRequired;
      }
      return true;
    },
    [minInputsById]
  );

  const scenario2Ready = React.useMemo(() => {
    const filteredIds = new Set(scenario2RequiredIds);
    ["V36", "V37"].forEach((id) => {
      if (!isSuperficialSource) filteredIds.delete(id);
    });
    return Array.from(filteredIds).every((id) => isInputCompleteScenario2(baseScoreById.get(id)));
  }, [scenario2RequiredIds, baseScoreById, isInputCompleteScenario2, isSuperficialSource]);
  const fullReady = React.useMemo(() => {
    const vars = effectiveRouteAScores?.variables || [];
    if (!vars.length) return false;
    return vars.every((v) => isInputCompleteNoMaps(v));
  }, [effectiveRouteAScores, isInputCompleteNoMaps]);
  const stage1Complete = scenario1Ready;
  const isScenario1Active = React.useMemo(
    () => scenario1Ready && !scenario2Ready && !fullReady,
    [scenario1Ready, scenario2Ready, fullReady]
  );
  const isScenario2Active = React.useMemo(() => scenario2Ready && !fullReady, [scenario2Ready, fullReady]);
  const isScenario1BlockedVar = React.useCallback(
    (id) => {
      if (activeStage >= 3) return false;
      if (isScenario1Active) return !scenario1RequiredIds.includes(id);
      if (isScenario2Active) return !scenario2RequiredIds.includes(id);
      return false;
    },
    [activeStage, isScenario1Active, isScenario2Active, scenario1RequiredIds, scenario2RequiredIds]
  );
  const scoreById = React.useMemo(() => {
    if (!caseData) return baseScoreById;
    let overrides = null;
    if (isScenario1Active) overrides = buildScenario1Overrides(caseData);
    else if (isScenario2Active) overrides = buildScenario2Overrides(caseData, baseScoreById);
    if (!overrides || !overrides.size) return baseScoreById;
    const next = new Map(baseScoreById);
    for (const [id, patch] of overrides.entries()) {
      const current = baseScoreById.get(id);
      if (!current) continue;
      next.set(id, { ...current, ...patch });
    }
    return next;
  }, [baseScoreById, caseData, isScenario1Active, isScenario2Active]);
  const serializedScoreById = React.useMemo(() => {
    const out = {};
    scoreById.forEach((value, id) => {
      out[id] = { ...value };
    });
    return out;
  }, [scoreById]);
  const serializedComputedScores = React.useMemo(() => {
    const routeAScoreData = routeAScores || {};
    return {
      scoreById: serializedScoreById,
      variables: Object.values(serializedScoreById),
      criteria: routeAScoreData.criteria || {},
      groups: routeAScoreData.groups || [],
      finalScores: routeAScoreData.finalScores || {},
      limitantes: routeAScoreData.limitantes || {},
    };
  }, [routeAScores, serializedScoreById]);
  const serializedAHPResults = React.useMemo(() => {
    const ids = Array.isArray(pairwiseMatrix.ids) ? pairwiseMatrix.ids : [];
    const matrix =
      Array.isArray(pairwiseMatrix.matrix) && pairwiseMatrix.matrix.length
        ? pairwiseMatrix.matrix.map((row) =>
            Array.isArray(row) ? row.map((value) => (Number.isFinite(value) ? Number(value) : null)) : []
          )
        : [];
    if (!ids.length) return null;
    const weights = Array.isArray(pairwiseAHP.weights)
      ? pairwiseAHP.weights.map((value) => (Number.isFinite(value) ? Number(value) : 0))
      : [];
    const lambdaMax = Number.isFinite(pairwiseAHP.lambdaMax) ? pairwiseAHP.lambdaMax : null;
    const ci = Number.isFinite(pairwiseAHP.ci) ? pairwiseAHP.ci : null;
    const cr = Number.isFinite(pairwiseAHP.cr) ? pairwiseAHP.cr : null;
    return { ids, matrix, weights, lambdaMax, ci, cr };
  }, [pairwiseMatrix, pairwiseAHP]);
  const shouldShowAllStages = fullReady;

  const enabledStage = React.useMemo(() => {
    if (shouldShowAllStages) return 3;
    if (!stage1Complete) return 1;
    return Math.min(activeStage + 1, 3);
  }, [shouldShowAllStages, stage1Complete, activeStage]);
  const stagePalette = React.useMemo(
    () => [
      { bg: "rgba(219, 234, 254, 0.55)", border: "rgba(147, 197, 253, 0.7)" }, // Etapa 1
      { bg: "rgba(254, 243, 199, 0.65)", border: "rgba(252, 211, 77, 0.7)" }, // Etapa 2
      { bg: "rgba(240, 253, 250, 0.65)", border: "rgba(153, 246, 228, 0.7)" }, // Etapa 3
    ],
    []
  );
  const getStageStyles = React.useCallback(
    (stage) => {
      const palette = stagePalette[stage - 1] || stagePalette[0];
      return { background: palette.bg, border: `1px solid ${palette.border}` };
    },
    [stagePalette]
  );

  const getStageCardStyles = React.useCallback(
    (stage, clickable = true) => {
      const baseStyles = getStageStyles(stage);
      if (shouldShowAllStages) {
        return { ...baseStyles, cursor: clickable ? "pointer" : "default" };
      }
      const locked = stage > enabledStage;
      return {
        ...baseStyles,
        cursor: locked && clickable ? "not-allowed" : clickable ? "pointer" : "default",
        opacity: locked ? 0.55 : 1,
        filter: locked ? "grayscale(0.1)" : "none",
      };
    },
    [getStageStyles, shouldShowAllStages, enabledStage]
  );

  const stageRefMap = React.useMemo(
    () => ({
      1: etapa1Ref,
      2: etapa2Ref,
      3: etapa5Ref,
    }),
    []
  );

  const canActivateStage = React.useCallback((stage) => stage <= enabledStage, [enabledStage]);
  const showStage = React.useCallback(
    (stage) => shouldShowAllStages || activeStage >= stage,
    [shouldShowAllStages, activeStage]
  );

  const onActivateStage = React.useCallback(
    (stage) => {
      if (!canActivateStage(stage)) return;
      setActiveStage((prev) => (stage > prev ? stage : prev));
      const ref = stageRefMap[stage];
      if (ref?.current && typeof ref.current.scrollIntoView === "function") {
        ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [canActivateStage, stageRefMap]
  );

  const missingForFull = React.useMemo(() => {
    const vars = effectiveRouteAScores?.variables || [];
    return vars.filter((v) => !isInputComplete(v)).map((v) => v.label || v.id);
  }, [effectiveRouteAScores, isInputComplete]);
  const missingScenario1Labels = React.useMemo(() => {
    if (!minimumScenario.missing?.length) return [];
    return minimumScenario.missing.map((item) => item.label || item.key || item.moduleId);
  }, [minimumScenario]);
  const missingScenario2Labels = React.useMemo(() => {
    const vars = effectiveRouteAScores?.variables || [];
    return vars
      .filter((v) => scenario2RequiredIds.includes(v.id) && !isInputCompleteScenario2(v))
      .map((v) => v.label || v.id);
  }, [scenario2RequiredIds, effectiveRouteAScores, isInputCompleteScenario2]);

  const c1Var = React.useMemo(() => scoreById.get("V1") || null, [scoreById]);
  const c1IsBlocked = React.useMemo(() => isScenario1BlockedVar("V1"), [isScenario1BlockedVar]);
  const c1IsComplete = React.useMemo(() => (c1Var ? !c1Var.missing : false) && !c1IsBlocked, [c1IsBlocked, c1Var]);
  const c1ManualValue = manualScores?.V1;
  const c1HasManual =
    manualOverrides?.V1 === true &&
    c1ManualValue !== undefined &&
    c1ManualValue !== null &&
    c1ManualValue !== "";
  const c1AutoScore = React.useMemo(() => Number(c1Var?.score04 || 0), [c1Var]);
  const c1BaseScore = React.useMemo(
    () => (c1IsBlocked ? 0 : c1HasManual ? Number(c1ManualValue) : c1AutoScore),
    [c1AutoScore, c1HasManual, c1IsBlocked, c1ManualValue]
  );
  const blockedScenarioLabel = isScenario2Active ? "2" : "1";
  const c1Status = c1IsBlocked ? "Bloqueado" : c1IsComplete ? "Completo" : "Falta";
  const c1Groups = React.useMemo(() => ["G1", "G2", "G3"], []);
  const c1Rows = React.useMemo(() => {
    return c1Groups.map((gid) => {
      const groupScore = c1Var?.scoreByGroup?.[gid];
      const score = c1IsBlocked
        ? 0
        : c1HasManual
        ? c1BaseScore
        : Number.isFinite(groupScore)
        ? groupScore
        : c1BaseScore;
      const scValue = c1IsBlocked ? 0 : c1IsComplete && Number.isFinite(score) ? score : null;
      return {
        id: gid,
        score,
        sc: scValue,
        obs: c1IsBlocked ? `Bloqueado en escenario ${blockedScenarioLabel}` : c1IsComplete ? `Objetivo compatible con ${gid}` : "Pendiente de información",
      };
    });
  }, [blockedScenarioLabel, c1BaseScore, c1Groups, c1HasManual, c1IsBlocked, c1IsComplete, c1Var]);
  const formatScore = React.useCallback((value) => {
    if (!Number.isFinite(value)) return "-";
    return Number(value).toFixed(2);
  }, []);
  const guideById = React.useMemo(() => {
    return new Map(VARIABLE_GUIDE.map((v) => [v.id, v]));
  }, []);
  const labelOverrides = React.useMemo(
    () =>
      new Map([
        ["V2", "Caracterización del acuífero"],
        ["V3", "Modelo geológico"],
        ["V4", "Modelo hidrológico"],
        ["V5", "Modelo numérico o parámetros"],
        ["V6", "Modelo hidrogeoquímico"],
        ["V7", "Escala del acuífero"],
        ["V8", "Tipo de acuífero"],
        ["V9", "Capacidad de infiltración (zona no saturada)"],
        ["V10", "Técnica viable incluye pozos"],
        ["V11", "Permeabilidad del acuífero"],
        ["V12", "Porosidad efectiva"],
        ["V13", "Fuente de agua identificada"],
        ["V14", "Tipo de fuente de agua"],
        ["V15", "Calidad del agua fuente"],
        ["V16", "Normativa para la recarga"],
        ["V36", "Tipo de fuente superficial"],
        ["V37", "Conexion hidráulica con el rio"],
        ["V17", "Calidad del agua del acuífero"],
        ["V18", "Mezcla fuente-acuífero cumple límites"],
        ["V19", "Capacidad de almacenamiento"],
        ["V20", "Volumen de agua a recargar"],
        ["V21", "Volumen de recarga vs capacidad de almacenamiento"],
        ["V22", "Uso final del agua"],
        ["V23", "Tipo de uso final"],
        ["V24", "Relieve dominante"],
        ["V25", "Clima dominante"],
        ["V26", "Infraestructura disponible para MAR"],
        ["V28", "Planta de tratamiento disponible"],
        ["V29", "Existencia de estanques"],
        ["V32", "Obras en cauce / captación ribera"],
        ["V33", "Pozos operativos o rehabilitables"],
        ["V34", "Tipo de asentamiento"],
        ["V35", "Beneficio directo identificado"],
      ]),
    []
  );
  const getDisplayLabel = React.useCallback(
    (id, fallback) => labelOverrides.get(id) || fallback || id,
    [labelOverrides]
  );
  const c1CustomRows = React.useMemo(() => {
    const vInfo = scoreById.get("V1");
    const guide = guideById.get("V1");
    return [
      {
        id: "V1",
        label: getDisplayLabel("V1", vInfo?.label || guide?.question || "V1"),
      },
    ];
  }, [getDisplayLabel, guideById, scoreById]);
  const formatScoreCompact = React.useCallback((value) => {
    if (!Number.isFinite(value)) return "-";
    const n = Number(value);
    return Number.isInteger(n) ? String(n) : n.toFixed(2);
  }, []);
  const formatPercent = React.useCallback((value) => {
    if (!Number.isFinite(value)) return "-";
    return `${(Number(value) * 100).toFixed(1)}%`;
  }, []);

  const getVarBaseScore = React.useCallback(
    (id) => {
      if (isScenario1BlockedVar(id)) return 0;
      const vInfo = scoreById.get(id);
      const override = manualScores?.[id];
      const hasManual =
        !manualLockedIds.has(id) &&
        manualOverrides?.[id] === true &&
        override !== undefined &&
        override !== null &&
        override !== "";
      const autoScore = Number(vInfo?.score04 || 0);
      return hasManual ? Number(override) : autoScore;
    }, [isScenario1BlockedVar, manualLockedIds, manualOverrides, manualScores, scoreById]);
  const summarizeGroupScores = React.useCallback((entries) => {
    const filtered = entries
      .filter((entry) => entry && entry.include && Number.isFinite(entry.value))
      .map((entry) => Number(entry.value));
    const denom = filtered.length;
    const total = filtered.reduce((acc, v) => acc + v, 0);
    const sc = denom > 0 ? total / denom : null;
    return { scores: filtered, denom, sc };
  }, []);
  const getOverrideGroupScore = React.useCallback(
    (varId, groupId) => {
      if (!customInfluenceEnabled) return null;
      const raw = customInfluenceByVar?.[varId]?.[groupId];
      return Number.isFinite(raw) ? Number(raw) : null;
    },
    [customInfluenceByVar, customInfluenceEnabled]
  );
  const getEffectiveGroupScore = React.useCallback(
    (varId, groupId, fallback) => {
      if (isScenario1BlockedVar(varId)) return 0;
      const custom = getOverrideGroupScore(varId, groupId);
      if (Number.isFinite(custom)) return custom;
      return Number.isFinite(fallback) ? Number(fallback) : fallback;
    }, [getOverrideGroupScore, isScenario1BlockedVar]);

  const c2VarIds = React.useMemo(
    () => ["V2", "V3", "V4", "V5", "V6", "V7", "V8", "V9", "V11", "V12", "V24", "V25"],
    []
  );
  const c2Vars = React.useMemo(() => {
    return c2VarIds
      .map((id) => {
        const vInfo = scoreById.get(id);
        const guide = guideById.get(id);
        const isBlocked = isScenario1BlockedVar(id);
        const inputs = Array.isArray(vInfo?.inputs) ? vInfo.inputs : [];
        const maps = Array.isArray(vInfo?.maps) ? vInfo.maps : [];
        const inputsPresent = inputs.filter((inp) => !inp?.missing).length;
        const mapsPresent = maps.filter((mp) => mp && mp.hasFile).length;
        const hasEvidence = inputsPresent + mapsPresent > 0;
        const isComplete = isBlocked ? true : vInfo ? !vInfo.missing : false;
        const override = manualScores?.[id];
        const hasManual =
          !manualLockedIds.has(id) &&
          manualOverrides?.[id] === true &&
          override !== undefined &&
          override !== null &&
          override !== "";
        const scoreBase =
          id === "V25" && Number.isFinite(vInfo?.scoreByGroup?.G1)
            ? Number(vInfo.scoreByGroup.G1)
            : getVarBaseScore(id);
        return {
          id,
          status: isBlocked ? "Bloqueado" : isComplete ? "Completo" : hasEvidence ? "Parcial" : "Falta",
          scoreBase: isBlocked ? 0 : hasManual ? Number(override) : isComplete || hasEvidence ? scoreBase : null,
          description: getDisplayLabel(id, vInfo?.label || guide?.question || ""),
          isComplete,
          isBlocked,
          hasEvidence,
        };
      })
      .filter((v) => v.id);
  }, [c2VarIds, guideById, getDisplayLabel, getVarBaseScore, isScenario1BlockedVar, manualLockedIds, manualOverrides, manualScores, scoreById]);
  const c2CustomRows = React.useMemo(() => {
    return c2VarIds.map((id) => {
      const vInfo = scoreById.get(id);
      const guide = guideById.get(id);
      return {
        id,
        label: getDisplayLabel(id, vInfo?.label || guide?.question || id),
      };
    });
  }, [c2VarIds, getDisplayLabel, guideById, scoreById]);
  const getAutoGroupScore = React.useCallback(
    (varId, groupId) => {
      if (isScenario1BlockedVar(varId)) return 0;
      const vInfo = scoreById.get(varId);
      const groupScore = vInfo?.scoreByGroup?.[groupId];
      if (Number.isFinite(groupScore)) return Number(groupScore);
      return Number(vInfo?.score04 || 0);
    },
    [isScenario1BlockedVar, scoreById]
  );

  const c2GroupRows = React.useMemo(() => {
    const groups = ["G1", "G2", "G3"];
    return groups.map((gid) => {
      const scores = [];
      for (const v of c2Vars) {
        if (v.isBlocked) {
          scores.push({ value: 0, include: false });
          continue;
        }
        const vInfo = scoreById.get(v.id);
        const custom = getOverrideGroupScore(v.id, gid);
        const override = manualScores?.[v.id];
        const hasManual =
          !manualLockedIds.has(v.id) &&
          manualOverrides?.[v.id] === true &&
          override !== undefined &&
          override !== null &&
          override !== "";
        if (Number.isFinite(custom)) {
          const include = custom !== 0;
          scores.push({ value: custom, include });
          continue;
        }
        if (!v.isComplete && !hasManual && !v.hasEvidence) {
          scores.push({ value: 0, include: false });
          continue;
        }
        const groupScore = vInfo?.scoreByGroup?.[gid];
        const score =
          v.id === "V8"
            ? Number.isFinite(groupScore)
              ? Number(groupScore)
              : Number(v.scoreBase || 0)
            : hasManual
            ? Number(override)
            : Number.isFinite(groupScore)
            ? Number(groupScore)
            : Number(v.scoreBase || 0);
        const include = Number.isFinite(score) && score !== 0;
        scores.push({ value: score, include });
      }
      const { scores: finalScores, denom, sc } = summarizeGroupScores(scores);
      const missingCount = c2Vars.filter((v) => !v.isBlocked && !v.isComplete).length;
      return {
        id: gid,
        scores: finalScores,
        denom,
        sc,
        obs: missingCount ? `Confianza reducida (${missingCount} faltantes)` : `Condiciones compatibles con ${gid}`,
      };
    });
  }, [c2Vars, getOverrideGroupScore, manualOverrides, manualScores, scoreById, summarizeGroupScores]);
  const c2GroupDetailRows = React.useMemo(() => {
    const groups = ["G1", "G2", "G3"];
    return groups.map((gid) => {
      const meta = c2GroupRows.find((row) => row.id === gid);
      const scoresByVar = {};
      for (const v of c2Vars) {
        if (v.isBlocked) {
          scoresByVar[v.id] = 0;
          continue;
        }
        const vInfo = scoreById.get(v.id);
        const custom = getOverrideGroupScore(v.id, gid);
        const override = manualScores?.[v.id];
        const hasManual =
          !manualLockedIds.has(v.id) &&
          manualOverrides?.[v.id] === true &&
          override !== undefined &&
          override !== null &&
          override !== "";
        if (Number.isFinite(custom)) {
          scoresByVar[v.id] = Number(custom);
          continue;
        }
        if (!v.isComplete && !hasManual && !v.hasEvidence) {
          scoresByVar[v.id] = null;
          continue;
        }
        const groupScore = vInfo?.scoreByGroup?.[gid];
        const score =
          v.id === "V8"
            ? Number.isFinite(groupScore)
              ? Number(groupScore)
              : Number(v.scoreBase || 0)
            : hasManual
            ? Number(override)
            : Number.isFinite(groupScore)
            ? Number(groupScore)
            : Number(v.scoreBase || 0);
        scoresByVar[v.id] = Number.isFinite(score) ? score : null;
      }
      return {
        id: gid,
        scoresByVar,
        sc: meta?.sc ?? null,
        obs: meta?.obs || "",
      };
    });
  }, [c2GroupRows, c2Vars, getOverrideGroupScore, manualLockedIds, manualOverrides, manualScores, scoreById]);
  const c3VarIds = React.useMemo(() => ["V13", "V14", "V15", "V16", "V17", "V18"], []);
  const c3Vars = React.useMemo(() => {
    return c3VarIds
      .map((id) => {
        const vInfo = scoreById.get(id);
        const guide = guideById.get(id);
        const isBlocked = isScenario1BlockedVar(id);
        const isComplete = isBlocked ? true : vInfo ? !vInfo.missing : false;
        const override = manualScores?.[id];
        const hasManual =
          !manualLockedIds.has(id) &&
          manualOverrides?.[id] === true &&
          override !== undefined &&
          override !== null &&
          override !== "";
        const scoreBase = Number(vInfo?.score04 || 0);
        return {
          id,
          status: isBlocked ? "Bloqueado" : isComplete ? "Completo" : "Falta",
          scoreBase: isBlocked ? 0 : hasManual ? Number(override) : isComplete ? scoreBase : null,
          description: getDisplayLabel(id, vInfo?.label || guide?.question || ""),
          isComplete,
          isBlocked,
        };
      })
      .filter((v) => v.id);
  }, [c3VarIds, getDisplayLabel, guideById, isScenario1BlockedVar, manualLockedIds, manualOverrides, manualScores, scoreById]);
  const c3CustomRows = React.useMemo(() => {
    return c3VarIds.map((id) => {
      const vInfo = scoreById.get(id);
      const guide = guideById.get(id);
      return {
        id,
        label: getDisplayLabel(id, vInfo?.label || guide?.question || id),
      };
    });
  }, [c3VarIds, getDisplayLabel, guideById, scoreById]);
  const c3ManualAllowedIds = React.useMemo(() => new Set(["V17", "V18"]), []);
  const c3GroupRows = React.useMemo(() => {
    const groups = ["G1", "G2", "G3"];
    return groups.map((gid) => {
      const scores = [];
      for (const v of c3Vars) {
        if (v.isBlocked) {
          scores.push({ value: 0, include: false });
          continue;
        }
        const vInfo = scoreById.get(v.id);
        const custom = getOverrideGroupScore(v.id, gid);
        const override = manualScores?.[v.id];
        const hasManual =
          c3ManualAllowedIds.has(v.id) &&
          manualOverrides?.[v.id] === true &&
          override !== undefined &&
          override !== null &&
          override !== "";
        if (Number.isFinite(custom)) {
          const include = custom !== 0;
          scores.push({ value: custom, include });
          continue;
        }
        if (!v.isComplete && !hasManual) {
          scores.push({ value: 0, include: false });
          continue;
        }
        const groupScore = vInfo?.scoreByGroup?.[gid];
        const score = hasManual
          ? Number(override)
          : Number.isFinite(groupScore)
          ? Number(groupScore)
          : Number(v.scoreBase || 0);
        const include = Number.isFinite(score) && score !== 0;
        scores.push({ value: score, include });
      }
      const { scores: finalScores, denom, sc } = summarizeGroupScores(scores);
      const missingCount = c3Vars.filter((v) => !v.isBlocked && !v.isComplete).length;
      return {
        id: gid,
        scores: finalScores,
        denom,
        sc,
        obs: missingCount ? `Confianza reducida (${missingCount} faltantes)` : `Condiciones compatibles con ${gid}`,
      };
    });
  }, [c3ManualAllowedIds, c3Vars, getOverrideGroupScore, manualOverrides, manualScores, scoreById, summarizeGroupScores]);
  const c3GroupDetailRows = React.useMemo(() => {
    const groups = ["G1", "G2", "G3"];
    return groups.map((gid) => {
      const meta = c3GroupRows.find((row) => row.id === gid);
      const scoresByVar = {};
      for (const v of c3Vars) {
        if (v.isBlocked) {
          scoresByVar[v.id] = 0;
          continue;
        }
        const vInfo = scoreById.get(v.id);
        const custom = getOverrideGroupScore(v.id, gid);
        const override = manualScores?.[v.id];
        const hasManual =
          c3ManualAllowedIds.has(v.id) &&
          manualOverrides?.[v.id] === true &&
          override !== undefined &&
          override !== null &&
          override !== "";
        if (Number.isFinite(custom)) {
          scoresByVar[v.id] = Number(custom);
          continue;
        }
        if (!v.isComplete && !hasManual) {
          scoresByVar[v.id] = null;
          continue;
        }
        const groupScore = vInfo?.scoreByGroup?.[gid];
        const score = hasManual
          ? Number(override)
          : Number.isFinite(groupScore)
          ? Number(groupScore)
          : Number(v.scoreBase || 0);
        scoresByVar[v.id] = Number.isFinite(score) ? score : null;
      }
      return {
        id: gid,
        scoresByVar,
        sc: meta?.sc ?? null,
        obs: meta?.obs || "",
      };
    });
  }, [c3GroupRows, c3ManualAllowedIds, c3Vars, getOverrideGroupScore, manualOverrides, manualScores, scoreById]);
  const c4VarIds = React.useMemo(
    () => ["V19", "V20", "V21", "V26", "V28", "V29", "V32", "V33"],
    []
  );
  const c4GroupOnlyIds = React.useMemo(() => new Set(["V28", "V29", "V32", "V33"]), []);
  const c4GroupOnlyNotes = React.useMemo(
    () =>
      new Map([
        ["V28", "Afecta solo G3."],
        ["V29", "Afecta solo G3."],
        ["V32", "Afecta solo G1."],
        ["V33", "Afecta solo G2 y G3."],
      ]),
    []
  );
  const c4Vars = React.useMemo(() => {
    return c4VarIds
      .map((id) => {
        const vInfo = scoreById.get(id);
        const guide = guideById.get(id);
        const isBlocked = isScenario1BlockedVar(id);
        const isComplete = isBlocked ? true : vInfo ? !vInfo.missing : false;
        const override = manualScores?.[id];
        const hasManual =
          !manualLockedIds.has(id) &&
          manualOverrides?.[id] === true &&
          override !== undefined &&
          override !== null &&
          override !== "";
        const scoreBase = getVarBaseScore(id);
        return {
          id,
          status: isBlocked ? "Bloqueado" : isComplete ? "Completo" : "Falta",
          scoreBase: isBlocked ? 0 : hasManual ? Number(override) : isComplete ? scoreBase : null,
          description: getDisplayLabel(id, vInfo?.label || guide?.question || ""),
          isComplete,
          isBlocked,
        };
      })
      .filter((v) => v.id);
  }, [c4VarIds, getDisplayLabel, guideById, getVarBaseScore, isScenario1BlockedVar, manualLockedIds, manualOverrides, manualScores, scoreById]);
  const c4CustomRows = React.useMemo(() => {
    return c4VarIds.map((id) => {
      const vInfo = scoreById.get(id);
      const guide = guideById.get(id);
      return {
        id,
        label: getDisplayLabel(id, vInfo?.label || guide?.question || id),
      };
    });
  }, [c4VarIds, getDisplayLabel, guideById, scoreById]);
  const c4GroupRows = React.useMemo(() => {
    const groups = ["G1", "G2", "G3"];
    return groups.map((gid) => {
      const scores = [];
      for (const v of c4Vars) {
        if (v.isBlocked) {
          scores.push({ value: 0, include: false });
          continue;
        }
        const vInfo = scoreById.get(v.id);
        const impact = vInfo?.groupImpact?.[gid] ?? 1;
        const applyImpact = c4GroupOnlyIds.has(v.id);
        const custom = getOverrideGroupScore(v.id, gid);
        const override = manualScores?.[v.id];
        const hasManual =
          !manualLockedIds.has(v.id) &&
          manualOverrides?.[v.id] === true &&
          override !== undefined &&
          override !== null &&
          override !== "";
        if (Number.isFinite(custom)) {
          const value = applyImpact ? Number(custom) * impact : Number(custom);
          const include = value !== 0;
          scores.push({ value, include });
          continue;
        }
        if (!v.isComplete && !hasManual) {
          scores.push({ value: 0, include: false });
          continue;
        }
        const groupScore = vInfo?.scoreByGroup?.[gid];
        const score = hasManual
          ? applyImpact
            ? Number(override) * impact
            : Number(override)
          : Number.isFinite(groupScore)
          ? Number(groupScore)
          : Number(v.scoreBase || 0);
        const include = Number.isFinite(score) && score !== 0;
        scores.push({ value: score, include });
      }
      const { scores: finalScores, denom, sc } = summarizeGroupScores(scores);
      const missingCount = c4Vars.filter((v) => !v.isBlocked && !v.isComplete).length;
      return {
        id: gid,
        scores: finalScores,
        denom,
        sc,
        obs: missingCount ? `Confianza reducida (${missingCount} faltantes)` : `Condiciones compatibles con ${gid}`,
      };
    });
  }, [c4GroupOnlyIds, c4Vars, getOverrideGroupScore, manualOverrides, manualScores, scoreById, summarizeGroupScores]);
  const c4GroupDetailRows = React.useMemo(() => {
    const groups = ["G1", "G2", "G3"];
    return groups.map((gid) => {
      const meta = c4GroupRows.find((row) => row.id === gid);
      const scoresByVar = {};
      for (const v of c4Vars) {
        if (v.isBlocked) {
          scoresByVar[v.id] = 0;
          continue;
        }
        const vInfo = scoreById.get(v.id);
        const impact = vInfo?.groupImpact?.[gid] ?? 1;
        const applyImpact = c4GroupOnlyIds.has(v.id);
        const custom = getOverrideGroupScore(v.id, gid);
        const override = manualScores?.[v.id];
        const hasManual =
          !manualLockedIds.has(v.id) &&
          manualOverrides?.[v.id] === true &&
          override !== undefined &&
          override !== null &&
          override !== "";
        if (Number.isFinite(custom)) {
          scoresByVar[v.id] = applyImpact ? Number(custom) * impact : Number(custom);
          continue;
        }
        if (!v.isComplete && !hasManual) {
          scoresByVar[v.id] = null;
          continue;
        }
        const groupScore = vInfo?.scoreByGroup?.[gid];
        const score = hasManual
          ? applyImpact
            ? Number(override) * impact
            : Number(override)
          : Number.isFinite(groupScore)
          ? Number(groupScore)
          : Number(v.scoreBase || 0);
        scoresByVar[v.id] = Number.isFinite(score) ? score : null;
      }
      return {
        id: gid,
        scoresByVar,
        sc: meta?.sc ?? null,
        obs: meta?.obs || "",
      };
    });
  }, [c4GroupOnlyIds, c4GroupRows, c4Vars, getOverrideGroupScore, manualLockedIds, manualOverrides, manualScores, scoreById]);
  const c5VarIds = React.useMemo(() => ["V22", "V23", "V34", "V35"], []);
  const c5Vars = React.useMemo(() => {
    return c5VarIds
      .map((id) => {
        const vInfo = scoreById.get(id);
        const guide = guideById.get(id);
        const isBlocked = isScenario1BlockedVar(id);
        const isComplete = isBlocked ? true : vInfo ? !vInfo.missing : false;
        const override = manualScores?.[id];
        const hasManual =
          !manualLockedIds.has(id) &&
          manualOverrides?.[id] === true &&
          override !== undefined &&
          override !== null &&
          override !== "";
        const scoreBase = getVarBaseScore(id);
        return {
          id,
          status: isBlocked ? "Bloqueado" : isComplete ? "Completo" : "Falta",
          scoreBase: isBlocked ? 0 : hasManual ? Number(override) : isComplete ? scoreBase : null,
          description: getDisplayLabel(id, vInfo?.label || guide?.question || ""),
          isComplete,
          isBlocked,
        };
      })
      .filter((v) => v.id);
  }, [c5VarIds, getDisplayLabel, guideById, getVarBaseScore, isScenario1BlockedVar, manualLockedIds, manualOverrides, manualScores, scoreById]);
  const c5CustomRows = React.useMemo(() => {
    return c5VarIds.map((id) => {
      const vInfo = scoreById.get(id);
      const guide = guideById.get(id);
      return {
        id,
        label: getDisplayLabel(id, vInfo?.label || guide?.question || id),
      };
    });
  }, [c5VarIds, getDisplayLabel, guideById, scoreById]);
  const c5GroupRows = React.useMemo(() => {
    const groups = ["G1", "G2", "G3"];
    return groups.map((gid) => {
      const scores = [];
      for (const v of c5Vars) {
        if (v.isBlocked) {
          scores.push({ value: 0, include: false });
          continue;
        }
        const vInfo = scoreById.get(v.id);
        const custom = getOverrideGroupScore(v.id, gid);
        const override = manualScores?.[v.id];
        const hasManual =
          !manualLockedIds.has(v.id) &&
          manualOverrides?.[v.id] === true &&
          override !== undefined &&
          override !== null &&
          override !== "";
        if (Number.isFinite(custom)) {
          const include = custom !== 0;
          scores.push({ value: custom, include });
          continue;
        }
        if (!v.isComplete && !hasManual) {
          scores.push({ value: 0, include: false });
          continue;
        }
        const groupScore = vInfo?.scoreByGroup?.[gid];
        const score = hasManual
          ? Number(override)
          : Number.isFinite(groupScore)
          ? Number(groupScore)
          : Number(v.scoreBase || 0);
        const include = Number.isFinite(score) && score !== 0;
        scores.push({ value: score, include });
      }
      const { scores: finalScores, denom, sc } = summarizeGroupScores(scores);
      const missingCount = c5Vars.filter((v) => !v.isBlocked && !v.isComplete).length;
      return {
        id: gid,
        scores: finalScores,
        denom,
        sc,
        obs: missingCount ? `Confianza reducida (${missingCount} faltantes)` : `Condiciones compatibles con ${gid}`,
      };
    });
  }, [c5Vars, getOverrideGroupScore, manualOverrides, manualScores, scoreById, summarizeGroupScores]);
  const c5GroupDetailRows = React.useMemo(() => {
    const groups = ["G1", "G2", "G3"];
    return groups.map((gid) => {
      const meta = c5GroupRows.find((row) => row.id === gid);
      const scoresByVar = {};
      for (const v of c5Vars) {
        if (v.isBlocked) {
          scoresByVar[v.id] = 0;
          continue;
        }
        const vInfo = scoreById.get(v.id);
        const custom = getOverrideGroupScore(v.id, gid);
        const override = manualScores?.[v.id];
        const hasManual =
          !manualLockedIds.has(v.id) &&
          manualOverrides?.[v.id] === true &&
          override !== undefined &&
          override !== null &&
          override !== "";
        if (Number.isFinite(custom)) {
          scoresByVar[v.id] = Number(custom);
          continue;
        }
        if (!v.isComplete && !hasManual) {
          scoresByVar[v.id] = null;
          continue;
        }
        const groupScore = vInfo?.scoreByGroup?.[gid];
        const score = hasManual
          ? Number(override)
          : Number.isFinite(groupScore)
          ? Number(groupScore)
          : Number(v.scoreBase || 0);
        scoresByVar[v.id] = Number.isFinite(score) ? score : null;
      }
      return {
        id: gid,
        scoresByVar,
        sc: meta?.sc ?? null,
        obs: meta?.obs || "",
      };
    });
  }, [c5GroupRows, c5Vars, getOverrideGroupScore, manualLockedIds, manualOverrides, manualScores, scoreById]);
  const summaryRows = React.useMemo(() => {
    const getCriterionScore = (rows, gid) => rows.find((row) => row.id === gid)?.sc ?? null;
    const getVariableScore = (varId, gid) => {
      const vInfo = scoreById.get(varId);
      const groupScore = vInfo?.scoreByGroup?.[gid];
      const base = Number.isFinite(groupScore) ? Number(groupScore) : Number(vInfo?.score04 || 0);
      const effective = getEffectiveGroupScore(varId, gid, base);
      return Number.isFinite(effective) ? Number(effective) : null;
    };
    const statusForVars = (vars) => {
      const availableVars = vars.filter((v) => !v.isBlocked);
      const total = availableVars.length;
      if (!total) return "Bloqueado";
      const complete = availableVars.filter((v) => v.isComplete).length;
      if (complete === 0) return "Falta";
      if (complete === total) return "Completo";
      return "Parcial";
    };
    const statusForSingle = (isComplete) => (isComplete ? "Completo" : "Falta");
    return [
      {
        id: "C1",
        g1: getCriterionScore(c1Rows, "G1"),
        g2: getCriterionScore(c1Rows, "G2"),
        g3: getCriterionScore(c1Rows, "G3"),
        status: c1IsBlocked ? "Bloqueado" : statusForSingle(c1IsComplete),
      },
      {
        id: "C2",
        g1: getCriterionScore(c2GroupRows, "G1"),
        g2: getCriterionScore(c2GroupRows, "G2"),
        g3: getCriterionScore(c2GroupRows, "G3"),
        status: statusForVars(c2Vars),
      },
      {
        id: "C3",
        g1: getCriterionScore(c3GroupRows, "G1"),
        g2: getCriterionScore(c3GroupRows, "G2"),
        g3: getCriterionScore(c3GroupRows, "G3"),
        status: statusForVars(c3Vars),
      },
      {
        id: "C4",
        g1: getCriterionScore(c4GroupRows, "G1"),
        g2: getCriterionScore(c4GroupRows, "G2"),
        g3: getCriterionScore(c4GroupRows, "G3"),
        status: statusForVars(c4Vars),
      },
      {
        id: "C5",
        g1: getCriterionScore(c5GroupRows, "G1"),
        g2: getCriterionScore(c5GroupRows, "G2"),
        g3: getCriterionScore(c5GroupRows, "G3"),
        status: statusForVars(c5Vars),
      },
      {
        id: "V36",
        g1: getVariableScore("V36", "G1"),
        g2: getVariableScore("V36", "G2"),
        g3: getVariableScore("V36", "G3"),
        status: statusForSingle(isInputComplete(scoreById.get("V36"))),
      },
      {
        id: "V37",
        g1: getVariableScore("V37", "G1"),
        g2: getVariableScore("V37", "G2"),
        g3: getVariableScore("V37", "G3"),
        status: statusForSingle(isInputComplete(scoreById.get("V37"))),
      },
    ];
  }, [c1IsBlocked, c1IsComplete, c1Rows, c2GroupRows, c2Vars, c3GroupRows, c3Vars, c4GroupRows, c4Vars, c5GroupRows, c5Vars, getEffectiveGroupScore, isInputComplete, scoreById]);
  const computedWLCResults = React.useMemo(() => {
    const criteriaIds = CRITERIA_TABLE.map((c) => c.id);
    if (!criteriaIds.length) return null;
    const summaryById = new Map(summaryRows.map((row) => [row.id, row]));
    const labelById = new Map(CRITERIA_TABLE.map((c) => [c.id, c.label || c.id]));
    const rows = [];
    const totals = WLC_GROUP_KEYS.reduce((acc, key) => {
      acc[key] = 0;
      return acc;
    }, {});
    for (const cid of criteriaIds) {
      const summary = summaryById.get(cid) || {};
      const rawWeight = routeAScoreWeightMap.get(cid);

      const weight = Number.isFinite(Number(rawWeight)) ? Number(rawWeight) : 0;
      let totalScore = 0;
      const scores = {};
      const groupRawScores = {};
      for (const groupKey of WLC_GROUP_KEYS) {
        const scoreKey = groupKey.toLowerCase();
        const baseScore = Number(summary[scoreKey] ?? 0);
        const contribution = weight * baseScore;
        const safeContribution = Number.isFinite(contribution) ? contribution : 0;
        scores[groupKey] = safeContribution;
        groupRawScores[groupKey] = Number.isFinite(baseScore) ? baseScore : 0;
        totalScore += safeContribution;
        totals[groupKey] = (totals[groupKey] || 0) + safeContribution;
      }
      rows.push({
        id: cid,
        label: labelById.get(cid) || cid,
        weight,
        scores,
        groupScores: groupRawScores,
        total: totalScore,
      });
    }
    const aggregateTotal = WLC_GROUP_KEYS.reduce((acc, key) => acc + (totals[key] || 0), 0);
    rows.push({
      id: "TOTAL_IDONEIDAD",
      label: "Total idoneidad",
      weight: null,
      scores: { ...totals },
      groupScores: WLC_GROUP_KEYS.reduce((acc, key) => {
        acc[key] = null;
        return acc;
      }, {}),
      total: aggregateTotal,
    });
    return {
      rows,
      commitTotals: { ...totals },
      aggregateTotal,
    };
  }, [routeAScoreWeightMap, summaryRows]);
  const serializedPhase2Payload = React.useMemo(() => {
    const payload = { computedScores: serializedComputedScores };
    if (computedWLCResults) payload.wlcResults = computedWLCResults;
    if (serializedAHPResults && serializedAHPResults.ids?.length) {
      payload.ahpResults = serializedAHPResults;
    }
    return payload;
  }, [serializedComputedScores, serializedAHPResults, computedWLCResults]);
  const serializedPhase2Json = React.useMemo(() => JSON.stringify(serializedPhase2Payload), [serializedPhase2Payload]);
  React.useEffect(() => {
    if (!serializedPhase2Json) return;
    patchActiveCase((c) => {
      if (!c) return c;
      const phase2 = { ...(c.phase2 || {}) };
      const currentPayload = {
        computedScores: phase2.computedScores || {},
        ahpResults: phase2.ahpResults || {},
        wlcResults: phase2.wlcResults || null,
      };
      if (JSON.stringify(currentPayload) === serializedPhase2Json) return c;
      phase2.computedScores = serializedComputedScores;
      if (serializedAHPResults && serializedAHPResults.ids?.length) {
        phase2.ahpResults = serializedAHPResults;
      }
      if (computedWLCResults) {
        phase2.wlcResults = computedWLCResults;
      } else {
        delete phase2.wlcResults;
      }
      return { ...c, phase2 };
    });
  }, [
    patchActiveCase,
    serializedPhase2Json,
    serializedComputedScores,
    serializedAHPResults,
    computedWLCResults,
  ]);
  const sensitivityAnalysis = React.useMemo(() => {
    const baseWeight = Number(sensitivityWeightById.get(sensitivityCriterion) || 0);
    const range = Number(sensitivityRange);
    const step = Number(sensitivityStep);
    const summaryById = new Map(summaryRows.map((row) => [row.id, row]));
    const criteriaIds = CRITERIA_TABLE.map((c) => c.id);
    if (!Number.isFinite(baseWeight) || baseWeight <= 0 || !Number.isFinite(range) || !Number.isFinite(step) || step <= 0) {
      return { isReady: false, message: "Ajusta criterio, rango y paso para calcular la idoneidad." };
    }
    const maxByWeight = baseWeight > 0 ? Math.max(0, (1 / baseWeight - 1) * 100) : 0;
    const maxAllowed = Math.min(50, maxByWeight);
    const safeRange = Math.max(0, Math.min(range, maxAllowed));
    const stepCount = Math.floor(safeRange / step);
    const deltas = Array.from({ length: stepCount * 2 + 1 }, (_, i) => (i - stepCount) * step);
    const baseWeights = new Map(criteriaIds.map((cid) => [cid, Number(sensitivityWeightById.get(cid) || 0)]));
    const rows = deltas.map((delta) => {
      const wBase = baseWeight;
      let wTest = wBase * (1 + delta / 100);
      if (wTest < 0) wTest = 0;
      if (wTest > 1) wTest = 1;
      const scale = wBase < 1 ? (1 - wTest) / (1 - wBase) : 0;
      const weights = new Map(
        criteriaIds.map((cid) => {
          const w = Number(baseWeights.get(cid) || 0);
          return [cid, cid === sensitivityCriterion ? wTest : w * scale];
        })
      );
      const scoreByGroup = ["G1", "G2", "G3"].map((gid) => {
        const key = gid.toLowerCase();
        const total = criteriaIds.reduce((acc, cid) => {
          const w = Number(weights.get(cid) || 0);
          const s = Number(summaryById.get(cid)?.[key] || 0);
          return acc + w * s;
        }, 0);
        return { gid, total };
      });
      const ranking = [...scoreByGroup].sort((a, b) => b.total - a.total).map((g) => g.gid).join(" > ");
      return { delta, wTest, scores: scoreByGroup, ranking };
    });
    const baseRanking = rows.find((row) => row.delta === 0)?.ranking || "";
    const firstChange = rows.find((row) => baseRanking && row.ranking !== baseRanking) || null;
    const allSameRanking = baseRanking && rows.every((row) => row.ranking === baseRanking);
    const topGroup = baseRanking ? baseRanking.split(" > ")[0] : "";
    const critLabel = CRITERIA_TABLE.find((c) => c.id === sensitivityCriterion)?.label || sensitivityCriterion;
    const interpretationText = allSameRanking
      ? `Para la alternativa con mayor puntuacion final de idoneidad (${topGroup}), el analisis de sensibilidad aplicado al criterio ${sensitivityCriterion} (${critLabel}) con un rango de variacion de +/-${safeRange.toFixed(
          1
        )}% y un paso de incremento de ${Number(step || 0).toFixed(
          1
        )}%, no genera cambios en el ranking de los grupos. Este resultado sugiere que la eleccion de ${topGroup} como grupo MAR optimo es robusta frente a ajustes razonables en la ponderacion del criterio ${sensitivityCriterion} (${critLabel}).`
      : `Para la alternativa con mayor puntuacion final de idoneidad (${topGroup}), el analisis de sensibilidad aplicado al criterio ${sensitivityCriterion} (${critLabel}) con un rango de variacion de +/-${safeRange.toFixed(
          1
        )}% y un paso de incremento de ${Number(step || 0).toFixed(
          1
        )}%, si genera cambios en el ranking de los grupos. El cambio ocurre a partir de w_test = ${
          firstChange ? firstChange.wTest.toFixed(3) : "-"
        } (${firstChange ? firstChange.delta.toFixed(1) : "-"}%), donde el orden pasa de ${baseRanking || "-"} a ${
          firstChange ? firstChange.ranking : "-"
        }.`;
    return {
      isReady: true,
      baseWeight,
      range,
      step,
      safeRange,
      rows,
      baseRanking,
      firstChange,
      allSameRanking,
      topGroup,
      critLabel,
      interpretationText,
    };
  }, [sensitivityCriterion, sensitivityRange, sensitivityStep, sensitivityWeightById, summaryRows]);
  const sensitivitySavedAnalyses = Array.isArray(activeCase?.phase2?.sensitivityAnalyses)
    ? activeCase.phase2.sensitivityAnalyses
    : [];
  const saveSensitivityAnalysis = React.useCallback(() => {
    if (!sensitivityAnalysis?.isReady) return;
    const now = new Date().toISOString();
    patchActiveCase((c) => {
      const phase2 = { ...(c.phase2 || {}) };
      const list = Array.isArray(phase2.sensitivityAnalyses) ? [...phase2.sensitivityAnalyses] : [];
      list.unshift({
        id: `SENS_${Date.now()}`,
        createdAtISO: now,
        criterionId: sensitivityCriterion,
        criterionLabel: sensitivityAnalysis.critLabel,
        baseWeight: sensitivityAnalysis.baseWeight,
        range: sensitivityAnalysis.safeRange,
        step: sensitivityAnalysis.step,
        baseRanking: sensitivityAnalysis.baseRanking,
        topGroup: sensitivityAnalysis.topGroup,
        allSameRanking: sensitivityAnalysis.allSameRanking,
        firstChange: sensitivityAnalysis.firstChange
          ? {
              delta: sensitivityAnalysis.firstChange.delta,
              wTest: sensitivityAnalysis.firstChange.wTest,
              ranking: sensitivityAnalysis.firstChange.ranking,
            }
          : null,
        interpretation: sensitivityAnalysis.interpretationText,
      });
      phase2.sensitivityAnalyses = list;
      return { ...c, phase2 };
    });
  }, [patchActiveCase, sensitivityAnalysis, sensitivityCriterion]);
  const deleteSensitivityAnalysis = React.useCallback(
    (targetId) => {
      patchActiveCase((c) => {
        const phase2 = { ...(c.phase2 || {}) };
        const list = Array.isArray(phase2.sensitivityAnalyses)
          ? phase2.sensitivityAnalyses.filter((entry) => entry.id !== targetId)
          : [];
        phase2.sensitivityAnalyses = list;
        return { ...c, phase2 };
      });
    },
    [patchActiveCase]
  );
  const clearSensitivityAnalyses = React.useCallback(() => {
    if (!sensitivitySavedAnalyses.length) return;
    const ok = window.confirm("Se eliminarán todos los análisis guardados. ¿Deseas continuar?");
    if (!ok) return;
    patchActiveCase((c) => {
      const phase2 = { ...(c.phase2 || {}) };
      phase2.sensitivityAnalyses = [];
      return { ...c, phase2 };
    });
  }, [patchActiveCase, sensitivitySavedAnalyses.length]);
  const v8Var = React.useMemo(() => scoreById.get("V8") || null, [scoreById]);
  const v8Value = React.useMemo(() => String(v8Var?.reason || ""), [v8Var]);
  const v8ScoreByGroup = React.useMemo(() => v8Var?.scoreByGroup || {}, [v8Var]);
  const v2Var = React.useMemo(() => scoreById.get("V2") || null, [scoreById]);
  const v2Value = React.useMemo(() => String(v2Var?.reason || ""), [v2Var]);
  const v2ScoreByGroup = React.useMemo(() => v2Var?.scoreByGroup || {}, [v2Var]);
  const v2Inputs = React.useMemo(() => (Array.isArray(v2Var?.inputs) ? v2Var.inputs : []), [v2Var]);
  const v2Maps = React.useMemo(() => (Array.isArray(v2Var?.maps) ? v2Var.maps : []), [v2Var]);
  const v2InputsPresent = React.useMemo(() => v2Inputs.filter((inp) => inp && !inp.missing).length, [v2Inputs]);
  const v2MapsPresent = React.useMemo(() => v2Maps.filter((mp) => mp && mp.hasFile).length, [v2Maps]);
  const v2EvidenceTotal = v2Inputs.length + v2Maps.length;
  const v2EvidencePresent = v2InputsPresent + v2MapsPresent;
  const v2ManualValue = manualScores?.V2;
  const v2HasManual =
    manualAdjustmentsEnabled && manualOverrides?.V2 === true && v2ManualValue !== undefined && v2ManualValue !== null && v2ManualValue !== "";
  const v3Var = React.useMemo(() => scoreById.get("V3") || null, [scoreById]);
  const v3ScoreByGroup = React.useMemo(() => v3Var?.scoreByGroup || {}, [v3Var]);
  const v3Inputs = React.useMemo(() => (Array.isArray(v3Var?.inputs) ? v3Var.inputs : []), [v3Var]);
  const v3Maps = React.useMemo(() => (Array.isArray(v3Var?.maps) ? v3Var.maps : []), [v3Var]);
  const v3InputsPresent = React.useMemo(() => {
    if (!caseData) return 0;
    const keys = ["nombre_unidad_geologica", "descripcion_unidad_geologica", "profundidad_unidad_geologica_m", "escala_mapa_geologico"];
    const isPresent = (value) => {
      if (value === null || value === undefined) return false;
      const s = String(value).trim();
      if (!s) return false;
      if (s === "No_reportado" || s === "No reportado") return false;
      return true;
    };
    return keys.filter((key) => isPresent(readCaseValue(caseData, "geologico", key))).length;
  }, [caseData]);
  const v3MapsPresent = React.useMemo(() => v3Maps.filter((mp) => mp && mp.hasFile).length, [v3Maps]);
  const v3EvidenceTotal = 5;
  const v3EvidencePresent = v3InputsPresent + (v3MapsPresent > 0 ? 1 : 0);
  const v3ManualValue = manualScores?.V3;
  const v3HasManual =
    manualAdjustmentsEnabled && manualOverrides?.V3 === true && v3ManualValue !== undefined && v3ManualValue !== null && v3ManualValue !== "";
  const v4Var = React.useMemo(() => scoreById.get("V4") || null, [scoreById]);
  const v4ScoreByGroup = React.useMemo(() => v4Var?.scoreByGroup || {}, [v4Var]);
  const v4Inputs = React.useMemo(() => (Array.isArray(v4Var?.inputs) ? v4Var.inputs : []), [v4Var]);
  const v4Maps = React.useMemo(() => (Array.isArray(v4Var?.maps) ? v4Var.maps : []), [v4Var]);
  const v4InputsPresent = React.useMemo(() => v4Inputs.filter((inp) => inp && !inp.missing).length, [v4Inputs]);
  const v4MapsPresent = React.useMemo(() => v4Maps.filter((mp) => mp && mp.hasFile).length, [v4Maps]);
  const v4GroupedMapsPresent = v4MapsPresent > 0 ? 1 : 0;
  const v4EvidenceTotal = v4Inputs.length + (v4Maps.length ? 1 : 0);
  const v4EvidencePresent = v4InputsPresent + v4GroupedMapsPresent;
  const v4ManualValue = manualScores?.V4;
  const v4HasManual =
    manualAdjustmentsEnabled && manualOverrides?.V4 === true && v4ManualValue !== undefined && v4ManualValue !== null && v4ManualValue !== "";
  const v5Var = React.useMemo(() => scoreById.get("V5") || null, [scoreById]);
  const v5ScoreByGroup = React.useMemo(() => v5Var?.scoreByGroup || {}, [v5Var]);
  const v5Inputs = React.useMemo(() => (Array.isArray(v5Var?.inputs) ? v5Var.inputs : []), [v5Var]);
  const v5Maps = React.useMemo(() => (Array.isArray(v5Var?.maps) ? v5Var.maps : []), [v5Var]);
  const v5InputsPresent = React.useMemo(() => v5Inputs.filter((inp) => inp && !inp.missing).length, [v5Inputs]);
  const v5MapsPresent = React.useMemo(() => v5Maps.filter((mp) => mp && mp.hasFile).length, [v5Maps]);
  const v5GroupedMapsPresent = v5Maps.length && v5MapsPresent === v5Maps.length ? 1 : 0;
  const v5EvidenceTotal = v5Inputs.length + (v5Maps.length ? 1 : 0);
  const v5EvidencePresent = v5InputsPresent + v5GroupedMapsPresent;
  const v5ManualValue = manualScores?.V5;
  const v5HasManual =
    manualAdjustmentsEnabled && manualOverrides?.V5 === true && v5ManualValue !== undefined && v5ManualValue !== null && v5ManualValue !== "";
  const v6Var = React.useMemo(() => scoreById.get("V6") || null, [scoreById]);
  const v6ScoreByGroup = React.useMemo(() => v6Var?.scoreByGroup || {}, [v6Var]);
  const v6Inputs = React.useMemo(() => (Array.isArray(v6Var?.inputs) ? v6Var.inputs : []), [v6Var]);
  const v6InputsPresent = React.useMemo(() => v6Inputs.filter((inp) => inp && !inp.missing).length, [v6Inputs]);
  const v6EvidenceTotal = v6Inputs.length;
  const v6EvidencePresent = v6InputsPresent;
  const v6ManualValue = manualScores?.V6;
  const v6HasManual =
    manualAdjustmentsEnabled && manualOverrides?.V6 === true && v6ManualValue !== undefined && v6ManualValue !== null && v6ManualValue !== "";
  const v7Var = React.useMemo(() => scoreById.get("V7") || null, [scoreById]);
  const v7RawValue = React.useMemo(
    () => (Array.isArray(v7Var?.inputs) ? v7Var.inputs : []).find((inp) => !inp?.missing)?.value ?? "",
    [v7Var]
  );
  const v7Value = React.useMemo(() => String(v7RawValue || v7Var?.reason || ""), [v7RawValue, v7Var]);
  const v7ScoreByGroup = React.useMemo(() => v7Var?.scoreByGroup || {}, [v7Var]);
  const v7ManualValue = manualScores?.V7;
  const v7HasManual =
    manualAdjustmentsEnabled && manualOverrides?.V7 === true && v7ManualValue !== undefined && v7ManualValue !== null && v7ManualValue !== "";
  const v9Var = React.useMemo(() => scoreById.get("V9") || null, [scoreById]);
  const v9Value = React.useMemo(() => String(v9Var?.reason || ""), [v9Var]);
  const v9ScoreByGroup = React.useMemo(() => v9Var?.scoreByGroup || {}, [v9Var]);
  const v9ManualValue = manualScores?.V9;
  const v9HasManual =
    manualAdjustmentsEnabled && manualOverrides?.V9 === true && v9ManualValue !== undefined && v9ManualValue !== null && v9ManualValue !== "";
  const v11Var = React.useMemo(() => scoreById.get("V11") || null, [scoreById]);
  const v11Value = React.useMemo(() => String(v11Var?.reason || ""), [v11Var]);
  const v11ScoreByGroup = React.useMemo(() => v11Var?.scoreByGroup || {}, [v11Var]);
  const v11ManualValue = manualScores?.V11;
  const v11HasManual =
    manualAdjustmentsEnabled &&
    !manualLockedIds.has("V11") &&
    manualOverrides?.V11 === true &&
    v11ManualValue !== undefined &&
    v11ManualValue !== null &&
    v11ManualValue !== "";
  const v12Var = React.useMemo(() => scoreById.get("V12") || null, [scoreById]);
  const v12Value = React.useMemo(() => String(v12Var?.reason || ""), [v12Var]);
  const v12ScoreByGroup = React.useMemo(() => v12Var?.scoreByGroup || {}, [v12Var]);
  const v12ManualValue = manualScores?.V12;
  const v12HasManual =
    manualAdjustmentsEnabled &&
    !manualLockedIds.has("V12") &&
    manualOverrides?.V12 === true &&
    v12ManualValue !== undefined &&
    v12ManualValue !== null &&
    v12ManualValue !== "";
  const v24Var = React.useMemo(() => scoreById.get("V24") || null, [scoreById]);
  const v24Value = React.useMemo(() => String(v24Var?.reason || ""), [v24Var]);
  const v24ScoreByGroup = React.useMemo(() => v24Var?.scoreByGroup || {}, [v24Var]);
  const v24ManualValue = manualScores?.V24;
  const v24HasManual =
    manualAdjustmentsEnabled &&
    !manualLockedIds.has("V24") &&
    manualOverrides?.V24 === true &&
    v24ManualValue !== undefined &&
    v24ManualValue !== null &&
    v24ManualValue !== "";
  const v25Var = React.useMemo(() => scoreById.get("V25") || null, [scoreById]);
  const v25Value = React.useMemo(() => String(v25Var?.reason || ""), [v25Var]);
  const v25ScoreByGroup = React.useMemo(() => v25Var?.scoreByGroup || {}, [v25Var]);
  const v25ManualValue = manualScores?.V25;
  const v25HasManual =
    manualAdjustmentsEnabled &&
    !manualLockedIds.has("V25") &&
    manualOverrides?.V25 === true &&
    v25ManualValue !== undefined &&
    v25ManualValue !== null &&
    v25ManualValue !== "";
  const onToggleCustomInfluence = React.useCallback(
    (flag) => {
      patchActiveCase((c) => ({
        ...c,
        phase2: { ...(c.phase2 || {}), useCustomInfluence: flag },
      }));
    },
    [patchActiveCase]
  );
  const onCustomInfluenceChange = React.useCallback(
    (varId, groupId, value) => {
      patchActiveCase((c) => {
        const phase2 = { ...(c.phase2 || {}) };
        const map = { ...(phase2.customInfluenceByVar || {}) };
        const entry = { ...(map[varId] || {}) };
        if (value === null) {
          delete entry[groupId];
        } else {
          entry[groupId] = value;
        }
        if (Object.keys(entry).length) map[varId] = entry;
        else delete map[varId];
        phase2.customInfluenceByVar = map;
        return { ...c, phase2 };
      });
    },
    [patchActiveCase]
  );
  const onResetCustomInfluence = React.useCallback(() => {
    patchActiveCase((c) => ({
      ...c,
      phase2: { ...(c.phase2 || {}), customInfluenceByVar: {} },
    }));
  }, [patchActiveCase]);
  const scrollToRef = React.useCallback((ref) => {
    if (!ref?.current) return;
    if (typeof ref.current.scrollIntoView === "function") {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  React.useEffect(() => {
    if (!activeRoute) return;
    setVisitedRoutes((prev) => {
      const next = new Set(prev);
      next.add(activeRoute);
      return next;
    });
  }, [activeRoute]);

  const scenarioId = React.useMemo(() => {
    if (fullReady) return 3;
    if (scenario2Ready) return 2;
    if (scenario1Ready) return 1;
    return 0;
  }, [fullReady, scenario1Ready, scenario2Ready]);
  const hasVisitedRoute = React.useMemo(() => visitedRoutes.size > 0, [visitedRoutes]);
  const resultsUnlocked = React.useMemo(() => scenarioId > 0 && hasVisitedRoute, [hasVisitedRoute, scenarioId]);

  React.useEffect(() => {
    if (resultsUnlocked && resultsBlockedNotice) {
      setResultsBlockedNotice("");
    }
  }, [resultsBlockedNotice, resultsUnlocked]);
  const goToPhase3 = React.useCallback(() => {
    if (!resultsUnlocked) {
      setResultsBlockedNotice("Selecciona una ruta y asegúrate de que un escenario esté en estudio para acceder a resultados.");
      return;
    }
    if (typeof onGoPhase3 === "function") {
      onGoPhase3();
      return;
    }
    scrollToRef(resultadosRef);
  }, [onGoPhase3, resultsUnlocked, scrollToRef]);
  const customInfluenceAllowedIds = React.useMemo(() => {
    if (!customInfluenceEnabled) return null;
    if (isScenario1Active) return new Set(scenario1RequiredIds);
    if (isScenario2Active) return new Set(scenario2RequiredIds);
    return null;
  }, [customInfluenceEnabled, isScenario1Active, isScenario2Active, scenario1RequiredIds, scenario2RequiredIds]);

  const getMissingModules = React.useCallback(
    (targetScenario) => {
      const vars = effectiveRouteAScores?.variables || [];
      const requiredIds = targetScenario === 2 ? phase2RequiredIds : [];
      const candidates =
        targetScenario === 2
          ? vars.filter((v) => requiredIds.includes(v.id) && v.missing)
          : vars.filter((v) => v.missing);

      const modules = new Set();
      for (const v of candidates) {
        for (const inp of v.inputs || []) {
          if (inp.missing && inp.moduleId) modules.add(inp.moduleId);
        }
        for (const mp of v.maps || []) {
          if (!mp.hasFile) {
            const mid = layerModuleMap.get(mp.layerId);
            if (mid) modules.add(mid);
          }
        }
      }
      return Array.from(modules);
    },
    [layerModuleMap, phase2RequiredIds, effectiveRouteAScores]
  );

  const navigateToInsumos = React.useCallback(
    (targetScenario, missingModules) => {
      try {
        window.dispatchEvent(
          new CustomEvent("sigmma:scenario-insumos", {
            detail: { scenario: targetScenario, modules: missingModules, caseId: activeCaseId },
          })
        );
      } catch {}
      try {
        window.dispatchEvent(new CustomEvent("sigmma:navigate", { detail: { to: "insumos", caseId: activeCaseId } }));
      } catch {}
      try {
        window.location.hash = "#insumos";
      } catch {}
    },
    [activeCaseId]
  );

  const goToInsumoModule = React.useCallback(
    (moduleId) => {
      if (!moduleId) return;
      navigateToInsumos(scenarioId || 0, [moduleId]);
    },
    [navigateToInsumos, scenarioId]
  );

  const onSelectScenario = React.useCallback(
    (targetScenario) => {
      if (targetScenario === 1) {
        if (scenarioId >= 2) {
          const ok = window.confirm(
            "Si vuelves al Escenario 1 se eliminarán los insumos adicionales. Solo se conservarán los 5 campos con (*). ¿Deseas continuar?"
          );
          if (!ok) return;
          patchActiveCase((c) => {
            const next = { ...c };

            const keepByModule = new Map();
            for (const f of MIN_REQUIRED || []) {
              if (!keepByModule.has(f.moduleId)) keepByModule.set(f.moduleId, new Set());
              keepByModule.get(f.moduleId).add(f.key);
            }

            for (const mod of CATALOG.modules || []) {
              const mid = mod.id;
              const keep = keepByModule.get(mid);
              const base = { ...(next?.[mid] || {}) };
              const filtered = {};
              if (keep) {
                for (const key of keep) {
                  if (key in base) filtered[key] = base[key];
                }
              }
              next[mid] = filtered;

              const entriesKey = `${mid}_entries`;
              if (Array.isArray(next?.[entriesKey])) {
                next[entriesKey] = keep ? [{ ...filtered }] : [];
              }
            }

            next.mapUploads = {};
            next.mapMeta = {};
            next.mapLayersByModule = Object.fromEntries((CATALOG.modules || []).map((m) => [m.id, []]));
            next.mapCustomLayersByModule = Object.fromEntries((CATALOG.modules || []).map((m) => [m.id, []]));

            return next;
          });
        }
        return;
      }

      if (!scenario1Ready) {
        alert("Completa primero el mínimo del Escenario 1 para continuar.");
        navigateToInsumos(targetScenario, []);
        return;
      }

      if (targetScenario === 2 && !scenario2Ready) {
        const missingModules = getMissingModules(2);
        alert("Para habilitar el Escenario 2 debes completar insumos adicionales en Fase 1. ¿Te llevamos all??.");
        navigateToInsumos(2, missingModules);
        return;
      }

      if (targetScenario === 3 && !scenario2Ready) {
        const missingModules = getMissingModules(2);
        alert("Para habilitar el Escenario 3 debes completar primero el minimo del Escenario 2. Te llevamos alla?");
        navigateToInsumos(2, missingModules);
        return;
      }

      if (targetScenario === 3 && !fullReady) {
        const missingModules = getMissingModules(3);
        alert("Para habilitar el Escenario 3 debes completar todos los insumos. Te llevamos alla?");
        navigateToInsumos(3, missingModules);
      }
    },
    [fullReady, getMissingModules, navigateToInsumos, patchActiveCase, scenario1Ready, scenario2Ready, scenarioId]
  );

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.sigmmaCurrentScenarioId = scenarioId;
    try {
      window.dispatchEvent(
        new CustomEvent("sigmma:scenario-changed", {
          detail: { scenarioId },
        })
      );
    } catch {}
  }, [scenarioId]);

  React.useEffect(() => {
    if (typeof window === "undefined") return () => {};
    const listener = (event) => {
      const target = event?.detail?.targetScenario;
      if (!target) return;
      onSelectScenario(target);
    };
    window.addEventListener("sigmma:scenario-request", listener);
    return () => window.removeEventListener("sigmma:scenario-request", listener);
  }, [onSelectScenario]);
  const isManualLockedByInfluence = React.useCallback(
    (id) => !isManualAdjustEnabled(id) || (customInfluenceEnabled && (scenarioId === 1 || scenarioId === 2)),
    [customInfluenceEnabled, isManualAdjustEnabled, scenarioId]
  );

  const getScore = (id) => {
    if (isScenario1BlockedVar(id)) return 0;
    const vInfo = scoreById.get(id);
    const override = manualScores?.[id];
    const hasManual = override !== undefined && override !== null && override !== "";
    const autoScore = Number(vInfo?.score04 || 0);
    const isSoftLocked = manualLockedIfCompleteIds.has(id);
    const isComplete = vInfo && !vInfo.missing;
    const allowManual = !manualLockedIds.has(id) && (!isSoftLocked || !isComplete);
    const manualDiffers =
      !isManualLockedByInfluence(id) &&
      allowManual &&
      hasManual &&
      manualOverrides?.[id] &&
      Number(override) !== autoScore;
    if (isManualLockedByInfluence(id)) return autoScore;
    if (manualDiffers) return Number(override);
    return autoScore;
  };

  const onManualScoreChange = (id, value) => {
    if (manualLockedIds.has(id) || isScenario1BlockedVar(id) || isManualLockedByInfluence(id)) return;
    if (manualLockedIfCompleteIds.has(id) && !scoreById.get(id)?.missing) return;
    const v = Math.max(0, Math.min(4, Number(value)));
    patchActiveCase((c) => ({
      ...c,
      phase2: {
        ...(c.phase2 || {}),
        manualScores: { ...(c.phase2?.manualScores || {}), [id]: v },
        manualOverrides: { ...(c.phase2?.manualOverrides || {}), [id]: true },
      },
    }));
  };

  const onUseDefaultWeights = (flag) => {
    patchActiveCase((c) => ({
      ...c,
      weights: flag ? { ...(c.weights || {}), ...DEFAULT_WEIGHTS } : { ...(c.weights || {}) },
      phase2: { ...(c.phase2 || {}), useDefaultWeights: flag },
    }));
  };

  const onWeightChange = (criterionId, value) => {
    const v = Number(value);
    patchActiveCase((c) => ({
      ...c,
      weights: { ...(c.weights || {}), [criterionId]: v },
      phase2: { ...(c.phase2 || {}), useDefaultWeights: false },
    }));
  };

  const totalWeight = CRITERIA_TABLE.reduce((acc, c) => acc + (Number(activeCase?.weights?.[c.id]) || 0), 0);
  const weightOk = totalWeight === 100;

  const VISIBLE_VARIABLE_IDS = new Set([
    "V1",
    "V2",
    "V3",
    "V4",
    "V5",
    "V6",
    "V7",
    "V8",
    "V9",
    "V11",
    "V12",
    "V13",
    "V14",
    "V15",
    "V16",
    "V17",
    "V18",
    "V19",
    "V20",
    "V21",
    "V22",
    "V23",
    "V24",
    "V25",
    "V26",
    "V28",
    "V29",
    "V32",
    "V33",
    "V34",
    "V35",
  ]);

  const visibleVars = VARIABLE_GUIDE.filter((v) => VISIBLE_VARIABLE_IDS.has(v.id));
  const yesNoVars = visibleVars.filter((v) => v.options.length === 2);
  const multiVars = visibleVars.filter((v) => v.options.length !== 2);
  const rigorVarIds = React.useMemo(() => ["V36", "V37"], []);
  const rigorVars = React.useMemo(
    () => VARIABLE_GUIDE.filter((v) => rigorVarIds.includes(v.id)),
    [rigorVarIds]
  );

  const handleRouteSelect = React.useCallback(
    (id) => {
      setVisitedRoutes((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      if (onSelectRoute) onSelectRoute(id);
      const target = id === "A" ? routeARef.current : routeBRef.current;
      if (target && typeof target.scrollIntoView === "function") {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [onSelectRoute]
  );

  const handleRouteBDecision = React.useCallback(
    (evaluateRouteB) => {
      setRouteBDialogOpen(false);
      if (evaluateRouteB) {
        handleRouteSelect("B");
        return;
      }
      goToPhase3();
    },
    [goToPhase3, handleRouteSelect]
  );

  const handleResultadosClick = React.useCallback(() => {
    if (!resultsUnlocked) {
      setResultsBlockedNotice("Selecciona una ruta y asegúrate de que un escenario esté en estudio para acceder a resultados.");
      return;
    }
    setResultsBlockedNotice("");
    setRouteBDialogOpen(true);
  }, [resultsUnlocked]);

const renderScoreControl = (item) => {
    const score = getScore(item.id);
    const displayScore = Number.isFinite(score) ? Math.round(score) : 0;
    const color = scaleColor(score);
    const vInfo = scoreById.get(item.id);
    const manualValue = manualScores?.[item.id];
    const hasManual =
      isManualAdjustEnabled(item.id) &&
      manualOverrides?.[item.id] === true &&
      manualValue !== undefined &&
      manualValue !== null &&
      manualValue !== "";
    const autoScore = Number(vInfo?.score04 || 0);
    const isSoftLocked = manualLockedIfCompleteIds.has(item.id);
    const isComplete = vInfo && !vInfo.missing;
    const allowManual = !manualLockedIds.has(item.id) && (!isSoftLocked || !isComplete);
    const isManual = isManualAdjustEnabled(item.id) && allowManual && hasManual && Number(manualValue) !== autoScore;
    const inputsLabel =
      item.inputs === "NA"
        ? "No aplica (se responde en esta ruta)."
        : item.inputs;
    const isYesNo = item.options.length === 2;
    const isRigor = rigorVarIds.includes(item.id);
    const cardBg = isYesNo ? "#fff7d6" : "#e3efff";
    const cardBorder = isYesNo ? "#f3dc98" : "#c7dcff";
    const moduleIdForLink =
      item.id === "V2"
        ? "caracterizacion"
        : vInfo?.inputs?.find((inp) => inp?.moduleId)?.moduleId || null;
    const inputs = Array.isArray(vInfo?.inputs) ? vInfo.inputs : [];
    const maps = Array.isArray(vInfo?.maps) ? vInfo.maps : [];
    const inputsPresent = inputs.filter((inp) => !inp?.missing).length;
    const mapsPresent = maps.filter((mp) => mp && mp.hasFile).length;
    const isEvidenceValue = (value) => {
      if (value === null || value === undefined) return false;
      const s = String(value).trim();
      if (!s) return false;
      if (s === "No_reportado" || s === "No reportado") return false;
      return true;
    };
    const v3InputsPresent =
      item.id === "V3"
        ? [
            "nombre_unidad_geologica",
            "descripcion_unidad_geologica",
            "profundidad_unidad_geologica_m",
            "escala_mapa_geologico",
          ].filter((key) => isEvidenceValue(readCaseValue(caseData, "geologico", key))).length
        : 0;
    const v3MapsPresent = item.id === "V3" ? maps.filter((mp) => mp && mp.hasFile).length : 0;
    const v3EvidencePresent = item.id === "V3" ? v3InputsPresent + (v3MapsPresent > 0 ? 1 : 0) : null;
    const v3EvidenceTotal = item.id === "V3" ? 5 : null;
    const isGroupedEvidence = item.id === "V4" || item.id === "V5";
    const groupedMapsPresent =
      item.id === "V4"
        ? mapsPresent > 0
          ? 1
          : 0
        : item.id === "V5"
        ? maps.length && mapsPresent === maps.length
          ? 1
          : 0
        : mapsPresent;
    const evidenceTotal =
      item.id === "V3"
        ? v3EvidenceTotal
        : isGroupedEvidence
        ? inputs.length + (maps.length ? 1 : 0)
        : inputs.length + maps.length;
    const evidencePresent =
      item.id === "V3"
        ? v3EvidencePresent
        : isGroupedEvidence
        ? inputsPresent + groupedMapsPresent
        : inputsPresent + mapsPresent;
    const reasonText = isManual
      ? "Ajuste manual."
      : evidenceTotal > 0
      ? `Evidencia: ${evidencePresent}/${evidenceTotal}`
      : vInfo?.reason
      ? `Evidencia: ${vInfo.reason}`
      : "Sin evidencia.";
    const totalItems = inputs.length + maps.length;
    const missingItems =
      inputs.filter((inp) => inp?.missing).length +
      maps.filter((mp) => mp && mp.hasFile === false).length;
    const missingMapLabels = maps
      .filter((mp) => mp && mp.hasFile === false)
      .map((mp) => mp.label || mp.layerId)
      .map((label) => {
        if (item.id === "V2" && label === "Unidades (UHG)") return "Unidades Hidrogeológicas";
        return label;
      });
    const insumoStatus = (() => {
      if (inputsLabel === "No aplica (se responde en esta ruta).") {
        return { label: "No aplica", color: "#475569", bg: "#e2e8f0" };
      }
      if (!totalItems) return { label: "Sin insumo", color: "#6b7280", bg: "#e5e7eb" };
      if (!missingItems) return { label: "Completo", color: "#166534", bg: "#dcfce7" };
      if (missingItems < totalItems) return { label: "Parcial", color: "#92400e", bg: "#fef3c7" };
      return { label: "Falta", color: "#b91c1c", bg: "#fee2e2" };
    })();
    const manualAllowedByScenario =
      !manualLockedIds.has(item.id) &&
      (scenarioId === 3 ||
        (scenarioId === 2 && scenario2RequiredIds.includes(item.id)) ||
        (scenarioId === 1 && scenario1RequiredIds.includes(item.id)));
    const allowManualWhenMissing =
      isSoftLocked && (insumoStatus.label === "Falta" || insumoStatus.label === "No aplica");
    const canManual = allowManualWhenMissing || manualAllowedByScenario;
    const isScenario1Blocked = scenarioId === 1 && !scenario1RequiredIds.includes(item.id);
    const isScenario2Blocked = scenarioId === 2 && !scenario2RequiredIds.includes(item.id);
    const disableSlider =
      isManualLockedByInfluence(item.id) ||
      isScenario1Blocked ||
      isScenario2Blocked ||
      manualLockedIds.has(item.id) ||
      (isSoftLocked && insumoStatus.label !== "Falta" && insumoStatus.label !== "No aplica") ||
      ((insumoStatus.label === "Falta" || insumoStatus.label === "No aplica") && !canManual);
    return (
      <div
        key={item.id}
        style={{
          background: cardBg,
          borderRadius: 14,
          padding: 12,
          boxShadow: "0 1px 0 rgba(0,0,0,.04)",
          border: `1px solid ${cardBorder}`,
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 16 }}>
          {item.id}. {item.question}
        </div>

        <div style={{ marginTop: 6, fontSize: 13, opacity: 0.8 }}>
          Insumo relacionado:{" "}
          {inputsLabel === "No aplica (se responde en esta ruta)." || !moduleIdForLink ? (
            inputsLabel
          ) : (
            <button
              type="button"
              onClick={() => goToInsumoModule(moduleIdForLink)}
              style={{
                border: "none",
                background: "none",
                padding: 0,
                color: "#1d4ed8",
                textDecoration: "underline",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              {inputsLabel}
            </button>
          )}
        </div>
        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.85, display: "flex", alignItems: "center", gap: 6 }}>
          <span>Estado del insumo:</span>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: 999,
              background: insumoStatus.bg,
              color: insumoStatus.color,
              fontWeight: 700,
              fontSize: 11,
            }}
          >
            {insumoStatus.label}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
          <input
            type="range"
            min="0"
            max="4"
            step="1"
            value={score}
            onChange={(e) => onManualScoreChange(item.id, e.target.value)}
            disabled={disableSlider}
            style={{
              flex: 1,
              accentColor: color,
              opacity: disableSlider ? 0.55 : 1,
              cursor: disableSlider ? "not-allowed" : "pointer",
            }}
          />
          <div
            style={{
              width: 36,
              height: 32,
              borderRadius: 10,
              background: color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
            }}
          >
            {displayScore}
          </div>
        </div>
        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.85 }}>
          Puntaje ({displayScore}): {reasonText}
        </div>
        {isRigor ? (
          <div
            style={{
              marginTop: 10,
              padding: 10,
              borderRadius: 12,
              background: "#ffffff",
              border: "1px solid rgba(0,0,0,.08)",
              fontSize: 14,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Cálculo:</div>
            {["G1", "G2", "G3"].map((gid) => {
              const scoreG = getEffectiveGroupScore(item.id, gid, vInfo?.scoreByGroup?.[gid]);
              return (
                <div key={gid} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, minWidth: 24 }}>{gid}</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ position: "relative", display: "inline-block", paddingRight: "0.75em" }}>
                      S
                      <span style={{ position: "absolute", top: "-0.45em", right: 0, fontSize: "0.65em" }}>G</span>
                    </span>
                    <span>=</span>
                    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", lineHeight: 1.1 }}>
                      <span style={{ padding: "0 6px", borderBottom: "1px solid #111" }}>{formatScore(scoreG)}</span>
                      <span style={{ padding: "0 6px" }}>1</span>
                    </span>
                    <span>=</span>
                    <span>{formatScore(scoreG)}</span>
                  </span>
                </div>
              );
            })}
          </div>
        ) : null}
        {isScenario1Blocked ? (
          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
            Bloqueado en el Escenario 1 (no requerido).
          </div>
        ) : isScenario2Blocked ? (
          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
            Bloqueado en el Escenario 2 (no requerido).
          </div>
        ) : isManualAdjustEnabled(item.id) && !manualLockedIds.has(item.id) ? (
          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
            Valor sugerido automáticamente según los insumos. Puedes ajustarlo si lo deseas.
          </div>
        ) : (
          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
            Valor sugerido automáticamente según los insumos.
          </div>
        )}
        {missingMapLabels.length ? (
          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>
            Falta el mapa: {missingMapLabels.join(", ")}
          </div>
        ) : null}
      </div>
    );
  };
  if (!canRender) return null;
  return (
    <>
      <div className="panel-card" style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 6 }}>Escenarios de información</div>
      <p style={{ marginTop: 0, opacity: 0.9 }}>
       Un escenario de información es un nivel de análisis definido por la disponibilidad, calidad y completitud de los datos técnicos recopilados durante la fase de insumos.
      </p>
      <p style={{ marginTop: 8, opacity: 0.9 }}>
        Al diligenciar la fase de insumos, el sistema determina por defecto el escenario correspondiente, sincronizando automáticamente los datos y evidencias cargados para articular las fases metodológicas de manera coherente. No obstante, el usuario mantiene la flexibilidad de elegir el escenario en el cual situarse, siempre que cumpla estrictamente con el Índice de Completitud y los insumos requeridos para dicho nivel de análisis. Esta integración asegura que la Ruta A procese variables estandarizadas bajo un esquema conceptual validado, optimizando la precisión del cálculo final y permitiendo una gestión robusta de los niveles de incertidumbre y confiabilidad de los resultados obtenidos.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
        {SCENARIO_INFO.map((s) => {
          const isSelected = s.id === scenarioId;
          return (
          <div
            key={s.id}
            style={{
              border: isSelected ? "2px solid #2563eb" : "1px solid rgba(0,0,0,.12)",
              borderRadius: 14,
              padding: 14,
              background: isSelected ? "#eef5ff" : "#fff",
              boxShadow: "0 1px 0 rgba(0,0,0,.04)",
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 16 }}>{s.title}</div>
            <div
              style={{
                marginTop: 6,
                fontSize: 13,
                color: s.id < 3 ? "#b91c1c" : "#15803d",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {s.id < 3 ? "\u26A0" : "\u2714"}
              <span>{s.warn}</span>
            </div>
            <p style={{ fontSize: 13, opacity: 0.85, marginTop: 10 }}>{s.desc}</p>
            <button
              type="button"
              onClick={() => onSelectScenario(s.id)}
              style={{
                borderRadius: 12,
                padding: "8px 14px",
                border: "1.5px solid #1d4ed8",
                background: isSelected ? "#1d4ed8" : "#fff",
                color: isSelected ? "#fff" : "#111827",
                fontWeight: 700,
              }}
            >
              {isSelected ? "Escenario actual" : "Usar escenario"}
            </button>
          </div>
          );
        })}
      </div>

      <p style={{ marginTop: 10, opacity: 0.9 }}>
        El sistema opera bajo dos dimensiones complementarias: primero, los Escenarios de Información (macro),
        que ofrecen un resumen del avance general del caso; y segundo, la Guía del Esquema (micro), la cual
        valida cada insumo y pregunta de manera detallada. Este análisis permite evaluar la idoneidad de
        las condiciones, identificar faltantes de información y justificar técnicamente el puntaje asignado
        a cada variable.
      </p>

      {!fullReady ? (
        <div style={{ marginTop: 10, fontSize: 13, color: "#b91c1c" }}>
          Faltan insumos para Escenario 3: Volumen - Capacidad, Infraestructura, Comunidad - uso final, Relieve - Clima
        </div>
      ) : null}


      <p style={{ marginTop: 8, opacity: 0.9 }}>
        Con la información consolidada en Insumos, el sistema habilita dos rutas de procesamiento alineadas con el mismo esquema conceptual de decisión. Ambas buscan producir resultados comparables, trazables y justificables; sin embargo, se diferencian en la forma de estructurar la evaluación y, por tanto, en el papel que asume el usuario durante el proceso.
      </p>

      <p style={{ marginTop: 2, opacity: 0.92 }}>
        <strong>¡Selecciona la ruta de tu preferencia!</strong>.
      </p>

      <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
        {[
          { id: "A", label: "Ruta A" },
          { id: "B", label: "Ruta B" },
        ].map((btn) => {
          const isActive = activeRoute === btn.id;
          return (
            <button
              key={btn.id}
              type="button"
              onClick={() => handleRouteSelect(btn.id)}
              style={{
                padding: "10px 16px",
                borderRadius: 999,
                border: "1px solid rgba(0,0,0,.18)",
                background: isActive ? "#2563eb" : "#fff",
                color: isActive ? "#fff" : "#111827",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {btn.label}
            </button>
          );
        })}
      </div>

      <hr style={{ margin: "18px 0" }} />

      <div style={{ display: activeRoute === "A" ? "block" : "none" }}>
        <div ref={routeARef} />

        <div style={{ marginTop: 8 }}>
          <p style={{ marginTop: 0, opacity: 0.8 }}>
            Conceptos a tener en cuenta para facilitar la comprensión de la ruta.
          </p>
          <div style={{ marginTop: 8, padding: 12, borderRadius: 12, background: "#f8fafc", border: "1px solid rgba(0,0,0,.08)" }}>
            <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 20 }}>Glosario</div>
            <div style={{ fontSize: 16 }}><strong>Grupo (G1)</strong>: Infiltración superficial.</div>
            <div style={{ fontSize: 16 }}><strong>Grupo (G2)</strong>: Recarga mediante pozos y perforaciones.</div>
            <div style={{ fontSize: 16 }}><strong>Grupo (G3)</strong>: Intervención del cauce.</div>
            <div style={{ fontSize: 16 }}><strong>V</strong>: variables/preguntas del esquema conceptual (V1-V35), descritos en la Introducción.</div>
            <div style={{ fontSize: 16 }}><strong>C</strong>: criterios de evaluación (C1-C5), descritos en la Introducción.</div>
          </div>
        </div>

        <div style={{ marginTop: 8 }}>
          <div style={{ fontWeight: 800, fontSize: 20 }}>Ruta A: Proceso Jerárquico Analítico</div>
          <p style={{ marginTop: 6, opacity: 0.92 }}>
            Esta ruta constituye el marco metodológico para transformar la evidencia técnica de un caso en criterios comparables que determinen la idoneidad de los grupos de Recarga Gestionada. El proceso se desarrolla en dos dimensiones integradas: (1) <strong>Estructura Jerárquica:</strong> Organiza la toma de decisiones en tres niveles descendentes que son criterios generales (C1-C6), variables específicas (V1-V35) e integración por grupos (G1, G2 Y G3). y (2) <strong>Flujo Operativo:</strong> Avanza a trav&eacute;s de tres etapas consecutivas (Figura 6), desde la consolidaci&oacute;n de insumos hasta el an&aacute;lisis de robustez.
          </p>
          <div style={{ textAlign: "center" }}>
            <div style={{ marginTop: 8, display: "grid", justifyItems: "center", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 14 }}>
                <div style={{ width: 560 }} />
              </div>
              {[
                {
                  title: "Etapa 1: Insumos - Esquema conceptual de decisión",
                  body: "Objetivos, caracterización de acuíferos, fuente de agua",
                  purpose:
                    "Organizar la información técnica para definir las variables que condicionan el proyecto. Como resultado, se obtiene un conjunto de indicadores que permiten medir la capacidad de respuesta del acuífero ante la recarga gestionada.",
                },
                {
                  title: "Etapa 2: Jerarquización de criterios (AHP)",
                  body: "Matriz pareada -> Pesos w_i -> Verificación CR",
                  purpose:
                    "Establece la importancia relativa de cada factor. El resultado es una matriz de pesos (w_i) validados estadísticamente por su índice de consistencia (CR). Esta etapa suma objetividad, priorizando los elementos que realmente determinan el éxito de la recarga.",
                },
                {
                  title: "Etapa 3: Análisis de Incertidumbre + Sensibilidad",
                  body: "Incertidumbre -> Sensibilidad AHP -> Ranking bajo condiciones",
                  purpose:
                    "Evaluar la confiabilidad de la decisión considerando información incompleta y variaciones en los pesos AHP. Identificar bajo qué; condiciones cambiará el ranking de grupos MAR.",
                },
              ].map((item, idx, arr) => (
                <React.Fragment key={item.title}>
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
                        ...getStageCardStyles(idx + 1, true),
                      }}
                      onClick={() => onActivateStage(idx + 1)}
                    >
                      <div style={{ fontWeight: 800 }}>{item.title}</div>
                      <div style={{ marginTop: 4 }}>{item.body}</div>
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
                        ...getStageCardStyles(idx + 1, false),
                      }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>Prop&oacute;sito</div>
                      <div style={{ fontSize: 14 }}>{item.purpose}</div>
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
              ))}
            </div>
            <div style={{ marginTop: 6, fontSize: 14 }}>
              Figura 6. Esquema conceptual de la ruta jerárquica (A). Fuente. Elaboración propia.
            </div>
          </div>
          <div
            ref={etapa1Ref}
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 12,
              display: "inline-block",
              minWidth: 90,
              ...getStageStyles(1),
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 18, textAlign: "center" }}>Etapa 1</div>
          </div>
          <p style={{ marginTop: 6, opacity: 0.92 }}>
            El proceso inicia convirtiendo los datos, mapas y evidencias cargados en la sección de "Insumos" en 35 variables operativas. Cada variable sintetiza aspectos como condiciones hidrogeológicas, calidad de la fuente, volumen, relieve y contexto socioambiental. Para garantizar la consistencia, cada variable se evalúa mediante una escala ordinal de cinco niveles (0-4), la cual traduce la evidencia técnica a un marco de decisión unificado: los niveles bajos indican limitantes técnicos o condiciones restrictivas para la recarga, mientras que los niveles altos representan condiciones óptimas, todo apoyado en una referencia cromática (Tabla 2) que facilita su interpretación.
          </p>

                       
        <div style={{ marginTop: 12, overflowX: "auto" }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>
            Tabla 2. Escala ordinal (0-4) para la evaluación de variables V1-V35
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>Puntuación</th>
                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>Categoría</th>
                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>Interpretación</th>
                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>Color de referencia</th>
              </tr>
            </thead>
            <tbody>
              {[
                { v: 0, cat: "No favorable / Inexistente", int: "Limitante crítico", color: "#dc2626", label: "Rojo" },
                { v: 1, cat: "Poco favorable", int: "Limitante significativo", color: "#f97316", label: "Naranja" },
                { v: 2, cat: "Neutral / Moderado", int: "Aceptable con reservas", color: "#facc15", label: "Amarillo" },
                { v: 3, cat: "Favorable", int: "Condición buena", color: "#22c55e", label: "Verde claro" },
                { v: 4, cat: "Muy favorable / óptimo", int: "Condición ideal", color: "#15803d", label: "Verde oscuro" },
              ].map((row) => (
                <tr key={row.v} style={{ background: scaleColor(row.v) }}>
                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)", fontWeight: 800 }}>{row.v}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>{row.cat}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>{row.int}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 12, height: 12, borderRadius: 999, background: row.color, display: "inline-block" }} />
                      {row.label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
            <em>Fuente: elaboración propia.</em>
          </div>
        </div>

        <p style={{ marginTop: 12, opacity: 0.92, fontStyle: "Italic"  }}>
          Esta escala no mide la calidad de los datos; mide la idoneidad de cada variable para la recarga gestionada.
          El proceso vincula los datos cargados en la fase de Insumos con sus variables correspondientes del esquema conceptual de decisión y determina su idoneidad en un rango de 0 a 4. Si la información es insuficiente para una variable, esta se marca como pendiente en lugar de asignar un puntaje arbitrario.
        </p>

        <p style={{ marginTop: 6, opacity: 0.92, }}>
            En este proceso, el usuario asume un rol protagónico como analista y validador, siendo responsable de gestionar la incertidumbre mediante la identificación de variables en estado "Pendiente" para evitar sesgos por falta de información. Su intervención técnica garantiza que la síntesis generada sea coherente con las evidencias, <strong>reconociendo que siempre existe un umbral de incertidumbre inherente derivado del procesamiento y la naturaleza de los datos disponibles</strong>. Como resultado, este flujo traduce datos aislados en un esquema de decisión trazable y comparativo, produciendo mapas de idoneidad y reportes de probabilidad que fundamentan la viabilidad real de la recarga en el territorio.
          </p>
        
        <p style={{ marginTop: 10, opacity: 0.92 }}>
          A continuación, se presenta la Guía Metodológica de la ruta. En ella encontrará la descripción de cada variable, qué datos específicos de tus 'Insumos' debes usar para calificarlas y los criterios para elegir el puntaje correcto en la escala.
        </p>

        <div ref={guideRef} style={{ marginTop: 14, fontWeight: 800, fontSize: 18 }}>1.1 Guía metodológica de diligenciamiento</div>
        <p style={{ marginTop: 4, opacity: 0.9 }}>
          Esta guía orienta la transición de los insumos técnicos de la Fase 1 hacia el esquema de decisión, con el fin de 
          transformar la evidencia cargada en una evaluación técnica estandarizada y comparable. Esta vinculación permite que 
          el sistema asigne una calificación en la escala de 0 a 4, identifique vacíos de información y genere una justificación 
          técnica para cada resultado obtenido. Es fundamental completar la totalidad de los datos requeridos, ya que cualquier insumo 
          no diligenciado será categorizado automáticamente como una limitante, reduciendo la confiabilidad y la robustez del análisis final.
        </p>
        <p style={{ marginTop: 6, opacity: 0.9 }}>
          Para una evaluación transparente, distinguimos entre el estado del insumo y el puntaje de idoneidad. <strong>El Estado</strong> indica 
          si hay información suficiente para calificar. <strong>El Puntaje</strong> no califica la calidad del dato, sino su idoneidad técnica; 
          es decir, mide qué tanto facilita o limita el sistema acuífero la implementación de la recarga. 
          Esta calificación se asigna con base en factores específicos de los insumos como porosidad, permeabilidad, 
          tipo de acuífero, entre otros que influyen directamente en la viabilidad de cada grupo MAR. Por ejemplo, una alta permeabilidad 
          se traduce en un puntaje de 4 por su óptimo desempeño, mientras que un acuicludo puede recibir un puntaje bajo 
          ya que no permite el almacenamiento ni la transmisión del agua. 
           <em> Finalmente, si el estado es &quot;Falta&quot; o &quot;No aplica&quot;,
          el sistema deshabilita automáticamente el puntaje para evitar errores en el análisis.</em>.
        </p>
                          
        <div style={{ marginTop: 14, padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,.08)", background: "#f8fafc" }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Estado: definición e implicación</div>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.4 }}>
            <li>
              <strong>Completo</strong>: cumple todos los requerimientos técnicos. Permite asignar puntaje de idoneidad.
            </li>
            <li>
              <strong>Parcial</strong>: falta algún dato clave (ej: escala del mapa, parámetros específicos).
              Permite asignar puntaje con advertencia de incertidumbre.
            </li>
            <li>
              <strong>Falta</strong>: no existe evidencia aprovechable. Puntaje deshabilitado, variable marcada como limitante.
            </li>
            <li>
              <strong>No aplica</strong>: la variable no es relevante para este grupo MAR específico.
              Excluida del cálculo para ese grupo.
            </li>
          </ul>
        </div>
        <p style={{ marginTop: 10, opacity: 0.9 }}>
          <strong>Ejemplo de interacción:</strong> Para cada una de las 35 variables, el sistema presentar? una tarjeta de evaluación donde el analista interactúa de la siguiente manera:
        </p>
        <ul style={{ marginTop: 6, paddingLeft: 18, lineHeight: 1.4 }}>
          <li>
            <strong>Pregunta (V2):</strong> ¿Existe o realizaron caracterización del acuífero?: ¿Consideras que la información que tienes sobre el acuífero es suficiente para asegurar el éxito de la recarga? ¿Esta variable es favorable para seleccionar el grupo MAR óptimo?
          </li>
          <li>
            <strong>Acción del analista:</strong> Puedes dejar el puntaje que el sistema propone (por defecto) si estás de acuerdo con la evidencia, o mover la barra manualmente si crees que la situación amerita una calificación distinta basándote en la escala de 0 a 4.
          </li>
        </ul>

        <div style={{ marginTop: 6, color: "#b91c1c", fontWeight: 800 }}>
          En los escenarios 1 y 2 debe cumplir con el mínimo de V (Variables) para poder continuar. ?Comienza ahora!
        </div>
        
        <div style={{ marginTop: 12, background: "#fff2b8", borderRadius: 16, padding: 12, border: "1px solid #f4df8a" }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Preguntas tipo Si/No</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
            {yesNoVars.map((item) => renderScoreControl(item))}
          </div>
        </div>

        <div style={{ marginTop: 16, background: "#dbeafe", borderRadius: 16, padding: 12, border: "1px solid #bfdbfe" }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Preguntas con opciones múltiples</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
            {multiVars.map((item) => renderScoreControl(item))}
          </div>
        </div>
        <div style={{ marginTop: 12, fontSize: 13, opacity: 0.9 }}>
          {(scenarioId === 1 || scenarioId === 0) && missingScenario1Labels.length ? (
            <>Falta completar: {missingScenario1Labels.join(", ")}</>
          ) : scenarioId === 2 && missingScenario2Labels.length ? (
            <>Falta completar: {missingScenario2Labels.join(", ")}</>
          ) : scenarioId === 3 && missingForFull.length ? (
            <>Falta completar: {missingForFull.join(", ")}</>
          ) : (
            <>Listo para continuar a la consolidación de criterios.</>
          )}
        </div>

        {stage1Complete && !shouldShowAllStages && activeStage < 2 ? (
          <div style={{ marginTop: 12 }}>
            <button
              type="button"
              onClick={() => onActivateStage(2)}
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                border: "1px solid rgba(0,0,0,.2)",
                background: "#1d4ed8",
                color: "#fff",
                fontWeight: 700,
              }}
            >
              Continuar a la Etapa 2
            </button>
          </div>
        ) : null}

        <div
          style={{
            marginTop: 8,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #fca5a5",
            background: "#fee2e2",
            color: "#7f1d1d",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          Esta es la configuración por defecto del sistema, sin embargo en la sección de Cálculo de Scores por Criterio y
          Grupo, en la opción de Modo personalizado de influencia por grupo, podrías variar la idoneidad para cada grupo
          conforme sea tu criterio o usar el que ya está establecido y seguir al método de ponderación.
        </div>

        <hr style={{ margin: "20px 0" }} />

        <div style={{ fontWeight: 800, fontSize: 18 }}>1.2 Consolidación de criterios (C1-C5)</div>
        <p style={{ marginTop: 4, opacity: 0.9 }}>
          Una vez finalizada la calificación individual de las variables, el sistema procede a la consolidación de criterios. Esto consiste en agrupar las variables ya evaluadas (V1-V35) en los cinco criterios definidos
          en la introducción, para sintetizar la información por temas y preparar la comparación de importancia en el AHP. La Tabla 3 muestra los criterios
          y su enlace directo con las variables.
        </p>

        <p style={{ marginTop: 4, opacity: 0.9 }}>
          Es fundamental destacar que esta organización representa la arquitectura base para el procesamiento de datos del sistema. De manera predeterminada, los algoritmos de cálculo utilizarán esta distribución de variables para generar los resultados de idoneidad. En consecuencia, esta agrupación garantiza que cada factor técnico influya exactamente en el área que le corresponde
          asegurando que el análisis de sensibilidad y la ponderación final sean coherentes con la realidad física del proyecto. No obstante, aunque el sistema opera bajo esta estructura por defecto, su diseño permite que la relación entre variables y criterios sea trazable y transparente para el analista.
        </p>

        <div style={{ marginTop: 10, overflowX: "auto" }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>
            Tabla 3. Criterios (C1-C5) y relación con variables (V)
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>Criterio</th>
                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>Descripción</th>
                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>Variables asociadas</th>
              </tr>
            </thead>
            <tbody>
              {CRITERIA_TABLE.map((c, idx) => (
                <tr key={c.id} style={{ background: idx % 2 === 0 ? "#f8fafc" : "#ffffff" }}>
                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)", fontWeight: 700 }}>{c.id} - {c.label}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>{c.description}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>{c.variables}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
            <em>Fuente: elaboración propia.</em>
          </div>
          <p style={{ marginTop: 10, opacity: 0.9 }}>
          Con esta estructura definida, el sistema queda habilitado para proceder a la Etapa 2, donde se determinará la importancia relativa de cada criterio mediante el método AHP para obtener el diagnóstico definitivo.
        </p>
        </div>

        {showStage(2) ? (
          <>
            <div
              style={{
                marginTop: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div
                ref={etapa2Ref}
                style={{
                  padding: 12,
                  borderRadius: 12,
                  width: "fit-content",
                  minWidth: 10,
                  ...getStageStyles(2),
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 18, textalign: "center" }}>Etapa 2</div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {showStage(1) ? (
                  <button
                    type="button"
                    onClick={() => {
                      onActivateStage(1);
                      scrollToRef(etapa1Ref);
                    }}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 10,
                      border: "1px solid rgba(0,0,0,0.15)",
                      background: "#e5e7eb",
                      color: "#111827",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Ir a la etapa 1
                  </button>
                ) : null}
              </div>
            </div>
        <div style={{ marginTop: 8, opacity: 0.9 }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>2.1 Jerarquización de criterios y cálculo de idoneidad</div>
          <p style={{ marginTop: 6 }}>
            Este proceso constituye el núcleo analítico del modelo y se fundamenta en el Análisis de Decisión Multicriterio (MCDA). De acuerdo con autores como Saaty (1980) y su Proceso de Análisis Jerárquico (AHP), la complejidad de un sistema ambiental no puede resolverse con una simple suma de factores; requiere una estructura que asigne pesos diferenciados según la influencia real de cada variable en el éxito del proyecto.
          </p>
          <p style={{ marginTop: 6 }}>
            En el contexto de MAR, autores como Dillon (2005) y Fernandez-Escalante (2005) enfatizan que la idoneidad de un sitio es una propiedad multidimensional. Por lo tanto, esta etapa tiene como objetivo transformar datos técnicos aislados en un índice de Idoneidad robusto. En primer lugar, esto permite entender que no todas las variables tienen el mismo impacto; por ejemplo, la permeabilidad es un factor condicionante, mientras que la pendiente es un factor facilitador. Por esta razón, el sistema aplica una ponderación que equilibra la relevancia de factores críticos frente a variables secundarias.
          </p>
          <p style={{ marginTop: 6 }}>
            En segundo lugar, a través de esta jerarquización, el modelo integra dimensiones hidráulicas, geológicas y ambientales para calcular una calificación específica para cada grupo tecnológico (G1, G2 y G3). El resultado es una herramienta que ofrece una comparación objetiva y validada matemáticamente entre cada grupo.
          </p>
        </div>
        <div style={{ marginTop: 14, opacity: 0.9 }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>2.1.1 Cálculo de Scores por Criterio y Grupo</div>
          <div style={{ marginTop: 6, fontWeight: 700 }}>Concepto de agregación</div>
          <p style={{ marginTop: 6 }}>
            La agregación es el mecanismo de síntesis que permite transitar de lo específico (variables individuales) a lo estratégico (criterios temáticos). Según Malczewski (1999), la agregación en sistemas de información geográfica y ambiental debe ser capaz de manejar la compensación entre criterios. La consolidación de datos se fundamenta en la Suma Lineal Ponderada (WLC), un estándar en la gestión hídrica que permite integrar variables con distintas unidades en un índice común. Bajo este enfoque, la agregación actúa como el mecanismo de síntesis para transitar de lo específico (variables V1-V35) a lo estratégico (criterios C1-C5).
          </p>
          <p style={{ marginTop: 6 }}>
            Este cálculo se realiza de manera diferenciada para cada grupo MAR (G1, G2, G3), lo que permite que el sistema reconozca que una misma condición física puede ser una limitante para un método pero una ventaja para otro. Así, la agregación no es solo una suma matemática, sino una evaluación contextual donde las variables se equilibran para reflejar la viabilidad real de cada tecnología en el acuífero.
          </p>
          <div style={{ marginTop: 10, fontWeight: 700 }}>Ecuación de agregación:</div>
          <div
            style={{
              margin: "8px 0",
              display: "block",
              textAlign: "center",
              fontFamily: "inherit",
              fontSize: 20,
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span style={{ position: "relative", display: "inline-block", paddingRight: "0.6em" }}>
                S
                <span style={{ position: "absolute", top: "-0.45em", right: 0, fontSize: "0.65em" }}>G</span>
                <span style={{ position: "absolute", bottom: "-0.35em", right: 0, fontSize: "0.65em" }}>
                  C<sub>i</sub>
                </span>
              </span>
              <span>=</span>
              <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", lineHeight: 1.1 }}>
                <span style={{ padding: "0 6px", paddingBottom: "2px", borderBottom: "1px solid #111" }}>
                  <span style={{ position: "relative", display: "inline-block", paddingRight: "0.85em" }}>
                    &sum;
                    <span style={{ position: "absolute", top: "-0.45em", right: "-0.04em", fontSize: "0.65em" }}>
                      <span style={{ fontStyle: "italic" }}>m</span>
                      <sub>i</sub>
                    </span>
                    <span style={{ position: "absolute", bottom: "-0.55em", right: "-0.38em", fontSize: "0.65em" }}>
                      <span style={{ fontStyle: "italic" }}>k</span>=1
                    </span>
                  </span>{" "}
                  Score(V<sub><span style={{ fontStyle: "italic" }}>k</span></sub>)<sup>G</sup>
                </span>
                <span style={{ padding: "0 6px" }}>
                  <span style={{ fontStyle: "italic" }}>m</span>
                  <sub>i</sub>
                </span>
              </span>
              <span style={{ fontSize: 14 }}>[1]</span>
            </span>
          </div>
          <div style={{ fontWeight: 700, marginTop: 8 }}>Donde:</div>
          <ul style={{ margin: "6px 0 0 18px", lineHeight: 1.5 }}>
            <li>
              <strong>
                <span style={{ position: "relative", display: "inline-block", paddingRight: "0.6em" }}>
                  S
                  <span style={{ position: "absolute", top: "-0.45em", right: 0, fontSize: "0.65em" }}>G</span>
                  <span style={{ position: "absolute", bottom: "-0.35em", right: 0, fontSize: "0.65em" }}>
                    C<sub>i</sub>
                  </span>
                </span>{" "}
                (Score del Criterio):
              </strong>{" "}
              Es el resultado final del tema evaluado (ej. Hidráulica). Representa la aptitud general en una escala de 0 a 4 para un grupo tecnológico específico (G).
            </li>
            <li>
              <strong>
                La Sumatoria (
                <span style={{ position: "relative", display: "inline-block", paddingRight: "0.85em" }}>
                  &sum;
                  <span style={{ position: "absolute", top: "-0.45em", right: "-0.04em", fontSize: "0.65em" }}>
                    <span style={{ fontStyle: "italic" }}>m</span>
                    <sub>i</sub>
                  </span>
                  <span style={{ position: "absolute", bottom: "-0.55em", right: "-0.38em", fontSize: "0.65em" }}>
                    <span style={{ fontStyle: "italic" }}>k</span>=1
                  </span>
                </span>
                <span style={{ marginLeft: "6px" }}>):</span>
              </strong>{" "}
              Este símbolo indica la acumulación de la "aptitud" técnica. Lo que hace es reunir todas las fortalezas de las variables que componen un criterio. Si un criterio (como Hidráulica) tiene variables con puntajes altos (4, 4, 3), la sumatoria captura ese potencial positivo total antes de promediarlo.
            </li>
            <li>
              <strong>
                El Score de la Variable (Score(V<sub><span style={{ fontStyle: "italic" }}>k</span></sub>)<sup>G</sup>):
              </strong>{" "}
              Es el valor de idoneidad (0-4). Lo crucial aqui es el superíndice G, que expresa que la misma variable se "lee" diferente según el Grupo MAR. Esto dota al modelo de inteligencia contextual.
            </li>
            <li>
              <strong>
                El Denominador (<span style={{ fontStyle: "italic" }}>m</span>
                <sub>i</sub>
                ):
              </strong>{" "}
              Representa el ajuste por disponibilidad de información. En lugar de dividir por un número fijo de variables, se divide unicamente por las que tienen datos reales.
            </li>
          </ul>
          <div style={{ marginTop: 10, fontWeight: 700 }}>Tratamiento de la Incertidumbre (Variables Faltantes):</div>
          <p style={{ margin: "6px 0 0", lineHeight: 1.5 }}>
            Para garantizar la confiabilidad del modelo ante la ausencia de datos, se aplican reglas de integridad:
          </p>
          <ul style={{ margin: "6px 0 0 18px", lineHeight: 1.5 }}>
            <li>
              <span style={{ fontStyle: "italic" }}>Criterio desierto:</span> Si la totalidad de las variables de un criterio estan en estado &quot;Falta&quot;, el{" "}
              <span style={{ position: "relative", display: "inline-block", paddingRight: "0.6em" }}>
                S
                <span style={{ position: "absolute", top: "-0.45em", right: 0, fontSize: "0.65em" }}>G</span>
                <span style={{ position: "absolute", bottom: "-0.35em", right: 0, fontSize: "0.65em" }}>
                  C<sub>i</sub>
                </span>
              </span>{" "}
              se penaliza con 0, identificandose como un vacío crítico de información.
            </li>
            <li>
              <span style={{ fontStyle: "italic" }}>Información parcial:</span> Si existen datos parciales, se promedian únicamente las variables disponibles y el sistema genera una alerta de confianza, indicando que el resultado tiene un margen de incertidumbre.
            </li>
            
          </ul>
          <div style={{ marginTop: 12, fontWeight: 700, fontSize: 24, textAlign: "center" }}>
            Cálculo para el caso de estudio: {activeCaseId}
          </div>
          <p style={{ marginTop: 6, opacity: 0.9, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            Tras la consolidación de la arquitectura matemática, el sistema ejecuta el procesamiento 
            de los datos específicos del área de estudio. Con el objetivo de mitigar el efecto de "caja negra" 
            común en modelos de decisión complejos y garantizar la trazabilidad del proceso, los resultados se 
            presentan mediante módulos de visualización por criterio (Cards). 
            <button
              type="button"
              onClick={() => setCardsHelpOpen((prev) => !prev)}
              aria-expanded={cardsHelpOpen}
              style={{
                border: "none",
                background: "none",
                color: "#2563eb",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>{cardsHelpOpen ? "v" : ">"}</span>
              <span>Ayuda</span>
            </button>
          </p>
          {cardsHelpOpen ? (
            <div
              role="dialog"
              aria-modal="true"
              onClick={() => setCardsHelpOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(15, 23, 42, 0.55)",
                zIndex: 50,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: "#ffffff",
                  borderRadius: 16,
                  border: "1px solid rgba(37, 99, 235, 0.35)",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
                  maxWidth: 760,
                  width: "100%",
                  maxHeight: "85vh",
                  overflowY: "auto",
                  padding: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ fontWeight: 800, fontSize: 20, color: "#1e3a8a" }}>Ayuda sobre las Cards</div>
                  <button
                    type="button"
                    onClick={() => setCardsHelpOpen(false)}
                    style={{
                      borderRadius: 10,
                      border: "1px solid rgba(37, 99, 235, 0.35)",
                      background: "#eff6ff",
                      color: "#1d4ed8",
                      fontWeight: 700,
                      padding: "6px 10px",
                      cursor: "pointer",
                    }}
                  >
                    Cerrar
                  </button>
                </div>
                <div style={{ marginTop: 12, fontSize: 16, lineHeight: 1.6 }}>
                  <div style={{ fontWeight: 700 }}>1. ¿Qué estás viendo en la tarjeta?</div>
                  <p style={{ marginTop: 6, marginBottom: 6 }}>
                    Cada tarjeta desglosa el proceso en tres niveles claros para facilitar tu comprensión:
                  </p>
                  <ul style={{ marginTop: 6, marginBottom: 10, paddingLeft: 18 }}>
                    <li>
                      <strong>Identificación y estado:</strong> Verás qué variables (V) componen el criterio y el
                      estado de su información (Completo, Parcial o Falta) heredado de la fase de insumos.
                    </li>
                    <li>
                      <strong>La operación matemática:</strong> Se muestra la aplicación de la ecuación de agregación
                      sobre tus datos. Esto te permite auditar el cálculo y entender cómo llegamos al puntaje del
                      criterio.
                    </li>
                    <li>
                      <strong>Diagnóstico por Grupo MAR:</strong> El sistema te entrega un resultado diferenciado para
                      cada grupo (G1, G2, G3), acompañado de una observación técnica que explica si tu objetivo es
                      compatible con esa opción.
                    </li>
                  </ul>
                  <div style={{ fontWeight: 700 }}>2. Personalización y Ajuste</div>
                  <p style={{ marginTop: 6, marginBottom: 6 }}>
                    Aunque el sistema establece enlaces y valores por defecto basados en estándares técnicos (por
                    ejemplo, asignando una alta relevancia a la caracterización del acuífero), puedes modificarlo.
                  </p>
                  <ul style={{ marginTop: 6, marginBottom: 10, paddingLeft: 18 }}>
                    <li>
                      <strong>Modo personalizado de influencia:</strong> Si consideras que una variable debe pesar más
                      en un grupo que en otro (ej. que la permeabilidad sea más influyente para G1 que para G3), puedes
                      ajustar estos valores manualmente.
                    </li>
                    <li>
                      <strong>Guía por variables:</strong> Para mayor practicidad, cada tarjeta incluye una guía que te
                      explica qu? significa cada valor de la escala ordinal, asegurando que tus ajustes tengan una base
                      técnica sólida.
                    </li>
                    <li>
                      <strong>Navegación Interactiva:</strong> Si durante este análisis detectas que necesitas corregir
                      un dato base, la tarjeta cuenta con botones directos para regresar a la Fase de Insumos o a la
                      Guía de la Etapa 1 sin perder tu progreso.
                    </li>
                  </ul>
                  <div style={{ fontWeight: 700, color: "#b91c1c" }}>
                    Nota: El objetivo es que esta herramienta sea tu soporte de decisión. El sistema sugiere, pero tu
                    criterio profesional es el que valida la viabilidad real en el territorio.
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          <div
            style={{
              marginTop: 10,
              padding: 14,
              borderRadius: 14,
              background: "rgba(253, 230, 238, 0.6)",
              border: "1px solid rgba(251, 207, 232, 0.7)",
            }}
          >
            <details style={{ marginTop: 10 }}>
              <summary
                style={{
                  cursor: "pointer",
                  fontWeight: 700,
                  padding: 4,
                  lineHeight: 1.2,
                  background: "transparent",
                  border: "none",
                  borderRadius: 12,
                }}
              >
                Criterio C1 - Objetivo
              </summary>
            <div style={{ marginTop: 8, fontWeight: 600 }}>Datos disponibles:</div>
            <div style={{ marginTop: 6, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15, minWidth: 520 }}>
                <thead>
                  <tr>
                    {renderHeaderWithHelp("c1-variable", "Variable", "Codigo de la variable evaluada.", {
                      textAlign: "left",
                      padding: 8,
                      borderBottom: "1px solid rgba(0,0,0,.14)",
                    })}
                    {renderHeaderWithHelp("c1-estado", "Estado", "Estado del insumo: completo, parcial o falta.", {
                      textAlign: "left",
                      padding: 8,
                      borderBottom: "1px solid rgba(0,0,0,.14)",
                    })}
                    {renderHeaderWithHelp("c1-descripcion", "Descripción", "Nombre corto de la variable.", {
                      textAlign: "left",
                      padding: 8,
                      borderBottom: "1px solid rgba(0,0,0,.14)",
                    })}
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ background: "#ffffff" }}>
                    <td style={{ padding: 8, borderBottom: "1px solid rgba(0,0,0,.08)", fontWeight: 700 }}>V1</td>
                    <td style={{ padding: 8, borderBottom: "1px solid rgba(0,0,0,.08)" }}>{c1Status}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Objetivo MAR</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 10, fontWeight: 600 }}>Cálculo:</div>
            <div
              style={{
                marginTop: 10,
                padding: 12,
                borderRadius: 12,
                background: "#fff",
                border: "1px solid rgba(0,0,0,.08)",
                textAlign: "center",
                fontSize: 20,
              }}
            >
              {c1IsBlocked || c1IsComplete ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span style={{ position: "relative", display: "inline-block", paddingRight: "0.75em" }}>
                    S
                    <span style={{ position: "absolute", top: "-0.45em", right: 0, fontSize: "0.65em" }}>G</span>
                    <span style={{ position: "absolute", bottom: "-0.35em", right: 0, fontSize: "0.65em" }}>
                      C1
                    </span>
                  </span>
                  <span>=</span>
                  <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", lineHeight: 1.1 }}>
                    <span style={{ padding: "0 6px", borderBottom: "1px solid #111" }}>
                      {c1IsBlocked ? formatScore(0) : formatScore(c1BaseScore)}
                    </span>
                    <span style={{ padding: "0 6px" }}>1</span>
                  </span>
                  <span>=</span>
                  <span>{c1IsBlocked ? formatScore(0) : formatScore(c1BaseScore)}</span>
                </span>
              ) : (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span style={{ position: "relative", display: "inline-block", paddingRight: "0.75em" }}>
                    S
                    <span style={{ position: "absolute", top: "-0.45em", right: 0, fontSize: "0.65em" }}>G</span>
                    <span style={{ position: "absolute", bottom: "-0.35em", right: 0, fontSize: "0.65em" }}>
                      C1
                    </span>
                  </span>
                  <span>=</span>
                  <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", lineHeight: 1.1 }}>
                    <span style={{ padding: "0 6px", borderBottom: "1px solid #111" }}>?</span>
                    <span style={{ padding: "0 6px" }}>1</span>
                  </span>
                  <span>=</span>
                  <span>?</span>
                </span>
              )}
            </div>
            <div style={{ marginTop: 8, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15, minWidth: 520 }}>
                <thead>
                  <tr>
                                        {renderHeaderWithHelp("c1-grupo", "Grupo", "Grupo MAR evaluado (G1, G2, G3).", { textAlign: "left", padding: 8, borderBottom: "1px solid rgba(0,0,0,.14)" })}
                    {renderHeaderWithHelp(
                      "c1-score-var",
                      <span>
                        Score(V1)<sup>G</sup>
                      </span>,
                      "Puntaje final de la variable para el grupo (G1, G2 o G3). Se obtiene del valor original y los ajustes/ponderaciones aplicables.",
                      { textAlign: "left", padding: 8, borderBottom: "1px solid rgba(0,0,0,.14)" }
                    )}
                    {renderHeaderWithHelp("c1-score-crit", <span style={{ position: "relative", display: "inline-block", paddingRight: "0.75em" }}>
                        S
                        <span style={{ position: "absolute", top: "-0.45em", right: 0, fontSize: "0.65em" }}>G</span>
                        <span style={{ position: "absolute", bottom: "-0.35em", right: 0, fontSize: "0.65em" }}>C1</span>
                      </span>, "Score del criterio para el grupo. Es el promedio de los scores de las variables del criterio, calculado para G1, G2 o G3.", { textAlign: "left", padding: 8, borderBottom: "1px solid rgba(0,0,0,.14)" })}
                    {renderHeaderWithHelp("c1-obs", "Observaciones", "Notas sobre faltantes o interpretación.", { textAlign: "left", padding: 8, borderBottom: "1px solid rgba(0,0,0,.14)" })}
                  </tr>
                </thead>
                <tbody>
                  {c1Rows.map((row, idx) => (
                    <tr key={row.id} style={{ background: idx % 2 === 0 ? "#f8fafc" : "#ffffff" }}>
                      <td style={{ padding: 8, borderBottom: "1px solid rgba(0,0,0,.08)", fontWeight: 700 }}>{row.id}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid rgba(0,0,0,.08)" }}>{formatScore(row.score)}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid rgba(0,0,0,.08)", fontWeight: 700 }}>
                        {formatScore(row.sc)}
                      </td>
                      <td style={{ padding: 8, borderBottom: "1px solid rgba(0,0,0,.08)" }}>{row.obs}</td>
                    </tr>
                  ))}
                  </tbody>
                </table>
              </div>
              {invertHierarchyEnabled && invertedPairwiseMatrix && invertedPairwiseAHP ? (
                <div
                  style={{
                    marginTop: 12,
                    padding: 12,
                    borderRadius: 12,
                    background: "#eef2ff",
                    border: "1px solid rgba(59,130,246,0.4)",
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>Matriz invertida y consistencia</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 13, marginBottom: 8 }}>
                    <span>
                      CR: {invertedPairwiseAHP.cr ? formatPercent(invertedPairwiseAHP.cr) : "-"}
                    </span>
                    <span>
                      CI: {Number.isFinite(invertedPairwiseAHP.ci) ? invertedPairwiseAHP.ci.toFixed(3) : "-"}
                    </span>
                    <span>
                      λmax: {Number.isFinite(invertedPairwiseAHP.lambdaMax) ? invertedPairwiseAHP.lambdaMax.toFixed(3) : "-"}
                    </span>
                    <span style={{ flex: "1 1 100%" }}>
                      Ranking invertido: {invertedRankingText || "Sin datos"}
                    </span>
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 520 }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid rgba(0,0,0,.14)" }}>Criterio</th>
                          {invertedPairwiseMatrix.ids.map((id) => (
                            <th key={id} style={{ textAlign: "center", padding: 8, borderBottom: "1px solid rgba(0,0,0,.14)" }}>
                              {id}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {invertedPairwiseMatrix.matrix.map((row, idx) => (
                          <tr key={invertedPairwiseMatrix.ids[idx]}>
                            <td
                              style={{
                                padding: 8,
                                borderBottom: "1px solid rgba(0,0,0,.08)",
                                fontWeight: 700,
                              }}
                            >
                              {invertedPairwiseMatrix.ids[idx]}
                            </td>
                            {row.map((value, innerIdx) => (
                              <td
                                key={`${invertedPairwiseMatrix.ids[idx]}-${invertedPairwiseMatrix.ids[innerIdx]}`}
                                style={{
                                  padding: 8,
                                  borderBottom: "1px solid rgba(0,0,0,.08)",
                                  textAlign: "center",
                                }}
                              >
                                {Number.isFinite(value) ? value.toFixed(2) : "-"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
              <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85 }}>
                Nota: Como solo hay 1 variable,{" "}
              <span style={{ position: "relative", display: "inline-block", paddingRight: "0.75em" }}>
                S
                <span style={{ position: "absolute", top: "-0.45em", right: 0, fontSize: "0.65em" }}>G</span>
                <span style={{ position: "absolute", bottom: "-0.35em", right: 0, fontSize: "0.65em" }}>
                  C1
                </span>
              </span>{" "}
              = Score(V1)<sup>G</sup> directamente.
            </div>
            <details style={{ marginTop: 12 }}>
              <summary
                style={{
                  cursor: "pointer",
                  padding: 12,
                  borderRadius: 12,
                  background: "#fee2e2",
                  border: "1px solid #fecaca",
                  fontWeight: 700,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <span>Modo personalizado de influencia por grupo</span>
                <span style={{ fontSize: 12, opacity: 0.75 }}>
                  {customInfluenceEnabled ? "Activo" : "Opcional"}
                  {Object.keys(customInfluenceByVar || {}).length ? ` ? ${Object.keys(customInfluenceByVar).length} ajustes` : ""}
                </span>
              </summary>
              <div
                style={{
                  marginTop: 10,
                  padding: 12,
                  borderRadius: 12,
                  background: "#fff",
                  border: "1px solid rgba(0,0,0,.08)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>Personaliza la influencia por variable</div>
                    <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
                      Ajusta manualmente la influencia por variable en cada grupo cuando no coincida con la guia base.
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                      <input
                        type="checkbox"
                        checked={customInfluenceEnabled}
                        onChange={(e) => onToggleCustomInfluence(e.target.checked)}
                      />
                      Activar modo personalizado
                    </label>
                    <button
                      type="button"
                      onClick={onResetCustomInfluence}
                      disabled={!Object.keys(customInfluenceByVar || {}).length}
                      style={{
                        border: "1px solid rgba(0,0,0,.2)",
                        background: "#f8fafc",
                        padding: "6px 10px",
                        borderRadius: 8,
                        fontSize: 12,
                        cursor: Object.keys(customInfluenceByVar || {}).length ? "pointer" : "not-allowed",
                        opacity: Object.keys(customInfluenceByVar || {}).length ? 1 : 0.5,
                      }}
                    >
                      Limpiar ajustes
                    </button>
                  </div>
                </div>
                <div style={{ marginTop: 10, overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 540 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>Variable</th>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>G1</th>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>G2</th>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>G3</th>
                      </tr>
                    </thead>
                    <tbody>
                      {c1CustomRows.map((row, idx) => {
                        const vInfo = scoreById.get(row.id);
                        const rawValue = String(vInfo?.reason || "");
                        const showSelection = rawValue && !rawValue.includes("/");
                        const isRowLocked = customInfluenceAllowedIds ? !customInfluenceAllowedIds.has(row.id) : false;
                        return (
                          <tr
                            key={row.id}
                            style={{
                              background: idx % 2 === 0 ? "#f8fafc" : "#ffffff",
                              opacity: isRowLocked ? 0.6 : 1,
                            }}
                          >
                            <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)", fontWeight: 600 }}>
                              <div>
                                {row.id} - {row.label}
                              </div>
                              <div style={{ marginTop: 2, fontSize: 12, opacity: 0.75 }}>
                                Seleccionado: {showSelection ? rawValue : "-"}
                              </div>
                            </td>
                            {["G1", "G2", "G3"].map((gid) => {
                              const override = customInfluenceByVar?.[row.id]?.[gid];
                              const autoValue = getAutoGroupScore(row.id, gid);
                              const selectValue = Number.isFinite(override) ? String(override) : "auto";
                              return (
                                <td key={gid} style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>
                                  <select
                                    value={selectValue}
                                    onChange={(e) => {
                                      const next = e.target.value;
                                      if (next === "auto") onCustomInfluenceChange(row.id, gid, null);
                                      else onCustomInfluenceChange(row.id, gid, Number(next));
                                    }}
                                    disabled={!customInfluenceEnabled || isRowLocked}
                                    style={{
                                      width: "100%",
                                      padding: "4px 6px",
                                      borderRadius: 6,
                                      border: "1px solid rgba(0,0,0,.2)",
                                      background: customInfluenceEnabled && !isRowLocked ? "#fff" : "#f1f5f9",
                                    }}
                                  >
                                    <option value="auto">{`Auto (${formatScoreCompact(autoValue)})`}</option>
                                    {[0, 1, 2, 3, 4].map((v) => (
                                      <option key={v} value={String(v)}>
                                        {v}
                                      </option>
                                    ))}
                                  </select>
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
            </details>
            </details>
          </div>
          <div
            style={{
              marginTop: 12,
              padding: 14,
              borderRadius: 14,
              background: "rgba(220, 252, 231, 0.6)",
              border: "1px solid rgba(134, 239, 172, 0.7)",
            }}
          >
                        <details style={{ marginTop: 10 }}>
              <summary
                style={{
                  cursor: "pointer",
                  fontWeight: 700,
                  padding: 4,
                  lineHeight: 1.2,
                  background: "transparent",
                  border: "none",
                  borderRadius: 12,
                }}
              >
                Criterio C2 - Condiciones hidrogeológicas
              </summary>
            <div style={{ marginTop: 8, fontWeight: 600 }}>Datos disponibles:</div>
            <div style={{ marginTop: 6, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15, minWidth: 620 }}>
                <thead>
                  <tr>
                    {renderHeaderWithHelp("c2-variable", "Variable", "Código de la variable evaluada.", {
                      textAlign: "left",
                      padding: 8,
                      borderBottom: "1px solid rgba(0,0,0,.14)",
                    })}
                    {renderHeaderWithHelp("c2-estado", "Estado", "Estado del insumo: completo, parcial o falta.", {
                      textAlign: "left",
                      padding: 8,
                      borderBottom: "1px solid rgba(0,0,0,.14)",
                    })}
                    {renderHeaderWithHelp("c2-descripcion", "Descripción", "Nombre corto de la variable.", {
                      textAlign: "left",
                      padding: 8,
                      borderBottom: "1px solid rgba(0,0,0,.14)",
                    })}
                  </tr>
                </thead>
                <tbody>
                  {c2Vars.map((row, idx) => (
                    <tr key={row.id} style={{ background: idx % 2 === 0 ? "#f8fafc" : "#ffffff" }}>
                      <td style={{ padding: 8, borderBottom: "1px solid rgba(0,0,0,.08)", fontWeight: 700 }}>{row.id}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid rgba(0,0,0,.08)" }}>{row.status}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid rgba(0,0,0,.08)" }}>{row.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 10 }}>
              <details style={{ background: "transparent", border: "none", borderRadius: 12, padding: 0 }}>
                <summary
                  style={{
                    cursor: "pointer",
                    fontWeight: 700,
                    background: "#fee2e2",
                    border: "1px solid #fecaca",
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  Guía por variables
                </summary>
                <div style={{ marginTop: 10 }}>
                  <details style={{ background: "#fff", border: "1px solid rgba(0,0,0,.08)", borderRadius: 12, padding: 10, marginBottom: 10 }}>
                    <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                      V2 - Caracterización del acuífero (criterio transversal)
                    </summary>
                    <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                      Evidencia actual: {v2EvidencePresent}/{v2EvidenceTotal}{" "}
                      {v2HasManual ? `| Ajuste manual: ${formatScore(v2ManualValue)}` : ""}
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 8, tableLayout: "fixed" }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "45%" }}>Tipo</th>
                          <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "15%" }}>Score^G</th>
                          <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "40%" }}>Justificación</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Muy favorable</td>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Alta idoneidad para el grupo.</td>
                        </tr>
                        <tr>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorable</td>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>3</td>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorabilidad buena.</td>
                        </tr>
                        <tr>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Moderada</td>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>2</td>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorabilidad intermedia.</td>
                        </tr>
                        <tr>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Poco favorable</td>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>1</td>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorabilidad baja.</td>
                        </tr>
                        <tr>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>No favorable</td>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>0</td>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>No aporta idoneidad.</td>
                        </tr>
                      </tbody>
                    </table>
                    <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                      Score(V2)<sup>G</sup> aplicado (G1/G2/G3): {formatScore(getEffectiveGroupScore("V2", "G1", v2ScoreByGroup.G1))}
                    </div>
                  </details>
                  <details style={{ background: "#fff", border: "1px solid rgba(0,0,0,.08)", borderRadius: 12, padding: 10, marginBottom: 10 }}>
                    <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                      V8 - Tipo de acuífero (funciones por grupo)
                    </summary>
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontWeight: 600 }}>G1 (Intervención de cauces)</div>
                      <div style={{ marginTop: 4, fontSize: 13, opacity: 0.85 }}>
                        Valor actual: {v8Value || "-"} ? Score(V8)<sup>G1</sup> = {formatScore(getEffectiveGroupScore("V8", "G1", v8ScoreByGroup.G1))}
                      </div>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 6, tableLayout: "fixed" }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "45%" }}>Tipo</th>
                            <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "15%" }}>Score^G1</th>
                            <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "40%" }}>Justificación</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Libre</td>
                            <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                            <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorece infiltración desde cauces.</td>
                          </tr>
                          <tr>
                            <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Semiconfinado / Confinado</td>
                            <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>1</td>
                            <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Limitado; se prefiere recarga por pozos.</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontWeight: 600 }}>G2 (Recarga por pozos)</div>
                      <div style={{ marginTop: 4, fontSize: 13, opacity: 0.85 }}>
                        Valor actual: {v8Value || "-"} ? Score(V8)<sup>G2</sup> = {formatScore(getEffectiveGroupScore("V8", "G2", v8ScoreByGroup.G2))}
                      </div>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 6, tableLayout: "fixed" }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "45%" }}>Tipo</th>
                            <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "15%" }}>Score^G2</th>
                            <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "40%" }}>Justificación</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Libre</td>
                            <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>3</td>
                            <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Mayor riesgo de pérdida por flujo superficial.</td>
                          </tr>
                          <tr>
                            <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Semiconfinado / Confinado</td>
                            <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                            <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Mejor control y almacenamiento en ASR/ASTR.</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontWeight: 600 }}>G3 (Infiltración superficial)</div>
                      <div style={{ marginTop: 4, fontSize: 13, opacity: 0.85 }}>
                        Valor actual: {v8Value || "-"} ? Score(V8)<sup>G3</sup> = {formatScore(getEffectiveGroupScore("V8", "G3", v8ScoreByGroup.G3))}
                      </div>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 6, tableLayout: "fixed" }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "45%" }}>Tipo</th>
                            <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "15%" }}>Score^G3</th>
                            <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "40%" }}>Justificación</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Libre</td>
                            <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                            <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Maximiza la percolación superficial.</td>
                          </tr>
                          <tr>
                            <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Semiconfinado / Confinado</td>
                            <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>1</td>
                            <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Menor efectividad en infiltración.</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </details>
                  <details style={{ background: "#fff", border: "1px solid rgba(0,0,0,.08)", borderRadius: 12, padding: 10, marginBottom: 10 }}>
                    <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                      V3 - Modelo geológico (criterio transversal)
                    </summary>
                <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                  Evidencia actual: {v3EvidencePresent}/{v3EvidenceTotal}{" "}
                  {v3HasManual ? `| Ajuste manual: ${formatScore(v3ManualValue)}` : ""}
                </div>
                <div style={{ marginTop: 10, fontSize: 13, opacity: 0.85 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Escala del acuifero (V7)</div>
                  <div>¿Cuál es la escala que define el acuifero del estudio?</div>
                  <ul style={{ margin: "6px 0 0 18px", padding: 0 }}>
                    <li>Muy pequeno (&le; 100 km2)</li>
                    <li>Pequeno (100-500 km2)</li>
                    <li>Mediano (500-5000 km2)</li>
                    <li>Grande (500-50000 km2)</li>
                  </ul>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 8, tableLayout: "fixed" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "45%" }}>Tipo</th>
                      <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "15%" }}>Score^G</th>
                      <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "40%" }}>Justificación</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Muy favorable</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Alta idoneidad para el grupo.</td>
                    </tr>
                    <tr>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorable</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>3</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorabilidad buena.</td>
                    </tr>
                    <tr>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Moderada</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>2</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorabilidad intermedia.</td>
                    </tr>
                    <tr>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Poco favorable</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>1</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorabilidad baja.</td>
                    </tr>
                    <tr>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>No favorable</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>0</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>No aporta idoneidad.</td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                  Score(V3)<sup>G</sup> aplicado (G1/G2/G3): {formatScore(getEffectiveGroupScore("V3", "G1", v3ScoreByGroup.G1))}
                </div>
              </details>
              <details style={{ background: "#fff", border: "1px solid rgba(0,0,0,.08)", borderRadius: 12, padding: 10, marginBottom: 10 }}>
                <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                  V4 - Modelo hidrológico (criterio transversal)
                </summary>
                <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                  Evidencia actual: {v4EvidencePresent}/{v4EvidenceTotal}{" "}
                  {v4HasManual ? `| Ajuste manual: ${formatScore(v4ManualValue)}` : ""}
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 8, tableLayout: "fixed" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "45%" }}>Tipo</th>
                      <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "15%" }}>Score^G</th>
                      <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "40%" }}>Justificación</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Muy favorable</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Alta idoneidad para el grupo.</td>
                    </tr>
                    <tr>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorable</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>3</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorabilidad buena.</td>
                    </tr>
                    <tr>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Moderada</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>2</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorabilidad intermedia.</td>
                    </tr>
                    <tr>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Poco favorable</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>1</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorabilidad baja.</td>
                    </tr>
                    <tr>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>No favorable</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>0</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>No aporta idoneidad.</td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                  Score(V4)<sup>G</sup> aplicado (G1/G2/G3): {formatScore(getEffectiveGroupScore("V4", "G1", v4ScoreByGroup.G1))}
                </div>
              </details>
              <details style={{ background: "#fff", border: "1px solid rgba(0,0,0,.08)", borderRadius: 12, padding: 10, marginBottom: 10 }}>
                <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                  V5 - Modelo numérico / parámetros hidráulicos (criterio transversal)
                </summary>
                <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                  Evidencia actual: {v5EvidencePresent}/{v5EvidenceTotal}{" "}
                  {v5HasManual ? `| Ajuste manual: ${formatScore(v5ManualValue)}` : ""}
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 8, tableLayout: "fixed" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "45%" }}>Tipo</th>
                      <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "15%" }}>Score^G</th>
                      <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "40%" }}>Justificación</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Muy favorable</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Alta idoneidad para el grupo.</td>
                    </tr>
                    <tr>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorable</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>3</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorabilidad buena.</td>
                    </tr>
                    <tr>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Moderada</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>2</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorabilidad intermedia.</td>
                    </tr>
                    <tr>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Poco favorable</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>1</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorabilidad baja.</td>
                    </tr>
                    <tr>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>No favorable</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>0</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>No aporta idoneidad.</td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85 }}>
                  Nota: si falta algun mapa hidráulico, un 4 se ajusta a 3.
                </div>
                <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                  Score(V5)<sup>G</sup> aplicado (G1/G2/G3): {formatScore(getEffectiveGroupScore("V5", "G1", v5ScoreByGroup.G1))}
                </div>
              </details>
              <details style={{ background: "#fff", border: "1px solid rgba(0,0,0,.08)", borderRadius: 12, padding: 10, marginBottom: 10 }}>
                <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                  V6 - Modelo hidrogeoquímico (criterio transversal)
                </summary>
                <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                  Evidencia actual: {v6EvidencePresent}/{v6EvidenceTotal}{" "}
                  {v6HasManual ? `| Ajuste manual: ${formatScore(v6ManualValue)}` : ""}
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 8, tableLayout: "fixed" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "45%" }}>Tipo</th>
                      <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "15%" }}>Score^G</th>
                      <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "40%" }}>Justificación</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Muy favorable</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Alta idoneidad para el grupo.</td>
                    </tr>
                    <tr>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorable</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>3</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorabilidad buena.</td>
                    </tr>
                    <tr>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Moderada</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>2</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorabilidad intermedia.</td>
                    </tr>
                    <tr>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Poco favorable</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>1</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorabilidad baja.</td>
                    </tr>
                    <tr>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>No favorable</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>0</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>No aporta idoneidad.</td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                  Score(V6)<sup>G</sup> aplicado (G1/G2/G3): {formatScore(getEffectiveGroupScore("V6", "G1", v6ScoreByGroup.G1))}
                </div>
              </details>
              <details style={{ background: "#fff", border: "1px solid rgba(0,0,0,.08)", borderRadius: 12, padding: 10, marginBottom: 10 }}>
                <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                  V7 - Escala del acuífero (criterio transversal)
                </summary>
                <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                  Valor actual: {v7Value || "-"} {v7HasManual ? `| Ajuste manual: ${formatScore(v7ManualValue)}` : ""}
                </div>
                {[
                  { id: "G1", label: "G1 (Intervención de cauces)", score: v7ScoreByGroup.G1 },
                  { id: "G2", label: "G2 (Recarga por pozos)", score: v7ScoreByGroup.G2 },
                  { id: "G3", label: "G3 (Infiltración superficial)", score: v7ScoreByGroup.G3 },
                ].map((g) => (
                  <div key={g.id} style={{ marginTop: 10 }}>
                    <div style={{ fontWeight: 600 }}>{g.label}</div>
                    <div style={{ marginTop: 4, fontSize: 13, opacity: 0.85 }}>
                      Valor actual: {v7Value || "-"} ? Score(V7)<sup>{g.id}</sup> = {formatScore(getEffectiveGroupScore("V7", g.id, g.score))}
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 6, tableLayout: "fixed" }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "45%" }}>Tipo</th>
                          <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "15%" }}>{`Score^${g.id}`}</th>
                          <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "40%" }}>Justificación</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Muy favorable</td>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Alta idoneidad para el grupo.</td>
                        </tr>
                        <tr>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorable</td>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>3</td>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorabilidad buena.</td>
                        </tr>
                        <tr>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Moderada</td>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>2</td>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorabilidad intermedia.</td>
                        </tr>
                        <tr>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Poco favorable</td>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>1</td>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorabilidad baja.</td>
                        </tr>
                        <tr>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>No favorable</td>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>0</td>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>No aporta idoneidad.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ))}
              </details>
              <details style={{ background: "#fff", border: "1px solid rgba(0,0,0,.08)", borderRadius: 12, padding: 10, marginBottom: 10 }}>
                <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                  V9 - Capacidad de infiltración (criterio transversal)
                </summary>
                <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                  Valor actual: {v9Value || "-"} {v9HasManual ? `| Ajuste manual: ${formatScore(v9ManualValue)}` : ""}
                </div>
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontWeight: 600 }}>G1 (Intervención de cauces)</div>
                  <div style={{ marginTop: 4, fontSize: 13, opacity: 0.85 }}>
                    Valor actual: {v9Value || "-"} ? Score(V9)<sup>G1</sup> = {formatScore(getEffectiveGroupScore("V9", "G1", v9ScoreByGroup.G1))}
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 6, tableLayout: "fixed" }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "45%" }}>Tipo</th>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "15%" }}>Score^G1</th>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "40%" }}>Justificación</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Muy favorable</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Alta idoneidad para el grupo.</td>
                      </tr>
                      <tr>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorable</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>3</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorabilidad buena.</td>
                      </tr>
                      <tr>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Moderada</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>2</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorabilidad intermedia.</td>
                      </tr>
                      <tr>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Poco favorable</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>1</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorabilidad baja.</td>
                      </tr>
                      <tr>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>No favorable</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>0</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>No aporta idoneidad.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 600 }}>G2 (Recarga por pozos)</div>
                  <div style={{ marginTop: 4, fontSize: 13, opacity: 0.85 }}>
                    Valor actual: {v9Value || "-"} ? Score(V9)<sup>G2</sup> = {formatScore(getEffectiveGroupScore("V9", "G2", v9ScoreByGroup.G2))}
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 6, tableLayout: "fixed" }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "45%" }}>Tipo</th>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "15%" }}>Score^G2</th>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "40%" }}>Justificación</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>No aplica</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>0</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>No influye en G2.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 600 }}>G3 (Infiltración superficial)</div>
                  <div style={{ marginTop: 4, fontSize: 13, opacity: 0.85 }}>
                    Valor actual: {v9Value || "-"} ? Score(V9)<sup>G3</sup> = {formatScore(getEffectiveGroupScore("V9", "G3", v9ScoreByGroup.G3))}
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 6, tableLayout: "fixed" }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "45%" }}>Tipo</th>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "15%" }}>Score^G3</th>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "40%" }}>Justificación</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Muy favorable</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Alta idoneidad para el grupo.</td>
                      </tr>
                      <tr>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorable</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>3</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorabilidad buena.</td>
                      </tr>
                      <tr>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Moderada</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>2</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorabilidad intermedia.</td>
                      </tr>
                      <tr>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Poco favorable</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>1</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorabilidad baja.</td>
                      </tr>
                      <tr>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>No favorable</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>0</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>No aporta idoneidad.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </details>
              <details style={{ background: "#fff", border: "1px solid rgba(0,0,0,.08)", borderRadius: 12, padding: 10, marginBottom: 10 }}>
                <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                  V11 - Permeabilidad del acuífero (criterio transversal)
                </summary>
                <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                  Valor actual: {v11Value || "-"} {v11HasManual ? `| Ajuste manual: ${formatScore(v11ManualValue)}` : ""}
                </div>
                {[
                  { id: "G1", label: "G1 (Intervención de cauces)", score: v11ScoreByGroup.G1 },
                  { id: "G2", label: "G2 (Recarga por pozos)", score: v11ScoreByGroup.G2 },
                  { id: "G3", label: "G3 (Infiltración superficial)", score: v11ScoreByGroup.G3 },
                ].map((g) => (
                  <div key={g.id} style={{ marginTop: 10 }}>
                    <div style={{ fontWeight: 600 }}>{g.label}</div>
                    <div style={{ marginTop: 4, fontSize: 13, opacity: 0.85 }}>
                      Valor actual: {v11Value || "-"} ? Score(V11)<sup>{g.id}</sup> = {formatScore(getEffectiveGroupScore("V11", g.id, g.score))}
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 6, tableLayout: "fixed" }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "45%" }}>Tipo</th>
                          <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "15%" }}>{`Score^${g.id}`}</th>
                          <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "40%" }}>Justificación</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Muy alta (100&lt;K)</td>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Muy favorable.</td>
                        </tr>
                        <tr>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Alta (10&lt;K&lt;100)</td>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorable.</td>
                        </tr>
                        <tr>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Media (1&lt;K&lt;10)</td>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>2</td>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorabilidad media.</td>
                        </tr>
                        <tr>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Baja a muy baja (10^-2&lt;K&lt;1)</td>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>1</td>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Poco favorable.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ))}
              </details>
              <details style={{ background: "#fff", border: "1px solid rgba(0,0,0,.08)", borderRadius: 12, padding: 10, marginBottom: 10 }}>
                <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                  V12 - Porosidad del acuífero (criterio transversal)
                </summary>
                <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                  Valor actual: {v12Value || "-"} {v12HasManual ? `| Ajuste manual: ${formatScore(v12ManualValue)}` : ""}
                </div>
                {[
                  { id: "G1", label: "G1 (Intervención de cauces)", score: v12ScoreByGroup.G1 },
                  { id: "G2", label: "G2 (Recarga por pozos)", score: v12ScoreByGroup.G2 },
                  { id: "G3", label: "G3 (Infiltración superficial)", score: v12ScoreByGroup.G3 },
                ].map((g) => (
                  <div key={g.id} style={{ marginTop: 10 }}>
                    <div style={{ fontWeight: 600 }}>{g.label}</div>
                    <div style={{ marginTop: 4, fontSize: 13, opacity: 0.85 }}>
                      Valor actual: {v12Value || "-"} ? Score(V12)<sup>{g.id}</sup> = {formatScore(getEffectiveGroupScore("V12", g.id, g.score))}
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 6, tableLayout: "fixed" }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "45%" }}>Tipo</th>
                          <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "15%" }}>{`Score^${g.id}`}</th>
                          <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "40%" }}>Justificación</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Muy alta (&gt;50%)</td>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Muy favorable.</td>
                        </tr>
                        <tr>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Alta (30-50%)</td>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorable.</td>
                        </tr>
                        <tr>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Regular (10-30%)</td>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>2</td>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorabilidad media.</td>
                        </tr>
                        <tr>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Mala (0-10%)</td>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>1</td>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Poco favorable.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ))}
              </details>
              <details style={{ background: "#fff", border: "1px solid rgba(0,0,0,.08)", borderRadius: 12, padding: 10, marginBottom: 10 }}>
                <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                  V24 - Relieve (criterio transversal)
                </summary>
                <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                  Valor actual: {v24Value || "-"} {v24HasManual ? `| Ajuste manual: ${formatScore(v24ManualValue)}` : ""}
                </div>
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontWeight: 600 }}>G1 (Intervención de cauces)</div>
                  <div style={{ marginTop: 4, fontSize: 13, opacity: 0.85 }}>
                    Valor actual: {v24Value || "-"} ? Score(V24)<sup>G1</sup> = {formatScore(getEffectiveGroupScore("V24", "G1", v24ScoreByGroup.G1))}
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 6, tableLayout: "fixed" }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "45%" }}>Tipo</th>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "15%" }}>Score^G1</th>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "40%" }}>Justificación</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Llanura / Valle</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Condiciones favorables.</td>
                      </tr>
                      <tr>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Colina o meseta / Montaña</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>0</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Baja idoneidad para G1.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 600 }}>G2 (Recarga por pozos)</div>
                  <div style={{ marginTop: 4, fontSize: 13, opacity: 0.85 }}>
                    Valor actual: {v24Value || "-"} ? Score(V24)<sup>G2</sup> = {formatScore(getEffectiveGroupScore("V24", "G2", v24ScoreByGroup.G2))}
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 6, tableLayout: "fixed" }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "45%" }}>Tipo</th>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "15%" }}>Score^G2</th>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "40%" }}>Justificación</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Llanura / Valle</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Condiciones favorables.</td>
                      </tr>
                      <tr>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Colina o meseta / Montaña</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>3</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorabilidad media.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 600 }}>G3 (Infiltración superficial)</div>
                  <div style={{ marginTop: 4, fontSize: 13, opacity: 0.85 }}>
                    Valor actual: {v24Value || "-"} ? Score(V24)<sup>G3</sup> = {formatScore(getEffectiveGroupScore("V24", "G3", v24ScoreByGroup.G3))}
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 6, tableLayout: "fixed" }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "45%" }}>Tipo</th>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "15%" }}>Score^G3</th>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "40%" }}>Justificación</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Llanura / Valle</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Condiciones favorables.</td>
                      </tr>
                      <tr>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Colina o meseta / Montaña</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>0</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Baja idoneidad para G3.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </details>
              <details style={{ background: "#fff", border: "1px solid rgba(0,0,0,.08)", borderRadius: 12, padding: 10, marginBottom: 10 }}>
                <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                  V25 - Clima (criterio transversal)
                </summary>
                <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                  Valor actual: {v25Value || "-"} {v25HasManual ? `| Ajuste manual: ${formatScore(v25ManualValue)}` : ""}
                </div>
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontWeight: 600 }}>G1 (Intervención de cauces)</div>
                  <div style={{ marginTop: 4, fontSize: 13, opacity: 0.85 }}>
                    Valor actual: {v25Value || "-"} ? Score(V25)<sup>G1</sup> = {formatScore(getEffectiveGroupScore("V25", "G1", v25ScoreByGroup.G1))}
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 6, tableLayout: "fixed" }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "45%" }}>Tipo</th>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "15%" }}>Score^G1</th>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "40%" }}>Justificación</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>árido o semiárido (seco)</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>3</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorable para el grupo.</td>
                      </tr>
                      <tr>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Cálido (seco)</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>3</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorable para el grupo.</td>
                      </tr>
                      <tr>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Húmedo-semihúmedo (Templado)</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Condiciones favorables para la recarga.</td>
                      </tr>
                      <tr>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Tropical</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>3</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorabilidad media.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 600 }}>G2 (Recarga por pozos)</div>
                  <div style={{ marginTop: 4, fontSize: 13, opacity: 0.85 }}>
                    Valor actual: {v25Value || "-"} ? Score(V25)<sup>G2</sup> = {formatScore(getEffectiveGroupScore("V25", "G2", v25ScoreByGroup.G2))}
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 6, tableLayout: "fixed" }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "45%" }}>Tipo</th>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "15%" }}>Score^G2</th>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "40%" }}>Justificación</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>árido o semiárido (seco)</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>No condiciona la recarga por pozos.</td>
                      </tr>
                      <tr>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Cálido (seco)</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>No condiciona la recarga por pozos.</td>
                      </tr>
                      <tr>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Húmedo-semihúmedo (Templado)</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>No condiciona la recarga por pozos.</td>
                      </tr>
                      <tr>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Tropical</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>No condiciona la recarga por pozos.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 600 }}>G3 (Infiltración superficial)</div>
                  <div style={{ marginTop: 4, fontSize: 13, opacity: 0.85 }}>
                    Valor actual: {v25Value || "-"} ? Score(V25)<sup>G3</sup> = {formatScore(getEffectiveGroupScore("V25", "G3", v25ScoreByGroup.G3))}
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 6, tableLayout: "fixed" }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "45%" }}>Tipo</th>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "15%" }}>Score^G3</th>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "40%" }}>Justificación</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>árido o semiárido (seco)</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>3</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorable para el grupo.</td>
                      </tr>
                      <tr>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Cálido (seco)</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>3</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorable para el grupo.</td>
                      </tr>
                      <tr>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Húmedo-semihúmedo (Templado)</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Condiciones favorables para infiltración.</td>
                      </tr>
                      <tr>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Tropical</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>3</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorabilidad media.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </details>
              {/* V8 movido arriba para respetar el orden */}
              {/*
              <details style={{ background: "#fff", border: "1px solid rgba(0,0,0,.08)", borderRadius: 12, padding: 10 }}>
                <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                  V8 - Tipo de acuífero (funciones por grupo)
                </summary>
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontWeight: 600 }}>G1 (Intervención de cauces)</div>
                  <div style={{ marginTop: 4, fontSize: 13, opacity: 0.85 }}>
                    Valor actual: {v8Value || "?"} ? Score(V8)<sup>G1</sup> = {formatScore(getEffectiveGroupScore("V8", "G1", v8ScoreByGroup.G1))}
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 6, tableLayout: "fixed" }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "45%" }}>Tipo</th>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "15%" }}>Score^G1</th>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "40%" }}>Justificación</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Libre</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorece infiltración desde cauces.</td>
                      </tr>
                      <tr>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Semiconfinado / Confinado</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>1</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Limitado; se prefiere recarga por pozos.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 600 }}>G2 (Recarga por pozos)</div>
                  <div style={{ marginTop: 4, fontSize: 13, opacity: 0.85 }}>
                    Valor actual: {v8Value || "?"} ? Score(V8)<sup>G2</sup> = {formatScore(getEffectiveGroupScore("V8", "G2", v8ScoreByGroup.G2))}
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 6, tableLayout: "fixed" }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "45%" }}>Tipo</th>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "15%" }}>Score^G2</th>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "40%" }}>Justificación</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Libre</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>3</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Mayor riesgo de pérdida por flujo superficial.</td>
                      </tr>
                      <tr>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Semiconfinado / Confinado</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Mejor control y almacenamiento en ASR/ASTR.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 600 }}>G3 (Infiltración superficial)</div>
                  <div style={{ marginTop: 4, fontSize: 13, opacity: 0.85 }}>
                    Valor actual: {v8Value || "?"} ? Score(V8)<sup>G3</sup> = {formatScore(getEffectiveGroupScore("V8", "G3", v8ScoreByGroup.G3))}
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 6, tableLayout: "fixed" }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "45%" }}>Tipo</th>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "15%" }}>Score^G3</th>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "40%" }}>Justificación</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Libre</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Maximiza la percolación superficial.</td>
                      </tr>
                      <tr>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Semiconfinado / Confinado</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>1</td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Menor efectividad en infiltración.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </details>
              */}
                </div>
              </details>
            </div>
            <details style={{ marginTop: 12 }}>
              <summary
                style={{
                  cursor: "pointer",
                  padding: 12,
                  borderRadius: 12,
                  background: "#fee2e2",
                  border: "1px solid #fecaca",
                  fontWeight: 700,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <span>Modo personalizado de influencia por grupo</span>
                <span style={{ fontSize: 12, opacity: 0.75 }}>
                  {customInfluenceEnabled ? "Activo" : "Opcional"}
                  {Object.keys(customInfluenceByVar || {}).length ? ` ? ${Object.keys(customInfluenceByVar).length} ajustes` : ""}
                </span>
              </summary>
              <div
                style={{
                  marginTop: 10,
                  padding: 12,
                  borderRadius: 12,
                  background: "#fff",
                  border: "1px solid rgba(0,0,0,.08)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>Personaliza la influencia por variable</div>
                    <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
                      Ajusta manualmente la influencia por variable en cada grupo cuando no coincida con la guia base.
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                      <input
                        type="checkbox"
                        checked={customInfluenceEnabled}
                        onChange={(e) => onToggleCustomInfluence(e.target.checked)}
                      />
                      Activar modo personalizado
                    </label>
                    <button
                      type="button"
                      onClick={onResetCustomInfluence}
                      disabled={!Object.keys(customInfluenceByVar || {}).length}
                      style={{
                        border: "1px solid rgba(0,0,0,.2)",
                        background: "#f8fafc",
                        padding: "6px 10px",
                        borderRadius: 8,
                        fontSize: 12,
                        cursor: Object.keys(customInfluenceByVar || {}).length ? "pointer" : "not-allowed",
                        opacity: Object.keys(customInfluenceByVar || {}).length ? 1 : 0.5,
                      }}
                    >
                      Limpiar ajustes
                    </button>
                  </div>
                </div>
                <div style={{ marginTop: 10, overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 540 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>Variable</th>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>G1</th>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>G2</th>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>G3</th>
                      </tr>
                    </thead>
                    <tbody>
                      {c2CustomRows.map((row, idx) => {
                        const vInfo = scoreById.get(row.id);
                        const rawValue = String(vInfo?.reason || "");
                        const showSelection = rawValue && !rawValue.includes("/");
                        const isRowLocked = customInfluenceAllowedIds ? !customInfluenceAllowedIds.has(row.id) : false;
                        return (
                          <tr
                            key={row.id}
                            style={{
                              background: idx % 2 === 0 ? "#f8fafc" : "#ffffff",
                              opacity: isRowLocked ? 0.6 : 1,
                            }}
                          >
                            <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)", fontWeight: 600 }}>
                              <div>
                                {row.id} - {row.label}
                              </div>
                              <div style={{ marginTop: 2, fontSize: 12, opacity: 0.75 }}>
                                Seleccionado: {showSelection ? rawValue : "-"}
                              </div>
                            </td>
                            {["G1", "G2", "G3"].map((gid) => {
                              const override = customInfluenceByVar?.[row.id]?.[gid];
                              const autoValue = getAutoGroupScore(row.id, gid);
                              const selectValue = Number.isFinite(override) ? String(override) : "auto";
                              return (
                                <td key={gid} style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>
                                  <select
                                    value={selectValue}
                                    onChange={(e) => {
                                      const next = e.target.value;
                                      if (next === "auto") onCustomInfluenceChange(row.id, gid, null);
                                      else onCustomInfluenceChange(row.id, gid, Number(next));
                                    }}
                                    disabled={!customInfluenceEnabled || isRowLocked}
                                    style={{
                                      width: "100%",
                                      padding: "4px 6px",
                                      borderRadius: 6,
                                      border: "1px solid rgba(0,0,0,.2)",
                                      background: customInfluenceEnabled && !isRowLocked ? "#fff" : "#f1f5f9",
                                    }}
                                  >
                                    <option value="auto">{`Auto (${formatScoreCompact(autoValue)})`}</option>
                                    {[0, 1, 2, 3, 4].map((v) => (
                                      <option key={v} value={String(v)}>
                                        {v}
                                      </option>
                                    ))}
                                  </select>
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
            </details>
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 600 }}>Cálculo:</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => scrollToRef(guideRef)}
                  style={{
                    border: "1px solid rgba(0,0,0,.2)",
                    background: "#f8fafc",
                    padding: "6px 10px",
                    borderRadius: 8,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Ir a guía
                </button>
                <button
                  type="button"
                  onClick={() => navigateToInsumos(scenarioId || 0, [])}
                  style={{
                    border: "1px solid rgba(0,0,0,.2)",
                    background: "#f8fafc",
                    padding: "6px 10px",
                    borderRadius: 8,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Ir a insumos
                </button>
              </div>
            </div>
            <div
              style={{
                marginTop: 6,
                padding: 12,
                borderRadius: 12,
                background: "#fff",
                border: "1px solid rgba(0,0,0,.08)",
              }}
            >
              {c2GroupRows.map((row) => (
                <div key={row.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, minWidth: 28 }}>{row.id}</div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ position: "relative", display: "inline-block", paddingRight: "0.75em" }}>
                      S
                      <span style={{ position: "absolute", top: "-0.45em", right: 0, fontSize: "0.65em" }}>G</span>
                      <span style={{ position: "absolute", bottom: "-0.35em", right: 0, fontSize: "0.65em" }}>
                        C2
                      </span>
                    </span>
                    <span>=</span>
                    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", lineHeight: 1.1 }}>
                      <span style={{ padding: "0 6px", borderBottom: "1px solid #111" }}>
                        {row.scores.length ? row.scores.map(formatScoreCompact).join(" + ") : "?"}
                      </span>
                      <span style={{ padding: "0 6px" }}>{row.denom ? row.denom : "?"}</span>
                    </span>
                    <span>=</span>
                    <span>{formatScore(row.sc)}</span>
                    <span style={{ opacity: 0.8, fontSize: 13 }}>{row.obs}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, fontWeight: 600 }}>Diagnóstico por Grupo:</div>
            <div style={{ marginTop: 6, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 900 }}>
                <thead>
                  <tr>
                    {renderHeaderWithHelp("c2-grupo", "Grupo", "Grupo MAR evaluado (G1, G2, G3).", {
                      textAlign: "left",
                      padding: 8,
                      borderBottom: "1px solid rgba(0,0,0,.14)",
                    })}
                    {c2VarIds.map((id) => (
                      <th key={id} style={{ textAlign: "center", padding: 8, borderBottom: "1px solid rgba(0,0,0,.14)" }}>
                        <span>
                          Score({id})<sup>G</sup>
                        </span>
                      </th>
                    ))}
                    {renderHeaderWithHelp(
                      "c2-score-crit",
                      <span style={{ position: "relative", display: "inline-block", paddingRight: "0.75em" }}>
                        S
                        <span style={{ position: "absolute", top: "-0.45em", right: 0, fontSize: "0.65em" }}>G</span>
                        <span style={{ position: "absolute", bottom: "-0.35em", right: 0, fontSize: "0.65em" }}>C2</span>
                      </span>,
                      "Score del criterio para el grupo. Es el promedio de los scores de las variables del criterio, calculado para G1, G2 o G3.",
                      { textAlign: "center", padding: 8, borderBottom: "1px solid rgba(0,0,0,.14)" }
                    )}
                    {renderHeaderWithHelp("c2-obs", "Observaciones", "Notas sobre faltantes o interpretacion.", {
                      textAlign: "left",
                      padding: 8,
                      borderBottom: "1px solid rgba(0,0,0,.14)",
                    })}
                  </tr>
                </thead>
                <tbody>
                  {c2GroupDetailRows.map((row, idx) => (
                    <tr key={row.id} style={{ background: idx % 2 === 0 ? "#f8fafc" : "#ffffff" }}>
                      <td style={{ padding: 8, borderBottom: "1px solid rgba(0,0,0,.08)", fontWeight: 700 }}>{row.id}</td>
                      {c2VarIds.map((id) => (
                        <td key={id} style={{ padding: 8, borderBottom: "1px solid rgba(0,0,0,.08)", textAlign: "center" }}>
                          {Number.isFinite(row.scoresByVar[id]) ? formatScore(row.scoresByVar[id]) : "-"}
                        </td>
                      ))}
                      <td style={{ padding: 8, borderBottom: "1px solid rgba(0,0,0,.08)", textAlign: "center", fontWeight: 700 }}>
                        {formatScore(row.sc)}
                      </td>
                      <td style={{ padding: 8, borderBottom: "1px solid rgba(0,0,0,.08)" }}>{row.obs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </details>
          </div>
          <div
            style={{
              marginTop: 12,
              padding: 14,
              borderRadius: 14,
              background: "rgba(219, 234, 254, 0.6)",
              border: "1px solid rgba(147, 197, 253, 0.7)",
            }}
          >
                        <details style={{ marginTop: 10 }}>
              <summary
                style={{
                  cursor: "pointer",
                  fontWeight: 700,
                  padding: 4,
                  lineHeight: 1.2,
                  background: "transparent",
                  border: "none",
                  borderRadius: 12,
                }}
              >
                Criterio C3 - Fuente y calidad del agua
              </summary>
            <div style={{ marginTop: 8, fontWeight: 600 }}>Datos disponibles:</div>
            <div style={{ marginTop: 6, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15, minWidth: 620 }}>
                <thead>
                  <tr>
                    {renderHeaderWithHelp("c3-variable", "Variable", "Codigo de la variable evaluada.", {
                      textAlign: "left",
                      padding: 8,
                      borderBottom: "1px solid rgba(0,0,0,.14)",
                    })}
                    {renderHeaderWithHelp("c3-estado", "Estado", "Estado del insumo: completo, parcial o falta.", {
                      textAlign: "left",
                      padding: 8,
                      borderBottom: "1px solid rgba(0,0,0,.14)",
                    })}
                    {renderHeaderWithHelp("c3-descripcion", "Descripción", "Nombre corto de la variable.", {
                      textAlign: "left",
                      padding: 8,
                      borderBottom: "1px solid rgba(0,0,0,.14)",
                    })}
                  </tr>
                </thead>
                <tbody>
                  {c3Vars.map((row, idx) => (
                    <tr key={row.id} style={{ background: idx % 2 === 0 ? "#f8fafc" : "#ffffff" }}>
                      <td style={{ padding: 8, borderBottom: "1px solid rgba(0,0,0,.08)", fontWeight: 700 }}>{row.id}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid rgba(0,0,0,.08)" }}>{row.status}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid rgba(0,0,0,.08)" }}>{row.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 10 }}>
              <details style={{ background: "transparent", border: "none", borderRadius: 12, padding: 0 }}>
                <summary
                  style={{
                    cursor: "pointer",
                    fontWeight: 700,
                    background: "#fee2e2",
                    border: "1px solid #fecaca",
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  Guía por variables
                </summary>
                <div style={{ marginTop: 10 }}>
                  {c3Vars.map((row) => {
                    const vInfo = scoreById.get(row.id);
                    const scoreByGroup = vInfo?.scoreByGroup || {};
                    const rawValue = String(vInfo?.reason || "");
                    if (row.id === "V36" || row.id === "V37") {
                      return null;
                    }
                    if (row.id === "V14") {
                      return (
                        <details
                          key={row.id}
                          style={{
                            background: "#fff",
                            border: "1px solid rgba(0,0,0,.08)",
                            borderRadius: 12,
                            padding: 10,
                            marginBottom: 10,
                          }}
                        >
                          <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                            {row.id} - {row.description}
                          </summary>
                          <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                            Valor actual: {rawValue || "-"}
                          </div>
                          <div style={{ marginTop: 10 }}>
                            <div style={{ fontWeight: 600 }}>G1 (Intervencin de cauces)</div>
                            <div style={{ marginTop: 4, fontSize: 13, opacity: 0.85 }}>
                              Valor actual: {rawValue || "-"} ? Score(V14)<sup>G1</sup> ={" "}
                              {formatScore(getEffectiveGroupScore("V14", "G1", scoreByGroup.G1))}
                            </div>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 6, tableLayout: "fixed" }}>
                              <thead>
                                <tr>
                                  <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "45%" }}>Tipo</th>
                                  <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "15%" }}>Score^G1</th>
                                  <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "40%" }}>Justificación</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Superficial</td>
                                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Alta idoneidad para el grupo.</td>
                                </tr>
                                <tr>
                                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Escorrentia estacional</td>
                                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>0</td>
                                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>No aporta idoneidad.</td>
                                </tr>
                                <tr>
                                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Agua residual / residual tratada</td>
                                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>0</td>
                                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>No aporta idoneidad.</td>
                                </tr>
                                <tr>
                                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Subterranea u otra</td>
                                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>0</td>
                                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>No aporta idoneidad.</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                          <div style={{ marginTop: 12 }}>
                            <div style={{ fontWeight: 600 }}>G2 (Recarga por pozos)</div>
                            <div style={{ marginTop: 4, fontSize: 13, opacity: 0.85 }}>
                              Valor actual: {rawValue || "-"} ? Score(V14)<sup>G2</sup> ={" "}
                              {formatScore(getEffectiveGroupScore("V14", "G2", scoreByGroup.G2))}
                            </div>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 6, tableLayout: "fixed" }}>
                              <thead>
                                <tr>
                                  <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "45%" }}>Tipo</th>
                                  <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "15%" }}>Score^G2</th>
                                  <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "40%" }}>Justificación</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Superficial</td>
                                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Alta idoneidad para el grupo.</td>
                                </tr>
                                <tr>
                                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Escorrentia estacional</td>
                                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>2</td>
                                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Requiere almacenamiento previo.</td>
                                </tr>
                                <tr>
                                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Agua residual / residual tratada</td>
                                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Alta idoneidad para el grupo.</td>
                                </tr>
                                <tr>
                                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Subterranea u otra</td>
                                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Alta idoneidad para el grupo.</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                          <div style={{ marginTop: 12 }}>
                            <div style={{ fontWeight: 600 }}>G3 (Infiltración superficial)</div>
                            <div style={{ marginTop: 4, fontSize: 13, opacity: 0.85 }}>
                              Valor actual: {rawValue || "-"} ? Score(V14)<sup>G3</sup> ={" "}
                              {formatScore(getEffectiveGroupScore("V14", "G3", scoreByGroup.G3))}
                            </div>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 6, tableLayout: "fixed" }}>
                              <thead>
                                <tr>
                                  <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "45%" }}>Tipo</th>
                                  <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "15%" }}>Score^G3</th>
                                  <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "40%" }}>Justificación</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Superficial</td>
                                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Alta idoneidad para el grupo.</td>
                                </tr>
                                <tr>
                                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Escorrentia estacional</td>
                                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Alta idoneidad para el grupo.</td>
                                </tr>
                                <tr>
                                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Agua residual / residual tratada</td>
                                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>3</td>
                                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorabilidad buena.</td>
                                </tr>
                                <tr>
                                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Subterranea u otra</td>
                                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>0</td>
                                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>No aporta idoneidad.</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </details>
                      );
                    }
                    if (row.id === "V36") {
                      return (
                        <details
                          key={row.id}
                          style={{
                            background: "#fff",
                            border: "1px solid rgba(0,0,0,.08)",
                            borderRadius: 12,
                            padding: 10,
                            marginBottom: 10,
                          }}
                        >
                          <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                            {row.id} - {row.description}
                          </summary>
                          <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                            Valor actual: {rawValue || "-"}
                          </div>
                          <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600, color: "#0f172a" }}>
                            Aplica solo cuando la fuente es superficial.
                          </div>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 8, tableLayout: "fixed" }}>
                            <thead>
                              <tr>
                                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "40%" }}>Tipo</th>
                                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "15%" }}>Score^G1</th>
                                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "15%" }}>Score^G3</th>
                                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "30%" }}>Justificación</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Río permanente</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>3</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Muy favorable para G1; viable para G3.</td>
                              </tr>
                              <tr>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Río estacional</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>3</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>3</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorabilidad similar en G1 y G3.</td>
                              </tr>
                              <tr>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Río efímero</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>2</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Menos favorable para G1; favorece G3.</td>
                              </tr>
                              <tr>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Lago/Embalse</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>0</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>No aplica intervención de cauce; favorece G3.</td>
                              </tr>
                            </tbody>
                          </table>
                          <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                            Score({row.id})<sup>G</sup> aplicado (G1/G2/G3): {formatScore(getEffectiveGroupScore(row.id, "G1", scoreByGroup.G1))} {" "}
                            {formatScore(getEffectiveGroupScore(row.id, "G2", scoreByGroup.G2))} {" "}
                            {formatScore(getEffectiveGroupScore(row.id, "G3", scoreByGroup.G3))}
                          </div>
                        </details>
                      );
                    }
                    if (row.id === "V37") {
                      return (
                        <details
                          key={row.id}
                          style={{
                            background: "#fff",
                            border: "1px solid rgba(0,0,0,.08)",
                            borderRadius: 12,
                            padding: 10,
                            marginBottom: 10,
                          }}
                        >
                          <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                            {row.id} - {row.description}
                          </summary>
                          <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                            Valor actual: {rawValue || "-"}
                          </div>
                          <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600, color: "#0f172a" }}>
                            Aplica solo cuando la fuente es superficial.
                          </div>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 8, tableLayout: "fixed" }}>
                            <thead>
                              <tr>
                                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "45%" }}>Tipo</th>
                                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "15%" }}>Score^G1</th>
                                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "15%" }}>Score^G3</th>
                                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "25%" }}>Justificación</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Río ganador</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Hay conexión hidráulica.</td>
                              </tr>
                              <tr>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Río perdedor</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Hay conexión hidráulica.</td>
                              </tr>
                              <tr>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Sin conexión</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>0</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>0</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>No aporta idoneidad.</td>
                              </tr>
                            </tbody>
                          </table>
                          <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                            Score({row.id})<sup>G</sup> aplicado (G1/G2/G3): {formatScore(getEffectiveGroupScore(row.id, "G1", scoreByGroup.G1))} {" "}
                            {formatScore(getEffectiveGroupScore(row.id, "G2", scoreByGroup.G2))} {" "}
                            {formatScore(getEffectiveGroupScore(row.id, "G3", scoreByGroup.G3))}
                          </div>
                        </details>
                      );
                    }
                    if (row.id === "V15") {
                      return (
                        <details
                          key={row.id}
                          style={{
                            background: "#fff",
                            border: "1px solid rgba(0,0,0,.08)",
                            borderRadius: 12,
                            padding: 10,
                            marginBottom: 10,
                          }}
                        >
                          <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                            {row.id} - {row.description}
                          </summary>
                          <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                            Valor actual: {rawValue || "-"}
                          </div>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 8, tableLayout: "fixed" }}>
                            <thead>
                              <tr>
                                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "45%" }}>Tipo</th>
                                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "15%" }}>Score^G</th>
                                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "40%" }}>Justificación</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Apta</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Alta idoneidad para el grupo.</td>
                              </tr>
                              <tr>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Apta con pretratamiento</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>3</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorabilidad buena.</td>
                              </tr>
                              <tr>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>No apta</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>0</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>No aporta idoneidad.</td>
                              </tr>
                              <tr>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>No evaluada</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>0</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Sin evaluación disponible.</td>
                              </tr>
                            </tbody>
                          </table>
                          <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                            Score({row.id})<sup>G</sup> aplicado (G1/G2/G3): {formatScore(getEffectiveGroupScore(row.id, "G1", scoreByGroup.G1))} ?{" "}
                            {formatScore(getEffectiveGroupScore(row.id, "G2", scoreByGroup.G2))} ?{" "}
                            {formatScore(getEffectiveGroupScore(row.id, "G3", scoreByGroup.G3))}
                          </div>
                        </details>
                      );
                    }
                    if (row.id === "V16") {
                      return (
                        <details
                          key={row.id}
                          style={{
                            background: "#fff",
                            border: "1px solid rgba(0,0,0,.08)",
                            borderRadius: 12,
                            padding: 10,
                            marginBottom: 10,
                          }}
                        >
                          <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                            {row.id} - {row.description}
                          </summary>
                          <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                            Valor actual: {rawValue || "-"}
                          </div>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 8, tableLayout: "fixed" }}>
                            <thead>
                              <tr>
                                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "45%" }}>Tipo</th>
                                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "15%" }}>Score^G</th>
                                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "40%" }}>Justificación</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Si</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Alta idoneidad para el grupo.</td>
                              </tr>
                              <tr>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Parcial</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>2</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorabilidad intermedia.</td>
                              </tr>
                              <tr>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>No</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>0</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>No aporta idoneidad.</td>
                              </tr>
                              <tr>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>No evaluado</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>0</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Sin evaluación disponible.</td>
                              </tr>
                            </tbody>
                          </table>
                          <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                            Score({row.id})<sup>G</sup> aplicado (G1/G2/G3): {formatScore(getEffectiveGroupScore(row.id, "G1", scoreByGroup.G1))} ?{" "}
                            {formatScore(getEffectiveGroupScore(row.id, "G2", scoreByGroup.G2))} ?{" "}
                            {formatScore(getEffectiveGroupScore(row.id, "G3", scoreByGroup.G3))}
                          </div>
                        </details>
                      );
                    }
                    return (
                      <details
                        key={row.id}
                        style={{
                          background: "#fff",
                          border: "1px solid rgba(0,0,0,.08)",
                          borderRadius: 12,
                          padding: 10,
                          marginBottom: 10,
                        }}
                      >
                        <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                          {row.id} - {row.description}
                        </summary>
                        <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                          Valor actual: {rawValue || "-"}
                        </div>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 8, tableLayout: "fixed" }}>
                          <thead>
                            <tr>
                              <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "45%" }}>Tipo</th>
                              <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "15%" }}>Score^G</th>
                              <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "40%" }}>Justificación</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Muy favorable</td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Alta idoneidad para el grupo.</td>
                            </tr>
                            <tr>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorable</td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>3</td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorabilidad buena.</td>
                            </tr>
                            <tr>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Moderada</td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>2</td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorabilidad intermedia.</td>
                            </tr>
                            <tr>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Poco favorable</td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>1</td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorabilidad baja.</td>
                            </tr>
                            <tr>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>No favorable</td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>0</td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>No aporta idoneidad.</td>
                            </tr>
                          </tbody>
                        </table>
                        <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                          Score({row.id})<sup>G</sup> aplicado (G1/G2/G3): {formatScore(getEffectiveGroupScore(row.id, "G1", scoreByGroup.G1))} ?{" "}
                          {formatScore(getEffectiveGroupScore(row.id, "G2", scoreByGroup.G2))} ?{" "}
                          {formatScore(getEffectiveGroupScore(row.id, "G3", scoreByGroup.G3))}
                        </div>
                      </details>
                    );
                  })}
                </div>
              </details>
            </div>
            <details style={{ marginTop: 12 }}>
              <summary
                style={{
                  cursor: "pointer",
                  padding: 12,
                  borderRadius: 12,
                  background: "#fee2e2",
                  border: "1px solid #fecaca",
                  fontWeight: 700,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <span>Modo personalizado de influencia por grupo</span>
                <span style={{ fontSize: 12, opacity: 0.75 }}>
                  {customInfluenceEnabled ? "Activo" : "Opcional"}
                  {Object.keys(customInfluenceByVar || {}).length ? ` \u00b7 ${Object.keys(customInfluenceByVar).length} ajustes` : ""}
                </span>
              </summary>
              <div
                style={{
                  marginTop: 10,
                  padding: 12,
                  borderRadius: 12,
                  background: "#fff",
                  border: "1px solid rgba(0,0,0,.08)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>Personaliza la influencia por variable</div>
                    <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
                      Ajusta manualmente la influencia por variable en cada grupo cuando no coincida con la guía base.
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                      <input
                        type="checkbox"
                        checked={customInfluenceEnabled}
                        onChange={(e) => onToggleCustomInfluence(e.target.checked)}
                      />
                      Activar modo personalizado
                    </label>
                    <button
                      type="button"
                      onClick={onResetCustomInfluence}
                      disabled={!Object.keys(customInfluenceByVar || {}).length}
                      style={{
                        border: "1px solid rgba(0,0,0,.2)",
                        background: "#f8fafc",
                        padding: "6px 10px",
                        borderRadius: 8,
                        fontSize: 12,
                        cursor: Object.keys(customInfluenceByVar || {}).length ? "pointer" : "not-allowed",
                        opacity: Object.keys(customInfluenceByVar || {}).length ? 1 : 0.5,
                      }}
                    >
                      Limpiar ajustes
                    </button>
                  </div>
                </div>
                <div style={{ marginTop: 10, overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 540 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>Variable</th>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>G1</th>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>G2</th>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>G3</th>
                      </tr>
                    </thead>
                    <tbody>
                      {c3CustomRows.map((row, idx) => {
                        const vInfo = scoreById.get(row.id);
                        const rawValue = String(vInfo?.reason || "");
                        const showSelection = rawValue && !rawValue.includes("/");
                        const isRowLocked = customInfluenceAllowedIds ? !customInfluenceAllowedIds.has(row.id) : false;
                        return (
                          <tr
                            key={row.id}
                            style={{
                              background: idx % 2 === 0 ? "#f8fafc" : "#ffffff",
                              opacity: isRowLocked ? 0.6 : 1,
                            }}
                          >
                            <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)", fontWeight: 600 }}>
                              <div>
                                {row.id} - {row.label}
                              </div>
                              <div style={{ marginTop: 2, fontSize: 12, opacity: 0.75 }}>
                                Seleccionado: {showSelection ? rawValue : "-"}
                              </div>
                            </td>
                            {["G1", "G2", "G3"].map((gid) => {
                              const override = customInfluenceByVar?.[row.id]?.[gid];
                              const autoValue = getAutoGroupScore(row.id, gid);
                              const selectValue = Number.isFinite(override) ? String(override) : "auto";
                              return (
                                <td key={gid} style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>
                                  <select
                                    value={selectValue}
                                    onChange={(e) => {
                                      const next = e.target.value;
                                      if (next === "auto") onCustomInfluenceChange(row.id, gid, null);
                                      else onCustomInfluenceChange(row.id, gid, Number(next));
                                    }}
                                    disabled={!customInfluenceEnabled || isRowLocked}
                                    style={{
                                      width: "100%",
                                      padding: "4px 6px",
                                      borderRadius: 6,
                                      border: "1px solid rgba(0,0,0,.2)",
                                      background: customInfluenceEnabled && !isRowLocked ? "#fff" : "#f1f5f9",
                                    }}
                                  >
                                    <option value="auto">{`Auto (${formatScoreCompact(autoValue)})`}</option>
                                    {[0, 1, 2, 3, 4].map((v) => (
                                      <option key={v} value={String(v)}>
                                        {v}
                                      </option>
                                    ))}
                                  </select>
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
            </details>
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 600 }}>Cálculo:</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => scrollToRef(guideRef)}
                  style={{
                    border: "1px solid rgba(0,0,0,.2)",
                    background: "#f8fafc",
                    padding: "6px 10px",
                    borderRadius: 8,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Ir a guía
                </button>
                <button
                  type="button"
                  onClick={() => navigateToInsumos(scenarioId || 0, [])}
                  style={{
                    border: "1px solid rgba(0,0,0,.2)",
                    background: "#f8fafc",
                    padding: "6px 10px",
                    borderRadius: 8,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Ir a insumos
                </button>
              </div>
            </div>
            <div
              style={{
                marginTop: 6,
                padding: 12,
                borderRadius: 12,
                background: "#fff",
                border: "1px solid rgba(0,0,0,.08)",
              }}
            >
              {c3GroupRows.map((row) => {
                const nonZeroScores = row.scores.filter((v) => Number.isFinite(v) && v !== 0);
                const denom = nonZeroScores.length;
                return (
                  <div key={row.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, minWidth: 28 }}>{row.id}</div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ position: "relative", display: "inline-block", paddingRight: "0.75em" }}>
                        S
                        <span style={{ position: "absolute", top: "-0.45em", right: 0, fontSize: "0.65em" }}>G</span>
                        <span style={{ position: "absolute", bottom: "-0.35em", right: 0, fontSize: "0.65em" }}>
                          C3
                        </span>
                      </span>
                      <span>=</span>
                      <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", lineHeight: 1.1 }}>
                        <span style={{ padding: "0 6px", borderBottom: "1px solid #111" }}>
                          {denom ? nonZeroScores.map(formatScoreCompact).join(" + ") : "-"}
                        </span>
                        <span style={{ padding: "0 6px" }}>{denom ? denom : "-"}</span>
                      </span>
                      <span>=</span>
                      <span>{formatScore(row.sc)}</span>
                      <span style={{ opacity: 0.8, fontSize: 13 }}>{row.obs}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 10, fontWeight: 600 }}>Diagnóstico por Grupo:</div>
            <div style={{ marginTop: 6, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 760 }}>
                <thead>
                  <tr>
                    {renderHeaderWithHelp("c3-grupo", "Grupo", "Grupo MAR evaluado (G1, G2, G3).", {
                      textAlign: "left",
                      padding: 8,
                      borderBottom: "1px solid rgba(0,0,0,.14)",
                    })}
                    {c3VarIds.map((id) => (
                      <th key={id} style={{ textAlign: "center", padding: 8, borderBottom: "1px solid rgba(0,0,0,.14)" }}>
                        <span>
                          Score({id})<sup>G</sup>
                        </span>
                      </th>
                    ))}
                    {renderHeaderWithHelp(
                      "c3-score-crit",
                      <span style={{ position: "relative", display: "inline-block", paddingRight: "0.75em" }}>
                        S
                        <span style={{ position: "absolute", top: "-0.45em", right: 0, fontSize: "0.65em" }}>G</span>
                        <span style={{ position: "absolute", bottom: "-0.35em", right: 0, fontSize: "0.65em" }}>C3</span>
                      </span>,
                      "Score del criterio para el grupo. Es el promedio de los scores de las variables del criterio, calculado para G1, G2 o G3.",
                      { textAlign: "center", padding: 8, borderBottom: "1px solid rgba(0,0,0,.14)" }
                    )}
                    {renderHeaderWithHelp("c3-obs", "Observaciones", "Notas sobre faltantes o interpretacion.", {
                      textAlign: "left",
                      padding: 8,
                      borderBottom: "1px solid rgba(0,0,0,.14)",
                    })}
                  </tr>
                </thead>
                <tbody>
                  {c3GroupDetailRows.map((row, idx) => (
                    <tr key={row.id} style={{ background: idx % 2 === 0 ? "#f8fafc" : "#ffffff" }}>
                      <td style={{ padding: 8, borderBottom: "1px solid rgba(0,0,0,.08)", fontWeight: 700 }}>{row.id}</td>
                      {c3VarIds.map((id) => (
                        <td key={id} style={{ padding: 8, borderBottom: "1px solid rgba(0,0,0,.08)", textAlign: "center" }}>
                          {Number.isFinite(row.scoresByVar[id]) ? formatScore(row.scoresByVar[id]) : "-"}
                        </td>
                      ))}
                      <td style={{ padding: 8, borderBottom: "1px solid rgba(0,0,0,.08)", textAlign: "center", fontWeight: 700 }}>
                        {formatScore(row.sc)}
                      </td>
                      <td style={{ padding: 8, borderBottom: "1px solid rgba(0,0,0,.08)" }}>{row.obs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </details>
          </div>
          <div
            style={{
              marginTop: 12,
              padding: 14,
              borderRadius: 14,
              background: "rgba(254, 243, 199, 0.6)",
              border: "1px solid rgba(252, 211, 77, 0.7)",
            }}
          >
                        <details style={{ marginTop: 10 }}>
              <summary
                style={{
                  cursor: "pointer",
                  fontWeight: 700,
                  padding: 4,
                  lineHeight: 1.2,
                  background: "transparent",
                  border: "none",
                  borderRadius: 12,
                }}
              >
                Criterio C4 - Viabilidad técnica
              </summary>
            <div style={{ marginTop: 8, fontWeight: 600 }}>Datos disponibles:</div>
            <div style={{ marginTop: 6, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15, minWidth: 620 }}>
                <thead>
                  <tr>
                    {renderHeaderWithHelp("c4-variable", "Variable", "Codigo de la variable evaluada.", {
                      textAlign: "left",
                      padding: 8,
                      borderBottom: "1px solid rgba(0,0,0,.14)",
                    })}
                    {renderHeaderWithHelp("c4-estado", "Estado", "Estado del insumo: completo, parcial o falta.", {
                      textAlign: "left",
                      padding: 8,
                      borderBottom: "1px solid rgba(0,0,0,.14)",
                    })}
                    {renderHeaderWithHelp("c4-descripcion", "Descripción", "Nombre corto de la variable.", {
                      textAlign: "left",
                      padding: 8,
                      borderBottom: "1px solid rgba(0,0,0,.14)",
                    })}
                  </tr>
                </thead>
                <tbody>
                  {c4Vars.map((row, idx) => (
                    <tr key={row.id} style={{ background: idx % 2 === 0 ? "#f8fafc" : "#ffffff" }}>
                      <td style={{ padding: 8, borderBottom: "1px solid rgba(0,0,0,.08)", fontWeight: 700 }}>{row.id}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid rgba(0,0,0,.08)" }}>{row.status}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid rgba(0,0,0,.08)" }}>{row.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 10 }}>
              <details style={{ background: "transparent", border: "none", borderRadius: 12, padding: 0 }}>
                <summary
                  style={{
                    cursor: "pointer",
                    fontWeight: 700,
                    background: "#fee2e2",
                    border: "1px solid #fecaca",
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  Guía por variables
                </summary>
                <div style={{ marginTop: 10 }}>
                  {c4Vars.map((row) => {
                    const vInfo = scoreById.get(row.id);
                    const scoreByGroup = vInfo?.scoreByGroup || {};
                    const rawValue = String(vInfo?.reason || "");
                    const groupNote = c4GroupOnlyNotes.get(row.id);
                    return (
                      <details
                        key={row.id}
                        style={{
                          background: "#fff",
                          border: "1px solid rgba(0,0,0,.08)",
                          borderRadius: 12,
                          padding: 10,
                          marginBottom: 10,
                        }}
                      >
                        <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                          {row.id} - {row.description}
                        </summary>
                        <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                          Valor actual: {rawValue || "-"}
                        </div>
                        {groupNote ? (
                          <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{groupNote}</div>
                        ) : null}
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 8, tableLayout: "fixed" }}>
                          <thead>
                            <tr>
                              <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "45%" }}>Tipo</th>
                              <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "15%" }}>Score^G</th>
                              <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "40%" }}>Justificación</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Muy favorable</td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Alta idoneidad para el grupo.</td>
                            </tr>
                            <tr>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorable</td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>3</td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorabilidad buena.</td>
                            </tr>
                            <tr>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Moderada</td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>2</td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorabilidad intermedia.</td>
                            </tr>
                            <tr>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Poco favorable</td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>1</td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorabilidad baja.</td>
                            </tr>
                            <tr>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>No favorable</td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>0</td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>No aporta idoneidad.</td>
                            </tr>
                          </tbody>
                        </table>
                        <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                          Score({row.id})<sup>G</sup> aplicado (G1/G2/G3): {formatScore(getEffectiveGroupScore(row.id, "G1", scoreByGroup.G1))} ?{" "}
                          {formatScore(getEffectiveGroupScore(row.id, "G2", scoreByGroup.G2))} ?{" "}
                          {formatScore(getEffectiveGroupScore(row.id, "G3", scoreByGroup.G3))}
                        </div>
                      </details>
                    );
                  })}
                </div>
              </details>
            </div>
            <details style={{ marginTop: 12 }}>
              <summary
                style={{
                  cursor: "pointer",
                  padding: 12,
                  borderRadius: 12,
                  background: "#fee2e2",
                  border: "1px solid #fecaca",
                  fontWeight: 700,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <span>Modo personalizado de influencia por grupo</span>
                <span style={{ fontSize: 12, opacity: 0.75 }}>
                  {customInfluenceEnabled ? "Activo" : "Opcional"}
                  {Object.keys(customInfluenceByVar || {}).length ? ` ? ${Object.keys(customInfluenceByVar).length} ajustes` : ""}
                </span>
              </summary>
              <div
                style={{
                  marginTop: 10,
                  padding: 12,
                  borderRadius: 12,
                  background: "#fff",
                  border: "1px solid rgba(0,0,0,.08)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>Personaliza la influencia por variable</div>
                    <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
                      Ajusta manualmente la influencia por variable en cada grupo cuando no coincida con la guía base.
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                      <input
                        type="checkbox"
                        checked={customInfluenceEnabled}
                        onChange={(e) => onToggleCustomInfluence(e.target.checked)}
                      />
                      Activar modo personalizado
                    </label>
                    <button
                      type="button"
                      onClick={onResetCustomInfluence}
                      disabled={!Object.keys(customInfluenceByVar || {}).length}
                      style={{
                        border: "1px solid rgba(0,0,0,.2)",
                        background: "#f8fafc",
                        padding: "6px 10px",
                        borderRadius: 8,
                        fontSize: 12,
                        cursor: Object.keys(customInfluenceByVar || {}).length ? "pointer" : "not-allowed",
                        opacity: Object.keys(customInfluenceByVar || {}).length ? 1 : 0.5,
                      }}
                    >
                      Limpiar ajustes
                    </button>
                  </div>
                </div>
                <div style={{ marginTop: 10, overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 540 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>Variable</th>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>G1</th>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>G2</th>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>G3</th>
                      </tr>
                    </thead>
                    <tbody>
                      {c4CustomRows.map((row, idx) => {
                        const vInfo = scoreById.get(row.id);
                        const rawValue = String(vInfo?.reason || "");
                        const showSelection = rawValue && !rawValue.includes("/");
                        const isRowLocked = customInfluenceAllowedIds ? !customInfluenceAllowedIds.has(row.id) : false;
                        return (
                          <tr
                            key={row.id}
                            style={{
                              background: idx % 2 === 0 ? "#f8fafc" : "#ffffff",
                              opacity: isRowLocked ? 0.6 : 1,
                            }}
                          >
                            <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)", fontWeight: 600 }}>
                              <div>
                                {row.id} - {row.label}
                              </div>
                              <div style={{ marginTop: 2, fontSize: 12, opacity: 0.75 }}>
                                Seleccionado: {showSelection ? rawValue : "-"}
                              </div>
                            </td>
                            {["G1", "G2", "G3"].map((gid) => {
                              const override = customInfluenceByVar?.[row.id]?.[gid];
                              const autoValue = getAutoGroupScore(row.id, gid);
                              const selectValue = Number.isFinite(override) ? String(override) : "auto";
                              return (
                                <td key={gid} style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>
                                  <select
                                    value={selectValue}
                                    onChange={(e) => {
                                      const next = e.target.value;
                                      if (next === "auto") onCustomInfluenceChange(row.id, gid, null);
                                      else onCustomInfluenceChange(row.id, gid, Number(next));
                                    }}
                                    disabled={!customInfluenceEnabled || isRowLocked}
                                    style={{
                                      width: "100%",
                                      padding: "4px 6px",
                                      borderRadius: 6,
                                      border: "1px solid rgba(0,0,0,.2)",
                                      background: customInfluenceEnabled && !isRowLocked ? "#fff" : "#f1f5f9",
                                    }}
                                  >
                                    <option value="auto">{`Auto (${formatScoreCompact(autoValue)})`}</option>
                                    {[0, 1, 2, 3, 4].map((v) => (
                                      <option key={v} value={String(v)}>
                                        {v}
                                      </option>
                                    ))}
                                  </select>
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
            </details>
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 600 }}>Cálculo:</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => scrollToRef(guideRef)}
                  style={{
                    border: "1px solid rgba(0,0,0,.2)",
                    background: "#f8fafc",
                    padding: "6px 10px",
                    borderRadius: 8,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Ir a guía
                </button>
                <button
                  type="button"
                  onClick={() => navigateToInsumos(scenarioId || 0, [])}
                  style={{
                    border: "1px solid rgba(0,0,0,.2)",
                    background: "#f8fafc",
                    padding: "6px 10px",
                    borderRadius: 8,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Ir a insumos
                </button>
              </div>
            </div>
            <div
              style={{
                marginTop: 6,
                padding: 12,
                borderRadius: 12,
                background: "#fff",
                border: "1px solid rgba(0,0,0,.08)",
              }}
            >
              {c4GroupRows.map((row) => (
                <div key={row.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, minWidth: 28 }}>{row.id}</div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ position: "relative", display: "inline-block", paddingRight: "0.75em" }}>
                      S
                      <span style={{ position: "absolute", top: "-0.45em", right: 0, fontSize: "0.65em" }}>G</span>
                      <span style={{ position: "absolute", bottom: "-0.35em", right: 0, fontSize: "0.65em" }}>
                        C4
                      </span>
                    </span>
                    <span>=</span>
                    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", lineHeight: 1.1 }}>
                      <span style={{ padding: "0 6px", borderBottom: "1px solid #111" }}>
                        {row.scores.length ? row.scores.map(formatScoreCompact).join(" + ") : "-"}
                      </span>
                      <span style={{ padding: "0 6px" }}>{row.denom ? row.denom : "-"}</span>
                    </span>
                    <span>=</span>
                    <span>{formatScore(row.sc)}</span>
                    <span style={{ opacity: 0.8, fontSize: 13 }}>{row.obs}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, fontWeight: 600 }}>Diagnóstico por Grupo:</div>
            <div style={{ marginTop: 6, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 820 }}>
                <thead>
                  <tr>
                    {renderHeaderWithHelp("c4-grupo", "Grupo", "Grupo MAR evaluado (G1, G2, G3).", {
                      textAlign: "left",
                      padding: 8,
                      borderBottom: "1px solid rgba(0,0,0,.14)",
                    })}
                    {c4VarIds.map((id) => (
                      <th key={id} style={{ textAlign: "center", padding: 8, borderBottom: "1px solid rgba(0,0,0,.14)" }}>
                        <span>
                          Score({id})<sup>G</sup>
                        </span>
                      </th>
                    ))}
                    {renderHeaderWithHelp(
                      "c4-score-crit",
                      <span style={{ position: "relative", display: "inline-block", paddingRight: "0.75em" }}>
                        S
                        <span style={{ position: "absolute", top: "-0.45em", right: 0, fontSize: "0.65em" }}>G</span>
                        <span style={{ position: "absolute", bottom: "-0.35em", right: 0, fontSize: "0.65em" }}>C4</span>
                      </span>,
                      "Score del criterio para el grupo. Es el promedio de los scores de las variables del criterio, calculado para G1, G2 o G3.",
                      { textAlign: "center", padding: 8, borderBottom: "1px solid rgba(0,0,0,.14)" }
                    )}
                    {renderHeaderWithHelp("c4-obs", "Observaciones", "Notas sobre faltantes o interpretacion.", {
                      textAlign: "left",
                      padding: 8,
                      borderBottom: "1px solid rgba(0,0,0,.14)",
                    })}
                  </tr>
                </thead>
                <tbody>
                  {c4GroupDetailRows.map((row, idx) => (
                    <tr key={row.id} style={{ background: idx % 2 === 0 ? "#f8fafc" : "#ffffff" }}>
                      <td style={{ padding: 8, borderBottom: "1px solid rgba(0,0,0,.08)", fontWeight: 700 }}>{row.id}</td>
                      {c4VarIds.map((id) => (
                        <td key={id} style={{ padding: 8, borderBottom: "1px solid rgba(0,0,0,.08)", textAlign: "center" }}>
                          {Number.isFinite(row.scoresByVar[id]) ? formatScore(row.scoresByVar[id]) : "-"}
                        </td>
                      ))}
                      <td style={{ padding: 8, borderBottom: "1px solid rgba(0,0,0,.08)", textAlign: "center", fontWeight: 700 }}>
                        {formatScore(row.sc)}
                      </td>
                      <td style={{ padding: 8, borderBottom: "1px solid rgba(0,0,0,.08)" }}>{row.obs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </details>
          </div>
          <div
            style={{
              marginTop: 12,
              padding: 14,
              borderRadius: 14,
              background: "rgba(233, 213, 255, 0.6)",
              border: "1px solid rgba(216, 180, 254, 0.7)",
            }}
          >
                        <details style={{ marginTop: 10 }}>
              <summary
                style={{
                  cursor: "pointer",
                  fontWeight: 700,
                  padding: 4,
                  lineHeight: 1.2,
                  background: "transparent",
                  border: "none",
                  borderRadius: 12,
                }}
              >
                Criterio C5 - Aspectos socioambientales
              </summary>
            <div style={{ marginTop: 8, fontWeight: 600 }}>Datos disponibles:</div>
            <div style={{ marginTop: 6, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15, minWidth: 620 }}>
                <thead>
                  <tr>
                    {renderHeaderWithHelp("c5-variable", "Variable", "Codigo de la variable evaluada.", {
                      textAlign: "left",
                      padding: 8,
                      borderBottom: "1px solid rgba(0,0,0,.14)",
                    })}
                    {renderHeaderWithHelp("c5-estado", "Estado", "Estado del insumo: completo, parcial o falta.", {
                      textAlign: "left",
                      padding: 8,
                      borderBottom: "1px solid rgba(0,0,0,.14)",
                    })}
                    {renderHeaderWithHelp("c5-descripcion", "Descripción", "Nombre corto de la variable.", {
                      textAlign: "left",
                      padding: 8,
                      borderBottom: "1px solid rgba(0,0,0,.14)",
                    })}
                  </tr>
                </thead>
                <tbody>
                  {c5Vars.map((row, idx) => (
                    <tr key={row.id} style={{ background: idx % 2 === 0 ? "#f8fafc" : "#ffffff" }}>
                      <td style={{ padding: 8, borderBottom: "1px solid rgba(0,0,0,.08)", fontWeight: 700 }}>{row.id}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid rgba(0,0,0,.08)" }}>{row.status}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid rgba(0,0,0,.08)" }}>{row.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 10 }}>
              <details style={{ background: "transparent", border: "none", borderRadius: 12, padding: 0 }}>
                <summary
                  style={{
                    cursor: "pointer",
                    fontWeight: 700,
                    background: "#fee2e2",
                    border: "1px solid #fecaca",
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  Guía por variables
                </summary>
                <div style={{ marginTop: 10 }}>
                  {c5Vars.map((row) => {
                    const vInfo = scoreById.get(row.id);
                    const scoreByGroup = vInfo?.scoreByGroup || {};
                    const rawValue = String(vInfo?.reason || "");
                    if (row.id === "V23") {
                      return (
                        <details
                          key={row.id}
                          style={{
                            background: "#fff",
                            border: "1px solid rgba(0,0,0,.08)",
                            borderRadius: 12,
                            padding: 10,
                            marginBottom: 10,
                          }}
                        >
                          <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                            {row.id} - {row.description}
                          </summary>
                          <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                            Valor actual: {rawValue || "-"}
                          </div>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 8, tableLayout: "fixed" }}>
                            <thead>
                              <tr>
                                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "45%" }}>Tipo</th>
                                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "15%" }}>Score^G</th>
                                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "40%" }}>Justificación</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Doméstico</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Alta idoneidad para el grupo.</td>
                              </tr>
                              <tr>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Industrial</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Alta idoneidad para el grupo.</td>
                              </tr>
                              <tr>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Ambiental</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Alta idoneidad para el grupo.</td>
                              </tr>
                              <tr>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Agrícola</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Alta idoneidad para el grupo.</td>
                              </tr>
                              <tr>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Mixto</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Alta idoneidad para el grupo.</td>
                              </tr>
                            </tbody>
                          </table>
                          <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                            Score({row.id})<sup>G</sup> aplicado (G1/G2/G3): {formatScore(getEffectiveGroupScore(row.id, "G1", scoreByGroup.G1))} ?{" "}
                            {formatScore(getEffectiveGroupScore(row.id, "G2", scoreByGroup.G2))} ?{" "}
                            {formatScore(getEffectiveGroupScore(row.id, "G3", scoreByGroup.G3))}
                          </div>
                        </details>
                      );
                    }
                    if (row.id === "V34") {
                      return (
                        <details
                          key={row.id}
                          style={{
                            background: "#fff",
                            border: "1px solid rgba(0,0,0,.08)",
                            borderRadius: 12,
                            padding: 10,
                            marginBottom: 10,
                          }}
                        >
                          <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                            {row.id} - {row.description}
                          </summary>
                          <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                            Valor actual: {rawValue || "-"}
                          </div>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 8, tableLayout: "fixed" }}>
                            <thead>
                              <tr>
                                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "45%" }}>Tipo</th>
                                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "15%" }}>Score^G</th>
                                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "40%" }}>Justificación</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Urbano</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Alta idoneidad para el grupo.</td>
                              </tr>
                              <tr>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Rural</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Alta idoneidad para el grupo.</td>
                              </tr>
                              <tr>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Mixto</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Alta idoneidad para el grupo.</td>
                              </tr>
                              <tr>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>NA</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>0</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>No aporta idoneidad.</td>
                              </tr>
                              <tr>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>No evaluado</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>0</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>No aporta idoneidad.</td>
                              </tr>
                            </tbody>
                          </table>
                          <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                            Score({row.id})<sup>G</sup> aplicado (G1/G2/G3): {formatScore(getEffectiveGroupScore(row.id, "G1", scoreByGroup.G1))} ?{" "}
                            {formatScore(getEffectiveGroupScore(row.id, "G2", scoreByGroup.G2))} ?{" "}
                            {formatScore(getEffectiveGroupScore(row.id, "G3", scoreByGroup.G3))}
                          </div>
                        </details>
                      );
                    }
                    if (row.id === "V35") {
                      return (
                        <details
                          key={row.id}
                          style={{
                            background: "#fff",
                            border: "1px solid rgba(0,0,0,.08)",
                            borderRadius: 12,
                            padding: 10,
                            marginBottom: 10,
                          }}
                        >
                          <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                            {row.id} - {row.description}
                          </summary>
                          <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                            Valor actual: {rawValue || "-"}
                          </div>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 8, tableLayout: "fixed" }}>
                            <thead>
                              <tr>
                                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "45%" }}>Tipo</th>
                                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "15%" }}>Score^G</th>
                                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "40%" }}>Justificación</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Beneficio directo</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Alta idoneidad para el grupo.</td>
                              </tr>
                              <tr>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Beneficio indirecto</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Alta idoneidad para el grupo.</td>
                              </tr>
                              <tr>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Potencial beneficiario</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Alta idoneidad para el grupo.</td>
                              </tr>
                              <tr>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>No evaluado</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>0</td>
                                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>No aporta idoneidad.</td>
                              </tr>
                            </tbody>
                          </table>
                          <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                            Score({row.id})<sup>G</sup> aplicado (G1/G2/G3): {formatScore(getEffectiveGroupScore(row.id, "G1", scoreByGroup.G1))} ?{" "}
                            {formatScore(getEffectiveGroupScore(row.id, "G2", scoreByGroup.G2))} ?{" "}
                            {formatScore(getEffectiveGroupScore(row.id, "G3", scoreByGroup.G3))}
                          </div>
                        </details>
                      );
                    }
                    return (
                      <details
                        key={row.id}
                        style={{
                          background: "#fff",
                          border: "1px solid rgba(0,0,0,.08)",
                          borderRadius: 12,
                          padding: 10,
                          marginBottom: 10,
                        }}
                      >
                        <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                          {row.id} - {row.description}
                        </summary>
                        <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                          Valor actual: {rawValue || "-"}
                        </div>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 8, tableLayout: "fixed" }}>
                          <thead>
                            <tr>
                              <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "45%" }}>Tipo</th>
                              <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "15%" }}>Score^G</th>
                              <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)", width: "40%" }}>Justificación</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Muy favorable</td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>4</td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Alta idoneidad para el grupo.</td>
                            </tr>
                            <tr>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorable</td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>3</td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorabilidad buena.</td>
                            </tr>
                            <tr>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Moderada</td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>2</td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorabilidad intermedia.</td>
                            </tr>
                            <tr>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Poco favorable</td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>1</td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorabilidad baja.</td>
                            </tr>
                            <tr>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>No favorable</td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>0</td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>No aporta idoneidad.</td>
                            </tr>
                          </tbody>
                        </table>
                        <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                          Score({row.id})<sup>G</sup> aplicado (G1/G2/G3): {formatScore(getEffectiveGroupScore(row.id, "G1", scoreByGroup.G1))} ?{" "}
                          {formatScore(getEffectiveGroupScore(row.id, "G2", scoreByGroup.G2))} ?{" "}
                          {formatScore(getEffectiveGroupScore(row.id, "G3", scoreByGroup.G3))}
                        </div>
                      </details>
                    );
                  })}
                </div>
              </details>
            </div>
            <details style={{ marginTop: 12 }}>
              <summary
                style={{
                  cursor: "pointer",
                  padding: 12,
                  borderRadius: 12,
                  background: "#fee2e2",
                  border: "1px solid #fecaca",
                  fontWeight: 700,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <span>Modo personalizado de influencia por grupo</span>
                <span style={{ fontSize: 12, opacity: 0.75 }}>
                  {customInfluenceEnabled ? "Activo" : "Opcional"}
                  {Object.keys(customInfluenceByVar || {}).length ? ` ? ${Object.keys(customInfluenceByVar).length} ajustes` : ""}
                </span>
              </summary>
              <div
                style={{
                  marginTop: 10,
                  padding: 12,
                  borderRadius: 12,
                  background: "#fff",
                  border: "1px solid rgba(0,0,0,.08)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>Personaliza la influencia por variable</div>
                    <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
                      Ajusta manualmente la influencia por variable en cada grupo cuando no coincida con la guía base.
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                      <input
                        type="checkbox"
                        checked={customInfluenceEnabled}
                        onChange={(e) => onToggleCustomInfluence(e.target.checked)}
                      />
                      Activar modo personalizado
                    </label>
                    <button
                      type="button"
                      onClick={onResetCustomInfluence}
                      disabled={!Object.keys(customInfluenceByVar || {}).length}
                      style={{
                        border: "1px solid rgba(0,0,0,.2)",
                        background: "#f8fafc",
                        padding: "6px 10px",
                        borderRadius: 8,
                        fontSize: 12,
                        cursor: Object.keys(customInfluenceByVar || {}).length ? "pointer" : "not-allowed",
                        opacity: Object.keys(customInfluenceByVar || {}).length ? 1 : 0.5,
                      }}
                    >
                      Limpiar ajustes
                    </button>
                  </div>
                </div>
                <div style={{ marginTop: 10, overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 540 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>Variable</th>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>G1</th>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>G2</th>
                        <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>G3</th>
                      </tr>
                    </thead>
                    <tbody>
                      {c5CustomRows.map((row, idx) => {
                        const vInfo = scoreById.get(row.id);
                        const rawValue = String(vInfo?.reason || "");
                        const showSelection = rawValue && !rawValue.includes("/");
                        const isRowLocked = customInfluenceAllowedIds ? !customInfluenceAllowedIds.has(row.id) : false;
                        return (
                          <tr
                            key={row.id}
                            style={{
                              background: idx % 2 === 0 ? "#f8fafc" : "#ffffff",
                              opacity: isRowLocked ? 0.6 : 1,
                            }}
                          >
                            <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)", fontWeight: 600 }}>
                              <div>
                                {row.id} - {row.label}
                              </div>
                              <div style={{ marginTop: 2, fontSize: 12, opacity: 0.75 }}>
                                Seleccionado: {showSelection ? rawValue : "-"}
                              </div>
                            </td>
                            {["G1", "G2", "G3"].map((gid) => {
                              const override = customInfluenceByVar?.[row.id]?.[gid];
                              const autoValue = getAutoGroupScore(row.id, gid);
                              const selectValue = Number.isFinite(override) ? String(override) : "auto";
                              return (
                                <td key={gid} style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>
                                  <select
                                    value={selectValue}
                                    onChange={(e) => {
                                      const next = e.target.value;
                                      if (next === "auto") onCustomInfluenceChange(row.id, gid, null);
                                      else onCustomInfluenceChange(row.id, gid, Number(next));
                                    }}
                                    disabled={!customInfluenceEnabled || isRowLocked}
                                    style={{
                                      width: "100%",
                                      padding: "4px 6px",
                                      borderRadius: 6,
                                      border: "1px solid rgba(0,0,0,.2)",
                                      background: customInfluenceEnabled && !isRowLocked ? "#fff" : "#f1f5f9",
                                    }}
                                  >
                                    <option value="auto">{`Auto (${formatScoreCompact(autoValue)})`}</option>
                                    {[0, 1, 2, 3, 4].map((v) => (
                                      <option key={v} value={String(v)}>
                                        {v}
                                      </option>
                                    ))}
                                  </select>
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
            </details>
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 600 }}>Cálculo:</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => scrollToRef(guideRef)}
                  style={{
                    border: "1px solid rgba(0,0,0,.2)",
                    background: "#f8fafc",
                    padding: "6px 10px",
                    borderRadius: 8,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Ir a guía
                </button>
                <button
                  type="button"
                  onClick={() => navigateToInsumos(scenarioId || 0, [])}
                  style={{
                    border: "1px solid rgba(0,0,0,.2)",
                    background: "#f8fafc",
                    padding: "6px 10px",
                    borderRadius: 8,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Ir a insumos
                </button>
              </div>
            </div>
            <div
              style={{
                marginTop: 6,
                padding: 12,
                borderRadius: 12,
                background: "#fff",
                border: "1px solid rgba(0,0,0,.08)",
              }}
            >
              {c5GroupRows.map((row) => (
                <div key={row.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, minWidth: 28 }}>{row.id}</div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ position: "relative", display: "inline-block", paddingRight: "0.75em" }}>
                      S
                      <span style={{ position: "absolute", top: "-0.45em", right: 0, fontSize: "0.65em" }}>G</span>
                      <span style={{ position: "absolute", bottom: "-0.35em", right: 0, fontSize: "0.65em" }}>
                        C5
                      </span>
                    </span>
                    <span>=</span>
                    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", lineHeight: 1.1 }}>
                      <span style={{ padding: "0 6px", borderBottom: "1px solid #111" }}>
                        {row.scores.length ? row.scores.map(formatScoreCompact).join(" + ") : "-"}
                      </span>
                      <span style={{ padding: "0 6px" }}>{row.denom ? row.denom : "-"}</span>
                    </span>
                    <span>=</span>
                    <span>{formatScore(row.sc)}</span>
                    <span style={{ opacity: 0.8, fontSize: 13 }}>{row.obs}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, fontWeight: 600 }}>Diagnóstico por Grupo:</div>
            <div style={{ marginTop: 6, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 700 }}>
                <thead>
                  <tr>
                    {renderHeaderWithHelp("c5-grupo", "Grupo", "Grupo MAR evaluado (G1, G2, G3).", {
                      textAlign: "left",
                      padding: 8,
                      borderBottom: "1px solid rgba(0,0,0,.14)",
                    })}
                    {c5VarIds.map((id) => (
                      <th key={id} style={{ textAlign: "center", padding: 8, borderBottom: "1px solid rgba(0,0,0,.14)" }}>
                        <span>
                          Score({id})<sup>G</sup>
                        </span>
                      </th>
                    ))}
                    {renderHeaderWithHelp(
                      "c5-score-crit",
                      <span style={{ position: "relative", display: "inline-block", paddingRight: "0.75em" }}>
                        S
                        <span style={{ position: "absolute", top: "-0.45em", right: 0, fontSize: "0.65em" }}>G</span>
                        <span style={{ position: "absolute", bottom: "-0.35em", right: 0, fontSize: "0.65em" }}>C5</span>
                      </span>,
                      "Score del criterio para el grupo. Es el promedio de los scores de las variables del criterio, calculado para G1, G2 o G3.",
                      { textAlign: "center", padding: 8, borderBottom: "1px solid rgba(0,0,0,.14)" }
                    )}
                    {renderHeaderWithHelp("c5-obs", "Observaciones", "Notas sobre faltantes o interpretacion.", {
                      textAlign: "left",
                      padding: 8,
                      borderBottom: "1px solid rgba(0,0,0,.14)",
                    })}
                  </tr>
                </thead>
                <tbody>
                  {c5GroupDetailRows.map((row, idx) => (
                    <tr key={row.id} style={{ background: idx % 2 === 0 ? "#f8fafc" : "#ffffff" }}>
                      <td style={{ padding: 8, borderBottom: "1px solid rgba(0,0,0,.08)", fontWeight: 700 }}>{row.id}</td>
                      {c5VarIds.map((id) => (
                        <td key={id} style={{ padding: 8, borderBottom: "1px solid rgba(0,0,0,.08)", textAlign: "center" }}>
                          {Number.isFinite(row.scoresByVar[id]) ? formatScore(row.scoresByVar[id]) : "-"}
                        </td>
                      ))}
                      <td style={{ padding: 8, borderBottom: "1px solid rgba(0,0,0,.08)", textAlign: "center", fontWeight: 700 }}>
                        {formatScore(row.sc)}
                      </td>
                      <td style={{ padding: 8, borderBottom: "1px solid rgba(0,0,0,.08)" }}>{row.obs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </details>
          </div>

        </div>
        {rigorVars.length ? (
          <div style={{ marginTop: 12, background: "#fff7d6", borderRadius: 16, padding: 12, border: "1px solid #f3dc98" }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Preguntas de rigor (fuente superficial)</div>
            <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 8 }}>
              Estas preguntas se diligencian solo cuando la fuente es superficial.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
              {rigorVars.map((item) => renderScoreControl(item))}
            </div>
          </div>
        ) : null}
        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 12,
            background: "#ffffff",
            border: "1px solid rgba(0,0,0,.08)",
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 8, fontSize: 16 }}>Resumen de puntajes por criterio</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15, minWidth: 560 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>Criterio</th>
                  <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>Score G1</th>
                  <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>Score G2</th>
                  <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>Score G3</th>
                  <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>Estado de la información</th>
                </tr>
              </thead>
              <tbody>
                {summaryRows.map((row, idx) => (
                  <tr key={row.id} style={{ background: idx % 2 === 0 ? "#f8fafc" : "#ffffff" }}>
                    <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)", fontWeight: 700 }}>{row.id}</td>
                    <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>{formatScore(row.g1)}</td>
                    <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>{formatScore(row.g2)}</td>
                    <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>{formatScore(row.g3)}</td>
                    <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{ marginTop: 14, fontWeight: 800, fontSize: 20 }}>
          2.2 M&eacute;todo de ponderaci&oacute;n: El Proceso Anal&iacute;tico Jer&aacute;rquico (AHP)
        </div>
        <p style={{ marginTop: 10, lineHeight: 1.6, opacity: 0.9 }}>
          Tras haber determinado la Aptitud T&eacute;cnica de cada criterio (
          <span style={{ position: "relative", display: "inline-block", paddingRight: "0.75em" }}>
            S
            <span style={{ position: "absolute", top: "-0.45em", right: 0, fontSize: "0.65em" }}>G</span>
            <span style={{ position: "absolute", bottom: "-0.35em", right: 0, fontSize: "0.65em" }}>
              C<sub>i</sub>
            </span>
          </span>
          ) mediante la l&oacute;gica de agregaci&oacute;n y el tratamiento de incertidumbre, el modelo requiere una
          capa final de inteligencia estrat&eacute;gica: la Ponderaci&oacute;n. En la gesti&oacute;n h&iacute;drica, es frecuente
          enfrentar escenarios con informaci&oacute;n limitada o la necesidad de valorar aspectos cualitativos de
          dif&iacute;cil cuantificaci&oacute;n.
        </p>
        <p style={{ marginTop: 8, lineHeight: 1.6, opacity: 0.9 }}>
          Para resolver esta complejidad, se implementa el Proceso Anal&iacute;tico Jer&aacute;rquico (AHP), desarrollado
          por Thomas L. Saaty en la d&eacute;cada de los 70. Este m&eacute;todo multiatributo permite la selecci&oacute;n de
          alternativas bas&aacute;ndose en una estructura jer&aacute;rquica donde el objetivo superior se desglosa en
          criterios y subcriterios que suelen entrar en conflicto entre s&iacute;. De acuerdo con Saaty (1980), la
          eficacia del m&eacute;todo reside en la correcta definici&oacute;n de estos elementos, los cuales deben ser
          relevantes y mutuamente excluyentes para garantizar la independencia del an&aacute;lisis.
        </p>
        <p style={{ marginTop: 8, lineHeight: 1.6, opacity: 0.9 }}>
          El componente esencial del AHP es la comparaci&oacute;n pareada. Bas&aacute;ndose en la Ley de Weber-Fechner, que
          establece que la percepci&oacute;n humana responde de forma aritm&eacute;tica a est&iacute;mulos que crecen en
          progresi&oacute;n geom&eacute;trica, el m&eacute;todo utiliza una Escala Fundamental (1 al 9) (Tabla 4). Esta escala
          permite transformar juicios verbales y percepciones t&eacute;cnicas en valores num&eacute;ricos precisos,
          facilitando la toma de decisiones al comparar solo dos elementos a la vez.
        </p>
        <div style={{ marginTop: 10, fontWeight: 700 }}>
          Tabla 4. Escala fundamental de comparación por pares.
        </div>
        <div style={{ marginTop: 6, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 540 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>Valor</th>
                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>Definici&oacute;n</th>
                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>Comentarios</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>1</td>
                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Igual importancia</td>
                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>
                  El criterio A es igual de importante que el criterio B
                </td>
              </tr>
              <tr>
                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>3</td>
                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Importancia moderada</td>
                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>
                  La experiencia y el juicio favorecen ligeramente al criterio A sobre el B
                </td>
              </tr>
              <tr>
                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>5</td>
                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Importancia grande</td>
                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>
                  La experiencia y el juicio favorecen fuertemente el criterio A sobre el B
                </td>
              </tr>
              <tr>
                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>7</td>
                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Importancia muy grande</td>
                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>
                  El criterio A es mucho m&aacute;s importante que el B
                </td>
              </tr>
              <tr>
                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>9</td>
                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Importancia extrema</td>
                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>
                  La mayor importancia del criterio A sobre el B est&aacute; fuera de toda duda
                </td>
              </tr>
              <tr>
                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>2, 4, 6 y 8</td>
                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>
                  Valores intermedios entre los anteriores
                </td>
                <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Cuando es necesario matizar</td>
              </tr>
            </tbody>
          </table>
          <div style={{ marginTop: 8, fontSize: 13, opacity: 0.8 }}>Fuente: Tomado de Saaty, 1980</div>
        </div>
        {/*
        <div
          style={{
            marginTop: 14,
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.18)",
            boxShadow: "0 0 0 1px rgba(0,0,0,0.08) inset",
            background: "rgba(244, 220, 220, 0.6)",
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 18 }}>Comparaci&oacute;n por pares (AHP)</div>
          <p style={{ marginTop: 6, lineHeight: 1.6, opacity: 0.9 }}>
            Selecciona el criterio m&aacute;s importante entre cada par y asigna la intensidad en la escala 1-9.
            El sistema construir&aacute; la matriz rec&iacute;proca a partir de estas elecciones. Para diligenciar la tabla de ponderación, 
            usted deber? realizar comparaciones directas entre dos criterios a la vez (por pares), respondiendo a la pregunta: ¿En términos 
            de ?xito para la recarga gestionada, ?cuál de estos dos criterios es más relevante y en qu? medida??
          </p>
          <div style={{ marginTop: 10, overflowX: "auto" }}>
            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid rgba(0,0,0,.08)", padding: 6 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 720 }}>
              <thead>
                <tr>
                  <th colSpan={2} style={{ textAlign: "center", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>
                    Criterio
                  </th>
                  <th rowSpan={2} style={{ textAlign: "center", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>
                    M&aacute;s importante (A o B)
                  </th>
                  <th rowSpan={2} style={{ textAlign: "center", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>
                    Escala (1-9)
                  </th>
                  <th rowSpan={2} style={{ textAlign: "center", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>
                    CR
                  </th>
                </tr>
                <tr>
                  <th style={{ textAlign: "center", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>A</th>
                  <th style={{ textAlign: "center", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>B</th>
                </tr>
              </thead>
              <tbody>
                {pairwiseRows.map((row, idx) => {
                  const pairKey = `${row.a.id}-${row.b.id}`;
                  const showCR = idx === 0;
                  const rowBg = "transparent";
                  const aBg = row.showA ? "#f3f4f6" : "transparent";
                  const selectBg = "rgba(244, 220, 220, 0.6)";
                  return (
                    <tr key={pairKey} style={{ background: idx % 2 === 0 ? "#f3f4f6" : "#ffffff" }}>
                      {row.showA ? (
                        <td
                          rowSpan={row.rowSpan}
                          style={{
                            padding: 10,
                            borderBottom: "1px solid rgba(0,0,0,.08)",
                            fontWeight: 700,
                            background: aBg,
                          }}
                        >
                          {row.a.id} - {row.a.label}
                        </td>
                      ) : null}
                      <td
                        style={{
                          padding: 10,
                          borderBottom: "1px solid rgba(0,0,0,.08)",
                          background: rowBg,
                        }}
                      >
                        <strong>{row.b.id}</strong> - {row.b.label}
                      </td>
                      <td
                        style={{
                          padding: 10,
                          borderBottom: "1px solid rgba(0,0,0,.08)",
                          background: selectBg,
                        }}
                      >
                        <select
                          aria-label={`Mas importante entre ${row.a.id} y ${row.b.id}`}
                          value={(pairwiseSelections[pairKey]?.more || row.a.id).toString()}
                          onChange={(e) => onPairwiseChange(pairKey, { more: e.target.value })}
                          style={{
                            width: "100%",
                            padding: "4px 6px",
                            borderRadius: 6,
                            border: "1px solid rgba(0,0,0,.2)",
                            background: "#fff",
                          }}
                        >
                          <option value="A">{row.a.id}</option>
                          <option value="B">{row.b.id}</option>
                        </select>
                      </td>
                      <td
                        style={{
                          padding: 10,
                          borderBottom: "1px solid rgba(0,0,0,.08)",
                          background: selectBg,
                        }}
                      >
                        <select
                          aria-label={`Escala para ${row.a.id} vs ${row.b.id}`}
                          value={String(pairwiseSelections[pairKey]?.scale || "1")}
                          onChange={(e) => onPairwiseChange(pairKey, { scale: Number(e.target.value) })}
                          style={{
                            width: "100%",
                            padding: "4px 6px",
                            borderRadius: 6,
                            border: "1px solid rgba(0,0,0,.2)",
                            background: "#fff",
                          }}
                        >
                          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((val) => (
                            <option key={val} value={val}>
                              {val}
                            </option>
                          ))}
                        </select>
                      </td>
                      {showCR ? (
                        <td
                          style={{
                            padding: 10,
                            borderBottom: "1px solid rgba(0,0,0,.08)",
                            verticalAlign: "top",
                            minWidth: 140,
                            background: rowBg,
                          }}
                        >
                          <div style={{ fontWeight: 700, marginBottom: 6 }}>
                            {Number.isFinite(pairwiseCR) ? `${(pairwiseCR * 100).toFixed(1)}%` : "-"}
                          </div>
                          <div
                            style={{
                              padding: "6px 8px",
                              borderRadius: 8,
                              background: isPairwiseCRHigh ? "#fecaca" : "#dcfce7",
                              color: isPairwiseCRHigh ? "#991b1b" : "#166534",
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            {isPairwiseCRHigh ? "CR fuera de límite. Ajusta las comparaciones." : "CR dentro del límite."}
                          </div>
                          <div style={{ marginTop: 6, fontSize: 11, opacity: 0.85 }}>
                            Rango esperado: 0.00 - 0.10 (consistencia aceptable seg&uacute;n Saaty).
                          </div>
                          {isPairwiseCRHigh && pairwiseSuggestions.length ? (
                            <div style={{ marginTop: 8, fontSize: 11, lineHeight: 1.4 }}>
                              Sugerencias (aprox.):{" "}
                              {pairwiseSuggestions.map((s, i) => (
                                <span key={s.pair}>
                                  {i ? " ? " : ""}
                                  {s.pair}: {s.suggestedMore} con escala {s.suggestedScale}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </td>
                      ) : (
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }} />
                      )}
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </div>
          </div>
        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
          Tip: valores 2, 4, 6 y 8 representan intensidades intermedias.
        </div>
        </div>
        */}
        <p style={{ marginTop: 10, lineHeight: 1.6, opacity: 0.9 }}>
          El Proceso Anal&iacute;tico Jer&aacute;rquico no solo nos permite organizar nuestras prioridades, sino que funciona
          como un filtro de calidad para asegurar que las decisiones tomadas sean coherentes. Esto es fundamental
          porque, al evaluar muchos factores al mismo tiempo, es natural que el ser humano incurra en peque&ntilde;as
          contradicciones. Por ello, el sistema utiliza un respaldo matem&aacute;tico que detecta si los juicios del
          analista mantienen una estructura l&oacute;gica o si necesitan ser revisados.
        </p>
        <p style={{ marginTop: 8, lineHeight: 1.6, opacity: 0.9 }}>
          Esta validaci&oacute;n comienza con el c&aacute;lculo del llamado M&aacute;ximo Autovalor (&lambda;<sub>max</sub>). Para
          entenderlo de forma sencilla, este valor es una medida de "equilibrio": en un mundo donde todas nuestras
          comparaciones fueran perfectamente exactas y l&oacute;gicas, este autovalor ser&iacute;a igual al n&uacute;mero de
          criterios que estamos evaluando (<em>n</em>). Sin embargo, como es com&uacute;n que existan ligeras desviaciones,
          el sistema mide qu&eacute; tanto se aleja este n&uacute;mero de la realidad t&eacute;cnica, dando origen al &Iacute;ndice de
          Consistencia (CI). Este &iacute;ndice es, en esencia, la unidad que cuantifica cu&aacute;nto "ruido" o error hay
          en nuestras respuestas; entre m&aacute;s grande sea la diferencia entre el autovalor y el n&uacute;mero de criterios,
          menos s&oacute;lido ser&aacute; el resultado.
        </p>
        <div
          style={{
            margin: "6px 0 0",
            display: "block",
            textAlign: "center",
            fontFamily: "inherit",
            fontSize: 20,
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span>CI</span>
            <span>=</span>
            <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", lineHeight: 1.1 }}>
              <span style={{ padding: "0 8px 2px", borderBottom: "1px solid #111" }}>
                &lambda;<sub>max</sub> &minus; <em>n</em>
              </span>
              <span style={{ padding: "2px 8px 0" }}>
                <em>n</em> &minus; 1
              </span>
            </span>
            <span style={{ fontSize: 14 }}>[2]</span>
          </span>
        </div>
        <div style={{ marginTop: 8, lineHeight: 1.6, opacity: 0.9 }}>
          <div style={{ fontWeight: 700 }}>Donde:</div>
          <ul style={{ margin: "6px 0 0 18px" }}>
            <li>
              <strong>&lambda;<sub>max</sub> (Lambda M&aacute;ximo):</strong> Es un valor que sale de la matriz de comparaciones y resume cu&aacute;nta inconsistencia hay.
            </li>
            <li>
              <strong><em>n</em>:</strong> El n&uacute;mero de criterios o alternativas que se est&aacute;n comparando.
            </li>
          </ul>
        </div>
        <p style={{ marginTop: 8, lineHeight: 1.6, opacity: 0.9 }}>
          A partir de este error calculado, el modelo da un paso decisivo mediante la Relaci&oacute;n de Consistencia (CR),
          que act&uacute;a como el filtro final de validez. Lo que hace este indicador es comparar nuestro &iacute;ndice de
          consistencia (CI) con un error que obtendr&iacute;a alguien que responde a la tabla totalmente al azar. Para que
          las ponderaciones de nuestro proyecto MAR sean aceptables, este ratio no debe superar el 10% (0.10). Si nos
          mantenemos bajo este l&iacute;mite, el sistema confirma que el an&aacute;lisis es coherente y defendible; de lo
          contrario, nos indicar&aacute; que existen conflictos de jerarqu&iacute;a que deben corregirse antes de continuar.
          Matem&aacute;ticamente, esta validaci&oacute;n se expresa de la siguiente manera:
        </p>
        <div
          style={{
            margin: "6px 0 0",
            display: "block",
            textAlign: "center",
            fontFamily: "inherit",
            fontSize: 20,
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span>CR</span>
            <span>=</span>
            <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", lineHeight: 1.1 }}>
              <span style={{ padding: "0 8px 2px", borderBottom: "1px solid #111" }}>CI</span>
              <span style={{ padding: "2px 8px 0" }}>RI</span>
            </span>
            <span style={{ fontSize: 14 }}>[3]</span>
          </span>
        </div>
        <p style={{ marginTop: 8, lineHeight: 1.6, opacity: 0.9 }}>
          Donde RI es el índice aleatorio, que indica la consistencia de una matriz aleatoria como se muestra a continuación:
        </p>
        <div style={{ marginTop: 8, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 520 }}>
            <tbody>
              <tr>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid rgba(0,0,0,.14)" }}>
                  Tama&ntilde;o de la matriz (<em>n</em>)
                </th>
                {["2", "3", "4", "5", "6", "7", "8", "9", "10"].map((value) => (
                  <td key={value} style={{ padding: 8, borderBottom: "1px solid rgba(0,0,0,.08)" }}>
                    {value}
                  </td>
                ))}
              </tr>
              <tr>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid rgba(0,0,0,.14)" }}>
                  &Iacute;ndice aleatorio (RI)
                </th>
                {["0", "0.58", "0.90", "1.12", "1.24", "1.32", "1.41", "1.45", "1.49"].map((value) => (
                  <td key={value} style={{ padding: 8, borderBottom: "1px solid rgba(0,0,0,.08)" }}>
                    {value}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <p style={{ marginTop: 8, lineHeight: 1.6, opacity: 0.9 }}>
          Una vez que el sistema valida que las comparaciones son consistentes, procede autom&aacute;ticamente a la
          obtenci&oacute;n de los pesos finales (W<sub>i</sub>). En esta etapa, las valoraciones registradas en la matriz
          se transforman en coeficientes num&eacute;ricos que representan la importancia relativa de cada tema.
          Finalmente, estos pesos se integran con los puntajes de aptitud mediante la f&oacute;rmula de ponderaci&oacute;n
          lineal, dando como resultado el &Iacute;ndice de Idoneidad Global. Este valor final permite identificar,
          qu&eacute; grupo MAR es el m&aacute;s adecuado para el acu&iacute;fero estudiado.
        </p>
        <p style={{ marginTop: 6, lineHeight: 1.6, opacity: 0.9 }}>
          En la pr&aacute;ctica dentro de nuestra plataforma, el analista interact&uacute;a con una matriz de
          decisi&oacute;n cuadrada que debe cumplir con tres propiedades esenciales:
        </p>
        <div style={{ marginTop: 6, lineHeight: 1.6, opacity: 0.9 }}>
          - Reciprocidad: Si el criterio A es 3 veces m&aacute;s importante que B, B es 1/3 respecto a A.
          <br />
          - Homogeneidad: Los elementos comparados deben pertenecer al mismo nivel jer&aacute;rquico.
          <br />
          - Consistencia: El sistema eval&uacute;a autom&aacute;ticamente que no existan contradicciones l&oacute;gicas en las valoraciones.
        </div>
        <div
          style={{
            marginTop: 14,
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.18)",
            boxShadow: "0 0 0 1px rgba(0,0,0,0.08) inset",
            background: "rgba(244, 220, 220, 0.6)",
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 18 }}>Comparaci&oacute;n por pares (AHP)</div>
          <p style={{ marginTop: 6, lineHeight: 1.6, opacity: 0.9 }}>
            Selecciona el criterio m&aacute;s importante entre cada par y asigna la intensidad en la escala 1-9.
            El sistema construir&aacute; la matriz rec&iacute;proca a partir de estas elecciones. Para diligenciar la tabla de ponderaci&oacute;n,
            usted deber&aacute; realizar comparaciones directas entre dos criterios a la vez (por pares), respondiendo a la pregunta: En t&eacute;rminos
            de &eacute;xito para la recarga gestionada, &iquest;cu&aacute;l de estos dos criterios es m&aacute;s relevante y en qu&eacute; medida?
          </p>
          <div style={{ marginTop: 10, overflowX: "auto" }}>
            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid rgba(0,0,0,.08)", padding: 6 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 720 }}>
              <thead>
                <tr>
                  <th colSpan={2} style={{ textAlign: "center", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>
                    Criterio
                  </th>
                  <th rowSpan={2} style={{ textAlign: "center", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>
                    M&aacute;s importante (A o B)
                  </th>
                  <th rowSpan={2} style={{ textAlign: "center", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>
                    Escala (1-9)
                  </th>
                </tr>
                <tr>
                  <th style={{ textAlign: "center", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>A</th>
                  <th style={{ textAlign: "center", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>B</th>
                </tr>
              </thead>
              <tbody>
                {pairwiseRows.map((row, idx) => {
                  const pairKey = `${row.a.id}-${row.b.id}`;
                  const showCRRow = row.a.id === "C4" && row.b.id === "C5";
                  const rowBg = "transparent";
                  const aBg = row.showA ? "#f3f4f6" : "transparent";
                  const selectBg = "rgba(244, 220, 220, 0.6)";
                  return (
                    <>
                      <tr key={pairKey} style={{ background: idx % 2 === 0 ? "#f3f4f6" : "#ffffff" }}>
                        {row.showA ? (
                          <td
                            rowSpan={row.rowSpan}
                            style={{
                              padding: 10,
                              borderBottom: "1px solid rgba(0,0,0,.08)",
                              fontWeight: 700,
                              background: aBg,
                            }}
                          >
                            {row.a.id} - {row.a.label}
                          </td>
                        ) : null}
                        <td
                          style={{
                            padding: 10,
                            borderBottom: "1px solid rgba(0,0,0,.08)",
                            background: rowBg,
                          }}
                        >
                          <strong>{row.b.id}</strong> - {row.b.label}
                        </td>
                        <td
                          style={{
                            padding: 10,
                            borderBottom: "1px solid rgba(0,0,0,.08)",
                            background: selectBg,
                          }}
                        >
                          <select
                            aria-label={`Mas importante entre ${row.a.id} y ${row.b.id}`}
                            value={(pairwiseSelections[pairKey]?.more || row.a.id).toString()}
                            onChange={(e) => onPairwiseChange(pairKey, { more: e.target.value })}
                            style={{
                              width: "100%",
                              padding: "4px 6px",
                              borderRadius: 6,
                              border: "1px solid rgba(0,0,0,.2)",
                              background: "#fff",
                            }}
                          >
                            <option value="A">{row.a.id}</option>
                            <option value="B">{row.b.id}</option>
                          </select>
                        </td>
                        <td
                          style={{
                            padding: 10,
                            borderBottom: "1px solid rgba(0,0,0,.08)",
                            background: selectBg,
                          }}
                        >
                          <select
                            aria-label={`Escala para ${row.a.id} vs ${row.b.id}`}
                            value={String(pairwiseSelections[pairKey]?.scale || "1")}
                            onChange={(e) => onPairwiseChange(pairKey, { scale: Number(e.target.value) })}
                            style={{
                              width: "100%",
                              padding: "4px 6px",
                              borderRadius: 6,
                              border: "1px solid rgba(0,0,0,.2)",
                              background: "#fff",
                            }}
                          >
                            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((val) => (
                              <option key={val} value={val}>
                                {val}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                      {showCRRow ? (
                        <tr style={{ background: "#ffffff" }}>
                          <td
                            style={{
                              padding: 10,
                              borderBottom: "1px solid rgba(0,0,0,.08)",
                              background: rowBg,
                            }}
                          />
                          <td
                            style={{
                              padding: 10,
                              borderBottom: "1px solid rgba(0,0,0,.08)",
                              fontWeight: 700,
                              background: rowBg,
                            }}
                          >
                            CR
                          </td>
                          <td
                            colSpan={2}
                            style={{
                              padding: 10,
                              borderBottom: "1px solid rgba(0,0,0,.08)",
                              verticalAlign: "top",
                              background: rowBg,
                            }}
                          >
                            <div style={{ fontWeight: 700, marginBottom: 6 }}>
                              {Number.isFinite(pairwiseCR) ? `${(pairwiseCR * 100).toFixed(1)}%` : "-"}
                            </div>
                            <div
                              style={{
                                padding: "6px 8px",
                                borderRadius: 8,
                                background: isPairwiseCRHigh ? "#fecaca" : "#dcfce7",
                                color: isPairwiseCRHigh ? "#991b1b" : "#166534",
                                fontSize: 12,
                                fontWeight: 600,
                              }}
                            >
                              {isPairwiseCRHigh ? "CR fuera de límite. Ajusta las comparaciones." : "CR dentro del límite."}
                            </div>
                            <div style={{ marginTop: 6, fontSize: 11, opacity: 0.85 }}>
                              Rango esperado: 0.00 - 0.10 (consistencia aceptable seg&uacute;n Saaty).
                            </div>
                            {isPairwiseCRHigh && pairwiseSuggestions.length ? (
                              <div style={{ marginTop: 8, fontSize: 11, lineHeight: 1.4 }}>
                                Sugerencias (aprox.):{" "}
                                {pairwiseSuggestions.map((s, i) => (
                                  <span key={s.pair}>
                                    {i ? "" : ""}
                                    {s.pair}: {s.suggestedMore} con escala {s.suggestedScale}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </td>
                        </tr>
                      ) : null}
                    </>
                  );
                })}
              </tbody>
              </table>
            </div>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
            Tip: valores 2, 4, 6 y 8 representan intensidades intermedias.
          </div>
          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
            Las variables de abajo se calculan autom&aacute;ticamente, no necesitas diligenciarlas.
          </div>
          <div style={{ marginTop: 12, height: 1, background: "rgba(0,0,0,0.1)" }} />
          <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>
            Matriz de comparaciones y &lambda;<sub>max</sub>
          </div>
          {(() => {
            const axisColors = {
              C1: "#dbeafe",
              C2: "#dcfce7",
              C3: "#ffedd5",
              C4: "#ede9fe",
              C5: "#fee2e2",
            };
            return (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15, minWidth: 640, tableLayout: "fixed" }}>
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: "center",
                      padding: 10,
                      borderBottom: "1px solid rgba(0,0,0,.14)",
                      width: `${100 / (pairwiseMatrix.ids.length + 1)}%`,
                    }}
                  >
                    {" "}
                  </th>
                  {pairwiseMatrix.ids.map((id) => (
                    <th
                      key={id}
                      style={{
                        textAlign: "center",
                        padding: 10,
                        borderBottom: "1px solid rgba(0,0,0,.14)",
                        width: `${100 / (pairwiseMatrix.ids.length + 1)}%`,
                        background: axisColors[id] || "#ffffff",
                      }}
                    >
                      {id}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pairwiseMatrix.matrix.map((row, i) => (
                  <tr key={pairwiseMatrix.ids[i]}>
                    <td
                      style={{
                        padding: 10,
                        borderBottom: "1px solid rgba(0,0,0,.08)",
                        fontWeight: 700,
                        textAlign: "center",
                        width: `${100 / (pairwiseMatrix.ids.length + 1)}%`,
                        background: axisColors[pairwiseMatrix.ids[i]] || "#ffffff",
                      }}
                    >
                      {pairwiseMatrix.ids[i]}
                    </td>
                    {row.map((val, j) => {
                      const isDiagonal = i === j;
                      return (
                        <td
                          key={`${pairwiseMatrix.ids[i]}-${pairwiseMatrix.ids[j]}`}
                          style={{
                            padding: 10,
                            borderBottom: "1px solid rgba(0,0,0,.08)",
                            background: isDiagonal ? "rgba(59, 130, 246, 0.12)" : "#ffffff",
                            fontWeight: isDiagonal ? 700 : 500,
                            textAlign: "center",
                            width: `${100 / (pairwiseMatrix.ids.length + 1)}%`,
                          }}
                        >
                          {Number.isFinite(val) ? Number(val).toFixed(2) : "-"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
            );
          })()}
          <div style={{ marginTop: 10, fontSize: 13 }}>
            &lambda;<sub>max</sub>: {Number.isFinite(pairwiseAHP.lambdaMax) ? pairwiseAHP.lambdaMax.toFixed(3) : "-"}
          </div>
          </div>
          <div style={{ marginTop: 12, height: 1, background: "rgba(0,0,0,0.1)" }} />
          <div style={{ marginTop: 14, display: "grid", gap: 14 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>Pesos (prioridades)</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 540 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>Criterio</th>
                    <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>
                      <details style={{ display: "inline-block", position: "relative" }}>
                        <summary style={{ cursor: "pointer", fontWeight: 700, listStyle: "none" }}>Peso (%)</summary>
                        <div
                          style={{
                            position: "absolute",
                            top: "calc(100% + 6px)",
                            left: 0,
                            zIndex: 10,
                            width: 280,
                            padding: 10,
                            borderRadius: 10,
                            border: "1px solid rgba(0,0,0,0.15)",
                            background: "#ffffff",
                            boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
                            fontSize: 12,
                            fontWeight: 500,
                            lineHeight: 1.5,
                            display: "grid",
                            gap: 8,
                          }}
                        >
                          <div>
                            Primero se construye la matriz pareada. De all&iacute; se obtiene el vector de prioridades v_i
                            (autovector principal de la matriz). Sum(v_i) es la suma de todos los v_i y se usa para
                            normalizar.
                          </div>
                          <div style={{ display: "grid", gap: 4 }}>
                            <div>Luego se normaliza:</div>
                            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
                              <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                <span>w_i =</span>
                                <span style={{ display: "inline-block", textAlign: "center", minWidth: 52 }}>
                                  <div>v_i</div>
                                  <div style={{ borderTop: "1px solid #111" }}>sum(v_i)</div>
                                </span>
                              </div>
                              <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                <span>Peso(%) =</span>
                                <span style={{ display: "inline-block", textAlign: "center", minWidth: 52 }}>
                                  <div>w_i</div>
                                  <div style={{ borderTop: "1px solid #111" }}>1</div>
                                </span>
                                <span>x 100</span>
                              </div>
                            </div>
                          </div>
                          <div>
                            Ejemplo real: si v = [0.054, 0.037, 0.100, 0.471, 0.338] entonces sum(v) = 1.000,
                            w = [0.054, 0.037, 0.100, 0.471, 0.338] y Peso(%) = [5.4%, 3.7%, 10.0%, 47.1%, 33.8%].
                          </div>
                        </div>
                      </details>
                    </th>
                    <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>Peso (w_i)</th>
                    <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>
                      <details style={{ display: "inline-block", position: "relative" }}>
                        <summary style={{ cursor: "pointer", fontWeight: 700, listStyle: "none" }}>Jerarqu&iacute;a</summary>
                        <div
                          style={{
                            position: "absolute",
                            top: "calc(100% + 6px)",
                            left: 0,
                            zIndex: 10,
                            width: 240,
                            padding: 10,
                            borderRadius: 10,
                            border: "1px solid rgba(0,0,0,0.15)",
                            background: "#ffffff",
                            boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
                            fontSize: 12,
                            fontWeight: 500,
                            lineHeight: 1.5,
                            display: "grid",
                            gap: 8,
                          }}
                        >
                          El Rank ordena los criterios por peso de mayor a menor. Rank 1 es el criterio con el mayor
                          peso; Rank 2 el siguiente, y as&iacute; sucesivamente.
                        </div>
                      </details>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pairwiseWeightRowsByRank.map((row, idx) => (
                    <tr key={row.id} style={{ background: idx % 2 === 0 ? "#f8fafc" : "#ffffff" }}>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)", fontWeight: 700 }}>
                        {row.id} - {row.label}
                      </td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>
                        <span title="Peso normalizado: w_i = v_i / S v_i; Peso(%) = w_i ? 100">
                          {formatPercent(row.weight)}
                        </span>
                      </td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>
                        {Number.isFinite(row.weight) ? row.weight.toFixed(3) : "-"}
                      </td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>{row.rank}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gap: 8,
              padding: 12,
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.1)",
              background: "#f8fafc",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background: isPairwiseCRHigh ? "#dc2626" : "#16a34a",
                    display: "inline-block",
                  }}
                />
                <span style={{ fontWeight: 700 }}>
                  CR: {Number.isFinite(pairwiseCR) ? formatPercent(pairwiseCR) : "?"}
                </span>
              </div>
              <div style={{ fontWeight: 700 }}>CI: {Number.isFinite(pairwiseAHP.ci) ? pairwiseAHP.ci.toFixed(3) : "?"}</div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>
                Rango aceptable: CR &le; 0.10 (consistencia seg&uacute;n Saaty).
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 600 }}>
                N&uacute;mero de comparaciones: {pairwiseComparisonsCount}
              </div>
              <details>
                <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                  &iquest;Qu&eacute; indica este valor?
                </summary>
                <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.5 }}>
                  Representa la cantidad de pares evaluados (n(n-1)/2). Entre m&aacute;s comparaciones, m&aacute;s
                  informaci&oacute;n se usa para estimar los pesos, pero tambi&eacute;n aumenta la probabilidad de
                  inconsistencias si los juicios no son coherentes.
                </div>
              </details>
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>Gr&aacute;fico de prioridades</div>
            {(() => {
              const chartHeight = 320;
              const plotPadding = { top: 12, right: 12, bottom: 44, left: 56 };
              const plotHeight = chartHeight - plotPadding.top - plotPadding.bottom;
              const ticks = [0, 25, 50, 75, 100];
              return (
                <>
                  <div style={{ textAlign: "center", fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                    Prioridad por criterio
                  </div>
                  <div
                    style={{
                      position: "relative",
                      height: chartHeight,
                      borderRadius: 12,
                      border: "1px solid rgba(0,0,0,0.1)",
                      background: "#ffffff",
                    }}
                  >
                    {ticks.map((tick) => (
                      <div
                        key={`grid-${tick}`}
                        style={{
                          position: "absolute",
                          left: plotPadding.left,
                          right: plotPadding.right,
                          bottom: plotPadding.bottom + (tick / 100) * plotHeight,
                          height: 1,
                          background: "rgba(15, 23, 42, 0.08)",
                        }}
                      />
                    ))}
                    {ticks.map((tick) => (
                      <div
                        key={`label-${tick}`}
                        style={{
                          position: "absolute",
                          left: plotPadding.left - 8,
                          bottom: plotPadding.bottom + (tick / 100) * plotHeight,
                          transform: "translateX(-100%)",
                          width: 28,
                          textAlign: "right",
                          fontSize: 10,
                          opacity: 0.6,
                        }}
                      >
                        {tick}%
                      </div>
                    ))}
                    <div
                      style={{
                        position: "absolute",
                        left: 6,
                        top: "50%",
                        transform: "translateY(-50%) rotate(-90deg)",
                        transformOrigin: "left top",
                        fontSize: 12,
                        fontWeight: 700,
                        opacity: 0.75,
                      }}
                    >
                      Peso (%)
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        left: "50%",
                        bottom: -10,
                        transform: "translateX(-50%)",
                        fontSize: 12,
                        fontWeight: 700,
                        opacity: 0.75,
                      }}
                    >
                      Criterios
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        left: plotPadding.left,
                        right: plotPadding.right,
                        top: plotPadding.top,
                        bottom: plotPadding.bottom,
                        display: "flex",
                        alignItems: "flex-end",
                        gap: 12,
                      }}
                    >
                      {pairwiseWeightRows.map((row) => {
                        const heightPx = Math.max(row.weight * plotHeight, 8);
                        return (
                          <div
                            key={row.id}
                            style={{
                              flex: 1,
                              minWidth: 60,
                              height: "100%",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "flex-end",
                              gap: 6,
                            }}
                          >
                            <div style={{ fontSize: 11, fontWeight: 700 }}>
                              {Number.isFinite(row.weight) ? formatPercent(row.weight) : "-"}
                            </div>
                            <div
                              style={{
                                width: 28,
                                height: `${heightPx}px`,
                                background: "#3b82f6",
                                borderRadius: 4,
                                boxShadow: "0 1px 0 rgba(0,0,0,0.2)",
                              }}
                              title={formatPercent(row.weight)}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        left: plotPadding.left,
                        right: plotPadding.right,
                        bottom: 10,
                        display: "flex",
                        gap: 12,
                      }}
                    >
                      {pairwiseWeightRows.map((row) => (
                        <div
                          key={`label-${row.id}`}
                          style={{ flex: 1, minWidth: 60, fontSize: 11, textAlign: "center" }}
                        >
                          {row.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
        </div>
        <div style={{ marginTop: 16, padding: 14, borderRadius: 12, border: "1px solid rgba(0,0,0,0.1)", background: "#ffffff" }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>2.3 C&aacute;lculo de Idoneidad Final por Grupo MAR</div>
          <div style={{ marginTop: 4, fontWeight: 700 }}>F&oacute;rmula de Combinaci&oacute;n Lineal Ponderada (WLC)</div>
          <div style={{ marginTop: 8, lineHeight: 1.6, opacity: 0.9 }}>
            La idoneidad de cada grupo MAR se calcula combinando los scores por criterio (S<sub>Ci</sub><sup>G</sup>)
            con los pesos del AHP (w<sub>i</sub><sup>AHP</sup>):
          </div>
          <div style={{ marginTop: 8, fontSize: 16, fontWeight: 700 }}>
            Idoneidad<sub>G</sub> =
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, marginLeft: 6 }}>
              <span style={{ display: "inline-block", textAlign: "center", minWidth: 28 }}>
                <div style={{ fontSize: 12, lineHeight: 1 }}>n</div>
                <div style={{ fontSize: 22, lineHeight: 1 }}>&Sigma;</div>
                <div style={{ fontSize: 12, lineHeight: 1 }}>i=1</div>
              </span>
              <span>
                w<sub>i</sub><sup>AHP</sup> &middot; S<sub>Ci</sub><sup>G</sup>
              </span>
            </span>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
            Donde: Idoneidad<sub>G</sub> es el &iacute;ndice del grupo G; w<sub>i</sub><sup>AHP</sup> es el peso del criterio i;
            S<sub>Ci</sub><sup>G</sup> es el score del criterio i para el grupo G.
          </div>
          {(() => {
            const criteriaIds = CRITERIA_TABLE.map((c) => c.id);
            const labelById = new Map(CRITERIA_TABLE.map((c) => [c.id, c.label]));
            const manualWeightRows = CRITERIA_TABLE.map((c) => ({
              id: c.id,
              weight: Number(activeCase?.weights?.[c.id] || 0),
            }));
            const manualSum = manualWeightRows.reduce((acc, row) => acc + row.weight, 0);
            const useManualWeights = manualSum > 0;
            const baseWeightById = new Map(
              (useManualWeights
                ? manualWeightRows.map((row) => [row.id, row.weight / manualSum])
                : pairwiseWeightRows.map((row) => [row.id, row.weight]))
            );
            const weightById = invertHierarchyEnabled ? invertWeightMap(baseWeightById) : baseWeightById;
            const summaryById = new Map(summaryRows.map((row) => [row.id, row]));
            const groups = [
              { id: "G1", key: "g1", label: "G1 - Intervención de cauces" },
              { id: "G2", key: "g2", label: "G2 - Recarga por pozos" },
              { id: "G3", key: "g3", label: "G3 - Infiltración superficial" },
            ];
            const groupResults = groups.map((g) => {
              const contributions = criteriaIds.map((cid) => {
                const w = Number(weightById.get(cid) || 0);
                const s = Number(summaryById.get(cid)?.[g.key] || 0);
                return { id: cid, w, s, contrib: w * s };
              });
              const total = contributions.reduce((acc, item) => acc + item.contrib, 0);
              const top = [...contributions].sort((a, b) => b.contrib - a.contrib)[0] || null;
              return { ...g, total, top };
            });
            const ranked = [...groupResults].sort((a, b) => b.total - a.total).map((g, idx) => ({ ...g, rank: idx + 1 }));
            const totalById = new Map(groupResults.map((g) => [g.id, g.total]));
            const rankLabel = (rank) => (rank === 1 ? "Primero" : rank === 2 ? "Segundo" : "Tercero");
            const formatIdoneidad = (val) => (Number.isFinite(val) ? Number(val).toFixed(3) : "-");
            const warnings = [];
            criteriaIds.forEach((cid) => {
              const row = summaryById.get(cid);
              const w = Number(weightById.get(cid) || 0);
              if (!row) return;
              const scores = [row.g1, row.g2, row.g3].map((v) => (Number.isFinite(v) ? Number(v) : 0));
              const allZero = scores.every((v) => v === 0);
              if (w >= 0.25 && allZero) {
                warnings.push({
                  id: cid,
                  weight: w,
                  label: labelById.get(cid) || cid,
                  reason: "score = 0.00 en G1, G2 y G3 por falta de informaci&oacute;n.",
                });
              } else if (row.status === "Falta") {
                warnings.push({
                  id: cid,
                  weight: w,
                  label: labelById.get(cid) || cid,
                  reason: "criterio sin informaci&oacute;n suficiente (estado: Falta).",
                });
              }
            });
            const rankingString = ranked.map((row) => row.id).join(" > ");
            return (
              <>
                <div ref={resultadosRef} />

                <div style={{ marginTop: 12, padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)", background: "#ffffff" }}>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>Detalle de pesos y scores (WLC)</div>
                  <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
                    Cada idoneidad se obtiene multiplicando el peso AHP (w_i) por el score del criterio (S<sub>Ci</sub><sup>G</sup>) y
                    sumando los aportes por criterio.
                  </div>
                  <div style={{ marginTop: 10, overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 720 }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>Criterio</th>
                          <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>w_i (AHP)</th>
                          <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>S_Ci^G1</th>
                          <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>w_i x S_Ci^G1</th>
                          <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>S_Ci^G2</th>
                          <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>w_i x S_Ci^G2</th>
                          <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>S_Ci^G3</th>
                          <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>w_i x S_Ci^G3</th>
                        </tr>
                      </thead>
                      <tbody>
                        {criteriaIds.map((cid, idx) => {
                          const w = Number(weightById.get(cid) || 0);
                          const row = summaryById.get(cid) || {};
                          const g1 = Number(row.g1 || 0);
                          const g2 = Number(row.g2 || 0);
                          const g3 = Number(row.g3 || 0);
                          const c1 = w * g1;
                          const c2 = w * g2;
                          const c3 = w * g3;
                          return (
                            <tr key={cid} style={{ background: idx % 2 === 0 ? "#f8fafc" : "#ffffff" }}>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)", fontWeight: 700 }}>{labelById.get(cid) || cid}</td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>{Number.isFinite(w) ? w.toFixed(3) : "-"}</td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>{Number.isFinite(g1) ? g1.toFixed(3) : "-"}</td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>{Number.isFinite(c1) ? c1.toFixed(3) : "-"}</td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>{Number.isFinite(g2) ? g2.toFixed(3) : "-"}</td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>{Number.isFinite(c2) ? c2.toFixed(3) : "-"}</td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>{Number.isFinite(g3) ? g3.toFixed(3) : "-"}</td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>{Number.isFinite(c3) ? c3.toFixed(3) : "-"}</td>
                            </tr>
                          );
                        })}
                        <tr style={{ background: "#eef2ff" }}>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)", fontWeight: 800 }}>Total idoneidad</td>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>-</td>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>-</td>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)", fontWeight: 800 }}>{Number.isFinite(totalById.get("G1")) ? totalById.get("G1").toFixed(3) : "-"}</td>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>-</td>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)", fontWeight: 800 }}>{Number.isFinite(totalById.get("G2")) ? totalById.get("G2").toFixed(3) : "-"}</td>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>-</td>
                          <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)", fontWeight: 800 }}>{Number.isFinite(totalById.get("G3")) ? totalById.get("G3").toFixed(3) : "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600 }}>
                  {invertHierarchyEnabled ? "Ranking invertido" : "Ranking actual"}: {rankingString}
                </div>
                <div style={{ marginTop: 12, padding: 16, borderRadius: 16, background: "#f8fafc", border: "1px solid rgba(0,0,0,0.08)" }}>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>Podio de Idoneidad</div>
                  <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
                    Resultados ordenados por idoneidad (mayor a menor).
                  </div>
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
                  {(() => {
                    const podium = [
                      ranked.find((g) => g.rank === 2),
                      ranked.find((g) => g.rank === 1),
                      ranked.find((g) => g.rank === 3),
                    ].filter(Boolean);
                    const heightByRank = { 1: 140, 2: 110, 3: 95 };
                    const colorByRank = { 1: "#bbf7d0", 2: "#fed7aa", 3: "#fecaca" };
                    return (
                      <div style={{ marginTop: 14, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
                        {podium.map((g) => (
                          <div key={g.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 160 }}>
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
                              {g.rank === 1 ? (
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
                                  backgroundSize: "200% 200%",
                                  border: "1px solid rgba(245, 158, 11, 0.5)",
                                  color: "#7c2d12",
                                  textShadow: "0 1px 0 #ffffff, 0 2px 0 rgba(245, 158, 11, 0.6), 0 6px 12px rgba(0,0,0,0.35)",
                                  boxShadow: "0 6px 14px rgba(245, 158, 11, 0.25)",
                                  animation: "podiumGlow 2.2s ease-in-out infinite, podiumShine 3.4s ease-in-out infinite",
                                }}
                              >
                                {rankLabel(g.rank)}
                              </div>
                            </div>
                            <div
                              style={{
                                width: 160,
                                height: heightByRank[g.rank] || 100,
                                borderRadius: 12,
                                background: colorByRank[g.rank] || "#e2e8f0",
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
                              <div style={{ fontSize: 21, fontWeight: 900, lineHeight: 1.1 }}>{String(g.id || "").replace("G", "")}</div>
                              <div style={{ fontWeight: 400, fontSize: 14, lineHeight: 1.2, textAlign: "center" }}>{g.label}</div>
                              <div style={{ fontSize: 17, fontWeight: 900, lineHeight: 1.1 }}>{formatIdoneidad(g.total)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
                {(() => {
                  const topGroupId = String(ranked[0]?.id || "").replace("G", "");
                  const topGroup = TECH_GROUPS.find((g) => g.id === topGroupId);
                  if (!topGroup) return null;
                  return (
                    <div style={{ marginTop: 14, padding: 14, borderRadius: 14, border: "1px solid rgba(15, 23, 42, 0.08)", background: "#ffffff" }}>
                      <div style={{ fontWeight: 800, fontSize: 16 }}>
                        Técnicas MAR recomendadas para {topGroup.name}
                      </div>
                      <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85 }}>{topGroup.short}</div>
                      <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
                        {topGroup.techniques.map((tech) => {
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
                                <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.5 }}>{tech.definition}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
                <div style={{ marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => {
                      onActivateStage(3);
                      scrollToRef(etapa5Ref);
                    }}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 10,
                      border: "1px solid rgba(37, 99, 235, 0.6)",
                      background: "#2563eb",
                      color: "#ffffff",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Ir a la etapa 3
                  </button>
                </div>
              </>
            );
          })()}
        </div>
          </>
        ) : null}
        {!stage1Complete ? (
          <div style={{ marginTop: 6, padding: 10, borderRadius: 10, background: "#fef3c7", border: "1px solid #f59e0b" }}>
            Completa la Etapa 1 para habilitar la jerarquización de criterios (AHP).
          </div>
        ) : null}
        {showStage(3) ? (
          <>
            <div
              style={{
                marginTop: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div
                ref={etapa5Ref}
                style={{
                  padding: "6px 8px",
                  borderRadius: 12,
                  width: "fit-content",
                  minWidth: 96,
                  textAlign: "center",
                  ...getStageStyles(3),
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 18 }}>Etapa 3</div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => {
                    onActivateStage(1);
                    scrollToRef(etapa1Ref);
                  }}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: "1px solid rgba(0,0,0,0.15)",
                    background: "#e5e7eb",
                    color: "#111827",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Ir a la etapa 1
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onActivateStage(2);
                    scrollToRef(etapa2Ref);
                  }}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: "1px solid rgba(0,0,0,0.15)",
                    background: "#e5e7eb",
                    color: "#111827",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Ir a la etapa 2
                </button>
              </div>
            </div>
            <div style={{ marginTop: 8, fontWeight: 800, fontSize: 18 }}>
              3. An&aacute;lisis de Incertidumbre + Sensibilidad
            </div>
            <p style={{ marginTop: 6, opacity: 0.9, lineHeight: 1.6 }}>
              La Etapa 3 consolida el an&aacute;lisis de robustez combinando incertidumbre y sensibilidad. Su prop&oacute;sito es evaluar la
              confiabilidad de la decisi&oacute;n considerando (a) informaci&oacute;n incompleta y (b) variaciones en los pesos AHP, para
              identificar bajo qu&eacute; condiciones cambiar&iacute;a el ranking de grupos MAR. Esta validaci&oacute;n no modifica los resultados
              previos, pero s&iacute; aporta transparencia sobre cu&aacute;ndo la elecci&oacute;n del grupo &oacute;ptimo es estad&iacute;sticamente confiable o
              podr&iacute;a ser vulnerable a cambios en los supuestos de entrada.
            </p>
            <div style={{ marginTop: 10 }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>3.1. C&aacute;lculo del &Iacute;ndice de Completitud (IC)</div>
              <p style={{ marginTop: 6, opacity: 0.9, lineHeight: 1.6 }}>
                El &Iacute;ndice de Completitud (IC) cuantifica la proporci&oacute;n de informaci&oacute;n realmente disponible en el proceso de
                evaluaci&oacute;n multicriterio. Este indicador permite estimar el nivel de certeza que se tiene sobre los resultados obtenidos
                en etapas anteriores (determin&iacute;sticas) y act&uacute;a como proxy de la incertidumbre para transformar puntuaciones puntuales
                en valores probabil&iacute;sticos. En contextos multicriterio jer&aacute;rquicos como AHP-WLC, este &iacute;ndice garantiza que la
                decisi&oacute;n final: la elecci&oacute;n del grupo MAR &oacute;ptimo, se sustente en datos suficientes y fiables.
              </p>
              <p style={{ marginTop: 6, opacity: 0.9, lineHeight: 1.6 }}>
                Un valor alto de IC no solo significa que los resultados son m&aacute;s robustos, sino que permite confiar en la diferencia entre
                los puntajes finales de los grupos MAR (G1, G2, G3). En cambio, un valor bajo de IC indica que la decisi&oacute;n podr&iacute;a estar
                sesgada por vac&iacute;os cr&iacute;ticos en la informaci&oacute;n, y que debe tratarse con precauci&oacute;n. Diversos autores
                recomiendan evaluar el grado de completitud antes de realizar an&aacute;lisis de incertidumbre en sistemas de toma de decisi&oacute;n
                jer&aacute;rquicos (Saaty, 2001; Mendoza &amp; Martins, 2006).
              </p>
              <div style={{ marginTop: 8, fontWeight: 700 }}>F&oacute;rmula:</div>
              <div style={{ marginTop: 8, fontSize: 16, fontWeight: 700, display: "flex", justifyContent: "center", alignItems: "center", gap: 6, width: "100%" }}>
                <span>IC =</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={{ display: "inline-block", textAlign: "center", minWidth: 28 }}>
                    <div style={{ fontSize: 12, lineHeight: 1 }}>n</div>
                    <div style={{ fontSize: 22, lineHeight: 1 }}>&Sigma;</div>
                    <div style={{ fontSize: 12, lineHeight: 1 }}>i=1</div>
                  </span>
                  <span>
                    w<sub>i</sub><sup>AHP</sup> &middot;
                    <span style={{ display: "inline-block", textAlign: "center", minWidth: 110, marginLeft: 4 }}>
                      <div>V<sub>disponibles</sub><sup>C<sub>i</sub></sup></div>
                      <div style={{ borderTop: "1px solid #111" }}>V<sub>totales</sub><sup>C<sub>i</sub></sup></div>
                    </span>
                    &nbsp;&times; 100%
                  </span>
                </span>
                <span style={{ marginLeft: 6, fontSize: 12, fontWeight: 700 }}>[4]</span>
              </div>
              <div style={{ marginTop: 8, fontWeight: 700 }}>Donde:</div>
              <div style={{ marginTop: 8, overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 620 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>S&iacute;mbolo</th>
                      <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>Definici&oacute;n</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>IC</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>&Iacute;ndice de Completitud global (%)</td>
                    </tr>
                    <tr>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>n<sub>completas</sub></td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>N&uacute;mero total de variables completas</td>
                    </tr>
                    <tr>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>n<sub>parciales</sub></td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>N&uacute;mero total de variables parciales</td>
                    </tr>
                    <tr>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>n<sub>totales</sub></td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>N&uacute;mero total de variables evaluadas</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>¿C&oacute;mo se calcula cada componente?</div>
              <ul style={{ marginTop: 8, paddingLeft: 18, lineHeight: 1.6 }}>
                <li>
                  <span style={{ fontWeight: 700 }}>Proporci&oacute;n disponible por criterio</span>
                  <div style={{ marginTop: 4, fontSize: 15, fontWeight: 700 }}>
                    <span style={{ display: "inline-block", textAlign: "center", minWidth: 110 }}>
                  <div>V<sub>disponibles,i</sub></div>
                  <div style={{ borderTop: "1px solid #111" }}>V<sub>totales,i</sub></div>
                </span>
                    <span style={{ marginLeft: 6 }}>= Proporci&oacute;n de informaci&oacute;n real usada</span>
                  </div>
                  <div style={{ marginTop: 4, opacity: 0.9 }}>
                    Si un criterio tiene 10 variables y 8 fueron diligenciadas (completas o parciales), el valor ser&iacute;a:
                  </div>
                  <div style={{ marginTop: 4, fontSize: 15, fontWeight: 700 }}>
                    <span style={{ display: "inline-block", textAlign: "center", minWidth: 70 }}>
                  <div>8</div>
                  <div style={{ borderTop: "1px solid #111" }}>10</div>
                </span>
                    <span style={{ marginLeft: 6 }}>= 0.80</span>
                  </div>
                </li>
                <li>
                  <span style={{ fontWeight: 700 }}>Completitud (%) por criterio</span>
                  <div style={{ marginTop: 4, opacity: 0.9 }}>Multiplica la proporci&oacute;n anterior por 100:</div>
                  <div style={{ marginTop: 4, fontSize: 15, fontWeight: 700 }}>
                    <span style={{ display: "inline-block", textAlign: "center", minWidth: 70 }}>
                  <div>8</div>
                  <div style={{ borderTop: "1px solid #111" }}>10</div>
                </span>
                    <span style={{ marginLeft: 6 }}>&times; 100 = 80%</span>
                  </div>
                </li>
              </ul>
            </div>
            <div style={{ marginTop: 14, padding: 14, borderRadius: 12, border: "1px solid rgba(0,0,0,0.1)", background: "#fce7f3" }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>Índice de Confianza del Resultado</div>
              <div style={{ marginTop: 4, fontWeight: 700 }}>C&aacute;lculo del &Iacute;ndice de Completitud</div>
              <div style={{ marginTop: 8, width: "100%", display: "flex", justifyContent: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span>IC =</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <span style={{ display: "inline-block", textAlign: "center", minWidth: 28 }}>
                      <div style={{ fontSize: 12, lineHeight: 1 }}>n</div>
                      <div style={{ fontSize: 22, lineHeight: 1 }}>&Sigma;</div>
                      <div style={{ fontSize: 12, lineHeight: 1 }}>i=1</div>
                    </span>
                    <span>
                      w<sub>i</sub><sup>AHP</sup> &middot;
                      <span style={{ display: "inline-block", textAlign: "center", minWidth: 90, marginLeft: 4 }}>
                        <div>V<sub>disponibles</sub><sup>C<sub>i</sub></sup></div>
                        <div style={{ borderTop: "1px solid #111" }}>V<sub>totales</sub><sup>C<sub>i</sub></sup></div>
                      </span>
                      &nbsp;&times; 100%
                    </span>
                  </span>
                </div>
              </div>
              {(() => {
                const weightById = new Map(pairwiseWeightRows.map((row) => [row.id, row.weight]));
                const partialWeight = 0.5;
                const countAvailable = (vars) =>
                  vars.reduce((acc, v) => {
                    if (v.isBlocked) return acc;
                    if (v.isComplete || v.status === "Completo") return acc + 1;
                    if (v.status === "Parcial") return acc + partialWeight;
                    return acc;
                  }, 0);
                const formatCount = (value) => {
                  if (!Number.isFinite(value)) return "-";
                  return Number.isInteger(value) ? String(value) : value.toFixed(1);
                };
                const criteriaMeta = [
                  { id: "C1", label: "C1 - Objetivo", total: 1, available: c1IsComplete ? 1 : 0 },
                  {
                    id: "C2",
                    label: "C2 - Condiciones hidrogeológicas",
                    total: c2VarIds.length,
                    available: countAvailable(c2Vars),
                  },
                  {
                    id: "C3",
                    label: "C3 - Fuente y calidad del agua",
                    total: c3VarIds.length,
                    available: countAvailable(c3Vars),
                  },
                  {
                    id: "C4",
                    label: "C4 - Viabilidad técnica",
                    total: c4VarIds.length,
                    available: countAvailable(c4Vars),
                  },
                  {
                    id: "C5",
                    label: "C5 - Aspectos socioambientales",
                    total: c5VarIds.length,
                    available: countAvailable(c5Vars),
                  },
                ];
                const rows = criteriaMeta.map((c) => {
                  const w = Number(weightById.get(c.id) || 0);
                  const ratio = c.total > 0 ? c.available / c.total : 0;
                  return { ...c, w, ratio, contrib: w * ratio };
                });
                const ic = rows.reduce((acc, r) => acc + r.contrib, 0) * 100;
                const classify = (value) => {
                  if (value >= 90) return { label: "Muy alta", color: "#16a34a", note: "Información completa, resultados robustos" };
                  if (value >= 70) return { label: "Alta", color: "#22c55e", note: "Información suficiente, resultados confiables" };
                  if (value >= 50) return { label: "Media", color: "#facc15", note: "Información parcial, resultados orientativos" };
                  if (value >= 30) return { label: "Baja", color: "#f97316", note: "Información insuficiente, resultados preliminares" };
                  return { label: "Muy baja", color: "#dc2626", note: "Información crítica faltante, resultados no confiables" };
                };
                const status = classify(ic);
                return (
                  <>
                    <div style={{ marginTop: 10, overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15, minWidth: 760 }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>Criterio</th>
                            <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>w<sub>i</sub></th>
                            <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>
                              V<sub>disp</sub> / V<sub>total</sub>
                            </th>
                            <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>Completitud (%)</th>
                            <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>
                              Contribuci&oacute;n (w<sub>i</sub> x completitud)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((r) => (
                            <tr key={r.id}>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>{r.label}</td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>
                                {Number.isFinite(r.w) ? r.w.toFixed(3) : "-"}
                              </td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>
                                    {formatCount(r.available)} / {r.total}
                              </td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>
                                {(r.ratio * 100).toFixed(1)}%
                              </td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>
                                {(r.contrib * 100).toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <div style={{ fontWeight: 800 }}>IC: {ic.toFixed(1)}%</div>
                      <div style={{ fontWeight: 700, color: status.color }}>{status.label}</div>
                      <div style={{ fontSize: 12, opacity: 0.8 }}>{status.note}</div>
                    </div>
                  </>
                );
              })()}
            </div>
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>3.2 An&aacute;lisis de sensibilidad</div>
              <p style={{ marginTop: 6, opacity: 0.9, lineHeight: 1.6 }}>
                El an&aacute;lisis de sensibilidad es una herramienta clave dentro del proceso de toma de decisiones jer&aacute;rquicas AHP, ya que
                permite evaluar la robustez del resultado final ante cambios en los pesos asignados a los criterios. En otras palabras, se
                analiza qu&eacute; tanto influye la importancia relativa de un criterio sobre la selecci&oacute;n del grupo MAR &oacute;ptimo. Al
                modificar el peso de un criterio (manteniendo el resto ajustado proporcionalmente), se recalculan los puntajes de idoneidad de
                cada grupo y se observa si el ranking final cambia.
              </p>
              <p style={{ marginTop: 6, opacity: 0.9, lineHeight: 1.6 }}>
                Este proceso ayuda a responder preguntas fundamentales como:
              </p>
              <ul style={{ marginTop: 6, paddingLeft: 18, lineHeight: 1.6, opacity: 0.9 }}>
                <li>&iquest;Mi decisi&oacute;n depende fuertemente del peso de un solo criterio?</li>
                <li>&iquest;Existe un umbral cr&iacute;tico a partir del cual el grupo &oacute;ptimo cambia?</li>
                <li>&iquest;Mi resultado es estable, incluso si se producen errores o ajustes en la ponderaci&oacute;n?</li>
              </ul>
              <p style={{ marginTop: 6, opacity: 0.9, lineHeight: 1.6 }}>
                El an&aacute;lisis est&aacute; dise&ntilde;ado para ser interactivo, replicable y comprensible tanto para expertos como para
                tomadores de decisiones no t&eacute;cnicos. La visualizaci&oacute;n din&aacute;mica permite interpretar r&aacute;pidamente si la
                selecci&oacute;n de un grupo &oacute;ptimo es robusta o sensible, fortaleciendo la confianza en la decisi&oacute;n final o
                advirtiendo sobre zonas cr&iacute;ticas.
              </p>
              <ul style={{ marginTop: 8, paddingLeft: 18, lineHeight: 1.6, opacity: 0.9 }}>
                <li>
                  En un an&aacute;lisis de sensibilidad, se recomienda comenzar variando el peso del criterio con mayor influencia, es decir,
                  aquel que posee el valor m&aacute;s alto en la ponderaci&oacute;n obtenida del AHP. Este criterio tiene el mayor efecto sobre la
                  decisi&oacute;n final, por lo que incluso peque&ntilde;as variaciones en su peso pueden alterar el ranking de alternativas.
                </li>
                <li>
                  La variaci&oacute;n del peso &plusmn;X% consiste en simular c&oacute;mo cambiar&iacute;a la decisi&oacute;n si el peso del criterio
                  analizado fuese ligeramente mayor o menor que el valor asignado originalmente. Esto no modifica los scores ni el resto de los
                  datos del modelo, sino que ajusta s&oacute;lo el peso del criterio dentro de un rango definido, mientras se reescalan
                  proporcionalmente los dem&aacute;s para mantener la suma total igual a 1.
                </li>
              </ul>
              <div style={{ marginTop: 12, padding: 14, borderRadius: 12, border: "1px solid rgba(219, 39, 119, 0.25)", background: "#fce7f3" }}>
              <div style={{ marginTop: 12, fontWeight: 800 }}>&iquest;C&oacute;mo proceder para ejecutar el an&aacute;lisis de sensibilidad?</div>
              <div style={{ marginTop: 6, opacity: 0.9, lineHeight: 1.6 }}>
                <strong>1. Identifica los elementos clave:</strong>
              </div>
              <ul style={{ marginTop: 6, paddingLeft: 18, lineHeight: 1.6, opacity: 0.9 }}>
                <li>Pesos AHP originales por criterio.</li>
                <li>Scores por grupo MAR (G1, G2, G3) en cada criterio.</li>
                <li>El criterio cuyo peso deseas variar (por defecto, el m&aacute;s influyente).</li>
              </ul>
              <div style={{ marginTop: 10, opacity: 0.9, lineHeight: 1.6 }}>
                <strong>2. Define la configuraci&oacute;n del experimento.</strong> Debes permitir al usuario o investigador definir:
              </div>
              <div style={{ marginTop: 8, overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 520 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>Par&aacute;metro</th>
                      <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>Descripci&oacute;n</th>
                      <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>Ejemplo</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Criterio a analizar</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Cualquiera entre C1 y C5</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>
                        <select
                          value={sensitivityCriterion}
                          onChange={(e) => {
                            setSensitivityCriterion(e.target.value);
                            setSensitivityRangeInvalid(false);
                          }}
                          style={{
                            padding: "6px 8px",
                            borderRadius: 6,
                            border: "1px solid rgba(0,0,0,0.2)",
                            background: "#fff",
                            fontSize: 13,
                          }}
                        >
                          <option value="C1">C1</option>
                          <option value="C2">C2</option>
                          <option value="C3">C3</option>
                          <option value="C4">C4</option>
                          <option value="C5">C5</option>
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Rango de variaci&oacute;n</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Porcentaje de aumento/disminuci&oacute;n del peso original</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>
                        {(() => {
                          const baseWeight = Number(sensitivityWeightById.get(sensitivityCriterion) || 0);
                          const maxByWeight = baseWeight > 0 ? Math.max(0, (1 / baseWeight - 1) * 100) : 0;
                          const maxAllowed = Math.min(50, maxByWeight);
                          const handleRangeChange = (value) => {
                            if (!Number.isFinite(value)) return;
                            if (value < 0) {
                              setSensitivityRange(0);
                              setSensitivityRangeInvalid(true);
                              return;
                            }
                            if (value > maxAllowed) {
                              setSensitivityRange(maxAllowed);
                              setSensitivityRangeInvalid(true);
                              return;
                            }
                            setSensitivityRange(value);
                            setSensitivityRangeInvalid(false);
                          };
                          return (
                            <input
                          type="number"
                          min="0"
                          max="50"
                          step="1"
                          value={Number.isFinite(sensitivityRange) ? sensitivityRange : 0}
                          onChange={(e) => handleRangeChange(Number(e.target.value))}
                          style={{
                            width: 80,
                            padding: "6px 8px",
                            borderRadius: 6,
                            border: `1px solid ${sensitivityRangeInvalid ? "#dc2626" : "rgba(0,0,0,0.2)"}`,
                            background: "#fff",
                            fontSize: 13,
                          }}
                        />
                          );
                        })()}
                        <span style={{ marginLeft: 6 }}>%</span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: 10 }}>Paso de incremento</td>
                      <td style={{ padding: 10 }}>Tama&ntilde;o del paso entre simulaciones</td>
                      <td style={{ padding: 10 }}>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          step="0.1"
                          value={Number.isFinite(sensitivityStep) ? sensitivityStep : 0}
                          onChange={(e) => {
                            const min = 0;
                            const max = 50;
                            const value = Number(e.target.value);
                            if (!Number.isFinite(value)) return;
                            if (value < min) {
                              setSensitivityStep(0);
                              setSensitivityStepInvalid(true);
                              return;
                            }
                            if (value > max) {
                              setSensitivityStep(max);
                              setSensitivityStepInvalid(true);
                              return;
                            }
                            setSensitivityStep(value);
                            setSensitivityStepInvalid(false);
                          }}
                          style={{
                            width: 80,
                            padding: "6px 8px",
                            borderRadius: 6,
                            border: `1px solid ${sensitivityStepInvalid ? "#dc2626" : "rgba(0,0,0,0.2)"}`,
                            background: "#fff",
                            fontSize: 13,
                          }}
                        />
                        <span style={{ marginLeft: 6 }}>%</span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Jerarqu&iacute;a invertida</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)", lineHeight: 1.4 }}>
                        Reasigna los pesos del AHP invirtiendo el orden original (el criterio con menor peso toma el valor m&aacute;s alto y viceversa)
                        y recalcula autom&aacute;ticamente el WLC para mostrar el ranking alternativo.
                      </td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>
                        <button
                          type="button"
                          onClick={() => setInvertHierarchyEnabled((prev) => !prev)}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 8,
                            border: "1px solid rgba(37,99,235,0.8)",
                            background: invertHierarchyEnabled ? "#1d4ed8" : "#fff",
                            color: invertHierarchyEnabled ? "#fff" : "#1d4ed8",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {invertHierarchyEnabled ? "Desactivar inversión" : "Activar jerarquía invertida"}
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 10, opacity: 0.9, lineHeight: 1.6 }}>
                <strong>3. Calcula pesos ajustados para cada iteraci&oacute;n.</strong> Por cada valor del nuevo peso (w<sub>test</sub>):
              </div>
              <p style={{ marginTop: 6, opacity: 0.9, lineHeight: 1.6 }}>
                Reasignas pesos del resto de criterios para que la suma siga siendo 1:
              </p>
              <div style={{ marginTop: 6, display: "flex", justifyContent: "center" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 700 }}>
                  <div>
                    w<sub>j</sub><sup>ajustado</sup> =
                  </div>
                  <div style={{ fontSize: 32, lineHeight: "1.05" }}>{"{"}</div>
                  <div style={{ display: "grid", rowGap: 4, textAlign: "right" }}>
                    <div>
                      w<sub>test</sub>{" "}
                      <span style={{ display: "inline-block", marginLeft: 16 }}>
                        <span style={{ fontWeight: 600 }}>si</span> j = criterio seleccionado
                      </span>
                    </div>
                    <div>
                      w<sub>j</sub> &middot;
                      <span style={{ display: "inline-block", textAlign: "center", minWidth: 120, margin: "0 4px" }}>
                        <div>(1 - w<sub>test</sub>)</div>
                        <div style={{ borderTop: "1px solid #111" }}>(1 - w<sub>j,base</sub>)</div>
                      </span>
                      <span style={{ fontWeight: 600 }}>si j &ne; criterio analizado</span>
                    </div>
                  </div>
                </div>
              </div>
              <p style={{ marginTop: 6, opacity: 0.9, lineHeight: 1.6 }}>
                Esto preserva la proporcionalidad original en los otros criterios.
              </p>
              <div style={{ marginTop: 10, opacity: 0.9, lineHeight: 1.6 }}>
                <strong>4. Calcula los nuevos scores de idoneidad.</strong> Para cada grupo MAR (G1, G2, G3):
              </div>
              <div style={{ marginTop: 6, fontSize: 15, fontWeight: 700, textAlign: "center" }}>
                Idoneidad<sub>Gk</sub> = &sum;<sub>i=1</sub><sup>5</sup> w<sub>i</sub><sup>ajustado</sup> &middot; Score<sub>Gk,i</sub>
              </div>
              <p style={{ marginTop: 6, opacity: 0.9, lineHeight: 1.6 }}>
                As&iacute; obtienes nuevas curvas de score frente a peso del criterio.
              </p>
              {(() => {
                const baseWeight = Number(sensitivityWeightById.get(sensitivityCriterion) || 0);
                const range = Number(sensitivityRange);
                const step = Number(sensitivityStep);
                const summaryById = new Map(summaryRows.map((row) => [row.id, row]));
                const criteriaIds = CRITERIA_TABLE.map((c) => c.id);
                if (!Number.isFinite(baseWeight) || baseWeight <= 0 || !Number.isFinite(range) || !Number.isFinite(step) || step <= 0) {
                  return (
                    <div style={{ marginTop: 10, fontSize: 13, color: "#b91c1c" }}>
                      Ajusta criterio, rango y paso para calcular la idoneidad.
                    </div>
                  );
                }
                const maxByWeight = baseWeight > 0 ? Math.max(0, (1 / baseWeight - 1) * 100) : 0;
                const maxAllowed = Math.min(50, maxByWeight);
                const safeRange = Math.max(0, Math.min(range, maxAllowed));
                const stepCount = Math.floor(safeRange / step);
                const deltas = Array.from({ length: stepCount * 2 + 1 }, (_, i) => (i - stepCount) * step);
                const baseWeights = new Map(criteriaIds.map((cid) => [cid, Number(sensitivityWeightById.get(cid) || 0)]));
                const rows = deltas.map((delta) => {
                  const wBase = baseWeight;
                  let wTest = wBase * (1 + delta / 100);
                  if (wTest < 0) wTest = 0;
                  if (wTest > 1) wTest = 1;
                  const scale = wBase < 1 ? (1 - wTest) / (1 - wBase) : 0;
                  const weights = new Map(
                    criteriaIds.map((cid) => {
                      const w = Number(baseWeights.get(cid) || 0);
                      return [cid, cid === sensitivityCriterion ? wTest : w * scale];
                    })
                  );
                  const scoreByGroup = ["G1", "G2", "G3"].map((gid) => {
                    const key = gid.toLowerCase();
                    const total = criteriaIds.reduce((acc, cid) => {
                      const w = Number(weights.get(cid) || 0);
                      const s = Number(summaryById.get(cid)?.[key] || 0);
                      return acc + w * s;
                    }, 0);
                    return { gid, total };
                  });
                  const ranking = [...scoreByGroup].sort((a, b) => b.total - a.total).map((g) => g.gid).join(" > ");
                  return { delta, wTest, scores: scoreByGroup, ranking };
                });
                const baseRanking = rows.find((row) => row.delta === 0)?.ranking || "";
                const firstChange = rows.find((row) => baseRanking && row.ranking !== baseRanking) || null;
                const allSameRanking = baseRanking && rows.every((row) => row.ranking === baseRanking);
                const topGroup = baseRanking ? baseRanking.split(" > ")[0] : "";
                const critLabel = CRITERIA_TABLE.find((c) => c.id === sensitivityCriterion)?.label || sensitivityCriterion;
                return (
                  <div style={{ marginTop: 12, overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 720 }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>Variaci&oacute;n</th>
                          <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>w<sub>test</sub></th>
                          <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>Idoneidad G1</th>
                          <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>Idoneidad G2</th>
                          <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>Idoneidad G3</th>
                          <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>Ranking</th>
                          <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>Cambio de ranking</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => {
                          const g1 = row.scores.find((g) => g.gid === "G1")?.total ?? 0;
                          const g2 = row.scores.find((g) => g.gid === "G2")?.total ?? 0;
                          const g3 = row.scores.find((g) => g.gid === "G3")?.total ?? 0;
                          const sameRanking = baseRanking && row.ranking === baseRanking;
                          return (
                            <tr key={`${row.delta}-${row.wTest}`}>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>{row.delta.toFixed(1)}%</td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>{row.wTest.toFixed(3)}</td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>{g1.toFixed(3)}</td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>{g2.toFixed(3)}</td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>{g3.toFixed(3)}</td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>{row.ranking}</td>
                              <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)", fontWeight: 700 }}>
                                {sameRanking ? "✔️" : "⚠️"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {(() => {
                      const colorByRank = { 1: "#bbf7d0", 2: "#fed7aa", 3: "#fecaca" };
                      const rankByGroup = new Map(
                        (baseRanking ? baseRanking.split(" > ") : []).map((gid, idx) => [gid, idx + 1])
                      );
                      const values = rows.flatMap((row) => row.scores.map((score) => Number(score.total) || 0));
                      const maxScore = Math.max(
                        0,
                        ...values
                      );
                      const width = Math.max(720, rows.length * 48);
                      const height = 240;
                      const pad = { top: 16, right: 16, bottom: 32, left: 36 };
                      const plotW = width - pad.left - pad.right;
                      const plotH = height - pad.top - pad.bottom;
                      const barGroupWidth = Math.max(40, Math.min(68, Math.floor(plotW / Math.max(1, rows.length))));
                      const innerGap = 4;
                      const barWidth = Math.max(8, Math.min(20, Math.floor((barGroupWidth - innerGap * 2) / 3)));
                      const barX = (rowIndex, groupIndex) =>
                        pad.left + rowIndex * barGroupWidth + groupIndex * (barWidth + innerGap);
                      const yMin = Math.min(...values, 2.9);
                      const yMax = Math.max(...values, 3.15);
                      const yRange = Math.max(0.05, yMax - yMin);
                      const yTicks = [yMin, yMin + yRange / 2, yMax];
                      const barHeight = (value) =>
                        Number.isFinite(value) ? (((value - yMin) / yRange) * plotH) : 0;
                      return (
                        <div style={{ marginTop: 16 }}>
                          <div style={{ fontWeight: 800, fontSize: 14 }}>Gr&aacute;fico de barras: variaci&oacute;n de idoneidad</div>
                          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75, lineHeight: 1.5 }}>
                            Cada barra muestra el score de idoneidad de un grupo MAR para distintos valores del peso del criterio (w<sub>test</sub>).
                          </div>
                          <div style={{ marginTop: 10, overflowX: "auto" }}>
                            <svg
                              width={width}
                              height={height}
                              style={{ display: "block", background: "#f8fafc", borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)" }}
                            >
                              <g stroke="rgba(0,0,0,0.08)">
                                {yTicks.map((tick) => {
                                  const normalized = (tick - yMin) / yRange;
                                  const y = pad.top + plotH * (1 - normalized);
                                  return <line key={`grid-${tick}`} x1={pad.left} y1={y} x2={width - pad.right} y2={y} />;
                                })}
                              </g>
                              <g stroke="#111827" strokeWidth="1">
                                <line x1={pad.left} y1={pad.top} x2={pad.left} y2={height - pad.bottom} />
                                <line x1={pad.left} y1={height - pad.bottom} x2={width - pad.right} y2={height - pad.bottom} />
                              </g>
                              {rows.map((row, i) =>
                                ["G1", "G2", "G3"].map((gid, gIdx) => {
                                  const value = Number(row.scores.find((s) => s.gid === gid)?.total || 0);
                                  const h = barHeight(value);
                                  const x = barX(i, gIdx);
                                  const y = height - pad.bottom - h;
                                  const rank = rankByGroup.get(gid) || 0;
                                  const color = colorByRank[rank] || "#94a3b8";
                                  const labelY = Math.max(pad.top + 8, y - 4 - gIdx * 6);
                                  return (
                                    <React.Fragment key={`${row.delta}-${gid}`}>
                                      <rect
                                        x={x}
                                        y={y}
                                        width={barWidth}
                                        height={h}
                                        fill={color}
                                        stroke="#0f172a"
                                        strokeWidth={0.5}
                                      />
                                    </React.Fragment>
                                  );
                                })
                              )}
                              {rows.map((row, i) => {
                                const x = pad.left + i * barGroupWidth + barGroupWidth / 2;
                                const deltaLabel = `${row.delta > 0 ? "+" : ""}${row.delta.toFixed(1)}%`;
                                return (
                                  <text
                                    key={`xlab-${row.delta}-${row.wTest}`}
                                    x={x}
                                    y={height - pad.bottom + 16}
                                    textAnchor="middle"
                                    fontSize="10"
                                    fill="#475569"
                                  >
                                    {deltaLabel}
                                  </text>
                                );
                              })}
                              <text
                                x={pad.left + plotW / 2}
                                y={height - pad.bottom + 26}
                                textAnchor="middle"
                                fontSize="11"
                                fill="#475569"
                              >
                                Peso del criterio (w
                                <tspan baselineShift="sub" fontSize="9">
                                  test
                                </tspan>
                                )
                              </text>
                              <text
                                x={pad.left - 28}
                                y={pad.top + plotH / 2}
                                textAnchor="middle"
                                fontSize="11"
                                fill="#475569"
                                transform={`rotate(-90 ${pad.left - 28} ${pad.top + plotH / 2})`}
                              >
                                Idoneidad (score 0-4)
                              </text>
                              {yTicks.map((tick) => {
                                const normalized = (tick - yMin) / yRange;
                                const y = pad.top + plotH * (1 - normalized);
                                return (
                                  <text
                                    key={`ytick-${tick}`}
                                    x={pad.left - 8}
                                    y={y + 4}
                                    textAnchor="end"
                                    fontSize="10"
                                    fill="#475569"
                                  >
                                    {tick.toFixed(2)}
                                  </text>
                                );
                              })}
                            </svg>
                          </div>
                          <div style={{ marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap", fontSize: 12 }}>
                            {["G1", "G2", "G3"].map((gid) => {
                              const rank = rankByGroup.get(gid) || 0;
                              const color = colorByRank[rank] || "#94a3b8";
                              return (
                                <div key={`legend-${gid}`} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ width: 14, height: 3, borderRadius: 4, background: color }} />
                                  <span>{gid}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                    {firstChange ? (
                      <div
                        style={{
                          marginTop: 12,
                          padding: 12,
                          borderRadius: 10,
                          background: "#fee2e2",
                          border: "1px solid #fecaca",
                          color: "#7f1d1d",
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        Al variar {sensitivityCriterion} hasta w<sub>test</sub> = {firstChange.wTest.toFixed(3)}{" "}
                        ({firstChange.delta.toFixed(1)}%), el ranking cambia de{" "}
                        <span style={{ fontWeight: 800 }}>{baseRanking}</span> a{" "}
                        <span style={{ fontWeight: 800 }}>{firstChange.ranking}</span>. Esto indica sensibilidad en ese rango.
                      </div>
                    ) : null}
                    <div
                      style={{
                        marginTop: 10,
                        padding: 12,
                        borderRadius: 10,
                        background: "#f8fafc",
                        border: "1px solid rgba(0,0,0,0.08)",
                        fontSize: 13,
                        lineHeight: 1.5,
                      }}
                    >
                      {allSameRanking ? (
                        <>
                          El grupo {topGroup} mantiene el ranking superior durante todo el rango de variaci&oacute;n (±{safeRange.toFixed(1)}%), lo que
                          sugiere alta robustez. El ranking no cambia en ning&uacute;n punto, por lo que la decisi&oacute;n es insensible a la
                          ponderaci&oacute;n del criterio {sensitivityCriterion} ({critLabel}) dentro del rango analizado.
                          <div style={{ marginTop: 10, lineHeight: 1.6 }}>
                            Para la alternativa con mayor puntuaci&oacute;n final de idoneidad ({topGroup}), el an&aacute;lisis de sensibilidad aplicado al
                            criterio {sensitivityCriterion} ({critLabel}) con un rango de variaci&oacute;n de &plusmn;{safeRange.toFixed(1)}% y un paso de
                            incremento de {Number(step || 0).toFixed(1)}%, no genera cambios en el ranking de los grupos.
                          </div>
                          <div style={{ marginTop: 6, lineHeight: 1.6 }}>
                            Este resultado sugiere que la elecci&oacute;n de {topGroup} como grupo MAR &oacute;ptimo se mantiene favorable incluso cuando se
                            ajusta la ponderaci&oacute;n del criterio {sensitivityCriterion} ({critLabel}), pero tambi&eacute;n deja claro que el criterio del experto
                            sigue siendo el eje determinante, de modo que ligeras variaciones pueden modificar la recomendaci&oacute;n.
                          </div>
                          <div style={{ marginTop: 6, lineHeight: 1.6 }}>
                            En otras palabras, la decisi&oacute;n puede ser favorable; sin embargo conserva cierto grado de incertidumbre porque prima el
                            criterio del experto y podr&iacute;a cambiar si se revisa esa ponderaci&oacute;n.
                          </div>
                          <div style={{ marginTop: 6, lineHeight: 1.6 }}>
                            Este comportamiento invita a revisar con cuidado la justificaci&oacute;n t&eacute;cnica asignada a ese criterio para entender hasta qu&eacute; punto
                            la recomendaci&oacute;n depende de ese juicio.
                          </div>
                        </>
                      ) : (
                        <>
                          La sensibilidad del modelo frente al peso del criterio {sensitivityCriterion} ({critLabel}) muestra cambios en el ordenamiento.
                          {" "}Se identifica un umbral en w<sub>test</sub> = {firstChange ? firstChange.wTest.toFixed(3) : "-"} donde el ranking pasa de{" "}
                          <span style={{ fontWeight: 700 }}>{baseRanking || "-"}</span> a{" "}
                          <span style={{ fontWeight: 700 }}>{firstChange ? firstChange.ranking : "-"}</span>. Esto indica que la decisi&oacute;n es sensible a
                          variaciones en ese rango y requiere interpretaci&oacute;n cuidadosa.
                          <div style={{ marginTop: 10, lineHeight: 1.6 }}>
                            Para la alternativa con mayor puntuaci&oacute;n final de idoneidad ({topGroup}), el an&aacute;lisis de sensibilidad aplicado al
                            criterio {sensitivityCriterion} ({critLabel}) con un rango de variaci&oacute;n de &plusmn;{safeRange.toFixed(1)}% y un paso de
                            incremento de {Number(step || 0).toFixed(1)}%, s&iacute; genera cambios en el ranking de los grupos.
                          </div>
                          <div style={{ marginTop: 6, lineHeight: 1.6 }}>
                            El cambio ocurre a partir de w<sub>test</sub> = {firstChange ? firstChange.wTest.toFixed(3) : "-"} (
                            {firstChange ? firstChange.delta.toFixed(1) : "-"}%), donde el orden pasa de {baseRanking || "-"} a{" "}
                            {firstChange ? firstChange.ranking : "-"}, lo que evidencia sensibilidad del resultado frente al criterio analizado.
                          </div>
                          <div style={{ marginTop: 6, lineHeight: 1.6 }}>
                            Esto sugiere que la elecci&oacute;n de {topGroup} como grupo MAR &oacute;ptimo depende en mayor medida del peso asignado al criterio
                            {sensitivityCriterion} ({critLabel}), por lo que ajustes razonables en esa ponderaci&oacute;n pueden modificar la alternativa
                            dominante.
                          </div>
                          <div style={{ marginTop: 6, lineHeight: 1.6 }}>
                            En consecuencia, se recomienda revisar cuidadosamente la justificaci&oacute;n del peso asignado a dicho criterio y, si es necesario,
                            explorar escenarios adicionales para validar la consistencia de la decisi&oacute;n.
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}
              {sensitivityAnalysis?.isReady ? (
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={saveSensitivityAnalysis}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 10,
                      border: "1px solid rgba(0,0,0,0.15)",
                      background: "#0f172a",
                      color: "#ffffff",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Guardar an&aacute;lisis
                  </button>
                  <button
                    type="button"
                    onClick={clearSensitivityAnalyses}
                    disabled={!sensitivitySavedAnalyses.length}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 10,
                      border: !sensitivitySavedAnalyses.length ? "1px solid rgba(0,0,0,0.1)" : "1px solid rgba(220,0,78,0.6)",
                      background: !sensitivitySavedAnalyses.length ? "#f3f4f6" : "rgba(248,113,113,0.15)",
                      color: !sensitivitySavedAnalyses.length ? "#9ca3af" : "#dc2626",
                      fontWeight: 700,
                      cursor: !sensitivitySavedAnalyses.length ? "not-allowed" : "pointer",
                    }}
                  >
                    Eliminar análisis guardados
                  </button>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>
                    Se guarda el criterio analizado, el resultado y la interpretaci&oacute;n.
                  </div>
                </div>
              ) : null}
              {sensitivitySavedAnalyses.length ? (
                <div
                  style={{
                    marginTop: 12,
                    padding: 12,
                    borderRadius: 12,
                    background: "#f8fafc",
                    border: "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: 16 }}>An&aacute;lisis de sensibilidad guardados</div>
                  <div style={{ marginTop: 8, display: "grid", gap: 10 }}>
                    {sensitivitySavedAnalyses.map((entry) => {
                      const when = entry.createdAtISO ? new Date(entry.createdAtISO) : null;
                      const whenLabel =
                        when && !Number.isNaN(when.getTime()) ? when.toLocaleString() : entry.createdAtISO || "-";
                      const changeLabel = entry.allSameRanking
                        ? "Ranking estable (robusto)"
                        : entry.firstChange
                        ? `Cambio en w_test = ${Number(entry.firstChange.wTest || 0).toFixed(3)} (${Number(
                            entry.firstChange.delta || 0
                          ).toFixed(1)}%)`
                        : "Cambio de ranking detectado";
                      const tableBaseWeight = Number.isFinite(entry.baseWeight)
                        ? Number(entry.baseWeight).toFixed(3)
                        : "-";
                      const tableRange = Number.isFinite(entry.range)
                        ? `±${Number(entry.range).toFixed(1)}%`
                        : "-";
                      const tableStep = Number.isFinite(entry.step)
                        ? `${Number(entry.step).toFixed(1)}%`
                        : "-";
                      const rankingChangedText = entry.allSameRanking ? "No" : "Sí";
                      const inflectionPoint = entry.firstChange
                        ? `w_test = ${Number(entry.firstChange.wTest || 0).toFixed(3)} (${Number(
                            entry.firstChange.delta || 0
                          ).toFixed(1)}%)`
                        : entry.allSameRanking
                        ? "No aplica"
                        : "Cambio detectado sin punto definido";
                      return (
                        <div
                          key={entry.id}
                          style={{
                            padding: 10,
                            borderRadius: 10,
                            background: "#ffffff",
                            border: "1px solid rgba(0,0,0,0.08)",
                          }}
                        >
                          <div style={{ fontWeight: 700 }}>
                            {entry.criterionId} - {entry.criterionLabel || entry.criterionId}
                          </div>
                          <div style={{ fontSize: 12, opacity: 0.7 }}>{whenLabel}</div>
                          <div style={{ marginTop: 6, fontSize: 13 }}>
                            <strong>Resultado:</strong> {entry.baseRanking || "-"} ({changeLabel})
                          </div>
                          <div style={{ marginTop: 6, fontSize: 13 }}>
                            <strong>Interpretaci&oacute;n:</strong> {entry.interpretation || "-"}
                          </div>
                          <div style={{ marginTop: 12, minWidth: 0 }}>
                            <div style={{ overflowX: "auto" }}>
                              <table
                                style={{
                                  width: "100%",
                                  borderCollapse: "collapse",
                                  fontSize: 12,
                                  minWidth: 640,
                                }}
                              >
                                <thead>
                                  <tr>
                                    {[
                                      "Criterio",
                                      "Peso base",
                                      "Rango de variación analizado",
                                      "Paso de incremento",
                                      "¿Cambio el ranking?",
                                      "Punto de inflexión (Donde se presenta el cambio)",
                                    ].map((header) => (
                                      <th
                                        key={header}
                                        style={{
                                          padding: "6px 8px",
                                          borderBottom: "1px solid rgba(0,0,0,0.08)",
                                          fontSize: 11,
                                          fontWeight: 600,
                                          textAlign: "left",
                                          color: "#475569",
                                        }}
                                      >
                                        {header}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td
                                      style={{
                                        padding: "6px 8px",
                                        borderBottom: "1px solid rgba(0,0,0,0.08)",
                                        color: "#0f172a",
                                      }}
                                    >
                                      {entry.criterionLabel || entry.criterionId}
                                    </td>
                                    <td
                                      style={{
                                        padding: "6px 8px",
                                        borderBottom: "1px solid rgba(0,0,0,0.08)",
                                        color: "#0f172a",
                                      }}
                                    >
                                      {tableBaseWeight}
                                    </td>
                                    <td
                                      style={{
                                        padding: "6px 8px",
                                        borderBottom: "1px solid rgba(0,0,0,0.08)",
                                        color: "#0f172a",
                                      }}
                                    >
                                      {tableRange}
                                    </td>
                                    <td
                                      style={{
                                        padding: "6px 8px",
                                        borderBottom: "1px solid rgba(0,0,0,0.08)",
                                        color: "#0f172a",
                                      }}
                                    >
                                      {tableStep}
                                    </td>
                                    <td
                                      style={{
                                        padding: "6px 8px",
                                        borderBottom: "1px solid rgba(0,0,0,0.08)",
                                        color: "#0f172a",
                                      }}
                                    >
                                      {rankingChangedText}
                                    </td>
                                    <td
                                      style={{
                                        padding: "6px 8px",
                                        borderBottom: "1px solid rgba(0,0,0,0.08)",
                                        color: "#0f172a",
                                      }}
                                    >
                                      {inflectionPoint}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                          <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
                            <button
                              type="button"
                              onClick={() => deleteSensitivityAnalysis(entry.id)}
                              style={{
                                borderRadius: 8,
                                border: "1px solid rgba(220,0,78,0.6)",
                                background: "rgba(248,113,113,0.08)",
                                color: "#dc2626",
                                padding: "6px 10px",
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              Eliminar an&aacute;lisis
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
              </div>

              <div style={{ marginTop: 12 }}>
                <button
                  type="button"
                  onClick={handleResultadosClick}
                  disabled={!resultsUnlocked}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 10,
                    border: resultsUnlocked ? "1px solid rgba(0,0,0,0.15)" : "1px solid rgba(0,0,0,0.08)",
                    background: resultsUnlocked ? "#1f2937" : "#94a3b8",
                    color: "#ffffff",
                    fontWeight: 700,
                    cursor: resultsUnlocked ? "pointer" : "not-allowed",
                  }}
                >
                  Resultados
                </button>
                {routeBDialogOpen ? (
                  <div
                    style={{
                      marginTop: 12,
                      padding: 12,
                      borderRadius: 12,
                      background: "#111827",
                      color: "#f8fafc",
                      border: "1px solid rgba(255,255,255,0.15)",
                      maxWidth: 520,
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 14 }}>¿Evaluar la Ruta B antes de ver los resultados?</div>
                    <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                      Se desplegará la tarjeta de Ruta B (modelo automatizado). Elige esa opción si deseas conocer esa alternativa.
                    </div>
                    <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => handleRouteBDecision(true)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 10,
                          border: "none",
                          background: "#2563eb",
                          color: "#fff",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Evaluar Ruta B
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRouteBDecision(false)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 10,
                          border: "1px solid rgba(255,255,255,0.4)",
                          background: "transparent",
                          color: "#f8fafc",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Continuar a resultados
                      </button>
                    </div>
                  </div>
                ) : null}
                {resultsBlockedNotice ? (
                  <div style={{ marginTop: 6, fontSize: 12, color: "#dc2626" }}>{resultsBlockedNotice}</div>
                ) : null}
              </div>

              </div>
          </>
        ) : null}
      </div>
      </div>

      <div style={{ display: activeRoute === "B" ? "block" : "none" }}>
        <div style={{ marginTop: 8 }}>
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
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 20 }}>Ruta B: Modelo automatizado (árboles / Bosque aleatorio)</div>
          <p style={{ opacity: 0.9 }}>
            Esta ruta constituye el marco metodológico para transformar la evidencia técnica de un caso en criterios comparables que determinen la idoneidad de los grupos de Recarga Gestionada.
            El proceso se desarrolla en dos dimensiones integradas: (1) <strong>Estructura Jerárquica:</strong> organiza la toma de decisiones en seis niveles descendentes (criterios generales C1-C6, variables específicas V1-V35 e integración por grupos G1, G2 y G3) y (2) <strong>Flujo Operativo:</strong> avanza a través de tres etapas consecutivas, desde la consolidación de insumos hasta el análisis de robustez, siguiendo el esquema conceptual descrito en la Figura 7.
          </p>
        </div>
        <RouteBStagesFigure />
        <div style={{ marginTop: 6, fontSize: 14, textAlign: "center" }}>
          Figura 7. Esquema conceptual de la ruta jerárquica (B). Fuente. Elaboración propia.
        </div>

        <div style={{ marginTop: 12 }}>
          <div ref={routeBRef} />
        </div>
      </div>
    </div>


    </>
  );
}






