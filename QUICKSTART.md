# Inicio Rápido - Guía de Pruebas Web

Asegúrate de tener instalado Node.js versión mayor a 18
La última versión es mejor

## Configuración

```bash
# Instalar dependencias
npm install

# Iniciar el servidor web
npm start
```

Abre tu navegador: **`http://localhost:3000`**

---

## Pruebas mediante la Interfaz Web

### 1️⃣ Búsqueda Basada en Ubicación

**Pasos:**
1. Abre `http://localhost:3000`
2. Selecciona tipo de búsqueda: **Ubicación**
3. Ingresa los siguientes datos:

| Campo | Valor de Prueba 1 | Valor de Prueba 2 | Valor de Prueba 3 |
|-------|--------------|--------------|--------------|
| Consulta de Búsqueda | pizza | restaurantes | cafeterías |
| Ubicación | Chicago, IL | Nueva York, NY | Los Ángeles, CA |
| Máx. Resultados | 10 | 15 | 20 |

**Resultados Esperados:** 10-20 negocios con detalles completos

---

### 2️⃣ Búsqueda por Código Postal

**Pasos:**
1. Abre `http://localhost:3000`
2. Selecciona tipo de búsqueda: **Código Postal**
3. Ingresa los siguientes datos:

| Campo | Valor de Prueba 1 | Valor de Prueba 2 | Valor de Prueba 3 | Valor de Prueba 4 |
|-------|--------------|--------------|--------------|--------------|
| Consulta de Búsqueda | dentistas | hoteles | restaurantes | pizza |
| Código Postal | 60614 | 10001 | 90210 | 94102 |
| Máx. Resultados | 10 | 15 | 10 | 15 |

**Resultados Esperados:** 8-15 negocios dentro del código postal

---

### 3️⃣ Búsqueda por Radio (Recomendada)

**Pasos:**
1. Abre `http://localhost:3000`
2. Selecciona tipo de búsqueda: **Radio**
3. Ingresa los siguientes datos:

#### **Ubicación de Prueba 1: Chicago**
| Campo | Valor |
|-------|-------|
| Consulta de Búsqueda | pizza |
| Latitud | 41.8781 |
| Longitud | -87.6298 |
| Radio (metros) | 5000 |
| Máx. Resultados | 20 |

**Resultados Esperados:** 15-20 pizzerías dentro de un radio de 5km

---

#### **Ubicación de Prueba 2: Nueva York**
| Campo | Valor |
|-------|-------|
| Consulta de Búsqueda | restaurantes |
| Latitud | 40.7128 |
| Longitud | -74.0060 |
| Radio (metros) | 3000 |
| Máx. Resultados | 20 |

**Resultados Esperados:** 15-20 restaurantes dentro de un radio de 3km

---

#### **Ubicación de Prueba 3: Los Ángeles**
| Campo | Valor |
|-------|-------|
| Consulta de Búsqueda | cafeterías |
| Latitud | 34.0522 |
| Longitud | -118.2437 |
| Radio (metros) | 5000 |
| Máx. Resultados | 20 |

**Resultados Esperados:** 15-20 cafeterías dentro de un radio de 5km

---

#### **Ubicación de Prueba 4: San Francisco**
| Campo | Valor |
|-------|-------|
| Consulta de Búsqueda | dentistas |
| Latitud | 37.7749 |
| Longitud | -122.4194 |
| Radio (metros) | 2000 |
| Máx. Resultados | 15 |

**Resultados Esperados:** 8-15 dentistas dentro de un radio de 2km

---

#### **Ubicación de Prueba 5: Houston**
| Campo | Valor |
|-------|-------|
| Consulta de Búsqueda | hoteles |
| Latitud | 29.7604 |
| Longitud | -95.3698 |
| Radio (metros) | 5000 |
| Máx. Resultados | 15 |

**Resultados Esperados:** 10-15 hoteles dentro de un radio de 5km

---

## Características de la Interfaz Web

### Durante el Scraping:
- ✅ Actualizaciones de progreso en tiempo real
- ✅ Nombres de negocios a medida que se extraen
- ✅ Barra de estado en vivo
- ✅ Notificaciones de error (si las hay)

### Después de Completar:
- ✅ Resultados completos mostrados
- ✅ Descargar como JSON
- ✅ Descargar como CSV
- ✅ Ver detalles completos del negocio
- ✅ Copiar al portapapeles

---

## Campos de Datos en los Resultados

Cada negocio incluye:
- **Nombre y Tipo** - Nombre del negocio y categoría
- **Contacto** - Teléfono, WhatsApp, Email, Sitio web
- **Dirección** - Dirección completa con componentes
- **Ubicación** - Latitud, Longitud, Distancia desde el centro
- **Horarios** - Horario de apertura por día
- **Calificación** - Calificación por estrellas y cantidad de reseñas
- **Detalles** - Nivel de precios, descripción, servicios
- **Imágenes** - Fotos del negocio
- **Metadatos** - Place ID, Código Plus, URL de Maps

---

## Lista de Verificación de Pruebas

### Búsqueda por Radio (Más Confiable)
- [ ] Búsqueda de pizza en Chicago (41.8781, -87.6298)
- [ ] Restaurantes en Nueva York (40.7128, -74.0060)
- [ ] Cafeterías en Los Ángeles (34.0522, -118.2437)
- [ ] Dentistas en San Francisco (37.7749, -122.4194)
- [ ] Hoteles en Houston (29.7604, -95.3698)

### Búsqueda por Ubicación
- [ ] "pizza" en Chicago, IL
- [ ] "restaurantes" en Nueva York, NY
- [ ] "hoteles" en Los Ángeles, CA

### Búsqueda por Código Postal
- [ ] "dentistas" en 60614
- [ ] "restaurantes" en 10001
- [ ] "pizza" en 90210

---

## Consejos

1. **Comienza con búsqueda por radio** - Resultados más confiables
2. **Usa máximo 15-20 resultados** - Equilibra velocidad vs. completitud
3. **Espera el estado "Completado"** - No refresques durante el scraping
4. **Exporta inmediatamente** - Guarda los resultados antes de salir de la página
5. **Verifica distancias** - Confirma que los resultados estén dentro del radio
