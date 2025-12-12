import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleMapsScraper } from './scraper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const activeSessions = new Map();
function createLogger(sessionId) {
  const logs = [];
  const clients = new Set();

  const sendToClients = (message, type = 'log') => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type,
      message,
    };
    logs.push(logEntry);

    clients.forEach(client => {
      client.write(`data: ${JSON.stringify(logEntry)}\n\n`);
    });
  };

  return {
    logs,
    clients,
    log: (msg) => sendToClients(msg, 'log'),
    info: (msg) => sendToClients(msg, 'info'),
    success: (msg) => sendToClients(msg, 'success'),
    error: (msg) => sendToClients(msg, 'error'),
    progress: (current, total, name) => sendToClients(JSON.stringify({ current, total, name }), 'progress'),
  };
}

app.get('/api/logs/:sessionId', (req, res) => {
  const { sessionId } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const session = activeSessions.get(sessionId);
  if (session) {
    session.logger.logs.forEach(log => {
      res.write(`data: ${JSON.stringify(log)}\n\n`);
    });
    session.logger.clients.add(res);
  }

  req.on('close', () => {
    if (session) {
      session.logger.clients.delete(res);
    }
  });
});

app.post('/api/scrape', async (req, res) => {
  const { 
    searchType, query, 
    // Location search fields
    location, locationCountry, locationCountryName, locationState, locationCity,
    // ZIP code search fields
    zipCode, country, countryName, state, 
    // Radius search fields
    latitude, longitude, radiusMeters, 
    maxResults = 50 
  } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const logger = createLogger(sessionId);

  activeSessions.set(sessionId, {
    logger,
    status: 'running',
    results: [],
    startedAt: new Date().toISOString(),
  });

  res.json({ sessionId, message: 'Scraping started' });

  (async () => {
    try {
      logger.info('Iniciando Extractor de Google Maps...');
      logger.log(`Consulta de Búsqueda: "${query}"`);
      logger.log(`Resultados Máximos: ${maxResults}`);

      const scraper = new GoogleMapsScraper();

      const originalLog = console.log;
      console.log = (...args) => {
        const message = args.map(arg =>
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ');
        
        // Filter out redundant and verbose Crawlee logs
        if (message.includes('PlaywrightCrawler:Statistics:') ||
            message.includes('PlaywrightCrawler:AutoscaledPool:') ||
            message.includes('Final request statistics:') ||
            message.includes('request statistics:') ||
            message.includes('{"terminal":true}')) {
          return; // Skip these verbose logs
        }
        
        // Clean up Crawlee messages
        let cleanMessage = message;
        if (message.includes('PlaywrightCrawler:')) {
          cleanMessage = message.replace(/INFO PlaywrightCrawler:\s*/, '');
        }
        
        // Remove duplicate [INFO] prefixes
        cleanMessage = cleanMessage.replace(/^\[INFO\]\s*/, '');
        
        // Translate common English messages to Spanish
        const translations = {
          'Starting the crawler': 'Iniciando el crawler',
          'All requests from the queue have been processed, the crawler will shut down': 'Todas las solicitudes de la cola han sido procesadas, el crawler se cerrará',
          'No more results available': 'No hay más resultados disponibles',
          'Processing batch': 'Procesando lote',
          'Processing': 'Procesando',
          'Found': 'Encontrados',
          'businesses': 'negocios',
          'Skipped': 'Omitidos',
          'outside radius': 'fuera del radio',
          'Searching:': 'Buscando:',
          'Radius:': 'Radio:',
          'Max:': 'Máx:',
          'Starting smart radius search': 'Iniciando búsqueda inteligente por radio',
          'Collected': 'Recolectadas',
          'URLs': 'URLs',
          'End of results': 'Fin de resultados',
          'No more results': 'No hay más resultados',
          'Processing batch': 'Procesando lote',
          'found': 'encontrados',
          'Progress:': 'Progreso:',
          'Page closed': 'Página cerrada',
          'Extraction failed': 'Extracción fallida',
          'Request failed': 'Solicitud fallida',
          'URL collection failed': 'Recolección de URLs fallida',
        };
        
        // Apply translations
        for (const [en, es] of Object.entries(translations)) {
          if (cleanMessage.includes(en)) {
            cleanMessage = cleanMessage.replace(new RegExp(en, 'g'), es);
          }
        }
        
        logger.log(cleanMessage);
        originalLog.apply(console, args);
      };

      let results;

      if (searchType === 'location') {
        logger.info(`Buscando en: ${location}`);
        if (locationCity) logger.info(`Ciudad: ${locationCity}`);
        if (locationState) logger.info(`Estado: ${locationState}`);
        if (locationCountryName) logger.info(`País: ${locationCountryName}`);
        
        results = await scraper.search({ 
          query, 
          location,
          city: locationCity,
          state: locationState,
          country: locationCountry,
          countryName: locationCountryName,
          maxResults 
        });
      } else if (searchType === 'zipcode') {
        // Build full location string with country and optional state
        let fullLocation = zipCode;
        if (state) {
          fullLocation = `${zipCode}, ${state}`;
        }
        if (countryName) {
          fullLocation = `${fullLocation}, ${countryName}`;
        }
        
        logger.info(`Buscando en código postal: ${zipCode}`);
        logger.info(`País: ${countryName || country}`);
        if (state) {
          logger.info(`Estado/Provincia: ${state}`);
        }
        logger.info(`Ubicación completa de búsqueda: ${fullLocation}`);
        
        results = await scraper.searchByZipCode({ 
          query, 
          zipCode, 
          country,
          countryName,
          state,
          maxResults 
        });
      } else if (searchType === 'radius') {
        logger.info(`Buscando dentro de un radio de ${radiusMeters}m de ${latitude}, ${longitude}`);
        results = await scraper.searchByRadius({
          query,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          radiusMeters: parseInt(radiusMeters, 10),
          maxResults,
        });
      } else {
        throw new Error('Invalid search type');
      }

      console.log = originalLog;

      const session = activeSessions.get(sessionId);
      session.results = results;
      session.status = 'completed';

      logger.success(`¡Extracción completada! Se encontraron ${results.length} negocios.`);

      session.logger.clients.forEach(client => {
        client.write(`data: ${JSON.stringify({ type: 'complete', count: results.length })}\n\n`);
      });

    } catch (error) {
      const session = activeSessions.get(sessionId);
      session.status = 'error';
      session.error = error.message;

      logger.error(`Error: ${error.message}`);

      session.logger.clients.forEach(client => {
        client.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
      });
    }
  })();
});

app.get('/api/results/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = activeSessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json({
    status: session.status,
    results: session.results,
    count: session.results.length,
    startedAt: session.startedAt,
  });
});

