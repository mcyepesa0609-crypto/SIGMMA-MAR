// /src/catalog/catalog.js
// ============================================================================
// SIGMMA-MAR — Catálogo único + amarres (compatible con tu Fase 1 ACTUAL)
// Lee datos desde:
//   - caseData[moduleId][key]                  ✅ (tu estructura actual)
//   - caseData.mapUploads[layerId], mapMeta    ✅ (tu estructura actual)
// También soporta (si algún día migras):
//   - caseData.phase1.modules / caseData.phase1.maps
// ============================================================================

/** @typedef {0|1|2|3|4} Scale04 */

const ROUTE_A_GROUPS = Object.freeze([
  { id: "G1", label: "Infiltracion superficial" },
  { id: "G2", label: "Intervencion del cauce" },
  { id: "G3", label: "Recarga mediante pozos" },
]);

const ROUTE_A_VARIABLES = Object.freeze([
  {
    id: "V1",
    label: "Objetivo definido",
    question: "Cual es el objetivo principal de MAR?",
    criterionId: "C1",
    inputs: [{ moduleId: "comunidad", key: "uso_final_del_agua", kind: "select" }],
    scoring: { kind: "presence" },
    groupImpact: { G1: 1, G2: 1, G3: 1 },
  },
  {
    id: "V2",
    label: "Caracterizacion del acuifero",
    question: "Existe caracterizacion del acuifero?",
    criterionId: "C2",
    inputs: [
      { moduleId: "caracterizacion", key: "clasificacion_hidrogeologica_uhg", kind: "select" },
      { moduleId: "caracterizacion", key: "porosidad", kind: "select" },
      { moduleId: "caracterizacion", key: "permeabilidad", kind: "select" },
    ],
    maps: ["unidades-hidrogeologicas"],
    scoring: { kind: "presence" },
    groupImpact: { G1: 1, G2: 1, G3: 1 },
  },
  {
    id: "V3",
    label: "Modelo geologico",
    question: "Existe modelo geologico?",
    criterionId: "C2",
    inputs: [
      { moduleId: "geologico", key: "nombre_unidad_geologica", kind: "text" },
      { moduleId: "geologico", key: "descripcion_unidad_geologica", kind: "text" },
      { moduleId: "geologico", key: "escala_mapa_geologico", kind: "text" },
    ],
    maps: ["mapa-geologico"],
    scoring: { kind: "presence" },
    groupImpact: { G1: 1, G2: 1, G3: 1 },
  },
  {
    id: "V4",
    label: "Modelo hidrologico",
    question: "Existe modelo hidrologico?",
    criterionId: "C2",
    inputs: [
      { moduleId: "hidrologico", key: "p_med_anual_mm", kind: "number" },
      { moduleId: "hidrologico", key: "q_med_anual_m3s", kind: "number" },
    ],
    maps: ["recarga", "precipitacion"],
    scoring: { kind: "presence" },
    groupImpact: { G1: 1, G2: 1, G3: 1 },
  },
  {
    id: "V5",
    label: "Modelo numerico o parametros",
    question: "Existe modelo numerico o parametros hidraulicos?",
    criterionId: "C2",
    inputs: [
      { moduleId: "hidraulico", key: "Tipo_unidad", kind: "select" },
      { moduleId: "hidraulico", key: "porosidad", kind: "select" },
      { moduleId: "hidraulico", key: "permeabilidad", kind: "select" },
      { moduleId: "hidraulico", key: "conductividad_hidraulica_k", kind: "text" },
      { moduleId: "hidraulico", key: "transmisividad_t", kind: "text" },
    ],
    maps: ["drenajes", "densidad-drenajes", "nivel-freatico"],
    scoring: { kind: "presence" },
    groupImpact: { G1: 1, G2: 1, G3: 1 },
  },
  {
    id: "V6",
    label: "Modelo hidrogeoquimico",
    question: "Existe modelo hidrogeoquimico?",
    criterionId: "C2",
    inputs: [
      { moduleId: "hidrogeoquimico", key: "facies_hidroquimica_descriptiva", kind: "text" },
      { moduleId: "hidrogeoquimico", key: "ph", kind: "number" },
      { moduleId: "hidrogeoquimico", key: "tds_mgL", kind: "number" },
      { moduleId: "hidrogeoquimico", key: "ce_uScm", kind: "number" },
      { moduleId: "hidrogeoquimico", key: "ca_mgL", kind: "number" },
      { moduleId: "hidrogeoquimico", key: "mg_mgL", kind: "number" },
      { moduleId: "hidrogeoquimico", key: "k_mgL", kind: "number" },
      { moduleId: "hidrogeoquimico", key: "na_mgL", kind: "number" },
      { moduleId: "hidrogeoquimico", key: "cl_mgL", kind: "number" },
      { moduleId: "hidrogeoquimico", key: "so4_mgL", kind: "number" },
      { moduleId: "hidrogeoquimico", key: "hco3_mgL", kind: "number" },
      { moduleId: "hidrogeoquimico", key: "no3_mgL", kind: "number" },

    ],
    scoring: { kind: "presence" },
    groupImpact: { G1: 1, G2: 1, G3: 1 },
  },
  {
    id: "V7",
    label: "Escala del acuifero",
    question: "Cual es la escala del acuifero?",
    criterionId: "C2",
    inputs: [{ moduleId: "geologico", key: "escala_mapa_geologico", kind: "text" }],
    scoring: { kind: "presence" },
    groupImpact: { G1: 1, G2: 1, G3: 1 },
  },
  {
    id: "V8",
    label: "Tipo de acuifero",
    question: "Cual es el tipo de acuifero?",
    criterionId: "C2",
    inputs: [{ moduleId: "hidraulico", key: "Tipo_unidad", kind: "select" }],
    scoring: {
      kind: "selectByGroup",
      mapByGroup: {
        libre: { G1: 4, G2: 3, G3: 4 },
        "semiconfinado - confinado": { G1: 1, G2: 4, G3: 1 },
      },
      defaultScore: 2,
    },
    groupImpact: { G1: 1, G2: 1, G3: 1 },
  },
  {
    id: "V9",
    label: "Capacidad de infiltracion (zona no saturada)",
    question: "Se estudio la capacidad de infiltracion?",
    criterionId: "C2",
    inputs: [
      { moduleId: "volumen", key: "cap_infiltracion_zona_no_saturada", kind: "select" },
      { moduleId: "volumen", key: "cap_infiltracion_categoria", kind: "select" },
    ],
    scoring: { kind: "presence" },
    groupImpact: { G1: 1, G2: 1, G3: 1 },
  },
  {
    id: "V10",
    label: "Tecnica viable incluye pozos",
    question: "La tecnica viable incluye pozos?",
    criterionId: "C2",
    inputs: [{ moduleId: "infraestructura", key: "tipo_infraestructura", kind: "select" }],
    scoring: { kind: "selectContains", tokens: ["pozo"] },
    groupImpact: { G1: 0.4, G2: 0.5, G3: 1 },
  },
  {
    id: "V11",
    label: "Permeabilidad del acuifero",
    question: "Como es la permeabilidad?",
    criterionId: "C2",
    inputs: [{ moduleId: "caracterizacion", key: "permeabilidad", kind: "select" }],
    scoring: {
      kind: "select",
      map: {
        "muy alta (100<k)": 4,
        "alta (10<k<100)": 4,
        "media (1<k<10)": 2,
        "baja a muy baja (10^-2<k<1)": 1,
      },
      defaultScore: 2,
    },
    groupImpact: { G1: 1, G2: 1, G3: 1 },
  },
  {
    id: "V12",
    label: "Porosidad efectiva",
    question: "Como es la porosidad?",
    criterionId: "C2",
    inputs: [{ moduleId: "caracterizacion", key: "porosidad", kind: "select" }],
    scoring: {
      kind: "select",
      map: {
        "muy alta (>50%)": 4,
        "alta (30-50%)": 4,
        "regular (10-30%)": 2,
        "mala (0-10%)": 1,
      },
      defaultScore: 2,
    },
    groupImpact: { G1: 1, G2: 1, G3: 1 },
  },
  {
    id: "V13",
    label: "Fuente de agua identificada",
    question: "Conoce la fuente de agua?",
    criterionId: "C3",
    inputs: [{ moduleId: "fuente", key: "tipo_de_fuente", kind: "select" }],
    scoring: { kind: "select", defaultScore: 4 },
    groupImpact: { G1: 1, G2: 1, G3: 1 },
  },
  {
    id: "V14",
    label: "Tipo de fuente de agua",
    question: "Cual es la fuente de agua a recargar?",
    criterionId: "C3",
    inputs: [{ moduleId: "fuente", key: "tipo_de_fuente", kind: "select" }],
    scoring: {
      kind: "selectByGroup",
      mapByGroup: {
        superficial: { G1: 4, G2: 4, G3: 4 },
        "escorrentia estacional": { G1: 0, G2: 4, G3: 4 },
        escorrentia: { G1: 0, G2: 4, G3: 4 },
        "agua residual": { G1: 0, G2: 4, G3: 3 },
        "residual tratada": { G1: 0, G2: 4, G3: 4 },
        "subterranea u otra fuente": { G1: 0, G2: 4, G3: 0 },
        subterranea: { G1: 0, G2: 4, G3: 0 },
      },
      defaultScore: 0,
    },
    groupImpact: { G1: 1, G2: 1, G3: 1 },
  },
  {
    id: "V15",
    label: "Calidad del agua fuente",
    question: "Conoce la calidad del agua fuente?",
    criterionId: "C3",
    inputs: [{ moduleId: "fuente", key: "categoria_calidad_mar", kind: "select" }],
    scoring: {
      kind: "select",
      map: {
        apta: 4,
        "apta con pretratamiento": 3,
        "no apta": 0,
        "no evaluada": 0,
      },
      defaultScore: 0,
    },
    groupImpact: { G1: 1, G2: 1, G3: 1 },
  },
  {
    id: "V16",
    label: "Normativa para la recarga",
    question: "La recarga esta permitida por normativa?",
    criterionId: "C3",
    inputs: [{ moduleId: "fuente", key: "cumple_norma_para_uso", kind: "select" }],
    scoring: {
      kind: "select",
      map: {
        si: 4,
        parcial: 2,
        no: 0,
        "no evaluado": 0,
      },
      defaultScore: 0,
    },
    groupImpact: { G1: 1, G2: 1, G3: 1 },
  },
  {
    id: "V36",
    label: "Tipo de fuente superficial",
    question: "Si la fuente es superficial, cual es el tipo?",
    criterionId: "C3",
    inputs: [{ moduleId: "fuente", key: "tipo_fuente_superficial", kind: "select" }],
    scoring: {
      kind: "selectByGroup",
      mapByGroup: {
        "rio permanente": { G1: 4, G2: 0, G3: 3 },
        "rio permanente q9 meses": { G1: 4, G2: 0, G3: 3 },
        "rio estacional": { G1: 3, G2: 0, G3: 3 },
        "rio estacional q 3 9 meses": { G1: 3, G2: 0, G3: 3 },
        "rio efimero": { G1: 2, G2: 0, G3: 4 },
        "rio efimero q3 meses": { G1: 2, G2: 0, G3: 4 },
        "lago/embalse": { G1: 0, G2: 0, G3: 4 },
        "lago embalse": { G1: 0, G2: 0, G3: 4 },
      },
      defaultScore: 0,
    },
    groupImpact: { G1: 1, G2: 0, G3: 1 },
  },
  {
    id: "V37",
    label: "Conexion hidraulica con el rio",
    question: "Existe conexion hidraulica (rio ganador, perdedor o sin conexion)?",
    criterionId: "C3",
    inputs: [{ moduleId: "fuente", key: "conexion_hidraulica", kind: "select" }],
    scoring: {
      kind: "select",
      map: {
        "rio ganador": 4,
        "rio perdedor": 4,
        "sin conexion": 0,
      },
      defaultScore: 0,
    },
    groupImpact: { G1: 1, G2: 0, G3: 1 },
  },
  {
    id: "V17",
    label: "Calidad del agua del acuifero",
    question: "Conoce la calidad del agua del acuifero?",
    criterionId: "C3",
    inputs: [],
    scoring: { kind: "presence" },
    groupImpact: { G1: 1, G2: 1, G3: 1 },
  },
  {
    id: "V18",
    label: "Mezcla fuente-acuifero cumple limites",
    question: "La mezcla cumple limites aplicables?",
    criterionId: "C3",
    inputs: [],
    scoring: { kind: "presence" },
    groupImpact: { G1: 1, G2: 1, G3: 1 },
  },
  {
    id: "V19",
    label: "Capacidad de almacenamiento",
    question: "Conoce la capacidad de almacenamiento?",
    criterionId: "C4",
    inputs: [{ moduleId: "volumen", key: "conoce_capacidad_almacenamiento", kind: "select" }],
    scoring: {
      kind: "selectByGroup",
      mapByGroup: {
        si: { G1: 3, G2: 4, G3: 3 },
        no: { G1: 2, G2: 0, G3: 2 },
      },
      defaultScore: 0,
    },
    groupImpact: { G1: 1, G2: 1, G3: 1 },
  },
  {
    id: "V20",
    label: "Volumen de agua a recargar",
    question: "Conoce el volumen de agua a recargar?",
    criterionId: "C4",
    inputs: [{ moduleId: "volumen", key: "conoce_volumen_recarga", kind: "select" }],
    scoring: {
      kind: "selectByGroup",
      mapByGroup: {
        si: { G1: 3, G2: 4, G3: 4 },
        no: { G1: 2, G2: 1, G3: 2 },
      },
      defaultScore: 0,
    },
    groupImpact: { G1: 1, G2: 1, G3: 1 },
  },
  {
    id: "V21",
    label: "Volumen vs capacidad",
    question: "El volumen a recargar es menor que la capacidad?",
    criterionId: "C4",
    inputs: [{ moduleId: "volumen", key: "volumen_menor_capacidad", kind: "select" }],
    scoring: {
      kind: "selectByGroup",
      mapByGroup: {
        si: { G1: 4, G2: 4, G3: 4 },
        no: { G1: 1, G2: 0, G3: 1 },
      },
      defaultScore: 0,
    },
    groupImpact: { G1: 1, G2: 1, G3: 1 },
  },
  {
    id: "V22",
    label: "Uso final conocido",
    question: "Conoce el uso final del agua?",
    criterionId: "C6",
    inputs: [{ moduleId: "comunidad", key: "uso_final_del_agua", kind: "select" }],
    scoring: { kind: "select", defaultScore: 4 },
    groupImpact: { G1: 1, G2: 1, G3: 1 },
  },
  {
    id: "V23",
    label: "Uso final definido",
    question: "Cual es el uso final?",
    criterionId: "C6",
    inputs: [{ moduleId: "comunidad", key: "uso_final_del_agua", kind: "select" }],
    scoring: {
      kind: "selectByGroup",
      mapByGroup: {
        domestico: { G1: 4, G2: 3, G3: 3 },
        industrial: { G1: 3, G2: 4, G3: 4 },
        ambiental: { G1: 4, G2: 2, G3: 4 },
        agricola: { G1: 2, G2: 2, G3: 4 },
        mixto: { G1: 4, G2: 3, G3: 4 },
      },
      defaultScore: 0,
    },
    groupImpact: { G1: 1, G2: 1, G3: 1 },
  },
  {
    id: "V24",
    label: "Relieve dominante",
    question: "Cual es el relieve dominante?",
    criterionId: "C4",
    inputs: [{ moduleId: "relieve", key: "relieve_dominante", kind: "select" }],
    scoring: {
      kind: "selectByGroup",
      mapByGroup: {
        llanura: { G1: 3, G2: 3, G3: 4 },
        valle: { G1: 4, G2: 3, G3: 3 },
        "colina o meseta": { G1: 2, G2: 3, G3: 2 },
        montana: { G1: 0, G2: 2, G3: 0 },
        montaa: { G1: 0, G2: 2, G3: 0 },
        "no evaluado": { G1: 0, G2: 0, G3: 0 },
      },
      defaultScore: 0,
    },
    groupImpact: { G1: 1, G2: 1, G3: 1 },
  },
  {
    id: "V25",
    label: "Clima dominante",
    question: "Cual es el clima dominante?",
    criterionId: "C4",
    inputs: [
      { moduleId: "relieve", key: "Clima", kind: "select" },
      { moduleId: "fuente", key: "Clima", kind: "select" },
    ],
    minInputsPresent: 1,
    scoring: {
      kind: "selectByGroup",
      mapByGroup: {
        "arido o semi arido seco": { G1: 3, G2: 4, G3: 3 },
        "arido o semiarido seco": { G1: 3, G2: 4, G3: 3 },
        "calido seco": { G1: 3, G2: 4, G3: 3 },
        "humedo-semihumedo templado": { G1: 4, G2: 3, G3: 4 },
        tropical: { G1: 4, G2: 3, G3: 4 },
        "no evaluado": { G1: 0, G2: 0, G3: 0 },
      },
      defaultScore: 0,
    },
    groupImpact: { G1: 1, G2: 1, G3: 1 },
  },
  {
    id: "V26",
    label: "Infraestructura disponible",
    question: "Existe infraestructura para MAR?",
    criterionId: "C5",
    inputs: [{ moduleId: "infraestructura", key: "tipo_infraestructura", kind: "select" }],
    scoring: {
      kind: "selectByGroup",
      mapByGroup: {
        pozo: { G1: 3, G2: 4, G3: 2 },
        canal: { G1: 4, G2: 1, G3: 4 },
        "red de distribucion": { G1: 4, G2: 1, G3: 4 },
        embalse: { G1: 3, G2: 2, G3: 4 },
        estanque: { G1: 3, G2: 2, G3: 4 },
        zanja: { G1: 1, G2: 2, G3: 4 },
        ptap: { G1: 1, G2: 4, G3: 3 },
        ptar: { G1: 2, G2: 4, G3: 4 },
        "obras en cauce": { G1: 4, G2: 0, G3: 2 },
        "sin infraestructura": { G1: 0, G2: 0, G3: 0 },
        "no hay infraestructura existente": { G1: 0, G2: 0, G3: 0 },
      },
      defaultScore: 0,
    },
    groupImpact: { G1: 1, G2: 1, G3: 1 },
  },
  {
    id: "V28",
    label: "Planta de tratamiento",
    question: "Existe planta de tratamiento?",
    criterionId: "C5",
    inputs: [{ moduleId: "infraestructura", key: "tipo_infraestructura", kind: "select" }],
    scoring: { kind: "selectContains", tokens: ["ptap", "ptar"] },
    groupImpact: { G1: 0, G2: 0, G3: 1 },
  },
  {
    id: "V29",
    label: "Estanques disponibles",
    question: "Existen estanques en la zona?",
    criterionId: "C5",
    inputs: [{ moduleId: "infraestructura", key: "tipo_infraestructura", kind: "select" }],
    scoring: { kind: "selectContains", tokens: ["estanque"] },
    groupImpact: { G1: 0, G2: 0, G3: 1 },
  },
  {
    id: "V32",
    label: "Obras en cauce",
    question: "Hay obras en cauce (presas o captacion de ribera)?",
    criterionId: "C5",
    inputs: [{ moduleId: "infraestructura", key: "tipo_infraestructura", kind: "select" }],
    scoring: { kind: "selectContains", tokens: ["embalse", "canal"] },
    groupImpact: { G1: 1, G2: 0, G3: 0 },
  },
  {
    id: "V33",
    label: "Pozos operativos",
    question: "Existen pozos operativos o rehabilitables?",
    criterionId: "C5",
    inputs: [
      { moduleId: "infraestructura", key: "tipo_infraestructura", kind: "select" },
      { moduleId: "infraestructura", key: "estado", kind: "select" },
    ],
    scoring: { kind: "pozosOperativos" },
    groupImpact: { G1: 0, G2: 1, G3: 1 },
  },
  {
    id: "V34",
    label: "Tipo de asentamiento",
    question: "Cual es el tipo de asentamiento?",
    criterionId: "C6",
    inputs: [{ moduleId: "comunidad", key: "tipo_asentamiento", kind: "select" }],
    scoring: {
      kind: "selectByGroup",
      mapByGroup: {
        urbano: { G1: 4, G2: 4, G3: 2 },
        rural: { G1: 3, G2: 3, G3: 4 },
        mixto: { G1: 3, G2: 3, G3: 3 },
        na: { G1: 2, G2: 2, G3: 2 },
        "no evaluado": { G1: 2, G2: 2, G3: 2 },
      },
      defaultScore: 0,
    },
    groupImpact: { G1: 1, G2: 1, G3: 1 },
  },
  {
    id: "V35",
    label: "Beneficio directo identificado",
    question: "Se identifico beneficio directo?",
    criterionId: "C6",
    inputs: [{ moduleId: "comunidad", key: "condicion_beneficio", kind: "select" }],
    scoring: {
      kind: "selectByGroup",
      mapByGroup: {
        "beneficio directo": { G1: 4, G2: 4, G3: 4 },
        "beneficio indirecto": { G1: 3, G2: 3, G3: 3 },
        "potencial beneficiario": { G1: 4, G2: 4, G3: 4 },
        "no evaluado": { G1: 0, G2: 0, G3: 0 },
      },
      defaultScore: 0,
    },
    groupImpact: { G1: 1, G2: 1, G3: 1 },
  },
]);

