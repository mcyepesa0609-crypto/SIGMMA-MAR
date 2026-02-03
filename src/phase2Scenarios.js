export const SCENARIO_INFO = [
  {
    id: 1,
    title: "Escenario 1 - Mínimo operativo",
    desc:
      "Se trabaja solo con los 5 criterios obligatorios. Permite continuar el proceso, pero los resultados son más sensibles a faltantes.",
    warn: "Mayor incertidumbre (Cálculo del dato al final).",
  },
  {
    id: 2,
    title: "Escenario 2 - Intermedio verificado",
    desc:
      "Incluye Escenario 1 más los insumos de modelos (geológico, hidrológico, hidráulico e hidrogeoquímico, tipo de acuífero y fuente/calidad).",
    warn: "Incertidumbre moderada (Cálculo del dato al final).",
  },
  {
    id: 3,
    title: "Escenario 3 - Completo robusto",
    desc:
      "Integra la mayor parte de variables V1-V35, mapas y evidencias. Es el escenario recomendado para resultados confiables.",
    warn: "Baja incertidumbre (Cálculo del dato al final).",
  },
];
