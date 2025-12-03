  # analisis.R
  # Adaptado para correr con source() en RStudio o sesión interactiva

  analisis_incidentes <- function(input_csv, output_png) {
    # Paquetes
    suppressPackageStartupMessages({
      library(ggplot2)
      library(dplyr)
    })
    
    # Leer datos
    df <- read.csv(input_csv, stringsAsFactors = FALSE)
    
    # Asegurar columnas
    if (!"tipo" %in% names(df))       df$tipo       <- "otro"
    if (!"severidad" %in% names(df)) df$severidad <- "media"
    if (!"estado" %in% names(df))    df$estado    <- "desconocido"
    
    # Resumen simple: conteo por tipo y severidad
    resumen <- df %>%
      group_by(tipo, severidad) %>%
      summarise(n = n(), .groups = "drop")
    
    # Si no hay datos, graficamos un mensaje vacío
    if (nrow(resumen) == 0) {
      png(output_png, width = 900, height = 400)
      par(mar = c(4, 4, 2, 1))
      plot.new()
      text(0.5, 0.5, "Sin datos para graficar aún", cex = 1.5)
      dev.off()
      return(invisible(NULL))
    }
    
    # Gráfica de barras: Incidentes por tipo y severidad
    p <- ggplot(resumen, aes(x = tipo, y = n, fill = severidad)) +
      geom_col(position = "dodge") +
      labs(
        title = "Incidentes por tipo y severidad",
        x = "Tipo de incidente",
        y = "Número de reportes"
      ) +
      theme_minimal() +
      theme(
        plot.title = element_text(face = "bold", hjust = 0.5),
        axis.text.x = element_text(angle = 20, hjust = 1)
      )
    
    # Guardar PNG
    ggsave(
      filename = output_png,
      plot     = p,
      width    = 9,
      height   = 4,
      dpi      = 120
    )
  }

  # Ejemplo de uso interactivo:
  # source("analisis.R")
  # analisis_incidentes("datos.csv", "grafico.png")