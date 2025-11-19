// js/charts.js

// Guardamos referencias a las gráficas para poder destruirlas y evitar que se dupliquen
let chartTipos = null;
let chartSeveridad = null;
let chartMeses = null;

/**
 * Recibe la lista de incidentes ya filtrada (list)
 * y dibuja / actualiza las 3 gráficas:
 *  - Incidentes por tipo
 *  - Incidentes por severidad
 *  - Incidentes por mes
 */
export function renderCharts(lista) {
  // Si Chart.js no está cargado o no existen los canvas, no hacemos nada
  const canvasTipos = document.getElementById("chartTipos");
  const canvasSeveridad = document.getElementById("chartSeveridad");
  const canvasMeses = document.getElementById("chartMeses");

  if (!window.Chart || !canvasTipos || !canvasSeveridad || !canvasMeses) {
    return;
  }

  const datos = Array.isArray(lista) ? lista : [];

  // --- Acumuladores ---
  const porTipo = {};
  const porSeveridad = {};
  const porMes = {}; // clave: YYYY-MM

  datos.forEach((r) => {
    if (!r) return;

    // Tipo
    if (r.tipo) {
      porTipo[r.tipo] = (porTipo[r.tipo] || 0) + 1;
    }

    // Severidad
    if (r.severidad) {
      porSeveridad[r.severidad] = (porSeveridad[r.severidad] || 0) + 1;
    }

    // Fecha → agrupar por mes
    if (r.fecha) {
      const d = new Date(r.fecha);
      if (!Number.isNaN(d.getTime())) {
        const mesClave = `${d.getFullYear()}-${String(
          d.getMonth() + 1
        ).padStart(2, "0")}`; // YYYY-MM
        porMes[mesClave] = (porMes[mesClave] || 0) + 1;
      }
    }
  });

  // Ordenar llaves de meses cronológicamente
  const mesesLabels = Object.keys(porMes).sort();

  // ================================
  // 1. GRÁFICA: INCIDENTES POR TIPO
  // ================================

  if (chartTipos) {
    chartTipos.destroy();
  }

  chartTipos = new Chart(canvasTipos.getContext("2d"), {
    type: "bar",
    data: {
      labels: Object.keys(porTipo),
      datasets: [
        {
          label: "Incidentes por tipo",
          data: Object.values(porTipo),
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          ticks: {
            autoSkip: false,
          },
        },
        y: {
          beginAtZero: true,
          precision: 0,
        },
      },
    },
  });

  // ==================================
  // 2. GRÁFICA: INCIDENTES POR SEVERIDAD
  // ==================================

  if (chartSeveridad) {
    chartSeveridad.destroy();
  }

  chartSeveridad = new Chart(canvasSeveridad.getContext("2d"), {
    type: "pie",
    data: {
      labels: Object.keys(porSeveridad),
      datasets: [
        {
          label: "Incidentes por severidad",
          data: Object.values(porSeveridad),
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
        },
      },
    },
  });

  // ==================================
  // 3. GRÁFICA: INCIDENTES POR MES
  // ==================================

  if (chartMeses) {
    chartMeses.destroy();
  }

  chartMeses = new Chart(canvasMeses.getContext("2d"), {
    type: "line",
    data: {
      labels: mesesLabels,
      datasets: [
        {
          label: "Incidentes por mes",
          data: mesesLabels.map((m) => porMes[m]),
          tension: 0.25,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          ticks: {
            autoSkip: true,
            maxTicksLimit: 8,
          },
        },
        y: {
          beginAtZero: true,
          precision: 0,
        },
      },
    },
  });
}
