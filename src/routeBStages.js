export const ROUTE_B_STAGES = [
  {
    title: "Etapa 1: Preparación de datos",
    highlights: [
      "Recolección: dataset de 130 casos históricos MAR",
      "Limpieza: manejo de valores faltantes y outliers",
      "Codificación: One-Hot Encoding para variables categóricas",
      "Escalado: normalización/estandarización de numéricas",
    ],
    purpose: "Transformar datos crudos en formato ML-compatible",
    result: "Matriz X (features) y vector y (grupo MAR óptimo)",
  },
  {
    title: "Etapa 2: Ingeniería de features",
    highlights: [
      "Selección de variables: análisis de importancia",
      "Creación de escenarios: E1 (5 vars), E2 (13 vars), E3 (24+ vars)",
      "Interacciones: features compuestos (ej. acuífero × fuente)",
    ],
    purpose: "Optimizar la representación de la información",
    result: "Conjuntos de features por escenario",
  },
  {
    title: "Etapa 3: Entrenamiento de modelos",
    highlights: [
      "Modelo A: Árbol de Decisión (CART) con profundidad controlada y poda",
      "Modelo B: Bosque Aleatorio (Random Forest) de 100-500 árboles",
      "Ambos modelos buscan capturar no-linealidades e interpretar patrones",
    ],
    purpose: "Aprender patrones de casos históricos",
    result: "Modelos entrenados ML_E1, ML_E2 y ML_E3",
  },
  {
    title: "Etapa 4: Validación y evaluación",
    highlights: [
      "Validación cruzada estratificada k-fold (k=5 o 10)",
      "Curvas de aprendizaje para detectar overfitting",
      "Matrices de confusión y métricas por grupo MAR",
    ],
    purpose: "Cuantificar desempeño predictivo",
    result: "Métricas por escenario y modelo",
  },
  {
    title: "Etapa 5: Análisis de importancia de variables",
    highlights: [
      "Gini Importance (Random Forest)",
      "Permutation Importance (agnóstico al modelo)",
      "SHAP values para interpretabilidad avanzada",
    ],
    purpose: "Identificar variables críticas para la decisión",
    result: "Ranking de importancia y gráficos de contribución",
  },
  {
    title: "Etapa 6: Comparación Ruta A vs Ruta B",
    highlights: [
      "Prueba t pareada sobre F1-scores",
      "Test de McNemar para diferencias en clasificación",
      "Curvas ROC comparativas y análisis estadístico",
    ],
    purpose: "Validar hipótesis de mejora con ML",
    result: "Evidencia estadística (p-value, intervalos de confianza)",
  },
];
