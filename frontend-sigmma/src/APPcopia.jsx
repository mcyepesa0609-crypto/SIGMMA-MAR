// App.jsx
import React, { useState, useMemo, useEffect, useCallback, useRef } from "react"; 
import "./App.css";
import { TECH_GROUPS } from "./marTechniques";
import Phase2Intro from "./Phase2Intro.jsx";// ajusta la ruta según tu carpeta
import { CATALOG } from "./catalog/catalog.js";
import Phase2RouteA from "./Phase2RouteA.jsx";
import { useCasesStore } from "./store/useCasesStore.js";
import { validateMinimumScenario } from "./catalog/catalog.js";

/* =========================================================
   MAPA DE ÍCONOS
========================================================= */
/* Grupos 1 y 2 por ID */
const TECH_ICON_BY_ID = {
  // Grupo 1 – Intervención de corrientes superficiales
  "1.1": "/images/Presas_de_recarga.png",
  "1.2": "/images/Presas_subterraneas.png",
  "1.3": "/images/Presas_de_arena.png",
  "1.4": "/images/Filtracion_de_ribera.png",

  // Grupo 2 – Pozos y perforaciones
  "2.1": "/images/ASR.png",
  "2.2": "/images/ASTR.png",
  "2.3": "/images/Pozos_secos.png",
};

/* Grupo 3 por NOMBRE de la técnica */
const TECH_ICON_BY_NAME = {
  "Estanques y cuencas de infiltración": "/images/Estanque_infiltración.png",
  "Tratamiento suelo - acuífero": "/images/SAT.png",
  "Tratamiento suelo–acuífero": "/images/SAT.png",
  "Tratamiento suelo–acuífero (SAT)": "/images/SAT.png",
  "Tratamiento suelo-acuífero": "/images/SAT.png",
  "Tratamiento suelo-acuífero (SAT)": "/images/SAT.png",
  "Galerías de infiltración": "/images/Galerias_infiltracion.png",
  "Inundaciones controladas": "/images/Inundaciones_controladas.png",
  "Exceso de riego": "/images/Exceso_de_irrigacion.png",
  "Filtración de dunas": "/images/Dunas_de_infiltracion.png",
  "Captación de agua lluvia": "/images/Lluvia.png",
};

/* Helper: primero busca por nombre (grupo 3), si no, por id (grupos 1–2) */
function getTechniqueIcon(tech) {
  if (!tech) return null;
  if (TECH_ICON_BY_NAME[tech.name]) return TECH_ICON_BY_NAME[tech.name];
  if (TECH_ICON_BY_ID[tech.id]) return TECH_ICON_BY_ID[tech.id];
  return null;
}