export const CATALOG = Object.freeze({
  catalogVersion: "1.0.0",
  schemaVersion: "legacy-compatible-1.0.0",

  scale04: Object.freeze({
    id: "SCALE_0_4",
    levels: Object.freeze([
      { value: 0, label: "0 — No disponible", description: "No se reporta / no aplica / sin evidencia." },
      { value: 1, label: "1 — Mención mínima", description: "Se menciona superficialmente, sin detalle verificable." },
      { value: 2, label: "2 — Parcial", description: "Hay info parcial; faltan parámetros, método o fuente clara." },
      { value: 3, label: "3 — Completo", description: "Info completa, con método/valores coherentes y fuente." },
      { value: 4, label: "4 — Validado", description: "Completo + validación (campo/monitoreo/modelo/calibración) o evidencia robusta." },
    ]),
  }),

  criteria: Object.freeze([
    { id: "C1", label: "Objetivo", description: "Claridad del objetivo (almacenamiento, calidad, intrusión salina, etc.)." },
    { id: "C2", label: "Condiciones hidrogeológicas", description: "Modelos + parámetros del acuífero y contexto." },
    { id: "C3", label: "Fuente y calidad del agua", description: "Fuente identificada + calidad recarga/acuífero/post-mezcla." },
    { id: "C4", label: "Capacidad y volumen", description: "Capacidad de almacenamiento, volumen/caudales, balances." },
    { id: "C5", label: "Infraestructura y costos", description: "Infraestructura documentada + viabilidad/costo–beneficio." },
    { id: "C6", label: "Socioambiental y regulación", description: "Permisos, impacto ambiental, comunidad/servicios." },
  ]),

  // Tus módulos (IDs alineados a lo que sueles usar: geologico/hidraulico/...)
  modules: Object.freeze([
    {
      id: "geologico",
      label: "Modelo geológico",
      maps: [
        { layerId: "mapa-geologico", label: "Geológico" },
        { layerId: "estructuras-lineamientos", label: "Estructuras/lineamientos" },
        { layerId: "densidad-estructuras-lineamientos", label: "Densidad de estructuras/lineamientos" },
        { layerId: "uso-suelo-cobertura", label: "Uso del suelo y cobertura" },
      ],
    },
    {
      id: "hidraulico",
      label: "Modelo hidráulico",
      maps: [
        { layerId: "drenajes", label: "Drenajes" },
        { layerId: "densidad-drenajes", label: "Densidad de drenajes" },
        { layerId: "nivel-freatico", label: "Nivel freático" },
      ],
    },
    {
      id: "hidrologico",
      label: "Modelo hidrológico",
      maps: [
        { layerId: "recarga", label: "Recarga" },
        { layerId: "precipitacion", label: "Precipitación" },
      ],
    },
    { id: "hidrogeoquimico", label: "Modelo hidrogeoquímico", maps: [] },
    { id: "caracterizacion", label: "Caracterización del acuífero", maps: [{ layerId: "unidades-hidrogeologicas", label: "Unidades (UHG)" }] },
    { id: "fuente", label: "Fuente y calidad del agua", maps: [] },
    { id: "volumen", label: "Capacidad y volumen", maps: [] },
    { id: "infraestructura", label: "Infraestructura", maps: [] },
    { id: "comunidad", label: "Comunidad y regulación", maps: [] },
    { id: "relieve", label: "Relieve y clima", maps: [{ layerId: "pendiente", label: "Pendiente" }] },
  ]),

  // Aliases: por si en tu Fase 1 algunos keys aún tienen / o tildes
  aliases: Object.freeze({
    "Nombre_Formación/Miembro/Grupo/Unidad": "Nombre_Formacion",
    "Descripción_Formación/Miembro/Grupo/Unidad": "Descripcion_Formacion",
    "Profundidad_Formación/Miembro/Grupo/Unidad": "Profundidad_Formacion_m",
    "Escala_mapa_geológico": "Escala_mapa_geologico",
    "Fuente_mapa": "Fuente_mapa",
    "Área_cuenca_km2": "Area_cuenca_km2",
    "Tipo_de_fuente": "tipo_de_fuente",
    "Categoria_calidad_MAR": "categoria_calidad_mar",
    "Cumple_norma_para_uso": "cumple_norma_para_uso",
    "Uso_final_del_agua": "uso_final_del_agua",
    "Relieve_dominante": "relieve_dominante",
    "Clima": "Clima",
    "clima": "Clima",
  }),

  // Indicadores V# (solo los usamos para amarre y “alistamiento”)
  indicators: Object.freeze([
    // Geológico
    { id: "V1", moduleId: "geologico", key: "Nombre_Formacion", label: "Nombre formación/miembro/grupo/unidad" },
    { id: "V2", moduleId: "geologico", key: "Descripcion_Formacion", label: "Descripción de la unidad geológica" },
    { id: "V3", moduleId: "geologico", key: "Profundidad_Formacion_m", label: "Profundidad (m) techo–base" },
    { id: "V4", moduleId: "geologico", key: "Escala_mapa_geologico", label: "Escala del mapa geológico" },
    { id: "V5", moduleId: "geologico", key: "Fuente_mapa", label: "Fuente del mapa" },

    // Hidráulico
    { id: "V6", moduleId: "hidraulico", key: "Unidad_referida", label: "Unidad referida" },
    { id: "V7", moduleId: "hidraulico", key: "Tipo_unidad", label: "Tipo de unidad" },
    { id: "V8", moduleId: "hidraulico", key: "Conductividad_hidraulica_K", label: "Conductividad hidráulica (K)" },
    { id: "V9", moduleId: "hidraulico", key: "Transmisividad_T", label: "Transmisividad (T)" },
    { id: "V10", moduleId: "hidraulico", key: "Coeficiente_almacenamiento_S", label: "Coeficiente de almacenamiento (S)" },
    { id: "V11", moduleId: "hidraulico", key: "Fuente_parametros", label: "Fuente de parámetros" },

    // Hidrológico
    { id: "V12", moduleId: "hidrologico", key: "Cuenca", label: "Cuenca" },
    { id: "V13", moduleId: "hidrologico", key: "Subcuenca_o_rio", label: "Subcuenca o río" },
    { id: "V14", moduleId: "hidrologico", key: "Area_cuenca_km2", label: "Área cuenca (km²)" },
    { id: "V15", moduleId: "hidrologico", key: "Periodo_analisis", label: "Periodo de análisis" },
    { id: "V16", moduleId: "hidrologico", key: "Precipitacion_P", label: "Precipitación (P)" },

    // Hidrogeoquímico
    { id: "V17", moduleId: "hidrogeoquimico", key: "Facies_hidrogeoquimicas", label: "Facies hidrogeoquímicas" },
    { id: "V18", moduleId: "hidrogeoquimico", key: "Parametros_quimicos", label: "Parámetros químicos reportados" },
    { id: "V19", moduleId: "hidrogeoquimico", key: "Calidad_agua_acuifero", label: "Calidad del agua del acuífero" },
    { id: "V20", moduleId: "hidrogeoquimico", key: "Fuente_hidrogeoquimica", label: "Fuente hidrogeoquímica" },

    // Caracterización
    { id: "V21", moduleId: "caracterizacion", key: "UHG_codigo", label: "UHG (UHG-1, UHG-2…)" },
    { id: "V22", moduleId: "caracterizacion", key: "Unidad_geologica_asociada", label: "Unidad geológica asociada" },
    { id: "V23", moduleId: "caracterizacion", key: "Tipo_de_acuifero", label: "Tipo de acuífero", requiredMin: true },
    { id: "V24", moduleId: "caracterizacion", key: "Escala_del_acuifero", label: "Escala del acuífero" },
    { id: "V25", moduleId: "caracterizacion", key: "Porosidad_clase", label: "Porosidad (clase)" },
    { id: "V26", moduleId: "caracterizacion", key: "Permeabilidad_clase", label: "Permeabilidad (clase)" },
    { id: "V27", moduleId: "caracterizacion", key: "Nivel_freatico", label: "Nivel freático" },
    { id: "V28", moduleId: "relieve", key: "Relieve", label: "Relieve" },

    // Fuente y calidad
    { id: "V29", moduleId: "fuente", key: "Tipo_de_fuente", label: "Tipo de fuente de agua", requiredMin: true },
    { id: "V30", moduleId: "fuente", key: "Calidad_agua_recarga", label: "Calidad del agua a recargar", requiredMin: true },
    { id: "V31", moduleId: "fuente", key: "Calidad_post_mezcla", label: "Calidad post-mezcla" },

    // Volumen
    { id: "V32", moduleId: "volumen", key: "Capacidad_almacenamiento", label: "Capacidad de almacenamiento" },
    { id: "V33", moduleId: "volumen", key: "Volumen_recarga", label: "Volumen/caudal de recarga" },

    // Infraestructura
    { id: "V34", moduleId: "infraestructura", key: "Infraestructura_documentada", label: "Infraestructura documentada" },

    // Comunidad / regulación
    { id: "V35", moduleId: "comunidad", key: "Regulacion_permisos_comunidad", label: "Regulación, permisos y comunidad", requiredMin: true },
  ]),

  // Campos extra (no-V#) pero mínimos para tu escenario “poca info”
  extraFields: Object.freeze([
    { moduleId: "comunidad", key: "Uso_final", label: "Uso final del agua", requiredMin: true },
    { moduleId: "relieve", key: "Clima", label: "Clima" },
  ]),

  // Amarres C# ↔ (V# + capas)
  routeA: Object.freeze({
    groups: ROUTE_A_GROUPS,
    variables: ROUTE_A_VARIABLES,
    bindings: Object.freeze({
      C1: Object.freeze({ indicatorIds: Object.freeze([]), mapLayerIds: Object.freeze([]), extraFields: Object.freeze([]) }),

      C2: Object.freeze({
        indicatorIds: Object.freeze([
          "V1","V2","V3","V4","V5",
          "V6","V7","V8","V9","V10","V11",
          "V12","V13","V14","V15","V16",
          "V21","V22","V23","V24","V25","V26","V27","V28",
        ]),
        mapLayerIds: Object.freeze([
          "mapa-geologico","estructuras-lineamientos","densidad-estructuras-lineamientos","uso-suelo-cobertura",
          "drenajes","densidad-drenajes","nivel-freatico",
          "recarga","precipitacion",
          "unidades-hidrogeologicas",
        ]),
        extraFields: Object.freeze([]),
      }),

      C3: Object.freeze({
        indicatorIds: Object.freeze(["V17","V18","V19","V20","V29","V30","V31"]),
        mapLayerIds: Object.freeze([]),
        extraFields: Object.freeze([]),
      }),

      C4: Object.freeze({ indicatorIds: Object.freeze(["V32","V33"]), mapLayerIds: Object.freeze([]), extraFields: Object.freeze([]) }),
      C5: Object.freeze({ indicatorIds: Object.freeze(["V34"]), mapLayerIds: Object.freeze([]), extraFields: Object.freeze([]) }),

      C6: Object.freeze({
        indicatorIds: Object.freeze(["V35"]),
        mapLayerIds: Object.freeze([]),
        extraFields: Object.freeze([
          { moduleId: "comunidad", key: "Uso_final", label: "Uso final del agua", requiredMin: true },
          { moduleId: "relieve", key: "Clima", label: "Clima" },
        ]),
      }),
    }),
  }),
});

