import { GoogleMapsScraper } from './scraper.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('\n=========================================================');
  console.log('  Google Maps Business Scraper v1.0');
  console.log('  Impulsado por Crawlee');
  console.log('=========================================================\n');

  try {
    console.log('Seleccione el tipo de búsqueda:');
    console.log('1. Búsqueda por ubicación (ciudad, estado, etc.)');
    console.log('2. Búsqueda por código postal');
    console.log('3. Búsqueda por coordenadas con radio');
    console.log('');

    const searchType = await question('Ingrese su elección (1-3): ');
    const query = await question('\nIngrese el tipo de negocio/niche (ej. "restaurantes", "dentistas"): ');

    let searchParams = { query };

    if (searchType === '1') {
      const location = await question('Ingrese ubicación (ej. "Nueva York, NY", "Miami, FL"): ');
      searchParams.location = location;
    } else if (searchType === '2') {
      const zipCode = await question('Ingrese código postal: ');
      searchParams.zipCode = zipCode;
    } else if (searchType === '3') {
      const latitude = parseFloat(await question('Ingrese latitud: '));
      const longitude = parseFloat(await question('Ingrese longitud: '));
      const radiusMeters = parseInt(await question('Ingrese radio en metros (ej. 1000): '), 10);
      searchParams = { query, latitude, longitude, radiusMeters };
    }

    const maxResultsInput = await question('\nMáximo de resultados a extraer (predeterminado: 50): ');
    const maxResults = parseInt(maxResultsInput, 10) || 50;
    searchParams.maxResults = maxResults;

    const exportFormat = await question('\nFormato de exportación (json/csv/ambos) [predeterminado: ambos]: ') || 'ambos';

    rl.close();

    const scraper = new GoogleMapsScraper();

    console.log('\n' + '='.repeat(60));
    console.log('Iniciando scraper...');
    console.log('='.repeat(60));

    let results;
    if (searchType === '1') {
      results = await scraper.search(searchParams);
    } else if (searchType === '2') {
      results = await scraper.searchByZipCode(searchParams);
    } else if (searchType === '3') {
      results = await scraper.searchByRadius(searchParams);
    }

    if (results && results.length > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('Exportando resultados...');
      console.log('='.repeat(60));

      if (exportFormat === 'ambos') {
        await scraper.export('json');
        await scraper.export('csv');
      } else {
        await scraper.export(exportFormat);
      }

      console.log('\n' + '='.repeat(60));
      console.log(`Total de negocios extraídos: ${results.length}`);
      
      console.log('\n¡Extracción completada exitosamente!');
    } else {
      console.log('\nNo se encontraron resultados. Intente ajustar sus parámetros de búsqueda.');
    }

  } catch (error) {
    console.error('\nError:', error.message);
    rl.close();
    process.exit(1);
  }
}

main();