function MapViewer({
  layer,
  upload,
  meta,
  marks,
  missing,
  isReadOnlyCase,
  previewSrc,
  canShow,
  moduleIdForSelection,
  onUpdateMeta,
  onUploadMap,
  onRemoveMap,
  ImageMarkerComponent,
}) {
  return (
    <div className="insumos-map-viewer">
      <div className="insumos-map-viewer-inner">
        <p className="insumos-map-viewer-caption">
          Vista previa de la capa: <strong>{layer?.label || ""}</strong>.
        </p>

        {!layer ? (
          <p className="text-muted">No hay capa activa.</p>
        ) : upload?.name ? (
          canShow ? (
            <>
              <label className="insumos-map-check" style={{ display: "block", marginBottom: 10 }}>
                <input
                  type="checkbox"
                  checked={!!meta?.confirmedLayer}
                  disabled={isReadOnlyCase}
                  onChange={(e) => onUpdateMeta({ confirmedLayer: e.target.checked })}
                />
                {"  "}
                Confirmo que este archivo corresponde a la capa: <strong>{layer.label}</strong>
              </label>

              <div className="insumos-map-scale-row" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 12, opacity: 0.85 }}>Escala (texto):</span>
                <input
                  className="insumos-map-scale-input"
                  type="text"
                  placeholder="Ej: 1:25.000"
                  value={meta?.scaleText || ""}
                  disabled={isReadOnlyCase}
                  onChange={(e) => onUpdateMeta({ scaleText: e.target.value })}
                  style={{ flex: 1 }}
                />
              </div>

              {ImageMarkerComponent ? (
                <ImageMarkerComponent src={previewSrc} layerId={layer.id} meta={meta} disabled={isReadOnlyCase} />
              ) : null}
            </>
          ) : (
            <div className="insumos-map-empty">
              Archivo cargado: <strong>{upload.name}</strong>
              <div style={{ marginTop: 8, fontSize: 12, opacity: 0.85 }}>
                Este archivo no permite marcacion. Para validar y exportar, sube una version <strong>PNG/JPG</strong>.
              </div>
              {upload.url && (
                <div style={{ marginTop: 8 }}>
                  <a href={upload.url} target="_blank" rel="noreferrer">
                    Abrir archivo en nueva pestaña
                  </a>
                </div>
              )}
            </div>
          )
        ) : (
          <div className="insumos-map-empty">No hay archivo cargado para esta capa.</div>
        )}

        {layer && (
          <div className="insumos-map-upload-box">
            <div className="insumos-map-upload-title">Mapas relacionados</div>

            <div className="insumos-map-upload-row">
              <input
                type="file"
                accept="image/*,application/pdf,.tif,.tiff,.zip"
                className="insumos-map-file"
                disabled={isReadOnlyCase}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onUploadMap(layer.id, f, moduleIdForSelection, layer.label);
                  e.target.value = "";
                }}
              />

              <div className="insumos-map-upload-status">
                {upload?.name ? (
                  <>
                    Cargado: <strong>{upload.name}</strong>
                    {upload?.meta?.downscaled ? (
                      <span style={{ marginLeft: 10, fontSize: 12, opacity: 0.85 }}>
                        ✓ Optimizado ({upload.meta.origW}x{upload.meta.origH} → {upload.meta.outW}x{upload.meta.outH})
                      </span>
                    ) : null}
                  </>
                ) : (
                  <>Sin archivo cargado</>
                )}
              </div>

              {upload?.name && (
                <button type="button" className="insumos-map-remove-btn" disabled={isReadOnlyCase} onClick={() => onRemoveMap(layer.id)}>
                  Quitar
                </button>
              )}
            </div>

            {layer && upload?.name && missing?.length > 0 && (
              <div className="insumos-map-missing" style={{ marginTop: 10 }}>
                Falta completar: <strong>{missing.join(", ")}</strong>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   PANEL DE INSUMOS (FASE 1)
========================================================= */
const INSUMOS_MODULES = [
  {
    id: "geologico",
    label: "Modelo Geológico",
    icon: "⛰️",
    colorClass: "mod-geologico",
    phase: "Fase 1 (Insumos)",
    definition:
      "Representación espacial 2D/3D del subsuelo que integra la distribución y espesor de unidades geológicas, estructuras (fallas, pliegues) y propiedades petrofísicas que controlan el comportamiento hidrogeológico, mediante interpretación integrada de correlaciones estratigráficas, ambientes de depósito, análisis estructural y estudios geofísicos.",
  },
  {
    id: "hidraulico",
    label: "Modelo Hidráulico",
    icon: "💧",
    colorClass: "mod-hidraulico",
    phase: "Fase 1 (Insumos)",
    definition:
      "Representación cuantitativa del comportamiento hidráulico del acuífero, basada en la estimación de parámetros como conductividad hidráulica (K), transmisividad (T), coeficiente de almacenamiento (S) y porosidad, asignados a unidades geológicas o zonas del acuífero a partir de ensayos de campo, laboratorio y/o literatura.",
  },
  {
    id: "hidrologico",
    label: "Modelo Hidrológico",
    icon: "🌧️",
    colorClass: "mod-hidrologico",
    phase: "Fase 1 (Insumos)",
    definition:
      "Representación cuantitativa (modelo o análisis de balance) de procesos del ciclo hidrológico en la cuenca (precipitación, evapotranspiración, escorrentía, infiltración) que transforma lluvia en caudales y genera series temporales en puntos de control relevantes (ríos, quebradas, canales).",
  },
  {
    id: "hidrogeoquimico",
    label: "Modelo Hidrogeoquímico",
    icon: "🧪",
    colorClass: "mod-hidrogeoquimico",
    phase: "Fase 1 (Insumos)",
    definition:
      "Caracterización hidrogeoquímica del agua subterránea y de fuentes potenciales de recarga mediante análisis fisicoquímicos y microbiológicos básicos, clasificación de tipos de agua (Piper/Stiff) e identificación de procesos dominantes; opcionalmente se complementa con modelos de especiación y mezcla.",
  },
  {
    id: "caracterizacion",
    label: "Caracterización del acuífero",
    icon: "📌",
    colorClass: "mod-caracterizacion",
    phase: "Fase 1 (Insumos)",
    definition:
      "Síntesis integrada del sistema acuífero a partir de los modelos geológico, hidráulico, hidrológico e hidrogeoquímico, que define ubicación y extensión, geometría y espesores saturados, límites hidrogeológicos, tipo de acuífero (libre/semiconfinado/confinado) y parámetros representativos (T, K, S).",
  },
  {
    id: "fuente",
    label: "Fuente de agua",
    icon: "🚰",
    colorClass: "mod-fuente",
    phase: "Fase 1 (Insumos)",
    definition:
      "Cuerpos de agua o corrientes superficiales, aguas residuales tratadas o aguas subterráneas potenciales para recarga, integrando disponibilidad (volumen/caudal básico) y calidad relevante. Incluye evaluación fisicoquímica y microbiológica básica (pH, CE, TDS, iones mayores, coliformes, E. coli) y síntesis normativa aplicable para la calidad del agua a recargar.",
  },
  {
    id: "volumen",
    label: "Volumen - capacidad",
    icon: "📊",
    colorClass: "mod-volumen",
    phase: "Fase 1 (Insumos)",
    definition:
      "Cuantificación del volumen disponible en las fuentes identificadas considerando variabilidad temporal (seco–húmedo–normal) y de la capacidad volumétrica del acuífero para almacenar agua sin impactos negativos, estimada con geometría del sistema, niveles freáticos y parámetros de almacenamiento.",
  },
  {
    id: "infraestructura",
    label: "Infraestructura",
    icon: "🏗️",
    colorClass: "mod-infraestructura",
    phase: "Fase 1 (Insumos)",
    definition:
      "Inventario y síntesis de la infraestructura hidráulica presente (pozos, embalses, canales, estanques, zanjas, plantas de tratamiento de agua potable y residual), registrando ubicación, uso actual y estado.",
  },
  {
    id: "comunidad",
    label: "Comunidad - uso final",
    icon: "👥",
    colorClass: "mod-comunidad",
    phase: "Fase 1 (Insumos)",
    definition:
      "Caracterización sociodemográfica y de usos del agua en el área de influencia (asentamientos, población, actividades económicas, tipos de usuarios, percepción del proyecto) y definición del uso final del agua (doméstico, agrícola, industrial, ambiental o combinaciones).",
  },
  {
    id: "relieve",
    label: "Relieve - clima",
    icon: "⛰️",
    colorClass: "mod-relieve",
    phase: "Fase 1 (Insumos)",
    definition:
      "Caracterización del relieve según forma del terreno (altitud relativa, pendiente, disección) para clasificar el entorno en Llanura, Valle, Colina/meseta o Montaña, y caracterización climática (Köppen) identificando tipo dominante y régimen básico de lluvias relevante para MAR.",
  },
];

/* ===================== MAPAS POR MÓDULO (SEGÚN TU LISTA) ===================== */
const MAP_LAYERS_BY_MODULE = {
  geologico: [
    { id: "mapa-geologico", label: "Geologico", preview: "/images/mapa_geologico.png" },
    { id: "estructuras-lineamientos", label: "Estructuras / lineamientos", preview: "/images/mapa_estructuras_lineamientos.png" },
    { id: "densidad-estructuras-lineamientos", label: "Densidad de estructuras/lineamientos", preview: "/images/mapa_densidad_estructuras_lineamientos.png" },
    { id: "uso-suelo-cobertura", label: "Uso del suelo y cobertura", preview: "/images/mapa_uso_suelo_cobertura.png" },
  ],
  hidraulico: [
    { id: "drenajes", label: "Drenajes", preview: "/images/mapa_drenajes.png" },
    { id: "densidad-drenajes", label: "Densidad de drenajes", preview: "/images/mapa_densidad_drenajes.png" },
    { id: "nivel-freatico", label: "Nivel freatico", preview: "/images/mapa_nivel_freatico.png" },
  ],
  hidrologico: [
    { id: "recarga", label: "Recarga", preview: "/images/mapa_recarga.png" },
    { id: "precipitacion", label: "Precipitacion", preview: "/images/mapa_precipitacion.png" },
  ],
  hidrogeoquimico: [],
  caracterizacion: [
    { id: "unidades-hidrogeologicas", label: "Unidades hidrogeologicas", preview: "/images/mapa_unidades_hidrogeologicas.png" },
  ],
  fuente: [],
  volumen: [],
  infraestructura: [],
  comunidad: [],
  relieve: [{ id: "pendiente", label: "Pendiente", preview: "/images/mapa_pendiente.png" }],
};

function getCustomLayersByModule(caseObj, moduleId) {
  const list = caseObj?.mapCustomLayersByModule?.[moduleId];
  return Array.isArray(list) ? list : [];
}

function getAllLayersByModule(caseObj, moduleId) {
  const base = MAP_LAYERS_BY_MODULE[moduleId] || [];
  const custom = getCustomLayersByModule(caseObj, moduleId);
  return [...base, ...custom];
}

/* ===================== CAMPOS POR MODULO (con help) ===================== */
const MODULE_FIELDS = {
  geologico: [
    {
      name: "nombre_unidad_geologica",
      label: "Nombre (Formación / Miembro / Grupo / Unidad)",
      help:
        "Indique el nombre oficial de la unidad litoestratigráfica dominante donde se localiza el sistema acuifero evaluado (p. ej., Formación Tilata)",
    },
    {
      name: "descripcion_unidad_geologica",
      label: "Descripción (Formación / Miembro / Grupo / Unidad)",
      type: "textarea",
      help:
        "Elabore un resumen de máximo 200 palabras que sintetice la litología, edad, ambiente de depósito y un elemento complementario",
    },
    {
      name: "profundidad_unidad_geologica_m",
      label: "Profundidad (techo-base, m)",
      help:
        "Indique el rango de profundidad (techo y base) en metros donde se localiza la unidad (p. ej., 30–80 m). En caso de no contar con el rango, registre la profundidad media o el espesor estimado de la unidad en el area de estudio.",
    },
    {
      name: "escala_mapa_geologico",
      label: "Escala del mapa geologico",
      help: "Escala cartográfica del mapa usado como referencia (p. ej., 1:25.000, 1:50.000, 1:100.000).",
    },
    {
      name: "fuente_mapa_geologico",
      label: "Fuente",
      help: "Referencia del documento base, mapa geológico o estudio de procedencia (p. ej., Yepes, 2025).",
    },
  ],

  hidraulico: [
    {
      name: "unidad_referida",
      label: "Unidad_referida",
      help:
        "Nombre de la unidad litoestratigráfica (Formación, Miembro o Grupo) o sector específico (p. ej., Zona saturada profunda o Formación Guayabo) al cual se le adjudican los parámetros hidráulicos obtenidos.",
    },

    {
      name: "Tipo_unidad",
      label: "Tipo_unidad",
      type: "select",
      options: ["Libre", "Semiconfinado - confinado"],
      help: "Clasificación del acuífero según su comportamiento hidráulico y la presión a la que se encuentra el agua en su interior. Seleccione la categoráa que mejor describa la unidad evaluada.",
    },

    {
      name: "conductividad_hidraulica_k",
      label: "Conductividad_hidraulica_K (m/dia)",
      help: "Es la capacidad del medio para dejar pasar el agua (m/día).",
    },

    {
      name: "transmisividad_t",
      label: "Transmisividad_T (m2/dia)",
      help: "Indica cuánta agua puede transmitir el acuífero en todo su espesor saturado (T = K * b). Se mide en m²/día",
    },

    {
      name: "coeficiente_almacenamiento_s",
      label: "Coeficiente_de_almacenamiento_S (S o Sy)",
      help: "Define el volumen de agua que el acuífero libera o incorpora por unidad de área y variación de nivel.",
    },

    {
      name: "porosidad",
      label: "Porosidad",
      type: "select",
      options: ["Muy alta (>50%)", "Alta (30-50%)", "Regular (10-30%)", "Mala (0-10%)"],
      help: "Fracción de vacíos en la roca (%). La porosidad efectiva es la que realmente permite el flujo de agua y determina la capacidad de almacenamiento real del sistema.",
    },

    {
      name: "permeabilidad",
      label: "Permeabilidad",
      type: "select",
      options: ["Muy alta (100<K)", "Alta (10<K<100)", "Media (1<K<10)", "Baja a muy baja (10^-2<K<1)"],
      help:
        "Es la propiedad que describe la facilidad con la que el agua fluye a través de los poros o grietas del suelo y las rocas. Indica qué tan interconectados están los espacios vacíos, permitiendo que el agua se mueva de un punto a otro.",
    },

    { name: "fuente_parametros", label: "Fuente_parametros", help: "Registro de la referencia (autor, año) que otorga validez técnica y trazabilidad a los datos ingresados (p. ej. Yepes, 2025)." },
  ],

  hidrologico: [
    { name: "cuenca", label: "Cuenca", help: "Registre el nombre de la cuenca hidrográfica principal o macrocuenca donde se localiza el punto de control (entendido como el sitio de clausura, estación de medición o punto de interés donde se cierra el balance hídrico), utilizando la denominación oficial (p. ej., Cuenca del Río Magdalena)." },
    { name: "subcuenca_o_rio", label: "Subcuenca_o_río", help: "Indique el nombre específico de la unidad hídrica menor o del cuerpo de agua superficial que drena directamente hacia el punto de monitoreo (p. ej., Río Aburrá o Quebrada La Presidenta)" },
    { name: "area_cuenca_km2", label: "Área_cuenca_km2", help: "Escriba el valor numérico de la superficie de drenaje total que aporta agua al punto de control, obtenida según la delimitación cartográfica o el modelo hidrológico del estudio (p. ej., 125.4)" },
    { name: "periodo_analisis", label: "Periodo_análisis", help: "Especifique el rango de años consecutivos de la serie histórica utilizada para los cálculos hidrológicos, asegurando que sea el mismo para todas las variables climáticas (p. ej., 1991–2021)" },
    { name: "p_med_anual_mm", label: "P_med_anual_mm", help: "Ingrese el promedio de lluvia total acumulada anualmente sobre la cuenca aportante para el periodo de análisis definido, expresado en milímetros (p. ej., 2100)" },
    { name: "q_med_anual_m3s", label: "Q_med_anual_m3s", help: "Reporte el volumen de agua promedio que circula por el punto de control por unidad de tiempo, calculado rigurosamente sobre el mismo periodo de análisis (p. ej., 5.8)." },
  ],

  hidrogeoquimico: [
    { name: "unidad_acuifero_asociada", label: "Unidad_acuífero_asociada", help: "Registre el nombre oficial de la formación geológica o la unidad hidrogeológica específica a la que pertenece la muestra de agua recolectada, asegurando la concordancia con el modelo geológico previamente definido (p. ej., Acuífero Formación Tilatá)." },
    { name: "facies_hidroquimica_descriptiva", label: "Facies_hidroquímica_descriptiva", help: "Indique la clasificación química del agua obtenida mediante el diagrama de Piper, mencionando los iones dominantes tanto en cationes como en aniones (p. ej., Bicarbonatada cálcica y/o magnésica)" },
    {
      name: "proceso_hidrogeoquimico_dominante",
      label: "Proceso_hidrogeoquímico_dominante",
      type: "textarea",
      help: "Describa la interpretación técnica de los fenómenos físicos o químicos que explican la composición del agua, tales como la interacción roca-agua, procesos de mezcla o impactos externos (p. ej., disolución de carbonatos, recarga meteórica reciente o influencia antrópica por nitratos).",
    },
    { name: "ph", label: "pH", help: "Reporte el valor medido del potencial de hidrógeno en la muestra, el cual indica el grado de acidez o alcalinidad del agua, o especifique el rango representativo si se analizan múltiples muestras (p. ej., 7.2 o rango 6.8–7.5)." },
    { name: "ce_uScm", label: "CE_uScm", help: "Registre la conductividad eléctrica medida en microsiemens por centímetro, parámetro que actúa como un indicador directo de la mineralización y el contenido iónico del agua (p. ej., 450)." },
    { name: "tds_mgL", label: "TDS_mgL", help: "Escriba la concentración de Sólidos Disueltos Totales o el residuo seco expresado en miligramos por litro, que representa la suma de todos los componentes minerales disueltos (p. ej., 320)." },
    { name: "ca_mgL", label: "Ca_mgL", help: "Ingrese la concentración del ion Calcio (Ca²⁺) determinada en el análisis de laboratorio, fundamental para definir la dureza y las facies del agua (p. ej., 45)." },
    { name: "mg_mgL", label: "Mg_mgL", help: "Reporte la concentración de Magnesio (Mg²⁺) presente en la muestra, componente clave en la caracterización hidroquímica de acuíferos sedimentarios (p. ej., 12)." },
    { name: "na_mgL", label: "Na_mgL", help: "Registre la concentración de Sodio (Na⁺), útil para identificar procesos de intercambio catiónico o influencias de aguas antiguas y salinas (p. ej., 25)." },
    { name: "k_mgL", label: "K_mgL", help: "Indique la concentración de Potasio (K⁺), ion que suele encontrarse en menores proporciones y cuya presencia puede estar ligada a la alteración de silicatos o uso de fertilizantes (p. ej., 2.1)." },
    { name: "hco3_mgL", label: "HCO3_mgL", help: "Escriba el valor de Bicarbonatos o la alcalinidad total expresada como HCO₃⁻, que refleja el sistema de equilibrio del carbono en el acuífero (p. ej., 180)." },
    { name: "cl_mgL", label: "Cl_mgL", help: "Reporte la concentración de Cloruros (Cl⁻), parámetro esencial para detectar procesos de salinización o contaminación (p. ej., 15)." },
    { name: "so4_mgL", label: "SO4_mgL", help: "Registre la concentración de Sulfatos (SO₄²⁻), la cual puede indicar disolución de yesos o presencia de minerales oxidados (p. ej., 30)." },
    { name: "no3_mgL", label: "NO3_mgL", help: "Ingrese la concentración de Nitratos (NO₃⁻), parámetro crítico para evaluar la calidad del agua y posibles impactos por actividades agrícolas o vertimientos (p. ej., 5)." },
    { name: "fuente_datos_analiticos", label: "Fuente_datos_analíticos", help: "Proporcione una referencia corta y precisa que permita rastrear el origen de la información química, incluyendo el autor y el año del estudio o informe técnico (p. ej., Yepes, 2025)." },
  ],

  caracterizacion: [
    { name: "uhg_codigo", label: "UHG", help: "Asigne un código único y secuencial que identifique la Unidad Hidrogeológica dentro del estudio, permitiendo agrupar capas geológicas con comportamientos hidráulicos similares bajo una misma denominación (p. ej., UHG-1, UHG-2)"},
    { name: "unidad_geologica_asociada", label: "Unidad geológica asociada", help: "Indique la formación, miembro o tipo de litología específica que compone físicamente a la UHG, manteniendo total coherencia con el modelo geológico regional y local definido previamente (p. ej., Formación Tilatá o Depósitos Aluviales)"},
    {
      name: "clasificacion_hidrogeologica_uhg",
      label: "Clasificación hidrogeológica de la UHG (tipo Fetter)",
      help:
        "Defina la función de la unidad dentro del sistema según su capacidad de transmitir y almacenar agua, clasificándola como acuífero (libre, confinado o semiconfinado), acuitardo, acuicludo o acuífugo (p. ej., Acuífero con porosidad primaria o Acuitardo por predominio de arcillas)",
    },
    {
      name: "porosidad",
      label: "Porosidad",
      type: "select",
      options: ["Muy alta (>50%)", "Alta (30-50%)", "Regular (10-30%)", "Mala (0-10%)"],
      help: "Fracción de vacíos en la roca (%). La porosidad efectiva es la que realmente permite el flujo de agua y determina la capacidad de almacenamiento real del sistema.",
    },
    {
      name: "permeabilidad",
      label: "Permeabilidad",
      type: "select",
      options: ["Muy alta (100<K)", "Alta (10<K<100)", "Media (1<K<10)", "Baja a muy baja (10^-2<K<1)"],
      help:
        "Es la propiedad que describe la facilidad con la que el agua fluye a través de los poros o grietas del suelo y las rocas. Indica qué tan interconectados están los espacios vacíos, permitiendo que el agua se mueva de un punto a otro.",
    },
    { name: "descripcion_comportamiento_hidrogeologico", label: "Descripción del comportamiento hidrogeológico", type: "textarea", help: "Redacte un resumen breve que explique el rol operativo de la unidad en el sistema, detallando cómo su naturaleza física influye en el flujo del agua (p. ej., Actúa como un acuífero libre con flujo eficiente por su alta permeabilidad; su composición de arenas favorece la infiltración y el almacenamiento)"},
  ],

  fuente: [
    {
      name: "tipo_de_fuente",
      label: "Tipo_de_fuente",
      type: "select",
      options: ["Superficial", "Escorrentía estacional", "Residual tratada", "Subterránea", "Otra"],
      help: "Seleccione el origen físico del recurso hídrico destinado a la recarga",
    },
    {
      name: "categoria_calidad_mar",
      label: "Categoria_calidad_MAR",
      type: "select",
      options: ["Apta", "Apta con pretratamiento", "No apta", "No evaluada"],
      help:
        "Clasificación de la calidad del agua para la recarga."
    },
    { name: "coliformes_totales", label: "Coliformes_totales", help: "Registre la concentración de estos indicadores microbiológicos en las unidades reportadas por el laboratorio ($NMP/100\ mL$ o $UFC/100\ mL$), ya que son los parámetros críticos para evaluar el riesgo sanitario y la seguridad del proceso de recarga"},
    { name: "coliformes_fecales", label: "Coliformes_fecales", help: "Registre la concentración de estos indicadores microbiológicos en las unidades reportadas por el laboratorio ($NMP/100\ mL$ o $UFC/100\ mL$), ya que son los parámetros críticos para evaluar el riesgo sanitario y la seguridad del proceso de recarga"},
    { name: "e_coli", label: "E_coli", help: "Registre la concentración de estos indicadores microbiológicos en las unidades reportadas por el laboratorio ($NMP/100\ mL$ o $UFC/100\ mL$), ya que son los parámetros críticos para evaluar el riesgo sanitario y la seguridad del proceso de recarga"},
    { name: "observacion_calidad_clave", label: "Observacion_calidad_clave", help: "Redacte un comentario breve y específico sobre el factor principal que limita o favorece el uso de esta fuente, como la alta turbiedad, presencia de metales o baja mineralización"},
    { name: "norma_aplicable", label: "Norma_aplicable", help: "Indique la resolución o decreto vigente utilizado para la evaluación (p. ej., Decreto 1076 de 2015 en Colombia) y especifique bajo qué categoría de uso se está evaluando el agua (p. ej., uso agrícola, industrial o recarga directa)"},
    { name: "categoria_uso_norma", label: "Categoria_uso_norma", help: "Indique la resolución o decreto vigente utilizado para la evaluación (p. ej., Decreto 1076 de 2015 en Colombia) y especifique bajo qué categoría de uso se está evaluando el agua (p. ej., uso agrícola, industrial o recarga directa)"},
    { name: "cumple_norma_para_uso", label: "Cumple_norma_para_uso", type: "select", options: ["Sí", "No", "Parcial", "No evaluado"], help: "Determine de forma global si la fuente satisface los requisitos legales, marcando Sí, No, o Parcial si requiere ajustes menores de calidad"},
    { name: "parametro_lim_critico", label: "Parametro_lim_crítico", help: "Identifique el componente específico (p. ej., nitratos, coliformes o sólidos suspendidos) que causa el incumplimiento de la norma o que obliga a realizar un tratamiento previo antes de iniciar la recarga"},
  ],

  volumen: [
    {
      name: "conoce_capacidad_almacenamiento",
      label: "¿Conoce la capacidad de almacenamiento del acuifero?",
      type: "select",
      options: ["Si", "No"],
      help: "Confirme si dispone de una estimación técnica de la capacidad de almacenamiento del acuífero (volumen disponible) y del volumen total de agua proveniente de la fuente que se pretende inyectar; esta información es la base para asegurar que el sistema pueda recibir el recurso sin saturarse.",
    },
    {
      name: "conoce_volumen_recarga",
      label: "¿Conoce el volumen de agua a recargar?",
      type: "select",
      options: ["Si", "No"],
      help: "Esta informacion permite conocer cuanta agua puede recibir el acuifero en una posible inyeccion.",
    },
    {
      name: "volumen_menor_capacidad",
      label: "¿El volumen de agua a recargar es < que la capacidad de almacenamiento del acuifero?",
      type: "select",
      options: ["Si", "No"],
      help: "Determina si el acuifero tiene espacio fisico suficiente para albergar el volumen de recarga proyectado.",
    },
    { name: "zona_o_uhg_receptora", label: "Zona_o_UHG_receptora", help: "Registre el nombre o código de la Unidad Hidrogeológica específica que ha sido identificada para recibir el agua, asegurando que sus propiedades hidráulicas sean aptas para la infiltración o inyección (p. ej., UHG-1 o Zona Aluvial Norte)."},
    { name: "periodo_referencia", label: "Periodo_referencia", help: "Indique el intervalo de tiempo o la serie de datos climáticos e hidrológicos utilizada para calcular tanto la oferta de la fuente como la capacidad de acogida del acuífero (p. ej., Promedio anual serie 2000–2020)."},
    { name: "v_fuente_disponible_anual_m3", label: "V_fuente_disponible_anual_m3", help: "Reporte el volumen total anual de agua que la fuente seleccionada (superficial, residual, etc.) puede entregar efectivamente para el proyecto, considerando su régimen hidrológico y la disponibilidad concesionable (p. ej., 1.500.000)."},
    { name: "v_capacidad_almacenamiento_m3", label: "V_capacidad_almacenamiento_m3", help: "Indique el volumen vacío o espacio disponible dentro del acuífero que ha sido calculado como apto para albergar agua nueva, basándose en la porosidad drenable y el espesor saturado disponible (p. ej., 850.000)."},
    { name: "v_max_recarga_segura_m3", label: "V_max_recarga_segura_m3", help:"Registre el volumen máximo recomendado para recargar anualmente sin generar riesgos de inundación, afloramientos o cambios químicos no deseados; este valor suele ser menor o igual a la capacidad física del acuífero (p. ej., 600.000)."},
    { name: "criterio_definicion_vmax", label: "Criterio_definicion_Vmax", type: "textarea", help: "Describa la regla técnica o el método utilizado para fijar el volumen máximo de recarga segura, como puede ser un porcentaje de la porosidad eficaz, el mantenimiento de un nivel piezométrico crítico o un límite basado en el balance hídrico (p. ej.,No exceder el 15% de la porosidad eficaz o Mantener el nivel freático a 2 metros bajo la superficie)"},
  ],

  infraestructura: [
    { name: "id_infraestructura", label: "ID_infraestructura", help: "Asigne un código único y alfanumérico que permita identificar de forma inequívoca cada elemento físico en la base de datos y en la cartografía del proyecto (p. ej., INF_01, POZO_A1 o PTAR_SUR)."},
    { name: "tipo_infraestructura", label: "Tipo_infraestructura", type: "select", options: ["Pozo", "Canal", "Embalse", "Estanque", "Zanja", "PTAP", "PTAR", "Red de distribución", "Drenaje", "Otra"], help: "Seleccione la categoría técnica que mejor describa la obra hidráulica existente, diferenciando entre captaciones (pozos), sistemas de conducción (canales, redes), almacenamiento (embalses) o plantas de tratamiento (PTAP, PTAR)."},
    { name: "uso_actual", label: "Uso_Actual", help: "Describa la función o actividad principal que desempeña la infraestructura al momento de la evaluación, especificando si es para consumo humano, riego, vertimiento o uso industrial."},
    { name: "estado", label: "Estado", type: "select", options: ["Bueno", "Regular", "Malo", "En desuso", "No evaluado"], help: "Evalúe la condición física y operativa del elemento."},
    { name: "coordenadas_x", label: "Coordenadas_x", help: "Ubicación geográfica (X o lat/long) para representarlo en el mapa." },
    { name: "coordenadas_y", label: "Coordenadas_y", help: "Ubicación geográfica (Y) para representarlo en el mapa." },
    { name: "relacion_con_mar", label: "Relacion_con_MAR", type: "select", options: ["Aprovechable", "Potencialmente afectada", "Sin relación directa", "Por evaluar"], help: "Relevancia cualitativa para MAR." },
  ],

  comunidad: [
    { name: "nombre_comunidad", label: "Nombre_comunidad", help: "Registre el nombre oficial de la localidad, vereda, barrio o corregimiento que se encuentra dentro del área de influencia directa del proyecto (p. ej., Vereda La Clarita)." },
    { name: "tipo_asentamiento", label: "Tipo_asentamiento", type: "select", options: ["Urbano", "Rural", "Mixto", "No evaluado"], help: "Clasifique el área donde habita la comunidad según su densidad y características territoriales en Urbano, Rural o Mixto, lo cual ayuda a prever el tipo de demanda y la infraestructura necesaria." },
    { name: "poblacion_total", label: "Poblacion_total", help: "Ingrese el número total de habitantes del asentamiento basándose en los datos más recientes de fuentes oficiales, como censos nacionales o registros municipales (p. ej., 1.250 habitantes)." },
    { name: "actividad_economica_principal", label: "Actividad_economica_principal", help: "Identifique la fuente de ingresos o labor predominante de los habitantes, como agricultura, ganadería, comercio o industria, para entender el impacto socioeconómico del recurso hídrico (p. ej., Cultivo de hortalizas a pequeña escala)." },
    { name: "uso_final_del_agua", label: "Uso_final_del_agua", type: "select", options: ["Doméstico", "Industrial", "Ambiental", "Agrícola", "Mixto"], help: "Defina el propósito específico que tendrá el agua tras su recuperación del acuífero." },
    { name: "condicion_beneficio", label: "Condicion_beneficio", type: "select", options: ["Beneficio directo", "Beneficio indirecto", "Potencial beneficiario", "No evaluado"], help: "Determine la relación esperada entre la comunidad y el proyecto." },
    { name: "percepcion_proyecto_mar", label: "Percepcion_proyecto_MAR", type: "select", options: ["Favorable", "Neutra", "Contraria", "No evaluada"], help: "Describa el nivel de aceptación, dudas o interés manifestado por la comunidad tras las socializaciones iniciales, lo cual es clave para gestionar la viabilidad social del proyecto (p. ej., Alta aceptación con dudas sobre la calidad del agua de recarga)." },
  ],

  relieve: [
    { name: "relieve_dominante", label: "Relieve_dominante", type: "select", options: ["Llanura", "Valle", "Colina o meseta", "Montaña", "No evaluado"], help: "Seleccione la forma de terreno que predomina en el área del proyecto, lo cual determina la velocidad de la escorrentía y la capacidad de infiltración." },
    { name: "Clima", label: "Clima", type: "select", options: ["Árido o semiárido (Seco)", "Cálido (Seco)", "Húmedo – semihúmedo (Templado)", "Tropical"], help: "Selecciona el tipo climático dominante del área de estudio."},
  ],
};



// ✅ Ayuda contextual para opciones de <select> (por campo)
const SELECT_OPTION_HELP = {
  Tipo_de_fuente: {
    Superficial: "Agua captada en ríos, quebradas, lagos, humedales o embalses.",
    "Escorrentía estacional": "Flujos generados principalmente en temporadas lluviosas o eventos de lluvia; suelen ser variables en el tiempo.",
    "Residual tratada": "Aguas residuales tratadas (PTAR) con calidad evaluada para recarga según uso final y norma aplicable.",
    Subterránea: "Agua proveniente del acuífero (bombeada o recirculada) para gestión de niveles/almacenamiento.",
    Otra: "Cualquier fuente distinta a las anteriores (p. ej., mezcla, importación, desalinizada), indicando cuál es.",
  },

  Categoria_calidad_mar: {
    Apta: "Cumple los criterios mínimos de calidad definidos para recarga (según norma/uso) sin tratamiento adicional relevante.",
    "Apta con pretratamiento": "Puede usarse para recarga, pero requiere tratamiento previo (p. ej., filtración, desinfección, remoción de sólidos/organismos).",
    "No apta": "No cumple criterios de calidad para recarga (alto riesgo de colmatación/contaminación o incumplimiento normativo).",
    "No evaluada": "No existe información suficiente para clasificar la calidad de la fuente.",
  },

  Cumple_norma_para_uso: {
    Sí: "Cumple la norma para el uso definido (según parámetros evaluados).",
    No: "No cumple la norma para el uso definido.",
    Parcial: "Cumple algunos parámetros, pero hay incumplimientos o incertidumbre que requiere ajuste/tratamiento/validación adicional.",
    "No evaluado": "No se evaluó con una norma o no hay datos suficientes.",
  },

  Tipo_infraestructura: {
    Pozo: "Estructura de captación/inyección (pozo de extracción, monitoreo o recarga).",
    Canal: "Conducción superficial para transportar agua hacia/desde la zona de recarga.",
    Embalse: "Almacenamiento superficial (represa/laguna) para regulación y disponibilidad.",
    Estanque: "Estructura para almacenamiento/infiltración controlada (p. ej., estanques/lagunas de infiltración).",
    Zanja: "Obra lineal somera para infiltrar o conducir agua (zanjas de infiltración/drenaje).",
    PTAP: "Planta de Tratamiento de Agua Potable (mejora calidad para consumo/uso).",
    PTAR: "Planta de Tratamiento de Aguas Residuales (mejora calidad para reúso/recarga).",
    "Red de distribución": "Sistema de tuberías/infraestructura para transportar agua entre puntos del sistema.",
    Drenaje: "Obras para evacuar/controlar escorrentía o niveles de agua (superficiales o subterráneos).",
    Otra: "Infraestructura no incluida arriba (describir cuál es).",
  },

  Estado: {
    Bueno: "Operativa, en condiciones adecuadas; no requiere intervención mayor.",
    Regular: "Funciona, pero requiere mantenimiento/ajustes para operar de forma confiable.",
    Malo: "No es confiable u operativa; requiere reparación mayor o reemplazo.",
    "En desuso": "Existe físicamente, pero no se utiliza actualmente.",
    "No evaluado": "No hay información para calificar su condición.",
  },

  Relacion_con_mar: {
    Aprovechable: "Puede usarse directamente o con ajustes menores como parte del esquema MAR.",
    "Potencialmente afectada": "Puede verse impactada por el proyecto (o impactarlo) y requiere revisión de riesgos/compatibilidad.",
    "Sin relación directa": "No influye en MAR ni es útil para el esquema propuesto.",
    "Por evaluar": "Aún no se tiene información suficiente para clasificarla.",
  },

  Tipo_asentamiento: {
    Urbano: "Asentamiento con predominio de infraestructura/servicios urbanos y mayor densidad poblacional.",
    Rural: "Asentamiento disperso, con predominio de actividades agropecuarias y baja densidad.",
    Mixto: "Combina características urbanas y rurales en el área de influencia.",
    "No evaluado": "No hay información suficiente para clasificar el asentamiento.",
  },

  Condicion_beneficio: {
    "Beneficio directo": "Recibe el agua/servicio de forma directa (p. ej., abastecimiento, riego, reducción de déficit).",
    "Beneficio indirecto": "Se beneficia por efectos secundarios (p. ej., mejora ambiental, reducción de conflictos, estabilidad de niveles).",
    "Potencial beneficiario": "Podría beneficiarse, pero depende del diseño final/operación/permisos.",
    "No evaluado": "No hay información suficiente para determinar el tipo de beneficio.",
  },

  Percepcion_proyecto_mar: {
    Favorable: "Existe aceptación o apoyo general hacia el proyecto MAR.",
    Neutra: "No hay postura clara o no se identifica apoyo/rechazo significativo.",
    Contraria: "Existe oposición o preocupaciones relevantes frente al proyecto.",
    "No evaluada": "No se levantó información social o no se reporta percepción.",
  },

  Relieve_dominante: {
    Llanura: "Terreno plano o suavemente ondulado; pendientes bajas.",
    Valle: "Depresión alargada asociada a un río/quebrada, con laderas laterales.",
    "Colina o meseta": "Relieve intermedio: colinas suaves o superficies relativamente planas en altura (mesetas).",
    Montaña: "Relieve abrupto con pendientes altas y diferencias de elevación marcadas.",
    "No evaluado": "No hay información suficiente para clasificar el relieve.",
  },

  Permeabilidad: {
  "Muy alta (100<K)": "K muy alta: el acuífero permite flujo/infiltración con facilidad.",
  "Alta (10<K<100)": "K alta: condiciones favorables para infiltración/recarga.",
  "Media (1<K<10)": "K media: puede funcionar, pero requiere validar diseño/tasas.",
  "Baja a muy baja (10^-2<K<1)": "K baja: alto riesgo de baja infiltración/colmatación; revisar alternativas."
},

Porosidad: {
  "Muy alta (>50%)": "Alta capacidad de almacenamiento en poros (muy favorable).",
  "Alta (30-50%)": "Buena capacidad de almacenamiento (favorable).",
  "Regular (10-30%)": "Capacidad moderada (depende del diseño y del medio).",
  "Mala (0-10%)": "Muy poca capacidad de almacenamiento; limita la recarga efectiva."
},

Tipo_unidad: {
  "Libre": "Fetter (2018). Acuiferos libres: la superficie de saturacion esta en contacto con la atmosfera y la presion es atmosferica, permitiendo flujo mas libre.",
  "Semiconfinado - confinado": "Fetter (2018). Acuiferos confinados: separados de la atmosfera por capas impermeables (acuicludos) con presion superior a la atmosferica. Acuiferos semiconfinados: cubiertos por una capa de baja permeabilidad (acuitardo) que restringe el paso del agua sin impedirlo por completo.",
},

Clima: {
    "Árido o semiárido (Seco)": "Köppen: Grupo B (BW/BS). Clima con déficit hídrico: la evaporación potencial suele superar la precipitación. Ejemplos de códigos: BWh, BWk, BSh, BSk.",
    "Cálido (Seco)": "Köppen: suele reflejar climas cálidos con estación seca marcada. En Köppen aparece típicamente con 'w' (invierno seco) o 's' (verano seco), según el caso. Ejemplos: Aw/As (tropical con estación seca) o Cwa/Csa (según región).",
    "Húmedo – semihúmedo (Templado)": "Köppen: Grupo C (templado). Precipitación moderada a alta; puede ser sin estación seca fuerte (f) o con estacionalidad (s/w). Ejemplos: Cfa, Cfb, Cwa, Csa.",
    "Tropical": "Köppen: Grupo A (tropical). Temperaturas altas todo el año. Subtipos: Af (tropical húmedo), Am (monzónico), Aw/As (sabana con estación seca).",
  },

Uso_final_del_agua: {"Doméstico": "Agua recuperada para el abastecimiento de núcleos urbanos y rurales. Se destina principalmente al consumo humano, higiene personal y labores del hogar, cumpliendo con estándares de potabilidad",
  "Industrial": "Agua recuperada para procesos productivos o de manufactura. Se utiliza en sistemas de refrigeración, lavado de maquinaria, minería o como insumo directo en la fabricación de bienes.",
  "Ambiental": "Uso del recurso para la conservación de la naturaleza. Se enfoca en mantener caudales ecológicos, proteger humedales, crear barreras contra la intrusión salina y estabilizar el suelo para prevenir hundimientos (subsidencia).",
  "Agrícola": "Agua destinada a la producción de alimentos y materias primas. Incluye principalmente el riego de cultivos, la preparación de suelos y el mantenimiento de la actividad pecuaria (ganadería), entre otras.",
  "Mixto": "Se aplica cuando el agua almacenada en el acuífero se recupera para satisfacer dos o más de las necesidades anteriores simultáneamente (ej. un mismo proyecto de recarga abastece a una zona residencial y a un distrito de riego cercano).",
  },
};

// ✅ Normaliza llaves (tildes, mayúsculas, espacios)
const normalizeKey = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

// ✅ Busca ayuda aunque las llaves no coincidan exacto
const getSelectOptionHelp = (fieldName, optionValue) => {
  if (!fieldName || !optionValue) return "";

  const fieldNorm = normalizeKey(fieldName);

  const realFieldKey = Object.keys(SELECT_OPTION_HELP).find(
    (k) => normalizeKey(k) === fieldNorm
  );

  const fieldMap = realFieldKey ? SELECT_OPTION_HELP[realFieldKey] : null;
  if (!fieldMap) return "";

  const optNorm = normalizeKey(optionValue);

  const realOptKey = Object.keys(fieldMap).find(
    (k) => normalizeKey(k) === optNorm
  );

  return realOptKey ? fieldMap[realOptKey] : "";
};


/* =========================================================
   APP
========================================================= */
function App() {
  const [showLanding, setShowLanding] = useState(true);

  return showLanding ? (
    <Landing onEnter={() => setShowLanding(false)} />
  ) : (
    <MainAppLayout onBackToLanding={() => setShowLanding(true)} />
  );
}

/* =========================================================
   PANTALLA DE INICIO (PORTADA SIGMMA-MAR)
========================================================= */
function Landing({ onEnter }) {
  return (
    <div className="landing">
      <div className="landing-card">
        <header className="landing-header">
          <h1 className="landing-title">SIGMMA - MAR</h1>
          <p className="landing-subtitle-descr">
            <em>Sistema de Información Geográfica (SIG), Decisión Multicriterio (M) y Modelación Automatizada (MA) en la Recarga Gestionada de Acuíferos</em>
          </p>
        </header>

        <div className="landing-main">
          <p className="landing-lema">Del dato a la decisión: evalúa contexto, pondera criterios y selecciona la alternativa óptima de recarga.</p>
          <button className="landing-button" onClick={onEnter}>
            Entrar a la plataforma
          </button>
        </div>

        <img src="/images/hero-mountains.png" alt="Decoración SIGMMA-MAR" className="landing-graphic" />
        <img src="/images/eafit-logo.png" alt="Universidad EAFIT" className="landing-logo" />
      </div>
    </div>
  );
}

/* =========================================================
   LAYOUT PRINCIPAL CON MENÚ LATERAL
========================================================= */
function MainAppLayout({ onBackToLanding }) {
  const [currentView, setCurrentView] = useState("home"); // home | metodo | resultados | dashboard
  const [currentMetodoView, setCurrentMetodoView] = useState("insumos"); // insumos | ahp | rf

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h2 className="logo">SIGMMA-MAR</h2>
        <p className="sidebar-subtitle">Plataforma para la selección de técnicas de recarga gestionada de acuíferos (MAR)</p>

        <nav className="main-nav">
          <button className={currentView === "home" ? "nav-btn active" : "nav-btn"} onClick={() => setCurrentView("home")}>
            <span className="nav-label">Introducción</span>
            <span className="nav-icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
                <path d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5A1 1 0 0 1 4 20v-9.5z" fill="currentColor" />
              </svg>
            </span>
          </button>

          <button className={currentView === "metodo" ? "nav-btn active" : "nav-btn"} onClick={() => setCurrentView("metodo")}>
            <span className="nav-label">Metodología</span>
            <span className="nav-icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
                <path d="M4 20h16v-1.5H4V20zm2-3h2.5V9H6v8zm4.75 0h2.5V5.5h-2.5V17zm4.75 0H18V11h-2.5v6z" fill="currentColor" />
              </svg>
            </span>
          </button>

          <button className={currentView === "resultados" ? "nav-btn active" : "nav-btn"} onClick={() => setCurrentView("resultados")}>
            <span className="nav-label">Resultados</span>
            <span className="nav-icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
                <path
                  d="M3.5 6.75A1.75 1.75 0 0 1 5.25 5h4.086c.46 0 .9.184 1.225.51L12.5 7H18.75A1.75 1.75 0 0 1 20.5 8.75v8.5A1.75 1.75 0 0 1 18.75 19H5.25A1.75 1.75 0 0 1 3.5 17.25v-10.5z"
                  fill="currentColor"
                />
              </svg>
            </span>
          </button>

          <button className={currentView === "dashboard" ? "nav-btn active" : "nav-btn"} onClick={() => setCurrentView("dashboard")}>
            <span className="nav-label">Resumen de casos MAR</span>
            <span className="nav-icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
                <path d="M4 4h16v7H4V4zm0 9.5h7V20H4v-6.5zm9 0h7V20h-7v-6.5z" fill="currentColor" />
              </svg>
            </span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="back-home-btn" onClick={onBackToLanding}>
            ← Volver al inicio
          </button>
        </div>
      </aside>

      <main className="content">
        {currentView === "home" && <Introduccion onGoToMetodo={() => setCurrentView("metodo")} />}
        {currentView === "metodo" && <Metodologia currentMetodoView={currentMetodoView} setCurrentMetodoView={setCurrentMetodoView} />}
        {currentView === "resultados" && <Resultados />}
        {currentView === "dashboard" && <Dashboard />}
      </main>
    </div>
  );
}

/* =========================================================
   INTRODUCCIÓN
========================================================= */
function Introduccion({ onGoToMetodo }) {
  const [selectedGroupId, setSelectedGroupId] = useState("1");
  const [selectedTechniqueId, setSelectedTechniqueId] = useState("1.1");
  const [zoomedImage, setZoomedImage] = useState(null);

  const activeGroup = TECH_GROUPS.find((g) => g.id === selectedGroupId) || TECH_GROUPS[0];
  const activeTechnique = activeGroup.techniques.find((t) => t.id === selectedTechniqueId) || activeGroup.techniques[0];
  const activeTechniqueIcon = getTechniqueIcon(activeTechnique);

  return (
    <section className="intro-section">
      <h1 className="intro-title">Introducción</h1>

      <div className="intro-mar-block">
        <h2 className="intro-mar-main">Recarga Gestionada de Acuíferos</h2>

        <p className="intro-text">
          Es la recarga intencionada de agua a los acuíferos con el propósito de garantizar su disponibilidad futura, así como de promover beneficios
          ambientales significativos (Dillon et al., 2022; IAH, 2022). Esta práctica forma parte de una estrategia de gestión sostenible del recurso hídrico,
          que busca equilibrar la extracción con la reposición, mejorar la calidad del agua, mitigar los efectos de la sobreexplotación y fortalecer la
          resiliencia frente a eventos climáticos extremos. Su implementación requiere planificación, monitoreo y un enfoque integrado que considere tanto los
          aspectos técnicos como los socioambientales.
        </p>

        <p className="intro-text">
          La Figura 1 ilustra de manera general el ciclo del agua en un paisaje donde interactúan procesos naturales y actividades humanas. En ella se destacan
          elementos como la recarga natural y la recarga gestionada de acuíferos, junto con el uso agrícola, industrial y urbano del agua. Este esquema permite
          visualizar cómo la recarga gestionada se integra en un sistema más amplio de gestión hídrica, mostrando su papel como puente entre la conservación del
          recurso y su aprovechamiento responsable.
        </p>

        <div className="intro-image-placeholder">
          <img
            src="/images/esquema_recarga.png"
            alt="Esquema conceptual de tipos de recarga gestionada de acuíferos"
            className="intro-image intro-image-small"
            onClick={() => setZoomedImage("/images/esquema_recarga.png")}
          />
        <p className="intro-image-caption">Figura 1. Esquema conceptual de tipos de recarga gestionada de acuíferos.Fuente: INOWAS, 2018.</p>
        </div>
      </div>

      {/* CLASIFICACIÓN DE TÉCNICAS MAR */}
      <section className="intro-block intro-tech-explorer">
        <h2 className="intro-heading">Clasificación de técnicas MAR</h2>
        <p className="intro-text">
          La implementación efectiva de la Recarga Gestionada de Acuíferos (MAR) exige asegurar que la tecnología seleccionada encaje perfectamente con su entorno. Por ello, este catálogo organiza 14 técnicas en una estructura jerárquica que considera el método de recarga, la infraestructura y la presión aplicada.
          Estas variables permiten agrupar las soluciones en tres grandes dominios: intervención de corrientes, recarga mediante pozos e infiltración superficial. A continuación, explore los grupos y seleccione una técnica específica para acceder a su definición técnica y las referencias académicas que la sustentan.
        </p>

        <p className="intro-tech-caption">Clasificación de técnicas MAR. Fuente: elaboración propia.</p>

        <div className="tech-groups-row">
          {TECH_GROUPS.map((group) => {
            const isActive = group.id === selectedGroupId;
            return (
              <button
                key={group.id}
                className={"tech-group-card group-" + group.id + (isActive ? " active" : "")}
                onClick={() => {
                  setSelectedGroupId(group.id);
                  setSelectedTechniqueId(group.techniques[0].id);
                }}
              >
                <div className="tech-group-card-top">
                  <div>
                    <div className="tech-group-tag">Grupo {group.id}</div>
                    <h3 className="tech-group-title">{group.name}</h3>
                  </div>
                  {group.icon && <img src={group.icon} alt={group.name} className="tech-group-icon" />}
                </div>
                <p className="tech-group-text">{group.short}</p>
              </button>
            );
          })}
        </div>

        <div className="tech-layout">
          <div className="tech-list">
            {activeGroup.techniques.map((tech) => {
              const itemIcon = getTechniqueIcon(tech);
              const isActive = tech.id === selectedTechniqueId;
              return (
                <button key={tech.id} className={"tech-item group-" + activeGroup.id + (isActive ? " active" : "")} onClick={() => setSelectedTechniqueId(tech.id)}>
                  <div className={"tech-icon-placeholder group-" + activeGroup.id}>
                    {itemIcon ? <img src={itemIcon} alt={tech.name} className="tech-icon-mini" /> : <span>{tech.id}</span>}
                  </div>
                  <div className="tech-text-wrapper">
                    <div className="tech-name" style={{ whiteSpace: "pre-line" }}>
                      {tech.name}
                    </div>
                    <div className="tech-group-label">{activeGroup.name}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <article className={"tech-detail group-" + activeGroup.id}>
            <div className="tech-detail-header">
              <div>
                <h3 className="tech-detail-title">
                  {activeTechnique.id} {activeTechnique.name}
                </h3>
                <p className="tech-detail-group-label">{activeGroup.name}</p>
              </div>

              {activeTechniqueIcon && (
                <button type="button" className="tech-detail-icon-button" onClick={() => setZoomedImage(activeTechniqueIcon)}>
                  <img src={activeTechniqueIcon} alt={activeTechnique.name} className="tech-detail-icon" />
                </button>
              )}
            </div>

            <p className="tech-detail-text">{activeTechnique.definition}</p>
            <p className="tech-detail-refs">
              <strong>Autores asociados: </strong>
              {activeTechnique.refs}
            </p>
          </article>
        </div>
      </section>

      {/* Fuentes de agua */}
      <div className="intro-block intro-water-sources">
        <h2 className="intro-heading">Fuentes de agua para MAR</h2>

        <div className="intro-water-layout">
          <div className="intro-water-text">
            <p className="intro-text">La recarga gestionada puede utilizar distintas fuentes de agua. En esta plataforma se consideran cuatro tipos principales:</p>
            <ul className="intro-list">
              <li>
                <strong>Superficial:</strong> agua en ríos, quebradas, lagos, humedales o embalses captada desde superficie.
              </li>
              <li>
                <strong>Escorrentía estacional:</strong> flujos durante eventos de lluvia/temporadas húmedas, conducidos y almacenados temporalmente.
              </li>
              <li>
                <strong>Residual:</strong> aguas residuales tratadas con criterios de calidad compatibles con la recarga y el uso previsto.
              </li>
              <li>
                <strong>Subterránea y Otras fuentes:</strong> agua extraída y recirculada para gestionar niveles piezométricos o almacenar excedentes o agua de mezclas, desalinizada/importada u otras no convencionales tras acondicionamiento
              </li>
            </ul>
          </div>

          <div className="intro-image-placeholder intro-water-image-box">
            <img src="/images/Fuente_De_Recarga.png" alt="Esquema de fuentes de agua para MAR" className="intro-image" onClick={() => setZoomedImage("/images/Fuente_De_Recarga.png")} />
            <p className="intro-image-caption">Figura 3. Fuentes de agua utilizadas en proyectos MAR. Fuente: elaboración propia.</p>
          </div>
        </div>
      </div>

      {/* Objetivos */}
      <div className="intro-block">
        <h2 className="intro-heading">Objetivos de MAR</h2>
        <p className="intro-text">Los proyectos MAR pueden diseñarse con distintos propósitos, según el problema hídrico a resolver o la necesidad del proyecto y el uso final del agua recuperada. En general, buscan aumentar la disponibilidad mediante almacenamiento subterráneo en épocas de excedente, mejorar la confiabilidad del suministro en periodos secos, recuperar niveles piezométricos en acuíferos sobreexplotados, reducir impactos de eventos extremos, entre otros.
          En SIGMMA-MAR, el objetivo se define explícitamente porque condiciona la técnica viable, la infraestructura requerida, los criterios de calidad y los indicadores de desempeño que se evaluarán.</p>
        <ul className="intro-list">
          <li>
            <strong>Almacenamiento de excedentes / aumento de disponibilidad:</strong> capturar volúmenes estacionales para reforzar reservas subterráneas.
          </li>
          <li>
            <strong>Mitigación de la sobreexplotación:</strong> compensar extracciones intensivas mediante recarga dirigida.
          </li>
          <li>
            <strong>Control de intrusión salina:</strong> barreras hidráulicas o elevación de niveles en zonas costeras.
          </li>
          <li>
            <strong>Mejorar la calidad del agua:</strong> atenuación natural (filtración, adsorción, biodegradación) durante el paso por suelo/acuífero.
          </li>
          <li>
            <strong>Otros objetivos integrados:</strong> mitigación de inundaciones, caudales ecológicos, soporte a ecosistemas, reúso seguro.
          </li>
        </ul>
      </div>

      {/* Criterios */}
      <div className="intro-block">
  <h2 className="intro-heading">Criterios evaluados para proyectos MAR</h2>

  <p className="intro-text">
    La selección de técnicas de recarga no depende de un único factor, sino de un conjunto de criterios que condicionan su
    viabilidad y desempeño. La literatura coincide en que, antes de elegir un método, se debe definir el objetivo del
    proyecto y el uso final del agua, y evaluar las condiciones del sistema (hidrogeología, hidrología, topografía/uso
    del suelo), la fuente disponible y su calidad (Dillon et al., 2009; Sherif et al., 2023). Otros marcos amplían el
    análisis incorporando la cadena operativa completa (captación, pretratamiento, recarga, almacenamiento, recuperación,
    postratamiento) y factores transversales como regulación, monitoreo, mantenimiento, impactos socioambientales y costos
    (Yuan &amp; Michele, 2016; Zhang et al., 2020; NRMMC, 2009; ASCE, 2020; Maliva, 2020; IGRAC, 2007). En SIGMMA-MAR,
    estos enfoques se integran y se contrastan con el análisis de 169 casos MAR reportados en el portal IGRAC, para
    consolidar los criterios que guían la ruta jerárquica (SIG-MCDA/AHP) y la ruta automatizada
    (modelos supervisados).
  </p>

  <div className="criteria-table-wrap">
    <div style={{ fontWeight: 600, marginBottom: 8 }}>
      Tabla 1. Criterios para la selección de técnicas de recarga MAR
    </div>
    <table className="criteria-table">
      <thead>
        <tr>
          <th style={{ background: "#f3f4f6" }}>Criterio</th>
          <th style={{ background: "#f3f4f6" }}>Subcriterio</th>
          <th style={{ background: "#f3f4f6" }}>Qué asegura en la selección</th>
        </tr>
      </thead>

      <tbody>
        {/* 1. Objetivo */}
        <tr style={{ background: "#f8fafc" }}>
          <td rowSpan={1}>1. Objetivo</td>
          <td>1.1 Definición del objetivo</td>
          <td>Alinea la técnica MAR con el propósito del proyecto y el uso final del agua.</td>
        </tr>

        {/* 2. Condiciones hidrogeológicas */}
        <tr>
          <td rowSpan={4}>2. Condiciones hidrogeológicas</td>
          <td>2.1 Modelo geológico</td>
          <td>Verifica la arquitectura del subsuelo y el marco estructural donde ocurrirá la recarga.</td>
        </tr>
        <tr style={{ background: "#f8fafc" }}>
          <td>2.2 Modelo hidrológico</td>
          <td>Comprueba el balance hídrico y la relación superficie–subsuelo que controla entradas/salidas.</td>
        </tr>
        <tr>
          <td>2.3 Modelo numérico</td>
          <td>Reduce incertidumbre estimando niveles, flujos, almacenamiento y respuesta del sistema.</td>
        </tr>
        <tr style={{ background: "#f8fafc" }}>
          <td>2.4 Propiedades del acuífero</td>
          <td>Soporta la capacidad de infiltración/almacenamiento (porosidad, K, T, S) y el desempeño esperado.</td>
        </tr>

        {/* 3. Fuente y calidad del agua */}
        <tr>
          <td rowSpan={5}>3. Fuente y calidad del agua</td>
          <td>3.1 Fuente de recarga identificada</td>
          <td>Garantiza disponibilidad y tipo de fuente (superficial, residual tratada, etc.) compatible con la técnica.</td>
        </tr>
        <tr style={{ background: "#f8fafc" }}>
          <td>3.2 Calidad del agua a recarga</td>
          <td>Controla riesgos de colmatación, contaminación y requisitos de pretratamiento.</td>
        </tr>
        <tr>
          <td>3.3 Calidad del agua del acuífero</td>
          <td>Define condiciones de base y sensibilidad del acuífero frente a cambios por la recarga.</td>
        </tr>
        <tr style={{ background: "#f8fafc" }}>
          <td>3.4 Calidad del agua de mezcla</td>
          <td>Anticipa reacciones geoquímicas al mezclar fuente y acuífero.</td>
        </tr>
        <tr>
          <td>3.5 Calidad del agua post-mezcla</td>
          <td>Verifica que el agua final cumpla el uso objetivo y estándares aplicables.</td>
        </tr>

        {/* 4. Viabilidad técnica */}
        <tr style={{ background: "#f8fafc" }}>
          <td rowSpan={2}>4. Viabilidad técnica</td>
          <td>4.1 Infraestructura documentada</td>
          <td>Confirma factibilidad constructiva/operativa (pozos, filtros, plantas, presas, obras en cauce, etc.).</td>
        </tr>
        <tr>
          <td>4.2 Evaluación costo–beneficio</td>
          <td>Justifica la alternativa con criterios técnico–económicos y sostenibilidad operativa.</td>
        </tr>

        {/* 5. Aspectos socioambientales */}
        <tr style={{ background: "#f8fafc" }}>
          <td rowSpan={3}>5. Aspectos socioambientales</td>
          <td>5.1 Impacto ambiental</td>
          <td>Reduce afectaciones y prioriza compatibilidad con ecosistemas/SbN, biodiversidad y hábitats.</td>
        </tr>
        <tr>
          <td>5.2 Regulación y permisos</td>
          <td>Asegura cumplimiento legal y viabilidad administrativa del proyecto.</td>
        </tr>
        <tr style={{ background: "#f8fafc" }}>
          <td>5.3 Servicios ecosistémicos y comunidad</td>
          <td>Verifica aceptación social, beneficios y coherencia con necesidades del territorio.</td>
        </tr>
      </tbody>
    </table>
    <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
      <em>Fuente: elaboración propia.</em>
    </div>
  </div>
</div>

      {/* Esquema conceptual */}
      <div className="intro-block intro-concept-scheme">
        <h2 className="intro-heading">Esquema conceptual de selección de técnicas MAR</h2>
        <p className="intro-text">
          El Esquema Conceptual de Selección constituye el núcleo lógico de SIGMMA-MAR, articulando una ruta de decisión diseñada para reducir la incertidumbre en proyectos de recarga. Este marco evalúa de 
          forma integrada cinco dimensiones: parte del objetivo estratégico y la caracterización hidrogeológica del acuífero, avanza hacia el análisis de compatibilidad física y química de la fuente de agua, 
          y cruza variables de entorno como el relieve y el clima. Finalmente, el modelo integra la factibilidad técnica mediante la infraestructura disponible y el componente socioambiental, asegurando que el grupo 
          de técnicas MAR identificado (G1 (Intervención de corrientes superficiales), G2(Recarga mediante pozos y perforaciones) o G3(Infiltración superficial)) no solo sea técnicamente viable, sino también sostenible y coherente con las necesidades del territorio. 
          A continuación, se detalla la ruta metodológica. Haga clic sobre la imagen para ampliarla y visualizar los detalles con mayor claridad.
        </p>

        <div className="concept-grid">
          <article className="concept-step">
            <h3 className="concept-step-title">1. Objetivo y condiciones hidrogeológicas</h3>
            <p className="concept-step-text">La ruta inicia definiendo el objetivo y verificando la existencia de estudios básicos: caracterización del acuífero y modelos relevantes.</p>
            <button type="button" className="concept-image-button" onClick={() => setZoomedImage("/images/figura-6a-esquema-conceptual-de-seleccion_300.jpg")}>
              <img src="/images/figura-6a-esquema-conceptual-de-seleccion_300.jpg" alt="Ruta de selección: objetivos y primeros estudios hidrogeológicos" className="intro-image concept-image" />
            </button>
            <p className="concept-caption">Figura 4a. Inicio de la ruta y evaluación inicial de las condiciones del acuífero. Fuente: elaboración propia.</p>
          </article>

          <article className="concept-step">
            <h3 className="concept-step-title">2. Tipo de acuífero y propiedades clave</h3>
            <p className="concept-step-text">Se analiza si el acuífero es libre, semiconfinado o confinado y se evalúan parámetros clave para viabilidad de técnicas.</p>
            <button type="button" className="concept-image-button" onClick={() => setZoomedImage("/images/figura-6b-esquema-conceptual-de-seleccion_300.jpg")}>
              <img src="/images/figura-6b-esquema-conceptual-de-seleccion_300.jpg" alt="Evaluación del tipo de acuífero, permeabilidad y porosidad" className="intro-image concept-image" />
            </button>
            <p className="concept-caption">Figura 4b. Evaluación del tipo de acuífero, la permeabilidad y la porosidad. Fuente: elaboración propia.</p>
          </article>

          <article className="concept-step">
            <h3 className="concept-step-title">3. Fuente de agua, calidad y capacidad</h3>
            <p className="concept-step-text">Se identifica la fuente, su calidad y compatibilidad normativa, y se contrasta volumen con almacenamiento.</p>
            <button type="button" className="concept-image-button" onClick={() => setZoomedImage("/images/figura-6c-esquema-conceptual-de-seleccion_300.jpg")}>
              <img src="/images/figura-6c-esquema-conceptual-de-seleccion_300.jpg" alt="Evaluación de fuente, calidad del agua y capacidad de almacenamiento" className="intro-image concept-image" />
            </button>
            <p className="concept-caption">Figura 4c. Evaluación de la fuente de agua, la calidad y la capacidad de almacenamiento. Fuente: elaboración propia.</p>
          </article>

          <article className="concept-step">
            <h3 className="concept-step-title">4. Uso final, relieve y clima</h3>
            <p className="concept-step-text">Se define el uso final del agua y se caracterizan relieve y clima que condicionan operación e infraestructura.</p>
            <button type="button" className="concept-image-button" onClick={() => setZoomedImage("/images/figura-6d-esquema-conceptual-de-seleccion_300.jpg")}>
              <img src="/images/figura-6d-esquema-conceptual-de-seleccion_300.jpg" alt="Evaluación del uso final del agua, relieve y clima" className="intro-image concept-image" />
            </button>
            <p className="concept-caption">Figura 4d. Evaluación del uso final del agua, relieve y clima. Fuente: elaboración propia.</p>
          </article>

          <article className="concept-step">
            <h3 className="concept-step-title">5. Infraestructura y componente social</h3>
            <p className="concept-step-text">Se revisa infraestructura y contexto social para priorizar el grupo de técnicas a analizar.</p>
            <button type="button" className="concept-image-button" onClick={() => setZoomedImage("/images/figura-6e-esquema-conceptual-de-seleccion_300.jpg")}>
              <img src="/images/figura-6e-esquema-conceptual-de-seleccion_300.jpg" alt="Evaluación de infraestructura y componente social" className="intro-image concept-image" />
            </button>
            <p className="concept-caption">Figura 4e. Integración de infraestructura y componente social para priorizar el grupo de técnicas MAR. Fuente: elaboración propia.</p>
          </article>
        </div>
      </div>

      {/* CTA */}
      <div className="intro-block intro-metodo-cta">
        <div className="intro-metodo-cta-inner">
          <div className="intro-metodo-text">
            <h3 className="intro-metodo-title">Metodología SIGMMA-MAR</h3>
            <p className="intro-metodo-copy">Descubra la estructura completa del sistema, explore el enfoque en tres fases y revise los resultados esperados.</p>
          </div>
          <button type="button" className="intro-metodo-button" onClick={onGoToMetodo}>
            Ir a la Metodología →
          </button>
        </div>
      </div>

      {/* Overlay zoom */}
      {zoomedImage && (
        <div className="image-zoom-overlay" onClick={() => setZoomedImage(null)}>
          <div className="image-zoom-backdrop" />
          <div className="image-zoom-content" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="image-zoom-close" onClick={() => setZoomedImage(null)}>
              ✕ Cerrar
            </button>
            <img src={zoomedImage} alt="Esquema ampliado" className="image-zoom-img" />
          </div>
        </div>
      )}
    </section>
  );
}

/* =========================================================
   METODOLOGÍA
========================================================= */
function Metodologia({ currentMetodoView, setCurrentMetodoView }) {
  const [zoomedImage, setZoomedImage] = useState(null);
  const [pendingMetodoView, setPendingMetodoView] = useState(null);

  // =========================================================
  // ✅ BLOQUEO FASE 2 y 3 HASTA COMPLETAR LOS 5 OBLIGATORIOS
  // (usa el mismo estado real que Fase 1)
  // =========================================================
  const { cases, activeCaseId } = useCasesStore();

  const currentCaseId = activeCaseId || "nuevo";
  const currentCase = (cases && cases[currentCaseId]) || (cases && cases.nuevo) || {};

  function isFilledSelect(v) {
    const s = String(v ?? "").trim();
    if (!s) return false;

    const n = s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\s-]+/g, "_");

    return n !== "no_reportado";
  }

  const canGoPhase23 = useMemo(() => {
    const tipo = currentCase?.hidraulico?.Tipo_unidad;
    const fuente =
      currentCase?.fuente?.tipo_de_fuente ?? currentCase?.fuente?.Tipo_de_fuente;
    const calidad =
      currentCase?.fuente?.categoria_calidad_mar ?? currentCase?.fuente?.Categoria_calidad_MAR;
    const norma =
      currentCase?.fuente?.cumple_norma_para_uso ?? currentCase?.fuente?.Cumple_norma_para_uso;
    const uso =
      currentCase?.comunidad?.uso_final_del_agua ?? currentCase?.comunidad?.Uso_final_del_agua;

    return (
      isFilledSelect(tipo) &&
      isFilledSelect(fuente) &&
      isFilledSelect(calidad) &&
      isFilledSelect(norma) &&
      isFilledSelect(uso)
    );
  }, [
    currentCase?.hidraulico?.Tipo_unidad,
    currentCase?.fuente?.tipo_de_fuente,
    currentCase?.fuente?.Tipo_de_fuente,
    currentCase?.fuente?.categoria_calidad_mar,
    currentCase?.fuente?.Categoria_calidad_MAR,
    currentCase?.fuente?.cumple_norma_para_uso,
    currentCase?.fuente?.Cumple_norma_para_uso,
    currentCase?.comunidad?.uso_final_del_agua,
    currentCase?.comunidad?.Uso_final_del_agua,
  ]);

  useEffect(() => {
    if (!canGoPhase23 && (currentMetodoView === "ahp" || currentMetodoView === "rf")) {
      setCurrentMetodoView("insumos");
    }
  }, [canGoPhase23, currentMetodoView, setCurrentMetodoView]);

  useEffect(() => {
    if (!pendingMetodoView || !canGoPhase23) return;
    setCurrentMetodoView(pendingMetodoView);
    setPendingMetodoView(null);
  }, [pendingMetodoView, canGoPhase23, setCurrentMetodoView]);

  useEffect(() => {
    const handleNavigate = (event) => {
      const target = event?.detail?.to;
      if (target === "insumos") {
        setCurrentMetodoView("insumos");
      }
      if (target === "fase2") {
        setCurrentMetodoView("ahp");
      }
    };

    window.addEventListener("sigmma:navigate", handleNavigate);
    return () => window.removeEventListener("sigmma:navigate", handleNavigate);
  }, [setCurrentMetodoView]);

  const handleContinueToPhase2 = useCallback(() => {
    if (canGoPhase23) {
      setCurrentMetodoView("ahp");
      return;
    }
    setPendingMetodoView("ahp");
  }, [canGoPhase23, setCurrentMetodoView]);

  const blockMsg =
    "Completa los 5 campos obligatorios (*) en Fase 1 para habilitar Fase 2 y Fase 3.";

  // =========================================================
  // ✅ FIN BLOQUEO
  // =========================================================

  return (
    <section className="metodo-section">
      <h1 className="metodo-title">Metodología SIGMMA-MAR</h1>

      <p className="metodo-text-main">
        La metodología SIGMMA-MAR organiza la selección del grupo de técnicas MAR en tres fases articuladas. La Fase 1 consolida el panel de
        insumos y la caracterización del sistema (modelos, unidades hidrogeológicas, fuente/calidad, volumen-capacidad y contexto). La Fase 2
        desarrolla el proceso jerárquico analítico (AHP integrado con SIG-MCDA) para ponderar criterios y generar mapas de idoneidad. La Fase 3 aplica modelos automáticos (árboles de decisión y bosques aleatorios) entrenados con casos para estimar la factibilidad por
        grupos y contrastar resultados. La Figura 5 sintetiza el flujo completo y cómo la información de la Fase 1 alimenta el análisis
        jerárquico y la modelación automática.
      </p>

      <div className="metodo-hero">
        <img src="/images/Metodologia_SIGMMA-MAR.png" alt="Metodología general SIGMMA-MAR" className="metodo-image" onClick={() => setZoomedImage("/images/Metodologia_SIGMMA-MAR.png")} />
        <p className="metodo-caption">Figura 5. Metodología general SIGMMA-MAR para la selección del grupo de técnicas de recarga gestionada de acuíferos. Fuente: elaboración propia.</p>
      </div>

      <div className="tabs">
  <button
    className={currentMetodoView === "insumos" ? "tab active" : "tab"}
    onClick={() => setCurrentMetodoView("insumos")}
    type="button"
  >
    <span className="tab-phase-icon">Fase 1</span> Panel de insumos
  </button>

  <button
    className={currentMetodoView === "ahp" ? "tab active" : "tab"}
    type="button"
    disabled={!canGoPhase23}
    title={!canGoPhase23 ? blockMsg : "Ir a Fase 2"}
    onClick={() => {
      if (!canGoPhase23) return;
      setCurrentMetodoView("ahp");
    }}
  >
    <span className="tab-phase-icon">Fase 2</span> Rutas metodológicas
  </button>

  <button
    className={currentMetodoView === "rf" ? "tab active" : "tab"}
    type="button"
    disabled={!canGoPhase23}
    title={!canGoPhase23 ? blockMsg : "Ir a Fase 3"}
    onClick={() => {
      if (!canGoPhase23) return;
      setCurrentMetodoView("rf");
    }}
  >
    <span className="tab-phase-icon">Fase 3</span> Resultados
  </button>
</div>

      {currentMetodoView === "insumos" && (
        <FaseInsumos onContinueToPhase2={handleContinueToPhase2} />
      )}
      {currentMetodoView === "ahp" && <FaseAHP />}
      {currentMetodoView === "rf" && <FaseRF />}

      {zoomedImage && (
        <div className="image-zoom-overlay" onClick={() => setZoomedImage(null)}>
          <div className="image-zoom-backdrop" />
          <div className="image-zoom-content" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="image-zoom-close" onClick={() => setZoomedImage(null)}>
              ✕ Cerrar
            </button>
            <img src={zoomedImage} alt="Metodología ampliada" className="image-zoom-img" />
          </div>
        </div>
      )}
    </section>
  );
}

// ✅ NUEVO: Storage compartido entre Fase 1 y Dashboard (sin tocar App)
// ✅ Storage compartido entre Fase 1 y Dashboard (seguro + compatible)
const SIGMMA_STORAGE_KEY = "sigmma_state_v1";

function deriveNextIdFromCases(casesObj) {
  const ids = Object.keys(casesObj || {}).filter((k) => /^MAR_\d+$/i.test(k));
  let maxN = 0;
  for (const id of ids) {
    const n = parseInt(String(id).split("_")[1], 10);
    if (Number.isFinite(n)) maxN = Math.max(maxN, n);
  }
  return maxN + 1 || 1;
}

function normalizeCasesObject(rawCases, fallbackCases) {
  const base = (fallbackCases && typeof fallbackCases === "object") ? fallbackCases : {};
  const obj = (rawCases && typeof rawCases === "object") ? rawCases : {};
  const merged = { ...base, ...obj };

  // ✅ asegurar siempre "nuevo"
  if (!merged.nuevo || typeof merged.nuevo !== "object") merged.nuevo = base.nuevo || {};
  return merged;
}

// ✅ Lee estado completo (cases + activeCaseId + nextId)
// ✅ Compatible con storage viejo que guardaba SOLO el objeto cases
function loadSigmmaState(fallbackCases) {
  const fallback = {
    cases: normalizeCasesObject(null, fallbackCases),
    activeCaseId: "nuevo",
    nextId: deriveNextIdFromCases(fallbackCases),
  };

  try {
    const raw = localStorage.getItem(SIGMMA_STORAGE_KEY);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return fallback;

    // compat: si antes guardaste SOLO cases (sin {cases, activeCaseId})
    const state = parsed.cases ? parsed : { cases: parsed };

    const cases = normalizeCasesObject(state.cases, fallbackCases);
    const activeCaseId = cases[state.activeCaseId] ? state.activeCaseId : "nuevo";

    const nextId =
      Number.isFinite(state.nextId) && state.nextId > 0
        ? state.nextId
        : deriveNextIdFromCases(cases);

    return { cases, activeCaseId, nextId };
  } catch {
    return fallback;
  }
}

function saveSigmmaState({ cases, activeCaseId, nextId }) {
  try {
    localStorage.setItem(
      SIGMMA_STORAGE_KEY,
      JSON.stringify({ v: 1, cases, activeCaseId, nextId })
    );
  } catch {
    // no rompas la app
  }

  // ✅ Campos obligatorios (deben mostrar asterisco)
const REQUIRED_FIELD_KEYS = new Set([
  "Tipo_unidad",
  "Tipo_de_fuente",
  "Categoria_calidad_MAR",
  "Cumple_norma_para_uso",
  "Uso_final_del_agua",
]);

const isRequiredKey = (key) => REQUIRED_FIELD_KEYS.has(key);

}

/* =========================================================
   FASE 1: INSUMOS  (CORREGIDA - DEFINITIVA)
   ✅ Conteo mínimo 5 (*) robusto (sin resolveRequiredUI)
   ✅ Aviso automático al completar 5/5: ¿Diligenciará más info? SI/NO
   ✅ Si NO: alerta ⚠️ + pasar a Fase 2
========================================================= */
function FaseInsumos({ onContinueToPhase2 } = {}) {
  const [activeTab, setActiveTab] = useState("datos"); // datos | mapas
  const [selectedModuleId, setSelectedModuleId] = useState("geologico");
  const [activeLayerId, setActiveLayerId] = useState(null);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [customLayerLabel, setCustomLayerLabel] = useState("");

  // ✅ MODALES
  const [showContinuePrompt, setShowContinuePrompt] = useState(false);
  const [showUncertaintyWarning, setShowUncertaintyWarning] = useState(false);
  const promptedMin5Ref = useRef(new Set()); // recuerda si ya mostró el aviso por caseId

  const formatMarId = (n) => `MAR_${String(n).padStart(3, "0")}`;

  const createEmptyCase = useCallback(
    () => ({
      id: "",
      nombre: "Nuevo caso MAR",
      usuario: "",
      ubicacion: "",
      mapLayersByModule: Object.fromEntries(((INSUMOS_MODULES || [])).map((m) => [m.id, []])),
      mapCustomLayersByModule: Object.fromEntries(((INSUMOS_MODULES || [])).map((m) => [m.id, []])),
      mapUploads: {}, // { [layerId]: { name, url, type, meta? } }
      mapMeta: {}, // { [layerId]: { confirmedLayer, scaleText, marks, expectedLayerLabel } }
      ...((INSUMOS_MODULES || [])).reduce((acc, mod) => ({ ...acc, [mod.id]: {} }), {}),
    }),
    []
  );

  // ✅ STORE
  const { cases, setCases, activeCaseId, setActiveCaseId } = useCasesStore();

  // ✅ SIEMPRE declarar esto arriba
  const currentCaseId = activeCaseId || "nuevo";
  const setCurrentCaseId = setActiveCaseId;

  // ✅ evita pisar storage antes de hidratar
  const [hydrated, setHydrated] = useState(false);

  // ✅ nextId coherente con lo guardado
  const [nextId, setNextId] = useState(1);

  // ✅ 1) HIDRATAR desde localStorage una sola vez
  useEffect(() => {
    const fallbackCases = { nuevo: createEmptyCase() };
    const storedState = loadSigmmaState(fallbackCases); // ✅ existe

    // ✅ garantizar que el activeCaseId guardado exista; si no, "nuevo"
    const storedActiveId =
      storedState?.activeCaseId && storedState.cases?.[storedState.activeCaseId]
        ? storedState.activeCaseId
        : "nuevo";

    // Mezcla segura: si ya hay casos en memoria, no los borres
    setCases((prev) => {
      const prevObj = prev && typeof prev === "object" ? prev : {};
      const prevHasRealCases = Object.keys(prevObj).some((k) => k !== "nuevo");

      const base = prevHasRealCases ? prevObj : (storedState?.cases || fallbackCases);

      return {
        ...fallbackCases,
        ...base,
        nuevo: base?.nuevo && typeof base.nuevo === "object" ? base.nuevo : fallbackCases.nuevo,
      };
    });

    setCurrentCaseId(storedActiveId);
    setNextId(storedState?.nextId || 1);
    setHydrated(true);
  }, [createEmptyCase, setCases, setCurrentCaseId]);

  // ✅ 2) Guardar SOLO después de hidratar
  useEffect(() => {
    if (!hydrated) return;

    saveSigmmaState({
      cases,
      activeCaseId: currentCaseId,
      nextId,
    });

    window.dispatchEvent(
      new CustomEvent("sigmma:cases-updated", {
        detail: { cases, activeCaseId: currentCaseId, nextId },
      })
    );
  }, [cases, currentCaseId, nextId, hydrated]);

  // ✅ ID mostrado cuando estás en "nuevo"
  const previewNewId = formatMarId(nextId);

  // ✅ caso actual SIEMPRE definido (evita "currentCase is not defined")
  const currentCase =
    (cases && cases[currentCaseId]) ||
    (cases && cases.nuevo) ||
    createEmptyCase();

  // ✅ solo lectura si no es "nuevo"
  const isReadOnlyCase = currentCaseId !== "nuevo" && !isEditingExisting;

  useEffect(() => {
    if (currentCaseId === "nuevo") {
      setIsEditingExisting(false);
    } else {
      setIsEditingExisting(false);
    }
  }, [currentCaseId]);

  useEffect(() => {
    setCustomLayerLabel("");
  }, [selectedModuleId]);

  // =========================================================
  // HELPERS: encontrar el id real del módulo "Caracterización del acuífero"
  // y encontrar el name real de un field dentro de MODULE_FIELDS
  // =========================================================
  const AQUIFER_MODULE_ID = useMemo(() => {
    const mods = Array.isArray(INSUMOS_MODULES) ? INSUMOS_MODULES : [];

    const byLabel =
      mods.find((m) => /caracteriz/i.test(m.label) && /acuif/i.test(m.label))?.id ||
      mods.find((m) => /acuif/i.test(m.label))?.id ||
      mods.find((m) => /caracteriz/i.test(m.label))?.id;

    return byLabel || "caracterizacion";
  }, []);

  function pickFieldName(moduleId, candidates) {
    const fields = MODULE_FIELDS?.[moduleId] || [];
    const safeCandidates = Array.isArray(candidates) ? candidates : [];
    const hit = fields.find((f) => safeCandidates.includes(f?.name));
    return hit?.name || safeCandidates[0] || "";
  }

  const DST_PORO_KEY = useMemo(
    () => pickFieldName(AQUIFER_MODULE_ID, ["Porosidad", "Porosidad_efectiva", "Porosidad_total"]),
    [AQUIFER_MODULE_ID]
  );

  const DST_PERM_KEY = useMemo(
    () =>
      pickFieldName(AQUIFER_MODULE_ID, ["Permeabilidad", "Permeabilidad_intrinseca", "K_intrinseca"]),
    [AQUIFER_MODULE_ID]
  );

  // ✅ getter seguro
  function getCaseValue(path) {
    const parts = String(path).split(".");
    let value = currentCase;

    for (let i = 0; i < parts.length; i++) {
      if (!value || typeof value !== "object") return "";
      value = value[parts[i]];
    }
    return value ?? "";
  }

  const displayedCaseId =
    currentCaseId === "nuevo" ? previewNewId : getCaseValue("id") || currentCaseId;

  // ✅ updateCase robusto
  function updateCase(path, value) {
    setCases((prev) => {
      const prevObj = prev && typeof prev === "object" ? prev : {};
      const baseCase = prevObj[currentCaseId] || prevObj.nuevo || createEmptyCase();
      const updated = { ...baseCase };

      const parts = String(path).split(".");
      let obj = updated;

      for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i];
        const next = obj[key];
        obj[key] = next && typeof next === "object" ? { ...next } : {};
        obj = obj[key];
      }

      obj[parts[parts.length - 1]] = value;

      return { ...prevObj, [currentCaseId]: updated };
    });
  }

  function normalizeModuleEntries(caseObj, moduleId) {
    const list = caseObj?.[`${moduleId}_entries`];
    if (Array.isArray(list) && list.length) return list;

    const base = caseObj?.[moduleId];
    if (base && typeof base === "object" && Object.keys(base).length) return [base];

    return [{}];
  }

  function updateModuleEntry(moduleId, entryIndex, fieldName, value) {
    if (isReadOnlyCase) return;

    setCases((prev) => {
      const prevObj = prev && typeof prev === "object" ? prev : {};
      const baseCase = prevObj[currentCaseId] || prevObj.nuevo || createEmptyCase();
      const updated = { ...baseCase };

      const entries = normalizeModuleEntries(updated, moduleId).map((e) => ({ ...(e || {}) }));
      const nextEntry = { ...(entries[entryIndex] || {}), [fieldName]: value };
      entries[entryIndex] = nextEntry;

      updated[`${moduleId}_entries`] = entries;
      updated[moduleId] = { ...(entries[0] || {}) };

      return { ...prevObj, [currentCaseId]: updated };
    });
  }

  function addModuleEntry(moduleId) {
    if (isReadOnlyCase) return;

    setCases((prev) => {
      const prevObj = prev && typeof prev === "object" ? prev : {};
      const baseCase = prevObj[currentCaseId] || prevObj.nuevo || createEmptyCase();
      const updated = { ...baseCase };

      const entries = normalizeModuleEntries(updated, moduleId).map((e) => ({ ...(e || {}) }));
      entries.push({});

      updated[`${moduleId}_entries`] = entries;
      updated[moduleId] = { ...(entries[0] || {}) };

      return { ...prevObj, [currentCaseId]: updated };
    });
  }

  function removeModuleEntry(moduleId, entryIndex) {
    if (isReadOnlyCase) return;

    setCases((prev) => {
      const prevObj = prev && typeof prev === "object" ? prev : {};
      const baseCase = prevObj[currentCaseId] || prevObj.nuevo || createEmptyCase();
      const updated = { ...baseCase };

      const entries = normalizeModuleEntries(updated, moduleId).map((e) => ({ ...(e || {}) }));
      if (entries.length <= 1) return prev;
      entries.splice(entryIndex, 1);

      updated[`${moduleId}_entries`] = entries;
      updated[moduleId] = { ...(entries[0] || {}) };

      return { ...prevObj, [currentCaseId]: updated };
    });
  }

  function normalizeUhgEntries(carData) {
    const list = Array.isArray(carData?.uhg_entries) ? carData.uhg_entries : null;
    if (list && list.length) return list;

    const legacy = {};
    let hasLegacy = false;
    (MODULE_FIELDS?.caracterizacion || []).forEach((field) => {
      const v = carData?.[field.name];
      if (v !== undefined && String(v).trim() !== "") {
        legacy[field.name] = v;
        hasLegacy = true;
      }
    });

    return hasLegacy ? [legacy] : [{}];
  }

  function setUhgEntries(nextEntries) {
    setCases((prev) => {
      const prevObj = prev && typeof prev === "object" ? prev : {};
      const baseCase = prevObj[currentCaseId] || prevObj.nuevo || createEmptyCase();
      const updated = { ...baseCase };
      const car = { ...(updated.caracterizacion || {}) };
      car.uhg_entries = nextEntries;
      updated.caracterizacion = car;
      return { ...prevObj, [currentCaseId]: updated };
    });
  }

  function updateUhgEntry(index, fieldName, value) {
    setCases((prev) => {
      const prevObj = prev && typeof prev === "object" ? prev : {};
      const baseCase = prevObj[currentCaseId] || prevObj.nuevo || createEmptyCase();
      const updated = { ...baseCase };
      const car = { ...(updated.caracterizacion || {}) };
      const list = normalizeUhgEntries(car).map((entry) => ({ ...entry }));

      while (list.length <= index) list.push({});
      list[index] = { ...(list[index] || {}), [fieldName]: value };

      car.uhg_entries = list;
      updated.caracterizacion = car;
      return { ...prevObj, [currentCaseId]: updated };
    });
  }

  function addUhgEntry() {
    const list = normalizeUhgEntries(currentCase?.caracterizacion).map((entry) => ({ ...entry }));
    list.push({});
    setUhgEntries(list);
  }

  function removeUhgEntry(index) {
    const list = normalizeUhgEntries(currentCase?.caracterizacion).map((entry) => ({ ...entry }));
    const next = list.filter((_, i) => i !== index);
    setUhgEntries(next.length ? next : [{}]);
  }

  // =========================================================
  // BLOQUEO: no permitir pasar de Hidráulico -> Hidrológico si falta Tipo_unidad
  // =========================================================
  function isFilledSelect(v) {
    const s = String(v ?? "").trim();
    if (!s) return false;

    const n = s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[^\w]+/g, "_")
      .replace(/^_+|_+$/g, "");

    if (!n) return false;
    if (n === "no_reportado" || n === "no_reporta") return false;
    if (n === "na" || n === "n_a" || n === "sin_dato" || n === "sin_informacion") return false;
    if (n.startsWith("seleccion")) return false;
    if (n.startsWith("select")) return false;

    return true;
  }

  function mustBlockModuleChange(fromModuleId, toModuleId) {
    if (fromModuleId === "hidraulico" && toModuleId === "hidrologico") {
      const v = currentCase?.hidraulico?.Tipo_unidad;
      const ok = isFilledSelect(v);
      return { ok, missingPath: ok ? null : "hidraulico.Tipo_unidad" };
    }
    return { ok: true, missingPath: null };
  }

  function trySelectModule(nextModuleId) {
    if (!nextModuleId || nextModuleId === selectedModuleId) return;

    if (isReadOnlyCase) {
      setSelectedModuleId(nextModuleId);
      setActiveLayerId(null);
      return;
    }

    const gate = mustBlockModuleChange(selectedModuleId, nextModuleId);

    if (!gate.ok) {
      requestAnimationFrame(() => {
        const el = document.querySelector(`[data-field-path="${gate.missingPath}"]`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      });

      alert("Para continuar al Modelo Hidrológico, debes diligenciar el campo obligatorio: Tipo_unidad (*)");
      return;
    }

    setSelectedModuleId(nextModuleId);
    setActiveLayerId(null);
  }

  function updateMapMeta(layerId, patch) {
    if (isReadOnlyCase) return;
    if (!layerId) return;

    setCases((prev) => {
      const updated = { ...(prev?.[currentCaseId] || createEmptyCase()) };
      updated.mapMeta = { ...(updated.mapMeta || {}) };

      const prevMeta = { ...(updated.mapMeta[layerId] || {}) };
      const nextMeta = { ...prevMeta, ...patch };

      if (patch && typeof patch === "object" && patch.marks) {
        nextMeta.marks = { ...(prevMeta.marks || {}), ...(patch.marks || {}) };
      }

      updated.mapMeta[layerId] = nextMeta;
      return { ...prev, [currentCaseId]: updated };
    });
  }

  function getMapMeta(layerId) {
    return currentCase?.mapMeta?.[layerId] || {};
  }

  function toggleLayerForModule(moduleId, layerId) {
    if (isReadOnlyCase) return;

    setCases((prev) => {
      const updated = { ...(prev?.[currentCaseId] || createEmptyCase()) };
      updated.mapLayersByModule = { ...(updated.mapLayersByModule || {}) };

      const selected = updated.mapLayersByModule[moduleId] || [];
      const exists = selected.includes(layerId);

      updated.mapLayersByModule[moduleId] = exists
        ? selected.filter((id) => id !== layerId)
        : [...selected, layerId];

      return { ...prev, [currentCaseId]: updated };
    });
  }

  function addCustomLayer(moduleId) {
    if (isReadOnlyCase) return;

    const label = String(customLayerLabel || "").trim();
    if (!label) return;

    const id = `custom-${moduleId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const newLayer = { id, label, preview: "", isCustom: true };

    setCases((prev) => {
      const updated = { ...(prev?.[currentCaseId] || createEmptyCase()) };
      const byModule = { ...(updated.mapCustomLayersByModule || {}) };
      const list = Array.isArray(byModule[moduleId]) ? [...byModule[moduleId]] : [];

      list.push(newLayer);
      byModule[moduleId] = list;
      updated.mapCustomLayersByModule = byModule;

      updated.mapLayersByModule = { ...(updated.mapLayersByModule || {}) };
      const selected = updated.mapLayersByModule[moduleId] || [];
      if (!selected.includes(id)) updated.mapLayersByModule[moduleId] = [...selected, id];

      return { ...prev, [currentCaseId]: updated };
    });

    setActiveLayerId(id);
    setCustomLayerLabel("");
  }

  function handleSaveCase() {
    if (!currentCase) return;

    if (currentCaseId === "nuevo") {
      const newId = formatMarId(nextId);

      const caseData = {
        ...currentCase,
        id: newId,
        nombre:
          currentCase.nombre && currentCase.nombre !== "Nuevo caso MAR"
            ? currentCase.nombre
            : `Caso MAR ${nextId}`,
      };

      setCases((prev) => ({
        ...prev,
        [newId]: caseData,
        nuevo: createEmptyCase(),
      }));

      setCurrentCaseId(newId);
      setNextId((n) => n + 1);

      // ✅ permitir que el aviso vuelva a aparecer cuando se vuelva a completar el mínimo en "nuevo"
      promptedMin5Ref.current.delete("nuevo");

      alert(`Caso guardado con ID ${newId}`);
      return;
    }

    alert(`Cambios guardados para ${currentCase.nombre || currentCaseId}`);
  }

  function revokeAllUploads(caseObj) {
    const uploads = caseObj?.mapUploads || {};
    Object.values(uploads).forEach((u) => {
      if (u?.url && String(u.url).startsWith("blob:")) {
        try {
          URL.revokeObjectURL(u.url);
        } catch {}
      }
    });
  }

  function purgeCaseFromStorage(caseId) {
    try {
      const raw = localStorage.getItem(SIGMMA_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          const casesObj = parsed.cases && typeof parsed.cases === "object" ? { ...parsed.cases } : {};
          delete casesObj[caseId];
          localStorage.setItem(
            SIGMMA_STORAGE_KEY,
            JSON.stringify({ ...parsed, cases: casesObj, activeCaseId: "nuevo" })
          );
        }
      }
    } catch {}

    try {
      const rawCases = localStorage.getItem("sigmma.cases.v1");
      if (rawCases) {
        const parsedCases = JSON.parse(rawCases);
        if (parsedCases && typeof parsedCases === "object") {
          const nextCases = { ...parsedCases };
          delete nextCases[caseId];
          localStorage.setItem("sigmma.cases.v1", JSON.stringify(nextCases));
        }
      }
    } catch {}

    try {
      localStorage.removeItem("sigmma.activeCaseId.v1");
    } catch {}
  }

  function handleDeleteCase() {
    if (currentCaseId === "nuevo") return;

    const ok = window.confirm(`¿Eliminar el caso ${currentCaseId}? Esta acción no se puede deshacer.`);
    if (!ok) return;

    revokeAllUploads(currentCase);

    setCases((prev) => {
      const copy = { ...(prev || {}) };
      delete copy[currentCaseId];
      return copy;
    });

    setCurrentCaseId("nuevo");
    purgeCaseFromStorage(currentCaseId);
  }

  function handleResetAll() {
    const ok = window.confirm(
      "¿Reiniciar todos los casos? Se eliminarán los casos guardados y se reiniciará el contador."
    );
    if (!ok) return;

    Object.values(cases || {}).forEach((c) => revokeAllUploads(c));

    setCases({
      nuevo: createEmptyCase(),
      MAR_001: {
        ...createEmptyCase(),
        id: "MAR_001",
        nombre: "Recarga Valle de Aburrá (Antioquia, Colombia)",
      },
    });

    setCurrentCaseId("nuevo");
    setNextId(2);

    // ✅ reset del aviso
    promptedMin5Ref.current = new Set();
    setShowContinuePrompt(false);
    setShowUncertaintyWarning(false);
  }

  // =========================================================
  // ✅ MÍNIMO (5 campos) ROBUSTO (NO depende de moduleId)
  // =========================================================
  const MIN_REQUIRED_5 = useMemo(
    () => [
      { key: "Tipo_unidad", label: "Tipo de acuífero (Tipo_unidad)", kind: "select" },
      { key: "tipo_de_fuente", label: "Fuente de agua (Tipo_de_fuente)", kind: "select" },
      { key: "categoria_calidad_mar", label: "Calidad del agua fuente (Categoria_calidad_MAR)", kind: "select" },
      { key: "cumple_norma_para_uso", label: "Normativa para la recarga (Cumple_norma_para_uso)", kind: "select" },
      { key: "uso_final_del_agua", label: "Uso final (Uso_final_del_agua)", kind: "select" },
    ],
    []
  );

  function normKey(s) {
    return String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  const REQUIRED_KEYS_SET = useMemo(
    () => new Set(MIN_REQUIRED_5.map((x) => normKey(x.key))),
    [MIN_REQUIRED_5]
  );

  // ✅ busca un key dentro del caso, sin importar el nombre real del módulo
  function getValueByKeyAnywhere(caseObj, key) {
    if (!caseObj || typeof caseObj !== "object") return undefined;

    // 1) Prioridad: recorrer módulos declarados (evita entrar a mapMeta, etc.)
    for (const mod of (INSUMOS_MODULES || [])) {
      const modId = mod?.id;
      if (!modId) continue;
      const v = caseObj?.[modId]?.[key];
      if (v !== undefined) return v;
    }

    // 2) Fallback: recorrer cualquier objeto dentro del caso
    for (const [, maybeObj] of Object.entries(caseObj)) {
      if (!maybeObj || typeof maybeObj !== "object") continue;
      if (Object.prototype.hasOwnProperty.call(maybeObj, key)) return maybeObj[key];
    }

    return undefined;
  }

  
  function validateMinimum5(caseObj) {
    const missing = [];

    for (const f of MIN_REQUIRED_5) {
      const v = getValueByKeyAnywhere(caseObj, f.key);

      // 🔍 DEBUG temporal
      console.log(`[MIN5] Validando "${f.key}"`, { 
        valor: v, 
        filled: f.kind === "select" ? isFilledSelect(v) : String(v ?? "").trim().length > 0 
      });

      const ok =
        f.kind === "select"
          ? isFilledSelect(v)
          : String(v ?? "").trim().length > 0;

      if (!ok) missing.push(f);
    }

    console.log(`[MIN5] Resultado: ${MIN_REQUIRED_5.length - missing.length}/${MIN_REQUIRED_5.length}`, { missing });

    return {
      ok: missing.length === 0,
      missing,
      done: MIN_REQUIRED_5.length - missing.length,
      total: MIN_REQUIRED_5.length,
    };
  }

  const minScenario = useMemo(() => validateMinimum5(currentCase), [currentCase, MIN_REQUIRED_5]);
  const minProgress = `${minScenario.done}/${minScenario.total}`;

  function shouldShowAsterisk(_moduleId, fieldName) {
    return REQUIRED_KEYS_SET.has(normKey(fieldName));
  }

  // ✅ Mostrar aviso AUTOMÁTICO al completar 5/5 (solo en modo edición)
  useEffect(() => {
    if (!hydrated) return;
    if (isReadOnlyCase) return;

    // si vuelve a estar incompleto, permitimos que el aviso se muestre otra vez
    if (!minScenario.ok) {
      promptedMin5Ref.current.delete(currentCaseId);
      return;
    }

    if (minScenario.ok && !promptedMin5Ref.current.has(currentCaseId)) {
      setShowContinuePrompt(true);
      promptedMin5Ref.current.add(currentCaseId);
    }

    // evento opcional por si tu menú habilita botones por fuera
    try {
      window.dispatchEvent(
        new CustomEvent("sigmma:min5-updated", {
          detail: { caseId: currentCaseId, ok: minScenario.ok, done: minScenario.done, total: minScenario.total },
        })
      );
    } catch {}
  }, [minScenario.ok, hydrated, isReadOnlyCase, currentCaseId, minScenario.done, minScenario.total]);

  // ✅ Navegar a Fase 2 (se llama SOLO cuando el usuario confirma NO + warning)
  function proceedToPhase2() {
    const check = validateMinimum5(currentCase);

    if (!check.ok) {
      alert(
        "Para habilitar Fase 2 debes diligenciar información en los 5 campos obligatorios marcados con (*):\n\n- " +
          check.missing.map((x) => x.label).join("\n- ")
      );
      return;
    }

    const doNavigate = () => {
      if (typeof onContinueToPhase2 === "function") {
        onContinueToPhase2();
        return;
      }
      try {
        window.dispatchEvent(new CustomEvent("sigmma:navigate", { detail: { to: "fase2", caseId: currentCaseId } }));
      } catch {}
      try {
        window.location.hash = "#fase2";
      } catch {}
    };

    if (currentCaseId === "nuevo") {
      const newId = formatMarId(nextId);

      const caseData = {
        ...currentCase,
        id: newId,
        nombre:
          currentCase.nombre && currentCase.nombre !== "Nuevo caso MAR"
            ? currentCase.nombre
            : `Caso MAR ${nextId}`,
      };

      setCases((prev) => ({
        ...prev,
        [newId]: caseData,
        nuevo: createEmptyCase(),
      }));

      setCurrentCaseId(newId);
      setNextId((n) => n + 1);

      // navegar en el siguiente tick para asegurar estado actualizado
      setTimeout(doNavigate, 0);
      return;
    }

    doNavigate();
  }

  // ✅ Click del botón (si no está completo, explica; si sí, abre el aviso)
  function handleContinueToPhase2Click() {
    const check = validateMinimum5(currentCase);
    if (!check.ok) {
      alert(
        "Para habilitar Fase 2 debes diligenciar información en los 5 campos obligatorios marcados con (*):\n\n- " +
          check.missing.map((x) => x.label).join("\n- ")
      );
      return;
    }
    setShowContinuePrompt(true);
  }

  // =========================================================
  // MODALES (inline, no dependen de CSS)
  // =========================================================
  const modalBackdropStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.45)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  };

  const modalStyle = {
    width: "min(560px, 92vw)",
    background: "#fff",
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,.12)",
    boxShadow: "0 12px 40px rgba(0,0,0,.22)",
    padding: 16,
  };

  const modalTitleStyle = { fontWeight: 900, fontSize: 16, marginBottom: 10 };
  const modalBodyStyle = { fontSize: 14, opacity: 0.9, lineHeight: 1.35 };
  const modalActionsStyle = { display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 14 };

  const btnPrimary = {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,.14)",
    background: "#0ea5e9",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  };

  const btnGhost = {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,.14)",
    background: "#fff",
    color: "#111827",
    fontWeight: 900,
    cursor: "pointer",
  };

  const btnDanger = {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(220,38,38,.35)",
    background: "rgba(220,38,38,.08)",
    color: "#b91c1c",
    fontWeight: 900,
    cursor: "pointer",
  };

  /* =========================
     VALIDACIÓN FUERTE POR NOMBRE (TOKENS)
  ========================= */
  function normToken(s) {
    return String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9_ -]/g, "");
  }

  function unique(arr) {
    return Array.from(new Set(arr.filter(Boolean)));
  }

  function deriveTokensFromLabel(labelRaw) {
    const label = normToken(labelRaw);
    const words = label
      .split(/[\s/_-]+/g)
      .map((w) => w.trim())
      .filter((w) => w.length >= 4);

    const tokens = [...words];

    if (label.includes("geolog")) tokens.push("geologia", "geologico", "geologic", "geology", "litologia", "lithology");
    if (label.includes("lineamiento") || label.includes("estructura")) tokens.push("lineament", "fault", "falla", "estructura", "lineamiento");
    if (label.includes("densidad")) tokens.push("densidad", "density");
    if (label.includes("uso") || label.includes("suelo") || label.includes("cobertura")) tokens.push("landuse", "land_use", "cover", "cobertura");
    if (label.includes("drenaj")) tokens.push("drenaje", "drenajes", "drainage", "stream", "rio", "river");
    if (label.includes("nivel") && (label.includes("freat") || label.includes("piez"))) tokens.push("freatico", "water_table", "piezometrico", "piezometr");
    if (label.includes("recarga")) tokens.push("recarga", "recharge");
    if (label.includes("precipit")) tokens.push("precipitacion", "precip", "lluvia", "rain");
    if (label.includes("unidad") || label.includes("uhg")) tokens.push("unidad", "unidades", "uhg", "hydrogeolog", "acuifero", "aquifer");
    if (label.includes("pendiente") || label.includes("slope")) tokens.push("slope", "pendiente");

    return unique(tokens);
  }

  function fileMatchesTokens(file, tokens) {
    const name = normToken(file?.name || "");
    if (!tokens || !tokens.length) return true;
    return tokens.some((t) => name.includes(normToken(t)));
  }

  function findLayerDefById(layerId) {
    for (const modId of Object.keys(MAP_LAYERS_BY_MODULE || {})) {
      const arr = getAllLayersByModule(currentCase, modId);
      const found = arr.find((x) => x.id === layerId);
      if (found) return found;
    }
    return null;
  }

  /* =========================
     UMBRALES Y OPTIMIZACIÓN DE IMÁGENES
  ========================= */
  const MAX_IMAGE_SIDE = 4500;
  const MAX_IMAGE_MEGAPIXELS = 35;
  const MAX_IMAGE_MB = 40;

  function isProbablyImageFile(file) {
    if (!file) return false;
    if (file.type && String(file.type).startsWith("image/")) return true;
    return /\.(png|jpe?g|webp|gif)$/i.test(file.name || "");
  }

  async function decodeImageSource(file) {
    try {
      const bmp = await createImageBitmap(file);
      return {
        kind: "bitmap",
        source: bmp,
        width: bmp.width,
        height: bmp.height,
        cleanup: () => bmp.close?.(),
      };
    } catch {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.decoding = "async";
      img.src = url;

      await new Promise((resolve, reject) => {
        img.onload = () => resolve(true);
        img.onerror = () => reject(new Error("No se pudo decodificar la imagen."));
      });

      return {
        kind: "img",
        source: img,
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        cleanup: () => {
          try {
            URL.revokeObjectURL(url);
          } catch {}
        },
      };
    }
  }

  async function optimizeImageIfNeeded(file) {
    const mb = file.size / (1024 * 1024);

    if (mb > 200) {
      throw new Error(`El archivo pesa ${mb.toFixed(1)}MB. Es demasiado grande para el navegador.`);
    }

    const decoded = await decodeImageSource(file);
    const w = decoded.width;
    const h = decoded.height;
    const mp = (w * h) / 1e6;

    const tooBig = mp > MAX_IMAGE_MEGAPIXELS || mb > MAX_IMAGE_MB || Math.max(w, h) > MAX_IMAGE_SIDE;

    if (!tooBig) {
      decoded.cleanup?.();
      return {
        file,
        meta: { origW: w, origH: h, outW: w, outH: h, downscaled: false, origMB: mb },
      };
    }

    const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(w, h));
    const outW = Math.max(1, Math.round(w * scale));
    const outH = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;

    const ctx = canvas.getContext("2d", { alpha: true });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(decoded.source, 0, 0, outW, outH);

    decoded.cleanup?.();

    const targetType = file.type === "image/jpeg" ? "image/jpeg" : "image/png";

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("No se pudo convertir la imagen (toBlob)."))),
        targetType,
        targetType === "image/jpeg" ? 0.92 : undefined
      );
    });

    const optimizedFile = new File([blob], file.name, { type: targetType, lastModified: Date.now() });

    return {
      file: optimizedFile,
      meta: {
        origW: w,
        origH: h,
        outW,
        outH,
        downscaled: true,
        origMB: mb,
        outMB: optimizedFile.size / (1024 * 1024),
      },
    };
  }

  /* =========================
     CARGA / QUITAR MAPAS POR CAPA
  ========================= */
  async function handleUploadMap(layerId, file, moduleIdForSelection, expectedLayerLabel) {
    if (isReadOnlyCase) return;
    if (!layerId || !file) return;

    const layerDef = findLayerDefById(layerId);
    const tokens =
      (layerDef && Array.isArray(layerDef.tokens) && layerDef.tokens.length ? layerDef.tokens : null) ||
      deriveTokensFromLabel(expectedLayerLabel || layerDef?.label || "");

    if (!layerDef?.isCustom && !fileMatchesTokens(file, tokens)) {
      alert(
        `Archivo rechazado para la capa "${expectedLayerLabel || layerDef?.label || layerId}".\n\n` +
          `Para evitar errores, el NOMBRE del archivo debe contener al menos 1 token esperado.\n\n` +
          `Tokens aceptados (ejemplos):\n- ${tokens.slice(0, 10).join("\n- ")}${tokens.length > 10 ? "\n- ..." : ""}\n\n` +
          `Ejemplo válido: "${normToken(tokens[0] || "capa")}_valle_aburra.png"`
      );
      return;
    }

    let processedFile = file;
    let processMeta = null;

    if (isProbablyImageFile(file)) {
      try {
        const optimized = await optimizeImageIfNeeded(file);
        processedFile = optimized.file;
        processMeta = optimized.meta;
      } catch (err) {
        alert(
          `No se pudo procesar "${file.name}".\n\n` +
            `Prueba reexportar en ArcGIS como PNG 8-bit o JPG.\n\n` +
            `Detalle: ${err?.message || err}`
        );
        return;
      }
    }

    const objectUrl = URL.createObjectURL(processedFile);

    setCases((prev) => {
      const updated = { ...prev[currentCaseId] };

      updated.mapUploads = { ...(updated.mapUploads || {}) };
      const old = updated.mapUploads[layerId];
      if (old?.url && String(old.url).startsWith("blob:")) {
        try {
          URL.revokeObjectURL(old.url);
        } catch {}
      }

      updated.mapUploads[layerId] = {
        name: file.name,
        url: objectUrl,
        type: processedFile.type || file.type || "",
        meta: processMeta || null,
      };

      updated.mapMeta = { ...(updated.mapMeta || {}) };

      const prevMeta = updated.mapMeta[layerId] ? { ...updated.mapMeta[layerId] } : {};

      updated.mapMeta[layerId] = {
        ...prevMeta,
        expectedLayerLabel: expectedLayerLabel || prevMeta.expectedLayerLabel || layerDef?.label || "",
        confirmedLayer: false,
        scaleText: "",
        marks: { north: null, scale: null, legend: null, polygon: null },
      };

      if (moduleIdForSelection) {
        updated.mapLayersByModule = { ...(updated.mapLayersByModule || {}) };
        const selected = updated.mapLayersByModule[moduleIdForSelection] || [];
        if (!selected.includes(layerId)) updated.mapLayersByModule[moduleIdForSelection] = [...selected, layerId];
      }

      return { ...prev, [currentCaseId]: updated };
    });
  }

  function handleRemoveMap(layerId) {
    if (isReadOnlyCase) return;
    if (!layerId) return;

    setCases((prev) => {
      const updated = { ...prev[currentCaseId] };

      const uploads = { ...(updated.mapUploads || {}) };
      const old = uploads[layerId];
      if (old?.url && String(old.url).startsWith("blob:")) {
        try {
          URL.revokeObjectURL(old.url);
        } catch {}
      }
      delete uploads[layerId];
      updated.mapUploads = uploads;

      updated.mapMeta = { ...(updated.mapMeta || {}) };
      updated.mapMeta[layerId] = {
        ...(updated.mapMeta[layerId] || {}),
        confirmedLayer: false,
        scaleText: "",
        marks: { north: null, scale: null, legend: null, polygon: null },
      };

      return { ...prev, [currentCaseId]: updated };
    });
  }

  function getLayerPreviewSrc(layer, caseObj = currentCase) {
    if (!layer?.id) return "";
    const uploaded = caseObj?.mapUploads?.[layer.id];
    return uploaded?.url || layer.preview || "";
  }

  function isImageUploadForLayer(layer, caseObj = currentCase) {
    const up = caseObj?.mapUploads?.[layer?.id];
    if (!up) return false;
    if (up.type) return String(up.type).startsWith("image/");
    return /\.(png|jpe?g|webp|gif)$/i.test(up.name || "");
  }

  /* =========================
     IMAGE MARKER
  ========================= */
  function ImageMarker({ src, layerId, meta, disabled }) {
    const [mode, setMode] = useState(null);
    const [drag, setDrag] = useState(null);
    const [boxEl, setBoxEl] = useState(null);

    const marks = meta?.marks || {};
    const requiredKeys = ["north", "scale", "legend", "polygon"];

    function rectFromDrag(d) {
      const x = Math.min(d.x0, d.x1);
      const y = Math.min(d.y0, d.y1);
      const w = Math.abs(d.x1 - d.x0);
      const h = Math.abs(d.y1 - d.y0);
      if (w < 0.01 || h < 0.01) return null;
      return { x, y, w, h };
    }

    function toFrac(clientX, clientY) {
      if (!boxEl) return null;
      const r = boxEl.getBoundingClientRect();
      const x = (clientX - r.left) / r.width;
      const y = (clientY - r.top) / r.height;
      return {
        x: Math.max(0, Math.min(1, x)),
        y: Math.max(0, Math.min(1, y)),
      };
    }

    function setMark(key, rect) {
      updateMapMeta(layerId, {
        marks: { ...(marks || {}), [key]: rect },
      });
    }

    function clearMark(key) {
      updateMapMeta(layerId, {
        marks: { ...(marks || {}), [key]: null },
      });
    }

    function boxStyle(fr) {
      if (!fr) return { display: "none" };
      return {
        position: "absolute",
        left: `${fr.x * 100}%`,
        top: `${fr.y * 100}%`,
        width: `${fr.w * 100}%`,
        height: `${fr.h * 100}%`,
        border: "2px solid rgba(37,99,235,.95)",
        borderRadius: 10,
        pointerEvents: "none",
      };
    }

    return (
      <div style={{ marginTop: 12, border: "1px dashed rgba(0,0,0,.18)", borderRadius: 12, padding: 12 }}>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>Marcación obligatoria</div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          <button type="button" disabled={disabled} onClick={() => setMode("north")} style={{ padding: "7px 10px", borderRadius: 10, border: "1px solid rgba(0,0,0,.15)", background: mode === "north" ? "rgba(37,99,235,.10)" : "#fff", fontWeight: 800, cursor: "pointer" }}>
            Marcar Norte
          </button>
          <button type="button" disabled={disabled} onClick={() => setMode("scale")} style={{ padding: "7px 10px", borderRadius: 10, border: "1px solid rgba(0,0,0,.15)", background: mode === "scale" ? "rgba(37,99,235,.10)" : "#fff", fontWeight: 800, cursor: "pointer" }}>
            Marcar Escala
          </button>
          <button type="button" disabled={disabled} onClick={() => setMode("legend")} style={{ padding: "7px 10px", borderRadius: 10, border: "1px solid rgba(0,0,0,.15)", background: mode === "legend" ? "rgba(37,99,235,.10)" : "#fff", fontWeight: 800, cursor: "pointer" }}>
            Marcar Leyenda
          </button>
          <button type="button" disabled={disabled} onClick={() => setMode("polygon")} style={{ padding: "7px 10px", borderRadius: 10, border: "1px solid rgba(0,0,0,.15)", background: mode === "polygon" ? "rgba(37,99,235,.10)" : "#fff", fontWeight: 800, cursor: "pointer" }}>
            Marcar Polígono
          </button>
          <button type="button" onClick={() => setMode(null)} style={{ padding: "7px 10px", borderRadius: 10, border: "1px solid rgba(0,0,0,.15)", background: "#fff", fontWeight: 800, opacity: 0.8, cursor: "pointer" }}>
            Salir
          </button>
        </div>

        <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 10 }}>
          {mode ? (
            <>
              Modo activo: <strong>{mode}</strong>. Arrastra sobre la imagen para marcar.
            </>
          ) : (
            <>Selecciona un modo para marcar sobre la imagen.</>
          )}
        </div>

        <div
          ref={setBoxEl}
          style={{ position: "relative", borderRadius: 12, overflow: "hidden" }}
          onMouseDown={(e) => {
            if (disabled || !mode) return;
            const p = toFrac(e.clientX, e.clientY);
            if (!p) return;
            setDrag({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
          }}
          onMouseMove={(e) => {
            if (!drag) return;
            const p = toFrac(e.clientX, e.clientY);
            if (!p) return;
            setDrag((d) => ({ ...d, x1: p.x, y1: p.y }));
          }}
          onMouseUp={() => {
            if (!drag || disabled || !mode) return;
            const rect = rectFromDrag(drag);
            setDrag(null);
            if (!rect) return;
            setMark(mode, rect);
          }}
          onMouseLeave={() => setDrag(null)}
        >
          <img src={src} alt="preview" className="insumos-map-image" draggable={false} />

          {requiredKeys.map((k) => (
            <div key={k} style={boxStyle(marks?.[k])}>
              <div style={{ position: "absolute", top: -10, left: 8, background: "#2563eb", color: "#fff", fontSize: 11, padding: "2px 6px", borderRadius: 999, pointerEvents: "none" }}>
                {k}
              </div>

              {!disabled && marks?.[k] ? (
                <button
                  type="button"
                  onClick={() => clearMark(k)}
                  title="Quitar marca"
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    border: 0,
                    background: "rgba(220,38,38,.92)",
                    color: "#fff",
                    fontWeight: 900,
                    cursor: "pointer",
                    pointerEvents: "auto",
                  }}
                >
                  ×
                </button>
              ) : null}
            </div>
          ))}

          {drag && rectFromDrag(drag) ? (
            <div style={{ ...boxStyle(rectFromDrag(drag)), borderStyle: "dashed", opacity: 0.8 }} />
          ) : null}
        </div>
      </div>
    );
  }

  /* =========================
     EXPORT PDF
  ========================= */
  function exportCaseToPDF(caseData) {
    const escapeHtml = (s) =>
      String(s ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

    const issues = [];
    INSUMOS_MODULES.forEach((m) => {
      const layers = getAllLayersByModule(caseData, m.id);
      layers.forEach((layer) => {
        const up = caseData?.mapUploads?.[layer.id];
        if (!up?.url) return;

        const meta = caseData?.mapMeta?.[layer.id] || {};
        const marks = meta.marks || {};

        if (!meta.confirmedLayer) issues.push(`${m.label} / ${layer.label}: falta confirmación de capa`);
        if (!String(meta.scaleText || "").trim()) issues.push(`${m.label} / ${layer.label}: falta Escala (texto)`);
        if (!marks.north) issues.push(`${m.label} / ${layer.label}: falta marcar Norte en la imagen`);
        if (!marks.scale) issues.push(`${m.label} / ${layer.label}: falta marcar Escala en la imagen`);
        if (!marks.legend) issues.push(`${m.label} / ${layer.label}: falta marcar Leyenda en la imagen`);
        if (!marks.polygon) issues.push(`${m.label} / ${layer.label}: falta marcar Polígono en la imagen`);
      });
    });

    if (issues.length) {
      alert("No se puede exportar. Completa los mínimos en Mapas relacionados:\n\n- " + issues.join("\n- "));
      return;
    }

    const modulesHtml = INSUMOS_MODULES.map((m) => {
      const fields = MODULE_FIELDS[m.id] || [];
      const entries =
        Array.isArray(caseData?.[`${m.id}_entries`]) && caseData[`${m.id}_entries`].length
          ? caseData[`${m.id}_entries`]
          : [caseData[m.id] || {}];

      const blocks = entries
        .map((values, idx) => {
          const rows = fields
            .map((f) => {
              const v = values?.[f.name] ?? "";
              if (!String(v).trim()) return "";
              return `
            <tr>
              <td style="padding:8px;border:1px solid #e5e7eb;width:35%;font-weight:700;">${escapeHtml(f.label)}</td>
              <td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(v)}</td>
            </tr>`;
            })
            .join("");

          if (!rows.trim()) return "";

          return `
        ${entries.length > 1 ? `<div style="margin:10px 0 6px 0;font-weight:700;">Registro ${idx + 1}</div>` : ""}
        <table style="border-collapse:collapse;width:100%;font-size:12px;">
          ${rows}
        </table>`;
        })
        .filter(Boolean)
        .join("");

      if (!blocks.trim()) return "";

      return `
        <h2 style="margin:18px 0 8px 0;font-size:16px;">${escapeHtml(m.label)}</h2>
        ${blocks}`;
    }).join("");

    const selectedMaps = [];
    INSUMOS_MODULES.forEach((m) => {
      const layers = getAllLayersByModule(caseData, m.id);
      layers.forEach((layer) => {
        const up = caseData?.mapUploads?.[layer.id];
        if (up?.url) selectedMaps.push({ ...layer, groupLabel: m.label, upload: up });
      });
    });

    const layersSummary = INSUMOS_MODULES.map((m) => {
      const layers = getAllLayersByModule(caseData, m.id);
      const withFile = layers.filter((l) => caseData?.mapUploads?.[l.id]?.url);
      if (!withFile.length) return "";
      return `<li><strong>${escapeHtml(m.label)}:</strong> ${escapeHtml(withFile.map((l) => l.label).join(", "))}</li>`;
    }).join("");

    const mapsHtml = selectedMaps
      .map((layer, idx) => {
        const src = layer.upload?.url || layer.preview || "";
        const isImg = layer.upload?.type ? String(layer.upload.type).startsWith("image/") : /\.(png|jpe?g|webp|gif)$/i.test(layer.upload?.name || "");

        return `
          <div class="page-break"></div>
          <h2 style="margin:0 0 6px 0;font-size:16px;">Mapa ${idx + 1}: ${escapeHtml(layer.label)}</h2>
          <p style="margin:0 0 10px 0;font-size:12px;color:#374151;">
            <strong>Módulo:</strong> ${escapeHtml(layer.groupLabel)}
          </p>
          <div style="border:1px solid #e5e7eb;border-radius:10px;padding:10px;">
            ${
              isImg
                ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(layer.label)}"
                    style="width:100%;height:auto;max-height:92vh;object-fit:contain;image-rendering:-webkit-optimize-contrast;" />`
                : `<div style="font-size:12px;color:#111827;">
                    Archivo cargado para esta capa, pero no es una imagen exportable en PDF: <strong>${escapeHtml(layer.upload?.name || "")}</strong>
                  </div>`
            }
          </div>
        `;
      })
      .join("");

    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) {
      alert("No se pudo abrir la ventana de exportación. Revisa bloqueadores de pop-ups.");
      return;
    }

    const html = `
      <html>
        <head>
          <title>Ficha SIGMMA-MAR - ${escapeHtml(caseData.id || "sin ID")}</title>
          <meta charset="utf-8" />
          <style>
            body { font-family: "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif; padding: 24px; color:#111827; }
            h1 { margin:0 0 6px 0; font-size: 20px; }
            p { margin: 0 0 10px 0; font-size: 12px; color:#374151; }
            .box { border:1px solid #e5e7eb; border-radius: 10px; padding: 12px; margin-top: 12px; }
            .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 8px; }
            .kv { border:1px solid #e5e7eb; border-radius: 8px; padding: 10px; }
            .k { font-weight: 800; font-size: 12px; color:#111827; }
            .v { font-size: 12px; color:#111827; margin-top: 4px; white-space: pre-wrap; }
            .page-break { page-break-before: always; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>Ficha técnica SIGMMA-MAR</h1>
          <p><strong>ID:</strong> ${escapeHtml(caseData.id || "sin ID")} &nbsp; | &nbsp; <strong>Nombre:</strong> ${escapeHtml(caseData.nombre || "")}</p>

          <div class="box">
            <div class="grid">
              <div class="kv"><div class="k">Usuario</div><div class="v">${escapeHtml(caseData.usuario || "")}</div></div>
              <div class="kv"><div class="k">Ubicación</div><div class="v">${escapeHtml(caseData.ubicacion || "")}</div></div>
            </div>
          </div>

          <div class="box">
            <div class="k" style="margin-bottom:6px;">Mapas cargados por capa</div>
            <ul style="margin:0; padding-left:18px; font-size:12px;">
              ${layersSummary || `<li>No se cargaron mapas por capa.</li>`}
            </ul>
          </div>

          ${modulesHtml ? `<div class="box" style="margin-top:16px;">${modulesHtml}</div>` : ""}

          ${
            selectedMaps.length
              ? `
                <div class="box" style="margin-top:16px;">
                  <div class="k" style="margin-bottom:6px;">Mapas</div>
                  <p style="margin:0;font-size:12px;color:#374151;">
                    Se exportan ${selectedMaps.length} mapa(s) cargado(s), uno por página.
                  </p>
                </div>
                ${mapsHtml}
              `
              : `
                <div class="box" style="margin-top:16px;">
                  <div class="k" style="margin-bottom:6px;">Mapas</div>
                  <p style="margin:0;font-size:12px;color:#374151;">No se cargaron mapas para exportar.</p>
                </div>
              `
          }

          <script>
            window.onload = () => { window.print(); };
          </script>
        </body>
      </html>
    `;

    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  /* =========================
     VARIABLES DE UI DEL MÓDULO ACTIVO
  ========================= */
  const currentModule = INSUMOS_MODULES.find((m) => m.id === selectedModuleId) || INSUMOS_MODULES[0];
  const rightPanelClass = activeTab === "datos" ? `fase-insumos-right ${currentModule.colorClass}` : "fase-insumos-right";

  const fieldDefs = MODULE_FIELDS[selectedModuleId] || [];
  const uhgEntries =
    selectedModuleId === "caracterizacion"
      ? normalizeUhgEntries(currentCase?.caracterizacion)
      : [];
  const moduleEntries = useMemo(
    () => normalizeModuleEntries(currentCase, selectedModuleId),
    [currentCase, selectedModuleId]
  );
  const moduleLayers = getAllLayersByModule(currentCase, selectedModuleId);
  const selectedLayerIds = currentCase.mapLayersByModule?.[selectedModuleId] || [];

  const layersForViewer = useMemo(() => {
    if (activeTab === "datos") return moduleLayers;
    return moduleLayers.filter((l) => selectedLayerIds.includes(l.id));
  }, [activeTab, moduleLayers, selectedLayerIds]);

  const activeLayer = useMemo(() => {
    const found = layersForViewer.find((l) => l.id === activeLayerId);
    return found || layersForViewer[0] || null;
  }, [layersForViewer, activeLayerId]);

  const activeUpload = activeLayer ? currentCase.mapUploads?.[activeLayer.id] : null;

  const viewerLayer = activeLayer;
  const viewerUpload = viewerLayer ? currentCase.mapUploads?.[viewerLayer.id] : null;
  const viewerMeta = viewerLayer ? getMapMeta(viewerLayer.id) : {};
  const viewerMarks = viewerMeta?.marks || {};
  const viewerPreviewSrc = viewerLayer ? getLayerPreviewSrc(viewerLayer) : "";
  const viewerCanShow = Boolean(viewerPreviewSrc) && viewerLayer && isImageUploadForLayer(viewerLayer);
  const viewerMissing = [];

  if (viewerLayer && viewerUpload?.name) {
    if (!viewerMeta.confirmedLayer) viewerMissing.push("confirmación de capa");
    if (!String(viewerMeta.scaleText || "").trim()) viewerMissing.push("Escala (texto)");
    if (!viewerMarks.north) viewerMissing.push("marcar Norte");
    if (!viewerMarks.scale) viewerMissing.push("marcar Escala");
    if (!viewerMarks.legend) viewerMissing.push("marcar Leyenda");
    if (!viewerMarks.polygon) viewerMissing.push("marcar Polígono");
  }

