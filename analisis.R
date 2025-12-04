# ============================================================
# analisis_reportes_graficas.R
# Gráficas para mapaDesastres.reportes.csv
# ============================================================

rm(list = ls())

# 1. Configuración inicial -----------------------------------

# Nombre del archivo CSV (MISMA carpeta que este script)
input_csv  <- "mapaDesastres.reportes.csv"

# Carpeta donde se guardarán las gráficas
output_dir <- "uploads"          # <- AQUÍ CAMBIÓ
if (!dir.exists(output_dir)) dir.create(output_dir)

cat("Directorio de trabajo actual:\n", getwd(), "\n\n")

if (!file.exists(input_csv)) {
  stop(
    "No encuentro el archivo '", input_csv,
    "'. Pon el script y el CSV en la misma carpeta\n",
    "o cambia 'input_csv' por la ruta correcta.",
    call. = FALSE
  )
}

# 2. Cargar datos --------------------------------------------

datos <- tryCatch(
  read.csv(
    input_csv,
    fileEncoding     = "UTF-8",    # cambia a 'latin1' si ves caracteres raros
    stringsAsFactors = FALSE
  ),
  error = function(e) {
    stop("Error leyendo el CSV: ", conditionMessage(e), call. = FALSE)
  }
)

cat("Columnas del CSV:\n")
print(names(datos))
cat("\nTotal de filas leídas:", nrow(datos), "\n\n")

# Normalizamos nombres para buscarlos más fácil
nombres_orig <- names(datos)
nombres_lc   <- tolower(trimws(nombres_orig))

# Helper para buscar columna por patrón -----------------------
buscar_col <- function(patrones) {
  ix <- which(Reduce(`|`, lapply(patrones, function(p) grepl(p, nombres_lc))))
  if (length(ix) == 0) return(NA_integer_)
  ix[1]
}

# 3. Identificar columnas clave ------------------------------

# tipo (ej. inundacion, incendio, etc.)
i_tipo <- buscar_col(c("^tipo$", "tipo"))

# severidad (alta/media/baja)
i_sev  <- buscar_col(c("sever", "nivel", "riesgo"))

# fuente (ej. Ciudadanía, Protección Civil, etc.)
i_fuente <- buscar_col(c("fuente", "origen", "source"))

# fecha
i_fecha  <- buscar_col(c("^fecha$", "fecha", "date"))

if (is.na(i_tipo)) {
  stop("No encontré columna de 'tipo' (ej. tipo de fenómeno). Revisa los nombres de columnas.", call. = FALSE)
}
if (is.na(i_sev)) {
  stop("No encontré columna de 'severidad' (nivel de riesgo). Revisa los nombres de columnas.", call. = FALSE)
}
if (is.na(i_fecha)) {
  stop("No encontré columna de 'fecha'. Revisa los nombres de columnas.", call. = FALSE)
}

col_tipo   <- nombres_orig[i_tipo]
col_sev    <- nombres_orig[i_sev]
col_fuente <- if (!is.na(i_fuente)) nombres_orig[i_fuente] else NA
col_fecha  <- nombres_orig[i_fecha]

cat("Usaré las columnas:\n")
cat("  Tipo      ->", col_tipo,   "\n")
cat("  Severidad ->", col_sev,    "\n")
cat("  Fecha     ->", col_fecha,  "\n")
if (!is.na(col_fuente)) cat("  Fuente    ->", col_fuente, "\n")
cat("\n")

# 4. Procesar la fecha ----------------------------------------

fecha_bruta <- datos[[col_fecha]]

# Intentamos dos formatos comunes: "YYYY-MM-DD" y "DD/MM/YYYY"
f1 <- suppressWarnings(as.Date(fecha_bruta, format = "%Y-%m-%d"))
f2 <- suppressWarnings(as.Date(fecha_bruta, format = "%d/%m/%Y"))

na_f1 <- sum(is.na(f1))
na_f2 <- sum(is.na(f2))

if (na_f1 <= na_f2) {
  fecha <- f1
  form_usado <- "%Y-%m-%d"
} else {
  fecha <- f2
  form_usado <- "%d/%m/%Y"
}

cat("Formato de fecha asumido:", form_usado, "\n")
cat("Filas sin fecha válida:", sum(is.na(fecha)), "\n\n")

datos$fecha_usable <- fecha

