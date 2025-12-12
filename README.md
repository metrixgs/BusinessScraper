# 🗺️ Google Maps Business Scraper

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Crawlee](https://img.shields.io/badge/Crawlee-3.7.3-blue.svg)](https://crawlee.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Un scraper profesional de Google Maps construido con Crawlee que extrae datos completos de negocios con capacidades de búsqueda basadas en ubicación.

> ⚡ **Rápido** • 🎯 **Preciso** • 🛡️ **Confiable** • 📊 **Completo**

---

## 🎯 Características

### 🔍 Métodos de Búsqueda
- ✅ Búsqueda por ubicación (ciudad, dirección)
- ✅ Búsqueda por código postal
- ✅ Búsqueda por radio (con filtrado por distancia)

### 📊 Extracción de Datos (25+ Campos)
- Nombre del negocio y tipo/categoría
- Teléfono, WhatsApp, Email, Sitio web
- Dirección completa con componentes (calle, ciudad, estado, código postal, país)
- Coordenadas geográficas (latitud/longitud)
- Horario de apertura (por día)
- Calificación y cantidad de reseñas
- Nivel de precios y descripción
- Servicios e imágenes
- Código Plus y Place ID

### ⚡ Rendimiento
- 🚀 Ejecución rápida usando Crawlee
- 👻 Automatización de navegador sin cabeza (headless)
- ♻️ Reintentos automáticos en fallos
- 🎯 Extracción eficiente de datos
- ⏱️ Tiempos de espera configurables

---

## 🚀 Inicio Rápido

### 1. Instalación
```bash
npm install
```

### 2. Iniciar Servidor
```bash
npm start
```

### 3. Abrir Interfaz Web
Ir a: **`http://localhost:3000`**

---

## 🧪 Pruebas

### Métodos de Búsqueda Disponibles

**1. Búsqueda por Ubicación**
- Consulta: pizza, restaurantes, hoteles, dentistas, cafeterías
- Ubicación: Chicago IL, Nueva York NY, Los Ángeles CA

**2. Búsqueda por Código Postal**
- Consulta: Cualquier tipo de negocio
- Códigos Postales: 60614, 10001, 90210, 94102

**3. Búsqueda por Radio (Recomendada)**
- Consulta: Cualquier tipo de negocio
- Ciudades principales con coordenadas listas para probar
- Radio: opciones de 1km, 5km, 10km

Ver [QUICKSTART.md](QUICKSTART.md) para datos de prueba detallados e instrucciones.

---

## 📊 Resultados de Ejemplo

Cada registro de negocio incluye:

```json
{
  "name": "Joe's Coffee Shop",
  "type": "Coffee shop",
  "phone": "+1-206-555-1234",
  "email": "contact@joescoffee.com",
  "website": "https://joescoffee.com",
  "address": {
    "full": "123 Main St, Seattle, WA 98101, USA",
    "street": "123 Main St",
    "city": "Seattle",
    "state": "WA",
    "zipCode": "98101",
    "country": "USA"
  },
  "coordinates": {
    "latitude": 47.6062,
    "longitude": -122.3321
  },
  "openingHours": [
    { "day": "Monday", "hours": "6:00 AM - 8:00 PM" }
  ],
  "rating": 4.5,
  "reviewsCount": 250,
  "priceLevel": "$$",
  "scrapedAt": "2025-11-29T10:30:00.000Z"
}
```

---

## 💾 Opciones de Exportación

Después del scraping, descarga los resultados como:
- **JSON** - Para integración con API
- **CSV** - Para análisis en hojas de cálculo

---

## 📝 Documentación

| Documento | Propósito |
|----------|---------|
| [QUICKSTART.md](QUICKSTART.md) | Guía de pruebas web con datos de ejemplo |
| [START_HERE.md](START_HERE.md) | Descripción completa |

---

## ⚙️ Configuración

Variables de entorno (`.env`):
```env
HEADLESS=true          # Ejecutar sin navegador visible
MAX_RESULTS=100        # Máximo de resultados por defecto
TIMEOUT=60000          # Tiempo de espera de solicitud (ms)
```

---

## 📝 Licencia

MIT

---

## 🤝 Soporte

Ver [QUICKSTART.md](QUICKSTART.md) para la guía de pruebas web y datos de prueba de ejemplo.