/* =========================================================
     RENDER
  ========================================================= */
  return (
    <div className="fase-insumos-wrapper">
      {/* ✅ MODAL 1: Pregunta SI/NO */}
      {showContinuePrompt && (
        <div style={modalBackdropStyle} role="dialog" aria-modal="true">
          <div style={modalStyle}>
            <div style={modalTitleStyle}>¿Diligenciará más información?</div>
            <div style={modalBodyStyle}>
              Si eliges <strong>SI</strong>, continúas completando los insumos que desees.  
              Si eliges <strong>NO</strong>, pasarás a Fase 2 con información mínima (mayor incertidumbre).
            </div>
            <div style={modalActionsStyle}>
              <button
                type="button"
                style={btnGhost}
                onClick={() => {
                  setShowContinuePrompt(false);
                }}
              >
                SI
              </button>
              <button
                type="button"
                style={btnPrimary}
                onClick={() => {
                  setShowContinuePrompt(false);
                  setShowUncertaintyWarning(true);
                }}
              >
                NO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ MODAL 2: Advertencia + continuar */}
      {showUncertaintyWarning && (
        <div style={modalBackdropStyle} role="dialog" aria-modal="true">
          <div style={modalStyle}>
            <div style={modalTitleStyle}>
              <span style={{ marginRight: 8 }}>⚠️</span> Advertencia
            </div>
            <div style={modalBodyStyle}>
              <strong>LA INCERTIDUMBRE EN LA DECISIÓN AUMENTA</strong> cuando la información cuenta únicamente con las 5 variables con (*).
            </div>
            <div style={modalActionsStyle}>
              <button
                type="button"
                style={btnGhost}
                onClick={() => setShowUncertaintyWarning(false)}
              >
                Volver
              </button>
              <button
                type="button"
                style={btnDanger}
                onClick={() => {
                  setShowUncertaintyWarning(false);
                  proceedToPhase2();
                }}
              >
                Continuar a Fase 2
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="fase-insumos-intro">
        El éxito del análisis técnico reside en la solidez de sus datos base. Este módulo inicial se dedica 
        a la integración y organización de la información necesaria para caracterizar el sistema hidrogeológico. 
        A través de un panel centralizado, se consolidan variables críticas como modelos técnicos, calidad del agua, 
        capacidad del acuífero e infraestructura existente. Esta estructura no solo garantiza la trazabilidad del caso, 
        sino que constituye el insumo fundamental para alimentar las fases posteriores de procesamiento jerárquico y 
        modelación automatizada.
      </p>
      
      <p className="fase-insumos-intro">
        Para avanzar con éxito en su proyecto, lo invitamos a consolidar la base de datos de su estudio a través del Panel de Insumos MAR.
        Para comenzar, simplemente da <strong>clic en cada uno de los módulos laterales</strong>, diligencie los campos técnicos y, si dispone de información espacial, 
        cargue los archivos en la sección de Mapas relacionados
      </p>
      
      <p className="fase-insumos-intro">
        Es fundamental tener en cuenta lo siguiente para el desarrollo del modelo:
      </p>
      
            <ul className="fase-insumos-list">
        <li>
          <strong>Requisito Obligatorio:</strong> Debe completar las 5 variables críticas distribuidas en los <strong>módulos de Modelo Hidráulico, Fuente de agua y Comunidad - Uso final.</strong>
        </li>
        <li>
          <strong>Gestión de la Información:</strong> Al alcanzar este mínimo, el sistema desplegará un cuadro de diálogo. Si posee datos adicionales, seleccione "Sí" para continuar digitalizando; de lo contrario, podrá proceder directamente a la fase metodológica.
        </li>
        <li>
          <strong>Calidad de los Resultados:</strong> Considere que la precisión de la Ruta MAR es directamente proporcional a la información suministrada. A menor cantidad de datos registrados, mayor será el nivel de incertidumbre en los resultados de idoneidad y en la toma de decisiones final.
        </li>
      </ul>


      <p className="fase-insumos-intro">
        ¡Complete sus insumos ahora para garantizar un análisis robusto y confiable!
      </p>

      <div className="fase-insumos-layout">
        {/* COLUMNA IZQUIERDA */}
        <aside className="fase-insumos-left">
          <header className="insumos-panel-header">
            <span className="insumos-panel-icon" aria-hidden="true">
              📋
            </span>
            <span className="insumos-panel-title">Panel de Insumos MAR</span>
          </header>

          <div className="insumos-case-select">
            <div className="insumos-case-select-label">Seleccionar caso MAR</div>
            <select className="insumos-select" value={currentCaseId} onChange={(e) => setCurrentCaseId(e.target.value)}>
              <option value="nuevo">Nuevo caso MAR</option>
              {Object.entries(cases)
                .filter(([id]) => id !== "nuevo")
                .map(([id, c]) => (
                  <option key={id} value={id}>
                    {id} – {c.nombre}
                  </option>
                ))}
            </select>
          </div>

          <div className="insumos-tab-toggle">
            <button type="button" className={activeTab === "datos" ? "insumos-tab-btn active" : "insumos-tab-btn"} onClick={() => setActiveTab("datos")}>
              Datos técnicos
            </button>
            <button type="button" className={activeTab === "mapas" ? "insumos-tab-btn active" : "insumos-tab-btn"} onClick={() => setActiveTab("mapas")}>
              Mapas
            </button>
          </div>

          <div className="insumos-case-card">
            <div className="insumos-case-field-row">
              <span className="insumos-case-label">Nombre del caso:</span>
              <input
                type="text"
                className="insumos-case-input"
                value={getCaseValue("nombre")}
                onChange={(e) => updateCase("nombre", e.target.value)}
                readOnly={isReadOnlyCase}
              />
            </div>

            <div className="insumos-case-field-row">
              <span className="insumos-case-label">ID:</span>
              <input type="text" className="insumos-case-input" value={displayedCaseId} readOnly />
            </div>

            <div className="insumos-case-field-row">
              <span className="insumos-case-label">Usuario:</span>
              <input
                type="text"
                className="insumos-case-input"
                value={getCaseValue("usuario")}
                onChange={(e) => updateCase("usuario", e.target.value)}
                readOnly={isReadOnlyCase}
              />
            </div>

            <div className="insumos-case-field-row">
              <span className="insumos-case-label">Ubicación:</span>
              <input
                type="text"
                className="insumos-case-input"
                value={getCaseValue("ubicacion")}
                onChange={(e) => updateCase("ubicacion", e.target.value)}
                readOnly={isReadOnlyCase}
              />
            </div>

            <div className="insumos-download-row">
              <button type="button" className="insumos-download-btn" onClick={handleSaveCase}>
                <span>Guardar caso</span>
              </button>

              <button type="button" className="insumos-download-btn" onClick={handleResetAll}>
                <span>Reiniciar</span>
              </button>

              {currentCaseId !== "nuevo" && (
                <button
                  type="button"
                  className="insumos-download-btn"
                  onClick={() => setIsEditingExisting(true)}
                >
                  <span>Editar</span>
                </button>
              )}

              <button type="button" className="insumos-delete-btn" onClick={handleDeleteCase} disabled={currentCaseId === "nuevo"}>
                <span>Eliminar</span>
              </button>
            </div>
          </div>

          {/* ✅ BLOQUE MÍNIMO */}
          <div className="insumos-case-card" style={{ marginTop: 12, fontSize: 14 }}>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>
              Requisito mínimo para habilitar Fase 2
            </div>

            <div style={{ fontSize: 14, opacity: 0.9 }}>
              El sistema exige información diligenciada en los <strong>cinco campos obligatorios</strong> marcados con <strong>(*)</strong>.
            </div>

            <div style={{ marginTop: 8, fontSize: 14, opacity: 0.9 }}>
              Progreso del mínimo: <strong>{minProgress}</strong>
            </div>

            {!minScenario.ok ? (
              <div style={{ marginTop: 10, fontSize: 14, opacity: 0.9 }}>
                <div style={{ fontWeight: 650, marginBottom: 6 }}>Aún falta información en:</div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {minScenario.missing.map((x) => (
                    <li key={x.key}>{x.label}</li>
                  ))}
                </ul>

                <div style={{ marginTop: 10, fontSize: 10, opacity: 0.85 }}>
                  Nota: en campos tipo selección no se acepta “No reportado” ni “Seleccionar…”.
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 10, fontSize: 10, opacity: 0.9 }}>
                ✅ Mínimo completo. Ya puedes continuar a Fase 2.
              </div>
            )}

            <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
              <button
                type="button"
                className="insumos-download-btn"
                onClick={handleContinueToPhase2Click}
                disabled={!minScenario.ok}
                title={minScenario.ok ? "Continuar a Fase 2" : "Completa los 5 obligatorios (*) para habilitar"}
              >
                <span>Continuar a Fase 2</span>
              </button>

              {!minScenario.ok ? (
                <span style={{ fontSize: 14, opacity: 0.8 }}>
                  (Se habilita solo cuando los 5 obligatorios (*) tienen información.)
                </span>
              ) : null}
            </div>
          </div>

          {activeTab === "datos" ? (
            <div className="insumos-modules-list">
              {INSUMOS_MODULES.map((mod) => (
                <button
                  key={mod.id}
                  type="button"
                  className={"insumos-module-btn " + mod.colorClass + (mod.id === selectedModuleId ? " active" : "")}
                  onClick={() => {
                    trySelectModule(mod.id);
                  }}
                >
                  <span>
                    {mod.icon && <span>{mod.icon} </span>}
                    {mod.label}
                  </span>
                  <span aria-hidden="true">▸</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="insumos-maps-panel">
              <div className="insumos-map-groups">
                {INSUMOS_MODULES.map((mod) => {
                  const layers = getAllLayersByModule(currentCase, mod.id);
                  if (!layers.length) return null;

                  return (
                    <div key={mod.id} className="insumos-map-group">
                      <div className="insumos-map-group-title">{mod.label}</div>
                      <div className="insumos-map-layers-list">
                        {layers.map((layer) => {
                          const checked = (currentCase.mapLayersByModule?.[mod.id] || []).includes(layer.id);
                          const hasFile = Boolean(currentCase.mapUploads?.[layer.id]?.name);

                          return (
                            <div key={layer.id} className="insumos-map-layer-row">
                              <label className="insumos-map-layer-check">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={isReadOnlyCase}
                                  onChange={() => {
                                    toggleLayerForModule(mod.id, layer.id);
                                    trySelectModule(mod.id);
                                    setActiveLayerId(layer.id);
                                  }}
                                />
                                <span>
                                  {layer.label}
                                  {hasFile ? (
                                    <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.85 }}>• Cargado</span>
                                  ) : (
                                    <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.55 }}>• Sin archivo</span>
                                  )}
                                </span>
                              </label>

                              <button
                                type="button"
                                className="insumos-map-layer-action"
                                onClick={() => {
                                  if (!checked && !isReadOnlyCase) toggleLayerForModule(mod.id, layer.id);
                                  trySelectModule(mod.id);
                                  setActiveLayerId(layer.id);
                                }}
                              >
                                Cargar
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </aside>

        {/* COLUMNA DERECHA */}
        <section className={rightPanelClass}>
          {activeTab === "datos" ? (
            <>
              <header className="insumos-module-header">
                <div>
                  <h3 className="insumos-module-title">{currentModule.label}</h3>
                  <div className="insumos-module-code">Caso: {displayedCaseId}</div>

                  {(currentModule.phase || currentModule.definition) && (
                    <div className="insumos-module-def">
                      {currentModule.phase && <div className="insumos-module-phase"></div>}
                      {currentModule.definition && <p className="insumos-module-definition">{currentModule.definition}</p>}
                      <p className="insumos-module-definition">
                        <strong>
                          Puedes diligenciar varios registros dentro del mismo caso si necesitas reportar m&aacute;s de una unidad, zona o fuente.
                        </strong>
                      </p>
                      {selectedModuleId === "caracterizacion" ? (
                        <p className="insumos-module-definition">
                          Si desea registrar m&aacute;s de una UHG, diligencie la informaci&oacute;n para cada una.
                          Recuerde poner un consecutivo para las UHG (UHG-1, UHG-2, UHG-3...).
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>

                <button type="button" className="insumos-module-save-btn" onClick={() => handleSaveCase()}>
                  💾 Guardar
                </button>
              </header>

              <div className="insumos-module-fields">
                {selectedModuleId === "caracterizacion" ? (
                  <div className="uhg-full">
                    {uhgEntries.map((entry, index) => (
                      <div key={`uhg-${index}`} className={index > 0 ? "uhg-group" : undefined}>
                        {uhgEntries.length > 1 ? (
                          <div className="uhg-group-header">
                            <span>{`UHG ${index + 1}`}</span>
                            <button
                              type="button"
                              className="insumos-map-layer-action"
                              disabled={isReadOnlyCase}
                              onClick={() => removeUhgEntry(index)}
                            >
                              Eliminar
                            </button>
                          </div>
                        ) : null}

                        {(() => {
                          const fields = MODULE_FIELDS.caracterizacion || [];
                          const getField = (name) => fields.find((f) => f.name === name);

                          const renderField = (field) => {
                            if (!field) return null;

                            const val = entry?.[field.name] ?? "";
                            const isTextArea = field.type === "textarea";
                            const isSelect = field.type === "select";
                            const isNumber = field.type === "number";

                            const optionHelp =
                              isSelect && typeof getSelectOptionHelp === "function"
                                ? getSelectOptionHelp(field.name, val)
                                : "";

                            const showStar = shouldShowAsterisk(selectedModuleId, field.name);

                            return (
                              <div key={`${field.name}-${index}`} className="insumos-field-row">
                                <label className="insumos-field-label">
                                  {field.label}
                                  {showStar ? <span className="insumos-required-asterisk"> *</span> : null}
                                </label>

                                {field.help ? <div className="insumos-field-help">{field.help}</div> : null}

                                {isTextArea ? (
                                  <textarea
                                    className="insumos-field-textarea"
                                    value={val}
                                    onChange={(e) => updateUhgEntry(index, field.name, e.target.value)}
                                    readOnly={isReadOnlyCase}
                                  />
                                ) : isSelect ? (
                                  <>
                                    <select
                                      className="insumos-field-select"
                                      value={val}
                                      onChange={(e) => updateUhgEntry(index, field.name, e.target.value)}
                                      disabled={isReadOnlyCase}
                                    >
                                      <option value="">Seleccionar...</option>
                                      {(field.options || []).map((opt) => (
                                        <option key={opt} value={opt}>
                                          {opt}
                                        </option>
                                      ))}
                                    </select>

                                    {val && SELECT_OPTION_HELP?.[field.name]?.[val] ? (
                                      <div className="insumos-field-option-help">{SELECT_OPTION_HELP[field.name][val]}</div>
                                    ) : null}

                                    {val && !SELECT_OPTION_HELP?.[field.name]?.[val] && optionHelp ? (
                                      <div className="insumos-field-option-help">{optionHelp}</div>
                                    ) : null}
                                  </>
                                ) : (
                                  <input
                                    className="insumos-field-input"
                                    type={isNumber ? "number" : "text"}
                                    inputMode={isNumber ? "decimal" : undefined}
                                    step={isNumber ? "any" : undefined}
                                    value={val}
                                    onChange={(e) => {
                                      const next = isNumber
                                        ? String(e.target.value).replace(/[^0-9.]/g, "")
                                        : e.target.value;
                                      updateUhgEntry(index, field.name, next);
                                    }}
                                    readOnly={isReadOnlyCase}
                                  />
                                )}
                              </div>
                            );
                          };

                          return (
                            <div className="uhg-columns">
                              <div className="uhg-column">
                                {renderField(getField("uhg_codigo"))}
                                {renderField(getField("clasificacion_hidrogeologica_uhg"))}
                                {renderField(getField("permeabilidad"))}
                              </div>
                              <div className="uhg-column">
                                {renderField(getField("unidad_geologica_asociada"))}
                                {renderField(getField("porosidad"))}
                                {renderField(getField("descripcion_comportamiento_hidrogeologico"))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ))}

                  </div>
                ) : (
                  moduleEntries.map((entry, entryIndex) => (
                    <div key={`entry-${entryIndex}`} className="insumos-entry">
                      {moduleEntries.length > 1 ? (
                        <div className="insumos-entry-header">
                          <span>{`Registro ${entryIndex + 1}`}</span>
                          <button
                            type="button"
                            className="insumos-map-layer-action"
                            disabled={isReadOnlyCase || moduleEntries.length <= 1}
                            onClick={() => removeModuleEntry(selectedModuleId, entryIndex)}
                          >
                            Eliminar
                          </button>
                        </div>
                      ) : null}

                      {fieldDefs.map((field) => {
                        const val = entry?.[field.name] ?? "";
                        const isTextArea = field.type === "textarea";
                        const isSelect = field.type === "select";
                        const isNumber = field.type === "number";
                        const optionHelp =
                          isSelect && typeof getSelectOptionHelp === "function"
                            ? getSelectOptionHelp(field.name, val)
                            : "";

                        const showStar = shouldShowAsterisk(selectedModuleId, field.name);
                        const path =
                          entryIndex === 0
                            ? `${selectedModuleId}.${field.name}`
                            : `${selectedModuleId}_entries.${entryIndex}.${field.name}`;

                        return (
                          <div
                            key={`${field.name}-${entryIndex}`}
                            className="insumos-field-row"
                            data-field-path={path}
                          >
                            <label className="insumos-field-label">
                              {field.label}
                              {showStar ? <span className="insumos-required-asterisk"> *</span> : null}
                            </label>

                            {field.help ? <div className="insumos-field-help">{field.help}</div> : null}

                            {isTextArea ? (
                              <textarea
                                className="insumos-field-textarea"
                                value={val}
                                onChange={(e) => updateModuleEntry(selectedModuleId, entryIndex, field.name, e.target.value)}
                                readOnly={isReadOnlyCase}
                              />
                            ) : isSelect ? (
                              <>
                                <select
                                  className="insumos-field-select"
                                  value={val}
                                  onChange={(e) => updateModuleEntry(selectedModuleId, entryIndex, field.name, e.target.value)}
                                  disabled={isReadOnlyCase}
                                >
                                  <option value="">Seleccionar...</option>
                                  {(field.options || []).map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>

                                {val && SELECT_OPTION_HELP?.[field.name]?.[val] ? (
                                  <div className="insumos-field-option-help">{SELECT_OPTION_HELP[field.name][val]}</div>
                                ) : null}

                                {val && !SELECT_OPTION_HELP?.[field.name]?.[val] && optionHelp ? (
                                  <div className="insumos-field-option-help">{optionHelp}</div>
                                ) : null}
                              </>
                            ) : (
                              <input
                                className="insumos-field-input"
                                type={isNumber ? "number" : "text"}
                                inputMode={isNumber ? "decimal" : undefined}
                                step={isNumber ? "any" : undefined}
                                value={val}
                                onChange={(e) => {
                                  const next = isNumber
                                    ? String(e.target.value).replace(/[^0-9.]/g, "")
                                    : e.target.value;
                                  updateModuleEntry(selectedModuleId, entryIndex, field.name, next);
                                }}
                                readOnly={isReadOnlyCase}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
              {selectedModuleId === "caracterizacion" ? (
                <div style={{ marginTop: 12 }}>
                  <button
                    type="button"
                    className="insumos-module-save-btn uhg-add-btn"
                    onClick={() => addUhgEntry()}
                    disabled={isReadOnlyCase}
                  >
                    + Agregar UHG
                  </button>
                </div>
              ) : (
                <div style={{ marginTop: 12 }}>
                  <button
                    type="button"
                    className="insumos-module-save-btn uhg-add-btn"
                    onClick={() => addModuleEntry(selectedModuleId)}
                    disabled={isReadOnlyCase}
                  >
                    + Agregar registro
                  </button>
                </div>
              )}

              <div className="insumos-maps-related">
                <span className="insumos-maps-title">Mapas relacionados</span>
                <div className="insumos-map-add-row">
                  <input
                    className="insumos-map-add-input"
                    type="text"
                    value={customLayerLabel}
                    onChange={(e) => setCustomLayerLabel(e.target.value)}
                    placeholder="Nombre de la nueva capa"
                    disabled={isReadOnlyCase}
                  />
                  <button
                    type="button"
                    className="insumos-map-add-btn"
                    onClick={() => addCustomLayer(selectedModuleId)}
                    disabled={isReadOnlyCase || !String(customLayerLabel || "").trim()}
                  >
                    + Agregar capa
                  </button>
                </div>

                {moduleLayers.length ? (
                  <>
                    <div className="insumos-maps-buttons">
                      {moduleLayers.map((layer) => {
                        const hasFile = Boolean(currentCase.mapUploads?.[layer.id]?.name);
                        return (
                          <button
                            key={layer.id}
                            type="button"
                            className={"insumos-map-btn" + (layer.id === (activeLayer?.id || "") ? " active" : "")}
                            onClick={() => setActiveLayerId(layer.id)}
                          >
                            {layer.label}
                            {hasFile ? " •" : ""}
                          </button>
                        );
                      })}
                    </div>

                    <MapViewer
                      layer={viewerLayer}
                      upload={viewerUpload}
                      meta={viewerMeta}
                      marks={viewerMarks}
                      missing={viewerMissing}
                      isReadOnlyCase={isReadOnlyCase}
                      previewSrc={viewerPreviewSrc}
                      canShow={viewerCanShow}
                      moduleIdForSelection={selectedModuleId}
                      onUpdateMeta={(patch) => {
                        if (viewerLayer) updateMapMeta(viewerLayer.id, patch);
                      }}
                      onUploadMap={handleUploadMap}
                      onRemoveMap={handleRemoveMap}
                      ImageMarkerComponent={ImageMarker}
                    />
                  </>
                ) : (
                  <p className="text-muted">Este módulo no tiene mapas relacionados.</p>
                )}
              </div>

            </>
          ) : (
            <>
              <header className="insumos-module-header">
                <h3 className="insumos-module-title">Mapas</h3>
                <div className="insumos-module-code">Caso: {displayedCaseId}</div>
              </header>

              <div className="insumos-maps-related">
                <span className="insumos-maps-title">Vista previa</span>

                {layersForViewer.length ? (
                  <>
                    <div className="insumos-maps-buttons">
                      {layersForViewer.map((layer) => (
                        <button
                          key={layer.id}
                          type="button"
                          className={"insumos-map-btn" + (layer.id === (activeLayer?.id || "") ? " active" : "")}
                          onClick={() => setActiveLayerId(layer.id)}
                        >
                          {layer.label}
                        </button>
                      ))}
                    </div>

                    <MapViewer
                      layer={viewerLayer}
                      upload={viewerUpload}
                      meta={viewerMeta}
                      marks={viewerMarks}
                      missing={viewerMissing}
                      isReadOnlyCase={isReadOnlyCase}
                      previewSrc={viewerPreviewSrc}
                      canShow={viewerCanShow}
                      moduleIdForSelection={selectedModuleId}
                      onUpdateMeta={(patch) => {
                        if (viewerLayer) updateMapMeta(viewerLayer.id, patch);
                      }}
                      onUploadMap={handleUploadMap}
                      onRemoveMap={handleRemoveMap}
                      ImageMarkerComponent={ImageMarker}
                    />
                  </>
                ) : (
                  <p className="text-muted">
                    Selecciona al menos una capa (checkbox) para verla aquí. (También puedes cargarlas desde Datos técnicos.)
                  </p>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}



/* =========================================================
   FASE 2
========================================================= */
// ✅ Reemplaza tu bloque de “Fase 2 …” por este componente.
// - No incluye el título “Fase 2 …”
// - Muestra abajo: Ruta A (Proceso jerárquico analítico) y Ruta B (Modelo automatizado)
// - Organiza la escala y V1…V35 dentro de la Ruta A, y describe la lógica de la Ruta B sin pedir pesos al usuario.

const ROUTE_A_VARIABLES_GUIDE = [
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
    options: ["Si", "No"],
    inputs: "Caracterización del acuífero",
  },
  { id: "V3", question: "¿Existe o realizaron un modelo geológico?", options: ["Si", "No"], inputs: "Modelo geológico" },
  { id: "V4", question: "¿Existe o realizaron un modelo hidrológico?", options: ["Si", "No"], inputs: "Modelo hidrológico" },
  { id: "V5", question: "¿Existe o realizaron un modelo numérico?", options: ["Si", "No"], inputs: "Modelo hidraulico" },
  { id: "V6", question: "¿Existe o realizaron un modelo hidrogeoquímico?", options: ["Si", "No"], inputs: "Modelo hidrogeoquímico" },
  {
    id: "V7",
    question: "¿Cuál es la escala que define su acuífero?",
    options: [
      "Muy pequeño (≤ 100 km²)",
      "Pequeño (100-500 km²)",
      "Mediano (500–5000 km²)",
      "Grande (500–50000 km²)",
    ],
    inputs: "NA",
  },
  {
    id: "V8",
    question: "¿Cuál es el tipo de acuífero?",
    options: ["Libre", "Semiconfinado – Confinado"],
    inputs: "Modelo hidráulico",
  },
  { id: "V9", question: "¿Se estudió la capacidad de infiltración en la zona no saturada?", options: ["Si", "No"], inputs: "NA" },
  { id: "V10", question: "¿La técnica viable incluye pozos?", options: ["Si", "No"], inputs: "NA" },
  {
    id: "V11",
    question: "¿Cómo es la permeabilidad del acuífero?",
    options: [
      "Muy alta (100<K)",
      "Alta (10<K<100)",
      "Media (1<K<10)",
      "Baja a muy baja (10^-2<K<1)",
    ],
    inputs: "Modelo hidraulico - Caracterizacion del acuifero",
  },
  {
    id: "V12",
    question: "¿Cómo es la porosidad del acuífero?",
    options: ["Muy alta (>50%)", "Alta (30-50%)", "Regular (10-30%)", "Mala (0-10%)"],
    inputs: "Modelo hidraulico - Caracterizacion del acuifero",
  },
  { id: "V13", question: "¿Conoce la fuente de agua?", options: ["Si", "No"], inputs: "Fuente de agua" },
  {
    id: "V14",
    question: "¿Cuál es la fuente de agua a recargar?",
    options: ["Superficial", "Escorrentía estacional", "Agua residual", "Subterránea u otra fuente"],
    inputs: "Fuente de agua",
  },
  { id: "V15", question: "¿Conoce la calidad del agua fuente?", options: ["Si", "No"], inputs: "Fuente de agua" },
  {
    id: "V16",
    question: "¿La recarga con esta fuente está permitida por la normativa local?",
    options: ["Si", "No"],
    inputs: "Fuente de agua",
  },
  {
    id: "V17",
    question: "¿Conoce la calidad del agua del acuífero? ¿Es vulnerable a la contaminación?",
    options: ["Si", "No"],
    inputs: "NA",
  },
  {
    id: "V18",
    question: "¿La mezcla fuente-acuífero cumple los límites de calidad aplicables?",
    options: ["Si", "No"],
    inputs: "NA",
  },
  {
    id: "V19",
    question: "¿Conoce la capacidad de almacenamiento del acuífero?",
    options: ["Si", "No"],
    inputs: "Volumen - capacidad",
  },
  { id: "V20", question: "¿Conoce el volumen de agua a recargar?", options: ["Si", "No"], inputs: "Volumen - capacidad" },
  {
    id: "V21",
    question: "¿El volumen de agua a recargar es < que la capacidad de almacenamiento del acuífero?",
    options: ["Si", "No"],
    inputs: "Volumen - capacidad",
  },
  { id: "V22", question: "¿Conoce el uso final del agua?", options: ["Si", "No"], inputs: "Comunidad – Uso final" },
  {
    id: "V23",
    question: "¿Cuál es el uso final?",
    options: ["Doméstico", "Industrial", "Ambiental", "Agrícola"],
    inputs: "Comunidad – Uso final",
  },
  {
    id: "V24",
    question: "¿Qué relieve domina la zona de estudio?",
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
    options: ["Si", "No"],
    inputs: "Infraestructura",
  },
  { id: "V27", question: "¿El grupo viable es infiltración superficial?", options: ["Si", "No"], inputs: "NA" },
  { id: "V28", question: "¿Existe planta de tratamiento en la zona de estudio?", options: ["Si", "No"], inputs: "NA" },
  { id: "V29", question: "¿Existen estanques en la zona de estudio?", options: ["Si", "No"], inputs: "NA" },
  { id: "V30", question: "¿El grupo MAR viable es recarga mediante pozos?", options: ["Si", "No"], inputs: "NA" },
  { id: "V31", question: "¿El grupo MAR viable es intervención del cauce?", options: ["Si", "No"], inputs: "NA" },
  {
    id: "V32",
    question: "¿Hay obras en cauce (presas) o infraestructura de captación de ribera?",
    options: ["Si", "No"],
    inputs: "NA",
  },
  { id: "V33", question: "¿Existe pozos operativos o rehabilitables?", options: ["Si", "No"], inputs: "NA" },
  { id: "V34", question: "¿Hay una comunidad en el área de influencia?", options: ["Si", "No"], inputs: "NA" },
  { id: "V35", question: "¿Se identificó un beneficio directo (potable/riego)?", options: ["Si", "No"], inputs: "Comunidad – Uso final" },
];

function Phase2IntroTextBlock() {
  const [route, setRoute] = useState("A"); // "A" | "B"

  const TabBtn = ({ id, children }) => {
    const active = route === id;
    return (
      <button
        type="button"
        onClick={() => setRoute(id)}
        style={{
          padding: "10px 16px",
          borderRadius: 999,
          border: "1px solid rgba(0,0,0,.18)",
          background: active ? "#2563eb" : "transparent",
          color: active ? "#fff" : "inherit",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {children}
      </button>
    );
  };

  return (
    <div className="panel-card">
      {/* Intro corto (sin “Fase 2…”) */}
      <p style={{ marginTop: 2, opacity: 0.92 }}>
        Con la información consolidada en Insumos, el sistema habilita dos rutas de procesamiento alineadas con el mismo{" "}
        <strong>esquema conceptual de decisión</strong>. Ambas buscan producir resultados comparables, trazables y
        justificables; sin embargo, se diferencian en la forma de estructurar la evaluación y, por tanto, en el papel que
        asume el usuario durante el proceso.
      </p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
        <TabBtn id="A">RUTA A</TabBtn>
        <TabBtn id="B">RUTA B</TabBtn>
      </div>

      {/* =========================
          RUTA A
      ========================= */}
      {route === "A" && (
        <div style={{ marginTop: 14 }}>
          <h3 style={{ marginBottom: 6 }}>RUTA A — Proceso jerárquico analítico (SIG-MCDA / AHP)</h3>

          <p style={{ opacity: 0.92 }}>
            Esta ruta inicia convirtiendo el registro del caso (datos, mapas y evidencias cargadas en Insumos) en{" "}
            <strong>35 variables (V1…V35)</strong>, derivadas del esquema conceptual de decisión. En términos operativos,
            cada variable resume una operación del esquema (por ejemplo: objetivo, condiciones hidrogeológicas,
            fuente/calidad, volumen-capacidad, relieve/clima, infraestructura y contexto socioambiental), de modo que la
            evaluación <strong>no replique preguntas</strong>: interpreta lo ya cargado, identifica faltantes e
            inconsistencias y conserva evidencia verificable para sustentar cada resultado.
          </p>

          <p style={{ marginTop: 10, opacity: 0.92 }}>
            Para unificar la lectura y permitir comparaciones consistentes, cada variable se expresa en una{" "}
            <strong>escala ordinal de cinco niveles (0–4)</strong>. Esta escala representa el grado de favorabilidad de la
            condición evaluada y se acompaña de una referencia cromática estable, desde un limitante crítico hasta una
            condición óptima:
          </p>

          <div style={{ marginTop: 12, overflowX: "auto" }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>
              Tabla 2. Escala ordinal (0–4) para la evaluación de variables V1…V35
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>
                    Puntuación
                  </th>
                  <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>
                    Categoría
                  </th>
                  <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>
                    Interpretación
                  </th>
                  <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.14)" }}>
                    Color de referencia
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)", fontWeight: 800 }}>0</td>
                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>
                    No favorable / Inexistente
                  </td>
                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Limitante crítico</td>
                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 999,
                          background: "#dc2626",
                          display: "inline-block",
                        }}
                      />
                      Rojo
                    </span>
                  </td>
                </tr>

                <tr>
                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)", fontWeight: 800 }}>1</td>
                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Poco favorable</td>
                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>
                    Limitante significativo
                  </td>
                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 999,
                          background: "#f97316",
                          display: "inline-block",
                        }}
                      />
                      Naranja
                    </span>
                  </td>
                </tr>

                <tr>
                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)", fontWeight: 800 }}>2</td>
                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Neutral / Moderado</td>
                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>
                    Aceptable con reservas
                  </td>
                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 999,
                          background: "#facc15",
                          display: "inline-block",
                        }}
                      />
                      Amarillo
                    </span>
                  </td>
                </tr>

                <tr>
                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)", fontWeight: 800 }}>3</td>
                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Favorable</td>
                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Condición buena</td>
                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 999,
                          background: "#22c55e",
                          display: "inline-block",
                        }}
                      />
                      Verde claro
                    </span>
                  </td>
                </tr>

                <tr>
                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)", fontWeight: 800 }}>4</td>
                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Muy favorable / Óptimo</td>
                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>Condición ideal</td>
                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 999,
                          background: "#15803d",
                          display: "inline-block",
                        }}
                      />
                      Verde oscuro
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
              <em>Fuente: elaboración propia.</em>
            </div>
          </div>

          <p style={{ marginTop: 12, opacity: 0.92 }}>
            Con esta base, el esquema conceptual se organiza como una{" "}
            <strong>jerarquía de criterios y subcriterios</strong>. El usuario define la importancia relativa mediante{" "}
            <strong>comparación por pares (AHP)</strong>, y el sistema traduce esas comparaciones en pesos numéricos.
            Posteriormente, se calcula la <strong>consistencia</strong> de las matrices (CR) y, si se detectan
            incoherencias, se reportan y se orienta el ajuste. Una vez definidos los pesos, las capas temáticas se
            estandarizan a la escala 0–4 y se integran mediante <strong>combinación lineal ponderada</strong> (WLC),
            aplicando restricciones cuando existan. Con ello, se generan mapas de idoneidad por grupo MAR (G1, G2, G3),
            junto con puntajes por criterio y una síntesis explicativa de factores favorables, limitantes críticas y
            faltantes que afectan la confianza del resultado.
          </p>

          <p style={{ marginTop: 6 }}>
            <strong>Resultado esperado:</strong> mapas de idoneidad por grupo MAR + probabilidad de ocurrencia de cada
            grupo (%) + estadísticos.
          </p>
        </div>
      )}

      {/* =========================
          RUTA B
      ========================= */}
      {route === "B" && (
        <div style={{ marginTop: 14 }}>
          <h3 style={{ marginBottom: 6 }}>RUTA B — Modelo automatizado (Árboles / Bosque aleatorio)</h3>

          <p style={{ opacity: 0.92 }}>
            En esta ruta, el mismo esquema conceptual se traduce a un{" "}
            <strong>vector de variables (V1…V35)</strong> que alimenta modelos supervisados entrenados con la base de casos.
            En lugar de solicitar pesos al usuario, la lógica se aprende a partir de ejemplos: el modelo identifica
            patrones que, históricamente, han conducido a G1, G2 o G3. Un árbol construye la decisión con reglas del tipo{" "}
            <em>si-entonces</em>, mientras que el <strong>bosque aleatorio</strong> combina múltiples árboles para mejorar
            estabilidad y reducir sesgos.
          </p>

          <p style={{ marginTop: 10, opacity: 0.92 }}>
            Durante la ejecución, el sistema transforma el caso a un formato consistente (categorías y rangos definidos),
            estima <strong>probabilidades por grupo</strong> (p(G1), p(G2), p(G3)) y entrega una recomendación principal.
            Además, genera <strong>señales de explicación</strong> (variables más influyentes) y alertas cuando faltan datos
            que impactan de forma relevante la decisión; en esos escenarios, la recomendación se reporta con menor
            confianza y se priorizan los campos que más reducen la solidez del resultado. Cuando se dispone de capas
            espaciales, la recomendación se complementa con mapas de idoneidad por grupo para contextualizar
            territorialmente la decisión.
          </p>

          <p style={{ marginTop: 6 }}>
            <strong>Resultado esperado:</strong> recomendación basada en patrones observados + mapas de idoneidad por grupo
            MAR + probabilidad de ocurrencia de cada grupo (%) + estadísticos.
          </p>
        </div>
      )}
    </div>
  );
}


function FaseAHP() {
  const { cases, setCases, activeCaseId, activeCase } = useCasesStore();
  const [route, setRoute] = React.useState("A");

  return (
    <>
      <Phase2IntroTextBlock />

      <Phase2Intro activeRoute={route} setActiveRoute={setRoute} />

      <Phase2RouteA activeRoute={route} onSelectRoute={setRoute} />
    </>
  );
}

/* =========================================================
   FASE 3
========================================================= */
function FaseRF() {
  return (
    <div className="panel-card">
      <h2>Fase 3 – Árboles de decisión y bosques aleatorios</h2>
      <p>
        Esta fase aplica modelos automáticos entrenados con casos MAR para estimar la probabilidad de aplicación por grupo de técnicas y contrastar los
        resultados con la Fase 2, afinando la selección final.
      </p>
    </div>
  );
}

function Resultados() {
  return (
    <section>
      <h1>Resultados integrados</h1>
      <p>Vista para comparar la selección obtenida con el proceso jerárquico (AHP) y con el modelo automático (bosques aleatorios), con análisis de sensibilidad.</p>
    </section>
  );
}

function Dashboard() {
  // ✅ NUEVO: leer casos desde storage
  const [casesObj, setCasesObj] = useState(() => loadSigmmaState({}).cases);
  const [q, setQ] = useState("");

  // ✅ NUEVO: actualizar cuando Fase 1 guarde cambios
  useEffect(() => {
    const reload = () => setCasesObj(loadSigmmaState({}).cases);
    window.addEventListener("sigmma:cases-updated", reload);
    window.addEventListener("storage", reload); // por si abres otra pestaña
    return () => {
      window.removeEventListener("sigmma:cases-updated", reload);
      window.removeEventListener("storage", reload);
    };
  }, []);

  const entries = Object.entries(casesObj || {}).filter(([id]) => id !== "nuevo");
  const filtered = entries.filter(([id, c]) => {
    const hay = `${id} ${c?.nombre || ""} ${c?.usuario || ""} ${c?.ubicacion || ""}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  const total = entries.length;
  const conMapas = entries.filter(([, c]) => Object.keys(c?.mapUploads || {}).length > 0).length;

  // ✅ NUEVO: función de export (copiada de Fase 1 para usarla desde Dashboard)
  function exportCaseToPDF(caseData) {
    const escapeHtml = (s) =>
      String(s ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

    // Validación mínimos (igual que en Fase 1)
    const issues = [];
    INSUMOS_MODULES.forEach((m) => {
      const layers = getAllLayersByModule(caseData, m.id);
      layers.forEach((layer) => {
        const up = caseData?.mapUploads?.[layer.id];
        if (!up?.url) return;

        const meta = caseData?.mapMeta?.[layer.id] || {};
        const marks = meta.marks || {};

        if (!meta.confirmedLayer) issues.push(`${m.label} / ${layer.label}: falta confirmación de capa`);
        if (!String(meta.scaleText || "").trim()) issues.push(`${m.label} / ${layer.label}: falta Escala (texto)`);

        if (!marks.north) issues.push(`${m.label} / ${layer.label}: falta marcar Norte en la imagen`);
        if (!marks.scale) issues.push(`${m.label} / ${layer.label}: falta marcar Escala en la imagen`);
        if (!marks.legend) issues.push(`${m.label} / ${layer.label}: falta marcar Leyenda en la imagen`);
        if (!marks.polygon) issues.push(`${m.label} / ${layer.label}: falta marcar Polígono en la imagen`);
      });
    });

    if (issues.length) {
      alert("No se puede exportar. Completa los mínimos en Mapas relacionados:\n\n- " + issues.join("\n- "));
      return;
    }

    const modulesHtml = INSUMOS_MODULES.map((m) => {
      const fields = MODULE_FIELDS[m.id] || [];
      const entries =
        Array.isArray(caseData?.[`${m.id}_entries`]) && caseData[`${m.id}_entries`].length
          ? caseData[`${m.id}_entries`]
          : [caseData[m.id] || {}];

      const blocks = entries
        .map((values, idx) => {
          const rows = fields
            .map((f) => {
              const v = values?.[f.name] ?? "";
              if (!String(v).trim()) return "";
              return `
            <tr>
              <td style="padding:8px;border:1px solid #e5e7eb;width:35%;font-weight:700;">${escapeHtml(f.label)}</td>
              <td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(v)}</td>
            </tr>`;
            })
            .join("");

          if (!rows.trim()) return "";
          return `
        ${entries.length > 1 ? `<div style="margin:10px 0 6px 0;font-weight:700;">Registro ${idx + 1}</div>` : ""}
        <table style="border-collapse:collapse;width:100%;font-size:12px;">
          ${rows}
        </table>`;
        })
        .filter(Boolean)
        .join("");

      if (!blocks.trim()) return "";
      return `
        <h2 style="margin:18px 0 8px 0;font-size:16px;">${escapeHtml(m.label)}</h2>
        ${blocks}`;
    }).join("");

    const selectedMaps = [];
    INSUMOS_MODULES.forEach((m) => {
      const layers = getAllLayersByModule(caseData, m.id);
      layers.forEach((layer) => {
        const up = caseData?.mapUploads?.[layer.id];
        if (up?.url) selectedMaps.push({ ...layer, groupLabel: m.label, upload: up });
      });
    });

    const layersSummary = INSUMOS_MODULES.map((m) => {
      const layers = getAllLayersByModule(caseData, m.id);
      const withFile = layers.filter((l) => caseData?.mapUploads?.[l.id]?.url);
      if (!withFile.length) return "";
      return `<li><strong>${escapeHtml(m.label)}:</strong> ${escapeHtml(withFile.map((l) => l.label).join(", "))}</li>`;
    }).join("");

    const mapsHtml = selectedMaps
      .map((layer, idx) => {
        const src = layer.upload?.url || layer.preview || "";
        const isImg = layer.upload?.type
          ? String(layer.upload.type).startsWith("image/")
          : /\.(png|jpe?g|webp|gif)$/i.test(layer.upload?.name || "");

        return `
          <div class="page-break"></div>
          <h2 style="margin:0 0 6px 0;font-size:16px;">Mapa ${idx + 1}: ${escapeHtml(layer.label)}</h2>
          <p style="margin:0 0 10px 0;font-size:12px;color:#374151;">
            <strong>Módulo:</strong> ${escapeHtml(layer.groupLabel)}
          </p>
          <div style="border:1px solid #e5e7eb;border-radius:10px;padding:10px;">
            ${
              isImg
                ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(layer.label)}"
                    style="width:100%;height:auto;max-height:92vh;object-fit:contain;image-rendering:-webkit-optimize-contrast;" />`
                : `<div style="font-size:12px;color:#111827;">
                    Archivo cargado para esta capa, pero no es una imagen exportable en PDF: <strong>${escapeHtml(layer.upload?.name || "")}</strong>
                  </div>`
            }
          </div>
        `;
      })
      .join("");

    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) {
      alert("No se pudo abrir la ventana de exportación. Revisa bloqueadores de pop-ups.");
      return;
    }

    const html = `
      <html>
        <head>
          <title>Ficha SIGMMA-MAR - ${escapeHtml(caseData.id || "sin ID")}</title>
          <meta charset="utf-8" />
          <style>
            body { font-family: "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif; padding: 24px; color:#111827; }
            h1 { margin:0 0 6px 0; font-size: 20px; }
            p { margin: 0 0 10px 0; font-size: 12px; color:#374151; }
            .box { border:1px solid #e5e7eb; border-radius: 10px; padding: 12px; margin-top: 12px; }
            .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 8px; }
            .kv { border:1px solid #e5e7eb; border-radius: 8px; padding: 10px; }
            .k { font-weight: 800; font-size: 12px; color:#111827; }
            .v { font-size: 12px; color:#111827; margin-top: 4px; white-space: pre-wrap; }
            .page-break { page-break-before: always; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>Ficha técnica SIGMMA-MAR</h1>
          <p><strong>ID:</strong> ${escapeHtml(caseData.id || "sin ID")} &nbsp; | &nbsp; <strong>Nombre:</strong> ${escapeHtml(caseData.nombre || "")}</p>

          <div class="box">
            <div class="grid">
              <div class="kv"><div class="k">Usuario</div><div class="v">${escapeHtml(caseData.usuario || "")}</div></div>
              <div class="kv"><div class="k">Ubicación</div><div class="v">${escapeHtml(caseData.ubicacion || "")}</div></div>
            </div>
          </div>

          <div class="box">
            <div class="k" style="margin-bottom:6px;">Mapas cargados por capa</div>
            <ul style="margin:0; padding-left:18px; font-size:12px;">
              ${layersSummary || `<li>No se cargaron mapas por capa.</li>`}
            </ul>
          </div>

          ${modulesHtml ? `<div class="box" style="margin-top:16px;">${modulesHtml}</div>` : ""}

          ${
            selectedMaps.length
              ? `
                <div class="box" style="margin-top:16px;">
                  <div class="k" style="margin-bottom:6px;">Mapas</div>
                  <p style="margin:0;font-size:12px;color:#374151;">
                    Se exportan ${selectedMaps.length} mapa(s) cargado(s), uno por página.
                  </p>
                </div>
                ${mapsHtml}
              `
              : `
                <div class="box" style="margin-top:16px;">
                  <div class="k" style="margin-bottom:6px;">Mapas</div>
                  <p style="margin:0;font-size:12px;color:#374151;">No se cargaron mapas para exportar.</p>
                </div>
              `
          }

          <script>
            window.onload = () => { window.print(); };
          </script>
        </body>
      </html>
    `;

    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  return (
    <section className="panel-card">
      <h1>Dashboard de casos MAR</h1>
      <p style={{ marginTop: 6, opacity: 0.85 }}>
        Casos guardados: <strong>{total}</strong> &nbsp;•&nbsp; Con mapas: <strong>{conMapas}</strong>
      </p>

      {/* ✅ NUEVO: búsqueda */}
      <div style={{ display: "flex", gap: 10, marginTop: 12, marginBottom: 12 }}>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por ID, nombre, usuario o ubicación…"
          style={{ flex: 1, padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,.15)" }}
        />
      </div>

      {/* ✅ NUEVO: tabla de casos */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.12)" }}>ID</th>
              <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.12)" }}>Nombre</th>
              <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.12)" }}>Usuario</th>
              <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,.12)" }}>Ubicación</th>
              <th style={{ textAlign: "center", padding: 10, borderBottom: "1px solid rgba(0,0,0,.12)" }}>Mapas</th>
              <th style={{ textAlign: "right", padding: 10, borderBottom: "1px solid rgba(0,0,0,.12)" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length ? (
              filtered.map(([id, c]) => {
                const nMapas = Object.keys(c?.mapUploads || {}).length;
                return (
                  <tr key={id}>
                    <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)", fontWeight: 800 }}>{id}</td>
                    <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>{c?.nombre || "—"}</td>
                    <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>{c?.usuario || "—"}</td>
                    <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)" }}>{c?.ubicacion || "—"}</td>
                    <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)", textAlign: "center" }}>{nMapas}</td>
                    <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.08)", textAlign: "right" }}>
                      <button
                        type="button"
                        className="insumos-download-btn"
                        onClick={() => exportCaseToPDF(c)}
                        style={{ padding: "7px 10px" }}
                      >
                        Exportar ficha (PDF)
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} style={{ padding: 14, opacity: 0.7 }}>
                  No hay casos para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: 12, fontSize: 12, opacity: 0.75 }}>
        Nota: el export incluye mapas solo si el archivo sigue disponible en la sesión (URLs tipo <code>blob:</code>).
      </p>
    </section>
  );
}

export default App;










