# Quitamos filas sin fecha para la parte temporal
datos_con_fecha <- datos[!is.na(datos$fecha_usable), ]

# Paleta de colores un poco más tenues -----------------------
paleta_colores <- function(n) {
  grDevices::rainbow(n, s = 0.4, v = 0.9)
}

# 5. Gráfica: Reportes por tipo -------------------------------

tabla_tipo <- sort(table(datos[[col_tipo]]), decreasing = TRUE)

png(
  file   = file.path(output_dir, "reportes_por_tipo.png"),
  width  = 900,
  height = 600
)
barplot(
  tabla_tipo,
  main = "Reportes por tipo de fenómeno",
  xlab = "Tipo de fenómeno",
  ylab = "Número de reportes",
  las  = 2,
  col  = paleta_colores(length(tabla_tipo))
)
dev.off()

cat("✓ Gráfica 'reportes_por_tipo.png' generada.\n")


# 6. Gráfica: Reportes por severidad --------------------------

tabla_sev <- sort(table(datos[[col_sev]]), decreasing = TRUE)

png(
  file   = file.path(output_dir, "reportes_por_severidad.png"),
  width  = 900,
  height = 600
)
barplot(
  tabla_sev,
  main = "Reportes por severidad",
  xlab = "Severidad",
  ylab = "Número de reportes",
  las  = 2,
  col  = paleta_colores(length(tabla_sev))
)
dev.off()

cat("✓ Gráfica 'reportes_por_severidad.png' generada.\n")


# 7. Gráfica: Reportes por fuente (si existe) -----------------

if (!is.na(col_fuente)) {
  tabla_fuente <- sort(table(datos[[col_fuente]]), decreasing = TRUE)

  png(
    file   = file.path(output_dir, "reportes_por_fuente.png"),
    width  = 900,
    height = 600
  )
  barplot(
    tabla_fuente,
    main = "Reportes por fuente",
    xlab = "Fuente",
    ylab = "Número de reportes",
    las  = 2,
    col  = paleta_colores(length(tabla_fuente))
  )
  dev.off()

  cat("✓ Gráfica 'reportes_por_fuente.png' generada.\n")
} else {
  cat("⚠ No se generó gráfica por fuente (no se encontró columna de fuente).\n")
}


# 8. Gráfica: Reportes por mes --------------------------------

if (nrow(datos_con_fecha) > 0) {
  # Año-mes: "YYYY-MM"
  datos_con_fecha$anio_mes <- format(datos_con_fecha$fecha_usable, "%Y-%m")

  tabla_mes <- sort(table(datos_con_fecha$anio_mes), decreasing = FALSE)

  png(
    file   = file.path(output_dir, "reportes_por_mes.png"),
    width  = 1000,
    height = 600
  )
  barplot(
    tabla_mes,
    main = "Reportes por mes",
    xlab = "Año-Mes",
    ylab = "Número de reportes",
    las  = 2,
    col  = paleta_colores(length(tabla_mes))
  )
  dev.off()

  cat("✓ Gráfica 'reportes_por_mes.png' generada.\n")
} else {
  cat("⚠ No se generó gráfica temporal: no hay fechas válidas.\n")
}

# 9. Gráfica: Reportes por día de la semana -------------------

if (nrow(datos_con_fecha) > 0) {
  dias_esp <- c("domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado")
  wday_num <- as.integer(strftime(datos_con_fecha$fecha_usable, format = "%w"))
  datos_con_fecha$dia_semana <- factor(dias_esp[wday_num + 1], levels = dias_esp)

  tabla_dia <- table(datos_con_fecha$dia_semana)

  png(
    file   = file.path(output_dir, "reportes_por_dia_semana.png"),
    width  = 900,
    height = 600
  )
  barplot(
    tabla_dia,
    main = "Reportes por día de la semana",
    xlab = "Día",
    ylab = "Número de reportes",
    las  = 2,
    col  = paleta_colores(length(tabla_dia))
  )
  dev.off()

  cat("✓ Gráfica 'reportes_por_dia_semana.png' generada.\n")
} else {
  cat("⚠ No se generó gráfica por día de la semana: no hay fechas válidas.\n")
}

cat("\n==========================================\n")
cat("Gráficas guardadas en la carpeta '", output_dir, "'.\n", sep = "")
cat("==========================================\n")
