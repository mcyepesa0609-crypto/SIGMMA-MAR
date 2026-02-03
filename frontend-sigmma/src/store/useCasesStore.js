// /src/store/useCasesStore.js
import { useCallback, useEffect, useMemo, useState } from "react";
import { normalizeCaseData } from "../catalog/catalog.js";

const LS_CASES = "sigmma.cases.v1";
const LS_ACTIVE = "sigmma.activeCaseId.v1";

function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

// Detecta si un objeto “parece” CaseData (CATALOG) para normalizarlo
function looksLikeCaseData(c) {
  return (
    c &&
    typeof c === "object" &&
    (c.phase1 || c.schemaVersion || c.catalogVersion || c.weights)
  );
}

// Normaliza sin romper tus casos “Fase 1” (id, nombre, mapUploads, mapMeta, etc.)
function normalizeAnyCase(caseObj, key) {
  const base = caseObj && typeof caseObj === "object" ? { ...caseObj } : {};

  // Asegura ID estable
  if (!base.id && key) base.id = key;

  // Compat: si alguna parte usa caseId/caseName
  if (!base.caseId) base.caseId = base.id;
  if (!base.caseName && base.nombre) base.caseName = base.nombre;

  // Solo normaliza como CaseData si realmente tiene forma de CaseData
  if (looksLikeCaseData(base)) {
    try {
      return normalizeCaseData(base);
    } catch {
      return base;
    }
  }

  return base;
}

function loadCasesObject() {
  const raw = localStorage.getItem(LS_CASES);
  const parsed = raw ? safeParse(raw, {}) : {};

  let obj = {};

  // Si antes guardaste array, lo convertimos a objeto
  if (Array.isArray(parsed)) {
    parsed.forEach((c, idx) => {
      const k = c?.id || c?.caseId || `CASE_${String(idx + 1).padStart(3, "0")}`;
      obj[k] = c;
    });
  } else if (parsed && typeof parsed === "object") {
    obj = parsed;
  }

  // Normalizar cada caso
  const out = {};
  for (const k of Object.keys(obj)) {
    out[k] = normalizeAnyCase(obj[k], k);
  }

  return out;
}

function storageReplacer(key, value) {
  if (key === "dataUrl") return undefined;
  return value;
}

function isQuotaError(error) {
  return (
    error &&
    (error.name === "QuotaExceededError" ||
      error.code === 22 ||
      error.code === 1014 ||
      (error.message && error.message.toLowerCase().includes("quota")))
  );
}

function saveCasesObject(casesObj) {
  const serialized = JSON.stringify(casesObj || {}, storageReplacer);
  try {
    localStorage.setItem(LS_CASES, serialized);
  } catch (error) {
    if (isQuotaError(error)) {
      console.warn("No se pudo persistir los casos: se excedió la cuota de localStorage", error);
    } else {
      console.error("No se pudo guardar la información de casos", error);
    }
  }
}

function loadActiveCaseId(casesObj) {
  const saved = localStorage.getItem(LS_ACTIVE);

  // Si existe y está en el objeto, úsalo
  if (saved && casesObj && casesObj[saved] && saved !== "nuevo") return saved;

  // Si no, primer caso distinto de "nuevo"
  const first = Object.keys(casesObj || {}).find((k) => k !== "nuevo");
  return first || null;
}

let globalCases = loadCasesObject();
let globalActiveCaseId = loadActiveCaseId(globalCases);
const listeners = new Set();

function notify() {
  const snapshot = { cases: globalCases, activeCaseId: globalActiveCaseId };
  listeners.forEach((fn) => fn(snapshot));
}

function setGlobalCases(nextCases) {
  globalCases = nextCases || {};
  if (globalActiveCaseId && !globalCases?.[globalActiveCaseId]) {
    globalActiveCaseId = loadActiveCaseId(globalCases);
  }
  notify();
}

function setGlobalActiveCaseId(nextActiveId) {
  globalActiveCaseId = nextActiveId;
  if (globalActiveCaseId && !globalCases?.[globalActiveCaseId]) {
    globalActiveCaseId = loadActiveCaseId(globalCases);
  }
  notify();
}

export function useCasesStore() {
  const [state, setState] = useState(() => ({
    cases: globalCases,
    activeCaseId: globalActiveCaseId,
  }));

  useEffect(() => {
    const handler = (nextState) => setState(nextState);
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  const setCases = useCallback((updater) => {
    const nextCases =
      typeof updater === "function" ? updater(globalCases) : updater;
    setGlobalCases(nextCases);
  }, []);

  const setActiveCaseId = useCallback((updater) => {
    const nextActive =
      typeof updater === "function" ? updater(globalActiveCaseId) : updater;
    setGlobalActiveCaseId(nextActive);
  }, []);

  // Persistencia
  useEffect(() => {
    saveCasesObject(state.cases);
  }, [state.cases]);

  useEffect(() => {
    if (state.activeCaseId) localStorage.setItem(LS_ACTIVE, state.activeCaseId);
    else localStorage.removeItem(LS_ACTIVE);
  }, [state.activeCaseId]);

  const activeCase = useMemo(() => {
    return state.activeCaseId ? state.cases?.[state.activeCaseId] ?? null : null;
  }, [state.activeCaseId, state.cases]);

  return {
    cases: state.cases,
    setCases,
    activeCaseId: state.activeCaseId,
    setActiveCaseId,
    activeCase,
  };
}

