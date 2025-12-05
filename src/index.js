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
  console.log('  Powered by Crawlee');
  console.log('=========================================================\n');

  try {
    console.log('Select search type:');
    console.log('1. Search by location (city, state, etc.)');
    console.log('2. Search by ZIP code');
    console.log('3. Search by coordinates with radius');
    console.log('');

    const searchType = await question('Enter your choice (1-3): ');
    const query = await question('\nEnter business type/niche (e.g., "restaurants", "dentists"): ');

    let searchParams = { query };

    if (searchType === '1') {
      const location = await question('Enter location (e.g., "New York, NY", "Miami, FL"): ');
      searchParams.location = location;
    } else if (searchType === '2') {
      const zipCode = await question('Enter ZIP code: ');
      searchParams.zipCode = zipCode;
    } else if (searchType === '3') {
      const latitude = parseFloat(await question('Enter latitude: '));
      const longitude = parseFloat(await question('Enter longitude: '));
      const radiusMeters = parseInt(await question('Enter radius in meters (e.g., 1000): '), 10);
      searchParams = { query, latitude, longitude, radiusMeters };
    }

    const maxResultsInput = await question('\nMaximum results to scrape (default: 50): ');
    const maxResults = parseInt(maxResultsInput, 10) || 50;
    searchParams.maxResults = maxResults;

    const exportFormat = await question('\nExport format (json/csv/both) [default: both]: ') || 'both';

    rl.close();

    const scraper = new GoogleMapsScraper();

    console.log('\n' + '='.repeat(60));
    console.log('Starting scraper...');
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
      console.log('Exporting results...');
      console.log('='.repeat(60));

      if (exportFormat === 'both') {
        await scraper.export('json');
        await scraper.export('csv');
      } else {
        await scraper.export(exportFormat);
      }

      console.log('\n' + '='.repeat(60));
      console.log(`Total businesses scraped: ${results.length}`);
      
      console.log('\nScraping completed successfully!');
    } else {
      console.log('\nNo results found. Try adjusting your search parameters.');
    }

  } catch (error) {
    console.error('\nError:', error.message);
    rl.close();
    process.exit(1);
  }
}

main();
