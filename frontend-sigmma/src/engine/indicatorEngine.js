// /src/engine/indicatorEngine.js
import { CATALOG } from "../catalog/catalog.js";

const LEVELS = [0, 1, 2, 3, 4];

// Mapea IDs del catálogo -> IDs reales de tus módulos en Fase 1
const MODULE_ID_COMPAT = Object.freeze({
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
});

// Inverso de aliases: canonKey -> [oldKey1, oldKey2...]
const CANON_TO_ALIASES = (() => {
  const out = {};
  const aliases = CATALOG?.aliases || {};
  for (const oldKey of Object.keys(aliases)) {
    const canon = aliases[oldKey];
    out[canon] = out[canon] || [];
    out[canon].push(oldKey);
  }
  return out;
})();

function isEmpty(v) {
  if (v === null || v === undefined) return true;
  if (typeof v === "string") return v.trim().length === 0;
  return false;
}

function normalizeNoReportado(v) {
  const s = String(v ?? "").trim();
  // soporta "No_reportado", "No reportado", "No Reportado"
  return s.replace(/\s+/g, "_").toLowerCase();
}

function selectFilled(v) {
  if (isEmpty(v)) return false;
  return normalizeNoReportado(v) !== "no_reportado";
}

function basicScore(indicator, value) {
  // Regla determinista mínima (sin pesos aún)
  if (indicator.type === "select") return selectFilled(value) ? 3 : 0;
  if (indicator.type === "number") return isEmpty(value) ? 0 : 3;

  // text / textarea
  if (isEmpty(value)) return 0;
  const len = String(value).trim().length;
  if (len < 10) return 1;
  if (len < 40) return 2;
  return 3;
}

function evidenceText(indicator, value) {
  if (isEmpty(value)) return "";
  const s = String(value);
  return s.length > 140 ? s.slice(0, 140) + "…" : s;
}

/**
 * Lee el valor soportando:
 * 1) CaseData: phase1.modules[modId][key]
 * 2) Legacy Fase1: case[geologico][key] (con compat de moduleId)
 * 3) Legacy con aliases (tildes/slash) -> intenta oldKeys
 */
function getValue(caseData, indicator) {
  const modId = indicator.moduleId;
  const key = indicator.key;

  // 1) CaseData (nuevo)
  const v1 = caseData?.phase1?.modules?.[modId]?.[key];
  if (v1 !== undefined) return v1;

  // 2) Legacy (tu Fase 1)
  const legacyModuleId = MODULE_ID_COMPAT[modId] || modId;
  const v2 = caseData?.[legacyModuleId]?.[key];
  if (v2 !== undefined) return v2;

  // 3) aliases (si legacy guarda nombres viejos con / o tildes)
  const possibleOldKeys = CANON_TO_ALIASES[key] || [];
  for (const oldKey of possibleOldKeys) {
    const v3 = caseData?.[legacyModuleId]?.[oldKey];
    if (v3 !== undefined) return v3;

    const v4 = caseData?.phase1?.modules?.[legacyModuleId]?.[oldKey];
    if (v4 !== undefined) return v4;
  }

  return undefined;
}

// appliesTo: por ahora todos relevantes
function defaultAppliesTo() {
  return {
    G1: { status: "relevant" },
    G2: { status: "relevant" },
    G3: { status: "relevant" },
  };
}

export const IndicatorRegistry = Object.freeze(
  (CATALOG?.indicators || []).map((i) => ({
    id: i.id,
    name: i.label,
    description: i.description ?? "",
    moduleId: i.moduleId,
    key: i.key,
    dependsOn: [{ type: "field", moduleId: i.moduleId, key: i.key }],
    appliesTo: defaultAppliesTo(),

    scoreRule: (caseData) => {
      const value = getValue(caseData, i);
      const score0to4 = basicScore(i, value);

      const missing = score0to4 === 0 ? [`${i.moduleId}.${i.key}`] : [];
      const evidence = score0to4 > 0 ? evidenceText(i, value) : "";
      const flags = [];

      // Inconsistencia mínima: number no numérico
      if (i.type === "number" && !isEmpty(value) && Number.isNaN(Number(value))) {
        flags.push("valor_no_numerico");
      }

      return { score0to4, evidence, missing, flags };
    },
  }))
);

export function scoreAllIndicators(caseData) {
  const scores = {};
  const evidenceMap = {};
  const missingFieldsSet = new Set();
  const inconsistencies = [];

  for (const reg of IndicatorRegistry) {
    const out = reg.scoreRule(caseData);

    scores[reg.id] = out.score0to4;
    evidenceMap[reg.id] = out.evidence;

    for (const m of out.missing) missingFieldsSet.add(m);
    for (const f of out.flags) inconsistencies.push({ indicatorId: reg.id, flag: f });
  }

  // normalizar (por seguridad)
  for (const k of Object.keys(scores)) {
    if (!LEVELS.includes(scores[k])) scores[k] = 0;
  }

  return {
    scores,
    missingFields: Array.from(missingFieldsSet),
    inconsistencies,
    evidenceMap,
  };
}

