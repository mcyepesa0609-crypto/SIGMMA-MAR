// src/marTechniques.js

export const TECH_GROUPS = [
  {
    id: "1",
    name: "Intervención de corrientes superficiales",
    short:
      "Técnicas que intervienen cauces y corrientes superficiales para retener flujos e inducir la infiltración al acuífero.",
    techniques: [
      {
        id: "1.1",
        name: "Presas de recarga",
        icon: "/images/Presas_de_recarga.png",
        definition: `Estructuras construidas en cauces de ríos efímeros para retener temporalmente el agua y promover su infiltración en el acuífero subyacente. Funcionan interceptando el flujo y permitiendo que el agua se infiltre progresivamente a través del lecho del río, aumentando el almacenamiento en acuíferos libres.`,
        refs: `IGRAC, 2007; Hannappel et al., 2014; Bonilla-Valverde et al., 2018; Stefan & Ansems, 2018; Maliva, 2020; Dillon et al., 2022.`
      },
      {
        id: "1.2",
        name: "Presas subterráneas",
        definition: `Barreras construidas en corrientes efímeras para retener y almacenar flujos de agua subterránea. Se instalan en el lecho del río, ancladas al basamento y rellenadas con material de baja permeabilidad, permitiendo la acumulación de agua en los aluviones saturados para su uso posterior.`,
        refs: `Dillon, 2005; IGRAC, 2007; Sprenger et al., 2017; Stefan & Ansems, 2018; Zhang et al., 2020; Dillon et al., 2022.`
      },
      {
        id: "1.3",
        name: "Presas de arena",
        definition: `Estructuras construidas en corrientes efímeras de zonas áridas y semiáridas para retener sedimentos y almacenar agua de escorrentía en sus poros. A medida que ocurren inundaciones sucesivas, la acumulación de arena eleva la presa, creando un acuífero artificial que permite la infiltración y almacenamiento del agua para su aprovechamiento posterior, principalmente mediante pozos en estaciones secas.`,
        refs: `Dillon, 2005; Dillon et al., 2009, 2022; IGRAC, 2007; Hannappel et al., 2014; Sprenger et al., 2017; Maliva, 2020; Zhang et al., 2020.`
      },
      {
        id: "1.4",
        name: "Filtración de ribera",
        definition: `Extracción de agua subterránea desde un pozo o galería cercana a un río para inducir la infiltración desde las bancas y el lecho del cuerpo de agua superficial.`,
        refs: `Dillon, 2005; IGRAC, 2007; Hannappel et al., 2014; Sprenger et al., 2017; Bonilla-Valverde et al., 2018; Stefan & Ansems, 2018; Maliva, 2020; Zhang et al., 2020; Dillon et al., 2022.`
      }
    ]
  },
  {
    id: "2",
    name: "Recarga mediante pozos y perforaciones",
    short:
      "Técnicas basadas en pozos y perforaciones para inyectar, almacenar, transferir y recuperar agua en acuíferos.",
    techniques: [
      {
        id: "2.1",
        name: "Almacenamiento y recuperación de acuíferos (ASR)",
        definition: `Inyección de agua en un pozo durante los periodos de exceso hídrico para su almacenamiento subterráneo y posterior recuperación desde el mismo pozo cuando se necesite.`,
        refs: `Dillon, 2005; Dillon et al., 2009, 2022; IGRAC, 2007; Sprenger et al., 2017; Bonilla-Valverde et al., 2018; Stefan & Ansems, 2018; Maliva, 2020; Zhang et al., 2020.`
      },
      {
        id: "2.2",
        name: "Almacenamiento, transferencia y \nrecuperación de acuíferos (ASTR)",
        definition: `Inyección de agua en un pozo para su almacenamiento y posterior recuperación desde uno o varios pozos diferentes. Este método permite extender el tiempo de residencia del agua en el acuífero, facilitando su tratamiento natural a través de procesos de filtración, adsorción y biodegradación.`,
        refs: `Dillon, 2005; Dillon et al., 2009, 2022; Hannappel et al., 2014; Sprenger et al., 2017; Bonilla-Valverde et al., 2018; Stefan & Ansems, 2018; Maliva, 2020; Zhang et al., 2020.`
      },
      {
        id: "2.3",
        name: "Pozos secos",
        definition: `Estructuras excavadas superficialmente utilizadas para facilitar la infiltración subterránea en la zona vadosa. Son generalmente pozos poco profundos empleados en áreas donde las capas freáticas están muy profundas, permitiendo la infiltración de agua hacia el acuífero libre en profundidad.`,
        refs: `Dillon, 2005; Dillon et al., 2009; Maliva, 2020.`
      }
    ]
  },
  {
    id: "3",
    name: "Infiltración superficial",
    short:
      "Técnicas que favorecen la infiltración desde la superficie mediante estanques, zanjas, exceso de riego o captación de lluvia.",
    techniques: [
      {
        id: "3.1",
        name: "Estanques y cuencas de infiltración",
        definition: `Estructuras diseñadas para almacenar temporalmente agua superficial y facilitar su infiltración hacia los acuíferos. Generalmente, se construyen fuera del cauce principal y reciben agua desviada desde fuentes superficiales, permitiendo su percolación a través de suelos permeables y la zona no saturada hasta alcanzar un acuífero subyacente.`,
        refs: `Dillon, 2005; IGRAC, 2007; Sprenger et al., 2017; Maliva, 2020; Zhang et al., 2020; Dillon et al., 2022.`
      },
      {
        id: "3.2",
        name: "Tratamiento suelo–acuífero",
        definition: `El agua residual tratada se infiltra de manera intermitente a través de estanques de infiltración para mejorar su calidad antes de alcanzar el acuífero. Durante su paso por la zona no saturada, se facilita la eliminación de nutrientes y patógenos mediante procesos naturales de filtración, adsorción y biodegradación. Una vez el agua ha residido en el acuífero, puede recuperarse mediante pozos para su posterior uso.`,
        refs: `Dillon, 2005; Hannappel et al., 2014; Sprenger et al., 2017; Maliva, 2020; Zhang et al., 2020; Dillon et al., 2022.`
      },
      {
        id: "3.3",
        name: "Galerías de infiltración",
        definition: `Zanjas enterradas en suelos permeables que contienen celdas de polietileno o tuberías ranuradas, permitiendo la infiltración del agua a través de la zona no saturada hasta un acuífero libre.`,
        refs: `Dillon et al., 2009, 2022.`
      },
      {
        id: "3.4",
        name: "Inundaciones controladas",
        definition: `Liberación de agua sobre una amplia superficie terrestre para promover su infiltración hacia el acuífero. Se aplica principalmente en zonas donde el acuífero libre se encuentra cerca de la superficie del suelo. Dependiendo de las condiciones locales, este método puede incluir sistemas de zanjas y surcos poco profundos fuera de los cauces principales para facilitar la recarga.`,
        refs: `IGRAC, 2007; Bonilla-Valverde et al., 2018; Stefan & Ansems, 2018; Maliva, 2020; Zhang et al., 2020.`
      },
      {
        id: "3.5",
        name: "Exceso de riego",
        definition: `Basada en la infiltración y percolación gravitacional, permite que el agua aplicada en superficies agrícolas se infiltre más allá de la zona radicular hacia el acuífero subyacente.`,
        refs: `Sprenger et al., 2017; Zhang et al., 2020.`
      },
      {
        id: "3.6",
        name: "Filtración de dunas",
        definition: `Infiltración de agua desde estanques construidos en dunas de arena, permitiendo su almacenamiento y posterior recuperación mediante pozos o estanques ubicados a menor elevación. Se usa en áreas cercanas a cuerpos de agua superficiales, donde contribuye a reducir la presión en la ribera del río, induciendo la infiltración en el acuífero.`,
        refs: `Dillon, 2005; Maliva, 2020; Zhang et al., 2020; Dillon et al., 2022.`
      },
      {
        id: "3.7",
        name: "Captación de agua lluvia",
        definition: `Recolección del escurrimiento pluvial desde techos, terrenos o espacios abiertos para su almacenamiento y posterior infiltración en el acuífero. Dependiendo de la configuración, el agua captada puede dirigirse a pozos, sumideros o estructuras con arena y grava para facilitar su percolación hasta la capa freática, desde donde puede ser extraída mediante bombeo. En algunos casos, la recolección se combina con técnicas de inyección o infiltración para mejorar su aprovechamiento en función de las condiciones local.`,
        refs: `Dillon, 2005; IGRAC, 2007; Hannappel et al., 2014; Sprenger et al., 2017; Bonilla-Valverde et al., 2018; Stefan & Ansems, 2018; Zhang et al., 2020; Dillon et al., 2022.`
      }
    ]
  }
];

