export const RECOMS = {
  inundacion: {
    label: "Inundación",
    Antes: [
      "Identifica rutas de evacuación y puntos altos cercanos.",
      "Guarda documentos importantes en bolsas herméticas.",
      "Revisa que desagües y coladeras cercanas estén despejadas."
    ],
    Durante: [
      "Evita cruzar corrientes; 15 cm de agua pueden derribarte.",
      "Desconecta la energía si el agua entra a casa.",
      "Refúgiate en zonas altas y sigue reportes oficiales."
    ],
    Despues: [
      "No regreses hasta que autoridades lo indiquen.",
      "Evita contacto con agua estancada; puede estar contaminada.",
      "Documenta daños con fotos para seguros/ayudas."
    ]
  },

  incendio: {
    label: "Incendio",
    Antes: [
      "Ten a la mano extintor con mantenimiento vigente.",
      "Mantén libres de maleza 10–20 m alrededor (si aplica).",
      "Ubica salidas y arma un plan de evacuación familiar."
    ],
    Durante: [
      "Agáchate y cubre nariz/boca; el humo sube.",
      "Corta gas y electricidad si es seguro hacerlo.",
      "Evacúa en calma; no intentes apagar incendios avanzados."
    ],
    Despues: [
      "No reingreses hasta la evaluación de bomberos.",
      "Ventila y evita reencendidos; revisa puntos calientes.",
      "Atiende irritaciones por humo; busca apoyo médico si persisten."
    ]
  },

  ola_calor: {
    label: "Ola de calor",
    Antes: [
      "Planifica actividades físicas temprano o tarde.",
      "Ten agua suficiente y sales de rehidratación oral.",
      "Revisa a población vulnerable (niños, mayores)."
    ],
    Durante: [
      "Hidrátate continuamente aunque no tengas sed.",
      "Evita el sol directo; usa ropa clara y ligera.",
      "Si hay mareo/confusión, busca sombra y atención médica."
    ],
    Despues: [
      "Recupera gradualmente actividades intensas.",
      "Revisa signos de golpe de calor (temperatura > 40°C, confusión).",
      "Mantén ventilación y descanso adecuado."
    ]
  },

  tormenta: {
    label: "Tormenta eléctrica",
    Antes: [
      "Revisa canaletas y drenaje; evita obstrucciones.",
      "Ten linternas y baterías listas.",
      "Protege equipos sensibles con supresores."
    ],
    Durante: [
      "Refúgiate bajo techo; evita árboles y superficies abiertas.",
      "Desconecta aparatos eléctricos.",
      "No uses agua (ducha, lavar) durante descargas cercanas."
    ],
    Despues: [
      "Evita cables caídos; repórtalos.",
      "Revisa daños por sobretensión.",
      "Circula con precaución por charcos profundos."
    ]
  },

  deslave: {
    label: "Deslave",
    Antes: [
      "Identifica grietas o inclinaciones anómalas cerca de tu vivienda.",
      "Evita sobrecargar laderas y mantén drenajes despejados.",
      "Define rutas de evacuación y puntos de reunión seguros."
    ],
    Durante: [
      "Evacúa hacia zonas laterales o más bajas fuera de la trayectoria.",
      "No cruces la ruta del deslizamiento; aléjate de riberas y cortes.",
      "Mantente atento a crujidos, agua turbia y movimiento del suelo."
    ],
    Despues: [
      "No regreses sin valoración técnica/geotécnica.",
      "Evita remover material inestable sin apoyo especializado.",
      "Reporta nuevas grietas o filtraciones inmediatamente."
    ]
  }
};

export function renderRecommendations(tipo, mountEl) {
  if (!mountEl) return;
  if (!tipo || tipo === "todos") {
    mountEl.innerHTML = `
      <div class="recom-empty">
        <strong>Selecciona un tipo de evento</strong>
        <p class="small">Aquí verás recomendaciones específicas (antes, durante y después).</p>
      </div>`;
    return;
  }

  const cfg = RECOMS[tipo];
  if (!cfg) {
    mountEl.innerHTML = `
      <div class="recom-empty">
        <strong>Sin recomendaciones específicas</strong>
        <p class="small">Aún no hay una guía para “${tipo}”.</p>
      </div>`;
    return;
  }

  const seccion = (titulo, items=[]) => `
    <div class="recom-section">
      <div class="recom-title">${titulo}</div>
      <ul class="recom-list">
        ${items.map(i => `<li>${i}</li>`).join("")}
      </ul>
    </div>`;

  mountEl.innerHTML = `
    <div class="recom-head">
      <span class="recom-badge">${cfg.label}</span>
      <span class="small muted">Recomendaciones</span>
    </div>
    ${seccion("Antes", cfg.Antes)}
    ${seccion("Durante", cfg.Durante)}
    ${seccion("Después", cfg.Despues)}
    <div class="recom-foot small">
      <span>Fuente: buenas prácticas de protección civil y preparación comunitaria.</span>
    </div>
  `;
}

export function ensureTipoOptions(selectEl) {
  if (!selectEl) return;
  const existing = new Set([...selectEl.options].map(o => o.value));
  Object.keys(RECOMS).forEach(key => {
    if (!existing.has(key)) {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = RECOMS[key].label;
      selectEl.appendChild(opt);
    }
  });
}