// -------------------------
// Helpers lectura (TU estructura)
// -------------------------
function isEmptyValueSimple(v) {
  if (v === null || v === undefined) return true;
  const s = String(v).trim();
  if (!s) return true;
  if (s === "No_reportado" || s === "No reportado") return true;
  return false;
}

function getModuleObj(caseData, moduleId) {
  const phase1Module = caseData?.phase1?.modules?.[moduleId] || null;
  let direct = phase1Module || caseData?.[moduleId] || {};

  if (moduleId === "caracterizacion") {
    const uhg = caseData?.caracterizacion?.uhg_entries;
    if (Array.isArray(uhg) && uhg.length) {
      const merged = { ...(direct || {}) };
      for (const entry of uhg) {
        if (!entry || typeof entry !== "object") continue;
        for (const [key, value] of Object.entries(entry)) {
          if (isEmptyValueSimple(value)) continue;
          if (!(key in merged)) merged[key] = value;
        }
      }
      direct = merged;
    }
  }
  const entries = caseData?.[`${moduleId}_entries`];
  if (Array.isArray(entries) && entries.length) {
    const merged = {};
    for (const entry of entries) {
      if (!entry || typeof entry !== "object") continue;
      for (const [key, value] of Object.entries(entry)) {
        if (isEmptyValueSimple(value)) continue;
        if (!(key in merged)) merged[key] = value;
      }
    }
    if (Object.keys(merged).length) return merged;
  }

  // tu estructura actual
  return direct;
}

