// /src/Phase2Intro.jsx
import React from "react";
import { CATALOG } from "./catalog/catalog.js";

export default function Phase2Intro({ activeRoute, setActiveRoute }) {
  const [localRoute, setLocalRoute] = React.useState("A");
  const route = activeRoute ?? localRoute;
  const onSelectRoute = setActiveRoute ?? setLocalRoute;

  const copy = CATALOG?.uiCopy?.phase2Intro;
  const hasCopy = !!(copy?.baseTruth && copy?.twoRoutes && copy?.routeA && copy?.routeB && copy?.closing);

  if (!hasCopy) return null;

  return (
    <div className="panel-card">
      {/* Intro antes de Ruta A / Ruta B */}
      <div className="fase2-intro-wrap">
        <p className="fase2-intro-p">{copy.baseTruth}</p>
        <p className="fase2-intro-p">{copy.twoRoutes}</p>

        <div className="fase2-route-cards">
          <div className="fase2-route-card">
            <h3 className="fase2-route-title">{copy.routeA?.title}</h3>
            <p className="fase2-route-p">{copy.routeA?.body}</p>
            <p className="fase2-route-result">
              <strong>Resultado esperado:</strong> {copy.routeA?.expected}
            </p>
          </div>

          <div className="fase2-route-card">
            <h3 className="fase2-route-title">{copy.routeB?.title}</h3>
            <p className="fase2-route-p">{copy.routeB?.body}</p>
            <p className="fase2-route-result">
              <strong>Resultado esperado:</strong> {copy.routeB?.expected}
            </p>
          </div>
        </div>

        <p className="fase2-intro-p">{copy.closing}</p>

        {/* Solo si existen */}
        {copy.nextStepTitle || copy.nextStepItem ? (
          <div className="fase2-nextstep">
            {copy.nextStepTitle ? <div className="fase2-nextstep-title">{copy.nextStepTitle}</div> : null}
            {copy.nextStepItem ? <div className="fase2-nextstep-item">{copy.nextStepItem}</div> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