app.get('/api/export/:sessionId/:format', (req, res) => {
  const { sessionId, format } = req.params;
  const session = activeSessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (session.results.length === 0) {
    return res.status(400).json({ error: 'No results to export' });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=google_maps_results_${timestamp}.json`);
    res.json(session.results);
  } else if (format === 'csv') {
    const csvData = convertToCSV(session.results);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=google_maps_results_${timestamp}.csv`);
    res.send(csvData);
  } else {
    res.status(400).json({ error: 'Invalid format. Use "json" or "csv"' });
  }
});

function convertToCSV(data) {
  const headers = [
    'Business Name', 'Business Type', 'Phone', 'WhatsApp', 'Email', 'Website',
    'Full Address', 'Street', 'City', 'State', 'ZIP Code', 'Country',
    'Latitude', 'Longitude', 'Rating', 'Reviews Count', 'Total Reviews',
    'Price Level', 'Description', 'Opening Hours', 'Plus Code', 'Place ID',
    'Google Maps URL', 'Image URL', 'Distance From Center (m)', 'Amenities', 'Scraped At'
  ];

  const escapeCSV = (value) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = data.map(item => [
    item.name || '',
    item.type || '',
    item.phone || '',
    item.whatsapp || '',
    item.email || '',
    item.website || '',
    item.address?.full || '',
    item.address?.street || '',
    item.address?.city || '',
    item.address?.state || '',
    item.address?.zipCode || '',
    item.address?.country || '',
    item.coordinates?.latitude || '',
    item.coordinates?.longitude || '',
    item.rating || '',
    item.reviewsCount || 0,
    item.totalReviews || 0,
    item.priceLevel || '',
    item.description || '',
    item.openingHours?.map(h => `${h.day}: ${h.hours}`).join('; ') || '',
    item.plusCode || '',
    item.placeId || '',
    item.googleMapsUrl || '',
    item.imageUrl || '',
    item.distanceFromCenter || '',
    item.amenities?.join('; ') || '',
    item.scrapedAt || '',
  ].map(escapeCSV));

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

app.delete('/api/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  activeSessions.delete(sessionId);
  res.json({ message: 'Session cleared' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`\nInterfaz Web de Google Maps Scraper`);
  console.log(`Servidor ejecutándose en http://localhost:${PORT}\n`);
});

export default app;