function readWithAliases(moduleObj, key) {
  if (!moduleObj || typeof moduleObj !== "object") return "";
  if (key in moduleObj) return moduleObj[key];

  // si key es canónica, busca si existe alguna alias que apunte a ella
  for (const [oldKey, canon] of Object.entries(CATALOG.aliases)) {
    if (canon === key && oldKey in moduleObj) return moduleObj[oldKey];
  }

  // si key es alias, prueba su canónica
  const canon2 = CATALOG.aliases[key];
  if (canon2 && canon2 in moduleObj) return moduleObj[canon2];

  return "";
}

function isEmptyValue(v) {
  if (v === null || v === undefined) return true;
  const s = String(v).trim();
  if (!s) return true;
  // selects típicos
  if (s === "No_reportado" || s === "No reportado") return true;
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

function parseNumber(value) {
  if (value === null || value === undefined) return null;
  const raw = String(value).replace(/,/g, ".");
  const match = raw.match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  const n = Number(match[0]);
  return Number.isFinite(n) ? n : null;
}

function scorePresence(inputsPresent, inputsTotal, mapsPresent, mapsTotal) {
  const total = inputsTotal + mapsTotal;
  if (total === 0) return 0;
  const present = inputsPresent + mapsPresent;
  if (present === 0) return 0;
  if (present < total) return 2;
  if (mapsTotal > 0 && mapsPresent === mapsTotal) return 4;
  return 3;
}

function scoreSelectValue(value, map, defaultScore) {
  if (isEmptyValue(value)) return 0;
  const key = normalizeToken(value);
  if (map && Object.prototype.hasOwnProperty.call(map, key)) return map[key];
  if (map) {
    const normalizedMap = Object.fromEntries(
      Object.entries(map).map(([k, v]) => [normalizeToken(k), v])
    );
    if (Object.prototype.hasOwnProperty.call(normalizedMap, key)) return normalizedMap[key];
  }
  return Number.isFinite(defaultScore) ? defaultScore : 2;
}

function scoreSelectContains(value, tokens) {
  if (isEmptyValue(value)) return 0;
  const hay = normalizeToken(value);
  const hits = (tokens || []).some((t) => hay.includes(normalizeToken(t)));
  return hits ? 4 : 0;
}

function scoreInversePresence(value) {
  if (isEmptyValue(value)) return 3;
  return 1;
}

// -------------------------
// API pública
// -------------------------
export function getIndicatorById(indicatorId) {
  return CATALOG.indicators.find((i) => i.id === indicatorId) || null;
}

export function readIndicatorValue(caseData, indicatorId) {
  const ind = getIndicatorById(indicatorId);
  if (!ind) return { indicator: null, value: "" };
  const moduleObj = getModuleObj(caseData, ind.moduleId);
  const value = readWithAliases(moduleObj, ind.key);
  return { indicator: ind, value: value ?? "" };
}

function readInputValue(caseData, input) {
  const moduleObj = getModuleObj(caseData, input.moduleId);
  return readWithAliases(moduleObj, input.key);
}

function evaluateRouteAVariable(caseData, variable) {
  const inputs = Array.isArray(variable.inputs) ? variable.inputs : [];
  const maps = Array.isArray(variable.maps) ? variable.maps : [];

  const inputValues = inputs.map((inp) => {
    const value = readInputValue(caseData, inp);
    return { ...inp, value, missing: isEmptyValue(value) };
  });

  const inputsPresent = inputValues.filter((v) => !v.missing).length;
  const inputsTotal = inputValues.length;
  let inputsRequired = Number.isFinite(variable.minInputsPresent) ? variable.minInputsPresent : inputsTotal;

  const mapDetails = maps.map((layerId) => {
    const up = caseData?.mapUploads?.[layerId];
    const meta = caseData?.mapMeta?.[layerId] || {};
    const marks = meta?.marks || {};
    const mapDef =
      (CATALOG.modules || [])
        .flatMap((m) => (m.maps || []).map((l) => ({ ...l, moduleId: m.id })))
        .find((l) => l.layerId === layerId) || null;
    const moduleId = mapDef?.moduleId || null;
    const label = mapDef?.label || layerId;
    const selectedLayers = moduleId ? caseData?.mapLayersByModule?.[moduleId] : null;
    const isSelected = Array.isArray(selectedLayers) ? selectedLayers.includes(layerId) : true;
    const hasFile = isSelected && !!(up?.url && up?.name);
    const validated = isSelected && !!(marks?.north && marks?.scale && marks?.legend);
    return { layerId, label, hasFile, validated };
  });

  const mapsPresent = mapDetails.filter((m) => m.hasFile).length;
  const mapsTotal = mapDetails.length;

  if (variable.id === "V9") {
    const studyValue = inputValues.find((v) => v.key === "cap_infiltracion_zona_no_saturada")?.value ?? "";
    const studyToken = normalizeToken(studyValue);
    inputsRequired = studyToken.includes("si") ? 2 : 1;
  }

  const missing = inputsPresent < inputsRequired || mapsPresent < mapsTotal;

  const scoring = variable.scoring || { kind: "presence" };
  const groupImpactRaw = variable.groupImpact || {};
  const groupImpact = {
    G1: Math.max(0, Math.min(1, Number(groupImpactRaw.G1 ?? 1))),
    G2: Math.max(0, Math.min(1, Number(groupImpactRaw.G2 ?? 1))),
    G3: Math.max(0, Math.min(1, Number(groupImpactRaw.G3 ?? 1))),
  };

  const primaryValue = inputValues.find((v) => !v.missing)?.value ?? "";
  const normalizedValue = normalizeToken(primaryValue);
  const fuenteTipo = normalizeToken(readInputValue(caseData, { moduleId: "fuente", key: "tipo_de_fuente" }));
  const isSuperficialSource = fuenteTipo.includes("superficial");

  let scoreByGroup = { G1: 0, G2: 0, G3: 0 };
  let score04 = 0;
  let reason = "";

  if ((variable.id === "V36" || variable.id === "V37") && !isSuperficialSource) {
    return {
      id: variable.id,
      label: variable.label,
      question: variable.question || "",
      criterionId: variable.criterionId,
      inputs: inputValues,
      maps: mapDetails,
      missing: false,
      score04: 0,
      scoreByGroup,
      reason: "no aplica (fuente no superficial)",
      groupImpact,
    };
  }

  const infraestructuraToken = normalizeToken(readInputValue(caseData, { moduleId: "infraestructura", key: "tipo_infraestructura" }));
  const hasNoInfra =
    infraestructuraToken.includes("no hay infraestructura") || infraestructuraToken.includes("sin infraestructura");
  const infraVarIds = new Set(["V26", "V28", "V29", "V32", "V33"]);
  if (hasNoInfra && infraVarIds.has(variable.id)) {
    return {
      id: variable.id,
      label: variable.label,
      question: variable.question || "",
      criterionId: variable.criterionId,
      inputs: inputValues,
      maps: mapDetails,
      missing: false,
      score04: 0,
      scoreByGroup,
      reason: "sin infraestructura existente",
      groupImpact,
    };
  }

  switch (scoring.kind) {
    case "selectByGroup": {
      if (isEmptyValue(primaryValue)) {
        scoreByGroup = { G1: 0, G2: 0, G3: 0 };
      } else {
        const mapByGroup = scoring.mapByGroup || {};
        const normalizedMap = Object.fromEntries(
          Object.entries(mapByGroup).map(([k, v]) => [normalizeToken(k), v])
        );
        const groupScores = normalizedMap[normalizedValue];
        const fallback = Number.isFinite(scoring.defaultScore) ? scoring.defaultScore : 2;
        scoreByGroup = groupScores || { G1: fallback, G2: fallback, G3: fallback };
      }
      scoreByGroup = {
        G1: scoreByGroup.G1 * groupImpact.G1,
        G2: scoreByGroup.G2 * groupImpact.G2,
        G3: scoreByGroup.G3 * groupImpact.G3,
      };
      score04 = (scoreByGroup.G1 + scoreByGroup.G2 + scoreByGroup.G3) / 3;
      if (variable.id === "V8") score04 = Math.round(score04);
      reason = String(primaryValue || "");
      break;
    }
    case "select": {
      const mapped = scoreSelectValue(primaryValue, scoring.map || {}, scoring.defaultScore);
      let adjusted = mapped;
      const reasonParts = [];
      if (primaryValue) reasonParts.push(String(primaryValue));

      if (variable.id === "V11" || variable.id === "V12") {
        const aquiferTypeValue = readInputValue(caseData, { moduleId: "hidraulico", key: "Tipo_unidad" });
        if (!isEmptyValue(aquiferTypeValue)) {
          const aquiferType = normalizeToken(aquiferTypeValue);
          if (aquiferType.includes("acuicludo") || aquiferType.includes("acuifugo")) {
            adjusted = 0;
            reasonParts.push(`tipo acuifero: ${aquiferTypeValue}`);
          } else if (aquiferType.includes("acuitardo")) {
            adjusted = Math.min(adjusted, 3);
            reasonParts.push(`tipo acuifero: ${aquiferTypeValue}`);
          }
        }
      }

      scoreByGroup = {
        G1: adjusted * groupImpact.G1,
        G2: adjusted * groupImpact.G2,
        G3: adjusted * groupImpact.G3,
      };
      score04 = adjusted;
      reason = reasonParts.join(" | ");
      break;
    }
    case "selectContains": {
      const mapped = scoreSelectContains(primaryValue, scoring.tokens || []);
      scoreByGroup = {
        G1: mapped * groupImpact.G1,
        G2: mapped * groupImpact.G2,
        G3: mapped * groupImpact.G3,
      };
      score04 = mapped;
      reason = String(primaryValue || "");
      break;
    }
    case "compareLTE": {
      const a = parseNumber(inputValues[0]?.value);
      const b = parseNumber(inputValues[1]?.value);
      const mapped = a === null || b === null ? 0 : a <= b ? 4 : 1;
      scoreByGroup = {
        G1: mapped * groupImpact.G1,
        G2: mapped * groupImpact.G2,
        G3: mapped * groupImpact.G3,
      };
      score04 = mapped;
      reason = a === null || b === null ? "sin datos" : `${a} <= ${b}`;
      break;
    }
    case "pozosOperativos": {
      const tipo = normalizeToken(inputValues[0]?.value || "");
      const estado = normalizeToken(inputValues[1]?.value || "");
      const esPozo = tipo.includes("pozo");
      let mapped = 0;
      if (esPozo) {
        if (estado === "bueno" || estado === "regular") mapped = 4;
        else if (estado === "malo" || estado === "en desuso") mapped = 2;
        else mapped = 2;
      }
      scoreByGroup = {
        G1: mapped * groupImpact.G1,
        G2: mapped * groupImpact.G2,
        G3: mapped * groupImpact.G3,
      };
      score04 = mapped;
      reason = esPozo ? inputValues[1]?.value || "" : "sin pozos";
      break;
    }
    case "inversePresence": {
      const mapped = scoreInversePresence(primaryValue);
      scoreByGroup = {
        G1: mapped * groupImpact.G1,
        G2: mapped * groupImpact.G2,
        G3: mapped * groupImpact.G3,
      };
      score04 = mapped;
      reason = isEmptyValue(primaryValue) ? "sin limitante" : String(primaryValue || "");
      break;
    }
    case "presence":
    default: {
      const mapped = scorePresence(inputsPresent, inputsRequired, mapsPresent, mapsTotal);
      scoreByGroup = {
        G1: mapped * groupImpact.G1,
        G2: mapped * groupImpact.G2,
        G3: mapped * groupImpact.G3,
      };
      score04 = mapped;
      reason = `${inputsPresent}/${inputsTotal}`;
      break;
    }
  }

  if (variable.id === "V9") {
    const studyValue = inputValues.find((v) => v.key === "cap_infiltracion_zona_no_saturada")?.value ?? "";
    const categoryValue = inputValues.find((v) => v.key === "cap_infiltracion_categoria")?.value ?? "";
    const studyToken = normalizeToken(studyValue);
    const categoryToken = normalizeToken(categoryValue);
    const setScore = (g1, g2, g3, reasonText) => {
      scoreByGroup = { G1: g1, G2: g2, G3: g3 };
      score04 = (g1 + g2 + g3) / 3;
      reason = reasonText || categoryValue || studyValue || reason;
    };
    if (studyToken.includes("si") || categoryToken) {
      if (categoryToken.includes("muy alta")) {
        setScore(3, 0, 4, categoryValue);
      } else if (categoryToken.includes("alta")) {
        setScore(4, 1, 4, categoryValue);
      } else if (categoryToken.includes("media") || categoryToken.includes("moderad")) {
        setScore(3, 1, 3, categoryValue);
      } else if (categoryToken.includes("baja")) {
        setScore(2, 1, 1, categoryValue);
      } else if (categoryToken.includes("no evaluado") || categoryToken.includes("no evaluada")) {
        setScore(0, 0, 0, categoryValue);
      }
    } else if (studyToken.includes("no")) {
      setScore(0, 0, 0, studyValue);
    }
  }

  if (variable.id === "V36" || variable.id === "V37") {
    const impacted = [
      groupImpact.G1 > 0 ? scoreByGroup.G1 : null,
      groupImpact.G2 > 0 ? scoreByGroup.G2 : null,
      groupImpact.G3 > 0 ? scoreByGroup.G3 : null,
    ].filter((v) => Number.isFinite(v));
    score04 = impacted.length ? impacted.reduce((acc, v) => acc + v, 0) / impacted.length : 0;
  }

  if (variable.id === "V23") {
    reason = String(primaryValue || "");
  }

  if (variable.id === "V25" && scoring.kind !== "selectByGroup") {
    const normalized = normalizeToken(primaryValue);
    const adjusted = isEmptyValue(primaryValue) || normalized == "no evaluado" ? 0 : 4;
    scoreByGroup = {
      G1: adjusted * groupImpact.G1,
      G2: adjusted * groupImpact.G2,
      G3: adjusted * groupImpact.G3,
    };
    score04 = adjusted;
    reason = String(primaryValue || "");
  }

  if (variable.id === "V2") {
    const total = inputsTotal + mapsTotal;
    const present = inputsPresent + mapsPresent;
    let adjusted = 0;
    if (total > 0) {
      if (present === 0) adjusted = 0;
      else if (present === total) adjusted = 4;
      else {
        const ratio = present / total;
        if (ratio >= 0.75) adjusted = 3;
        else if (ratio >= 0.5) adjusted = 2;
        else adjusted = 1;
      }
    }

    scoreByGroup = {
      G1: adjusted * groupImpact.G1,
      G2: adjusted * groupImpact.G2,
      G3: adjusted * groupImpact.G3,
    };
    score04 = adjusted;
    reason = `${present}/${total}`;
  }

  if (variable.id === "V4") {
    const pRaw = readInputValue(caseData, { moduleId: "hidrologico", key: "p_med_anual_mm" });
    const qRaw = readInputValue(caseData, { moduleId: "hidrologico", key: "q_med_anual_m3s" });
    const hasP = !isEmptyValue(pRaw);
    const hasQ = !isEmptyValue(qRaw);

    let adjusted = 0;
    if (mapsPresent === 0 && !hasP && !hasQ) {
      adjusted = 0;
    } else if (mapsPresent >= 1 && hasP && hasQ) {
      adjusted = mapsPresent === mapsTotal ? 4 : 3;
    } else if (mapsPresent >= 1 && (hasP || hasQ)) {
      adjusted = 2;
    } else {
      adjusted = 0;
    }

    scoreByGroup = {
      G1: adjusted * groupImpact.G1,
      G2: adjusted * groupImpact.G2,
      G3: adjusted * groupImpact.G3,
    };
    score04 = adjusted;

    const reasonParts = [];
    if (hasP) reasonParts.push(`P: ${pRaw}`);
    if (hasQ) reasonParts.push(`Q: ${qRaw}`);
    reasonParts.push(`mapas: ${mapsPresent}/${mapsTotal}`);
    reason = reasonParts.join(" | ");
  }

  if (variable.id === "V5") {
    const tipoRaw = readInputValue(caseData, { moduleId: "hidraulico", key: "Tipo_unidad" });
    const poroRaw = readInputValue(caseData, { moduleId: "hidraulico", key: "porosidad" });
    const permRaw = readInputValue(caseData, { moduleId: "hidraulico", key: "permeabilidad" });
    const condRaw = readInputValue(caseData, { moduleId: "hidraulico", key: "conductividad_hidraulica_k" });
    const transRaw = readInputValue(caseData, { moduleId: "hidraulico", key: "transmisividad_t" });

    const scoreFromRange = (raw) => {
      if (isEmptyValue(raw)) return null;
      const token = normalizeToken(raw);
      if (
        token.includes("muy alta") ||
        token.includes("muy alto") ||
        token.includes("muy buena") ||
        token.includes("muy bueno") ||
        token.includes("buena") ||
        token.includes("bueno")
      ) {
        return 4;
      }
      if (token.includes("alta") || token.includes("alto")) return 3;
      if (token.includes("regular") || token.includes("media") || token.includes("medio")) return 2;
      if (token.includes("muy baja") || token.includes("baja") || token.includes("mala")) return 1;
      const numeric = parseNumber(raw);
      if (numeric !== null) return 2;
      return null;
    };

    const poroScore = scoreFromRange(poroRaw);
    const permScore = scoreFromRange(permRaw);
    const condScore = scoreFromRange(condRaw);
    const transScore = scoreFromRange(transRaw);
    const scoreList = [poroScore, permScore, condScore, transScore].filter((v) => Number.isFinite(v));

    let adjusted = scoreList.length
      ? Math.round(scoreList.reduce((acc, v) => acc + v, 0) / scoreList.length)
      : 0;

    if (mapsTotal > 0 && mapsPresent < mapsTotal && adjusted === 4) {
      adjusted = 3;
    }

    scoreByGroup = {
      G1: adjusted * groupImpact.G1,
      G2: adjusted * groupImpact.G2,
      G3: adjusted * groupImpact.G3,
    };
    score04 = adjusted;

    const reasonParts = [];
    if (!isEmptyValue(tipoRaw)) reasonParts.push(`tipo unidad: ${tipoRaw}`);
    if (!isEmptyValue(poroRaw)) reasonParts.push(`porosidad: ${poroRaw}`);
    if (!isEmptyValue(permRaw)) reasonParts.push(`permeabilidad: ${permRaw}`);
    if (!isEmptyValue(condRaw)) reasonParts.push(`K: ${condRaw}`);
    if (!isEmptyValue(transRaw)) reasonParts.push(`T: ${transRaw}`);
    if (mapsTotal > 0) reasonParts.push(`mapas: ${mapsPresent}/${mapsTotal}`);
    reason = reasonParts.join(" | ");
  }

  if (variable.id === "V6") {
    const readNum = (key) => parseNumber(readInputValue(caseData, { moduleId: "hidrogeoquimico", key }));
    const faciesRaw = readInputValue(caseData, { moduleId: "hidrogeoquimico", key: "facies_hidroquimica_descriptiva" });

    const scoreByLimit = (value, limit) => {
      if (value === null) return null;
      if (value <= limit) return 4;
      if (value <= limit * 1.5) return 3;
      if (value <= limit * 2) return 2;
      if (value <= limit * 3) return 1;
      return 0;
    };

    const scoreByPh = (value) => {
      if (value === null) return null;
      if (value >= 6.5 && value <= 9.0) return 4;
      if (value >= 6.0 && value <= 9.5) return 3;
      if (value >= 5.5 && value <= 10.0) return 2;
      if (value >= 5.0 && value <= 10.5) return 1;
      return 0;
    };

    const paramScores = [
      scoreByPh(readNum("ph")),
      scoreByLimit(readNum("tds_mgL"), 500),
      scoreByLimit(readNum("ce_uScm"), 1000),
      scoreByLimit(readNum("ca_mgL"), 60),
      scoreByLimit(readNum("mg_mgL"), 36),
      scoreByLimit(readNum("k_mgL"), 10),
      scoreByLimit(readNum("na_mgL"), 200),
      scoreByLimit(readNum("cl_mgL"), 250),
      scoreByLimit(readNum("so4_mgL"), 250),
      scoreByLimit(readNum("hco3_mgL"), 250),
      scoreByLimit(readNum("no3_mgL"), 10),
    ].filter((v) => Number.isFinite(v));

    const faciesScore = isEmptyValue(faciesRaw) ? null : 4;
    const allScores = faciesScore !== null ? [...paramScores, faciesScore] : paramScores;
    const avg =
      allScores.length === 0
        ? 0
        : allScores.reduce((acc, v) => acc + v, 0) / allScores.length;
    const adjusted = Math.max(0, Math.min(4, Math.round(avg)));

    scoreByGroup = {
      G1: adjusted * groupImpact.G1,
      G2: adjusted * groupImpact.G2,
      G3: adjusted * groupImpact.G3,
    };
    score04 = adjusted;

    reason = allScores.length ? `promedio: ${avg.toFixed(2)}` : "sin datos";
  }

  return {
    id: variable.id,
    label: variable.label,
    question: variable.question || "",
    criterionId: variable.criterionId,
    inputs: inputValues,
    maps: mapDetails,
    missing,
    score04,
    scoreByGroup,
    reason,
    groupImpact,
  };
}

export function evaluateRouteAVariables(caseData) {
  const vars = CATALOG?.routeA?.variables || [];
  return vars.map((v) => evaluateRouteAVariable(caseData, v));
}

export function computeRouteAScores(caseData, weights) {
  const variables = evaluateRouteAVariables(caseData);
  const groups = CATALOG?.routeA?.groups || [];
  const criteria = CATALOG?.criteria || [];

  const weightMap = weights || {};
  const weightSum = criteria.reduce((acc, c) => acc + (Number(weightMap[c.id]) || 0), 0);
  const defaultWeight = criteria.length ? 1 / criteria.length : 0;

  const byCriterion = {};
  for (const c of criteria) byCriterion[c.id] = { ...c, variables: [] };
  for (const v of variables) {
    if (!byCriterion[v.criterionId]) continue;
    byCriterion[v.criterionId].variables.push(v);
  }

  const groupScores = {};
  for (const g of groups) groupScores[g.id] = 0;

  for (const c of criteria) {
    const vars = byCriterion[c.id]?.variables || [];
    const weight = weightSum > 0 ? (Number(weightMap[c.id]) || 0) / weightSum : defaultWeight;

    for (const g of groups) {
      let sumScore = 0;
      let sumImpact = 0;
      for (const v of vars) {
        const impact = v.groupImpact?.[g.id] ?? 1;
        sumScore += (v.scoreByGroup?.[g.id] ?? 0);
        sumImpact += impact;
      }
      const criterionScore = sumImpact > 0 ? sumScore / sumImpact : 0;
      groupScores[g.id] += criterionScore * weight;
    }
  }

  const finalScores = {};
  for (const g of groups) {
    const total04 = groupScores[g.id] ?? 0;
    finalScores[g.id] = Math.round((total04 / 4) * 1000) / 10;
  }

  const limitantes = {};
  for (const g of groups) {
    limitantes[g.id] = variables.filter((v) => (v.scoreByGroup?.[g.id] ?? 0) <= 1 && (v.groupImpact?.[g.id] ?? 0) >= 0.6);
  }

  return {
    variables,
    criteria: byCriterion,
    groups,
    finalScores,
    limitantes,
  };
}
// -------------------------
// MÍNIMOS (escenario poca info) — tus 5 obligatorios
// -------------------------
export const MIN_REQUIRED = Object.freeze([
  { moduleId: "hidraulico", key: "Tipo_unidad", label: "Tipo de acuifero", kind: "select" },
  { moduleId: "fuente", key: "tipo_de_fuente", label: "Fuente de agua", kind: "select" },
  { moduleId: "fuente", key: "categoria_calidad_mar", label: "Calidad del agua fuente", kind: "select" },
  { moduleId: "fuente", key: "cumple_norma_para_uso", label: "Normativa para la recarga", kind: "select" },
  { moduleId: "comunidad", key: "uso_final_del_agua", label: "Uso final", kind: "select" },
]);

export function validateMinimumScenario(caseData) {
  const missing = [];
  for (const f of MIN_REQUIRED) {
    const moduleObj = getModuleObj(caseData, f.moduleId);
    const v = readWithAliases(moduleObj, f.key);

    const ok =
      f.kind === "select"
        ? !isEmptyValue(v)
        : String(v ?? "").trim().length > 0;

    if (!ok) missing.push(f);
  }
  return { ok: missing.length === 0, missing };
}

// -------------------------
// computeBindingStatus — ESTE ES EL NÚCLEO (rombos + detalle)
// -------------------------
export function computeBindingStatus(caseData, criterionId) {
  const routeAVars = CATALOG?.routeA?.variables || [];
  if (routeAVars.length) {
    const vars = routeAVars.filter((v) => v.criterionId === criterionId);
    const details = [];
    let present = 0;
    const total = vars.length;

    for (const v of vars) {
      const evalV = evaluateRouteAVariable(caseData, v);
      if (!evalV.missing) present += 1;

      details.push({
        kind: "variable",
        id: evalV.id,
        label: evalV.label,
        missing: evalV.missing,
        value: evalV.reason || "",
        score04: evalV.score04,
      });
    }

    const ratio = total === 0 ? 1 : present / total;
    let score04 = 0;
    if (ratio === 0) score04 = 0;
    else if (ratio < 0.25) score04 = 1;
    else if (ratio < 0.65) score04 = 2;
    else if (ratio < 1) score04 = 3;
    else score04 = 4;

    const missingItems = details.filter((d) => d.missing).map((d) => d.label);

    return { ok: true, score04, present, total, missingItems, details };
  }

  const bind = CATALOG?.routeA?.bindings?.[criterionId];
  if (!bind) return { ok: false, score04: 0, present: 0, total: 0, missingItems: [], details: [] };

  const details = [];
  let present = 0;
  let total = 0;

  // 1) Indicadores
  for (const id of bind.indicatorIds || []) {
    total += 1;
    const { indicator, value } = readIndicatorValue(caseData, id);
    const missing = isEmptyValue(value);
    if (!missing) present += 1;

    details.push({
      kind: "indicator",
      id,
      label: indicator?.label || id,
      moduleId: indicator?.moduleId || "",
      key: indicator?.key || "",
      missing,
      value,
      requiredMin: !!indicator?.requiredMin,
    });
  }

  // 2) Extras (Uso_final, Clima)
  for (const ef of bind.extraFields || []) {
    total += 1;
    const moduleObj = getModuleObj(caseData, ef.moduleId);
    const value = readWithAliases(moduleObj, ef.key);
    const missing = isEmptyValue(value);
    if (!missing) present += 1;

    details.push({
      kind: "extra",
      id: `${ef.moduleId}.${ef.key}`,
      label: ef.label,
      moduleId: ef.moduleId,
      key: ef.key,
      missing,
      value,
      requiredMin: !!ef.requiredMin,
    });
  }

  // 3) Mapas — desde TU estructura actual (mapUploads/mapMeta)
  for (const layerId of bind.mapLayerIds || []) {
    total += 1;

    const up = caseData?.mapUploads?.[layerId];      // {name,url,type}
    const meta = caseData?.mapMeta?.[layerId] || {}; // {scaleText, confirmedLayer, marks...}

    const hasFile = !!up?.url && !!up?.name;
    const missing = !hasFile;
    if (!missing) present += 1;

    const marks = meta?.marks || {};
    const validated = !!(marks?.north && marks?.scale && marks?.legend); // simple

    details.push({
      kind: "map",
      id: layerId,
      label: meta?.expectedLayerLabel || layerId,
      missing,
      fileName: up?.name || "",
      validated,
      validation: {
        hasNorth: !!marks?.north,
        hasScale: !!marks?.scale,
        hasLegend: !!marks?.legend,
        scaleText: meta?.scaleText || "",
        confirmedLayer: !!meta?.confirmedLayer,
      },
    });
  }

  const ratio = total === 0 ? 1 : present / total;

  // score 0–4 (alistamiento)
  let score04 = 0;
  if (ratio === 0) score04 = 0;
  else if (ratio < 0.25) score04 = 1;
  else if (ratio < 0.65) score04 = 2;
  else if (ratio < 1) score04 = 3;
  else score04 = 4;

  const missingItems = details.filter((d) => d.missing).map((d) => d.label);

  return { ok: true, score04, present, total, missingItems, details };
}

// ============================================================================
// ✅ AJUSTE NECESARIO: NORMALIZADOR (lo requiere useCasesStore.js)
// - Evita que Metodología se caiga por falta de export
// - Hace compatible tu estructura "id" con store que usa "caseId"
// ============================================================================

export function normalizeCaseData(raw) {
  const c = raw && typeof raw === "object" ? { ...raw } : {};

  // store usa caseId; tu Fase 1 usa id -> los unificamos
  const unifiedId = c.caseId || c.id || null;
  if (unifiedId) {
    c.caseId = unifiedId;
    c.id = c.id || unifiedId;
  }

  // nombres básicos
  if (typeof c.nombre !== "string") c.nombre = c.nombre ? String(c.nombre) : "";
  if (typeof c.usuario !== "string") c.usuario = c.usuario ? String(c.usuario) : "";
  if (typeof c.ubicacion !== "string") c.ubicacion = c.ubicacion ? String(c.ubicacion) : "";

  // mapas (estructura que usas en Fase 1)
  if (!c.mapUploads || typeof c.mapUploads !== "object") c.mapUploads = {};
  if (!c.mapMeta || typeof c.mapMeta !== "object") c.mapMeta = {};
  if (!c.mapLayersByModule || typeof c.mapLayersByModule !== "object") c.mapLayersByModule = {};

  // asegurar módulos raíz (geologico, hidraulico, etc.)
  for (const mod of CATALOG.modules) {
    const mid = mod.id;
    if (!c.phase1?.modules?.[mid]) {
      if (!c[mid] || typeof c[mid] !== "object") c[mid] = {};
    }
    if (!Array.isArray(c.mapLayersByModule[mid])) c.mapLayersByModule[mid] = [];
  }

  // completar mapMeta y auto-seleccionar capas cuando hay archivo
  for (const mod of CATALOG.modules) {
    for (const m of mod.maps || []) {
      const layerId = m.layerId;
      const up = c.mapUploads?.[layerId];

      // meta por defecto
      if (!c.mapMeta[layerId] || typeof c.mapMeta[layerId] !== "object") c.mapMeta[layerId] = {};
      const meta = c.mapMeta[layerId];

      if (!meta.marks || typeof meta.marks !== "object") meta.marks = {};
      meta.marks = {
        north: meta.marks.north ?? null,
        scale: meta.marks.scale ?? null,
        legend: meta.marks.legend ?? null,
        polygon: meta.marks.polygon ?? null,
      };

      meta.confirmedLayer = !!meta.confirmedLayer;
      meta.scaleText = typeof meta.scaleText === "string" ? meta.scaleText : "";
      meta.expectedLayerLabel =
        typeof meta.expectedLayerLabel === "string" && meta.expectedLayerLabel.trim()
          ? meta.expectedLayerLabel
          : (m.label || layerId);

      // si ya hay archivo cargado -> dejar seleccionada la capa del módulo
      const hasFile = !!(up?.url && up?.name);
      if (hasFile && !c.mapLayersByModule[mod.id].includes(layerId)) {
        c.mapLayersByModule[mod.id].push(layerId);
      }
    }
  }

  return c;
}



