import { PlaywrightCrawler } from 'crawlee';
import { config } from './config.js';
import { buildSearchUrl, calculateDistance, sleep } from './utils.js';
import { extractBusinessUrls, extractBusinessData } from './extractor.js';
import { exportToCSV, exportToJSON } from './export.js';

export class GoogleMapsScraper {
  constructor(options = {}) {
    this.config = { ...config, ...options };
    this.results = [];
  }

  async search({ query, location, maxResults = 100 }) {
    this.searchLocation = location;
    console.log(`Searching for: "${query}" in "${location}"`);
    console.log(`Max results: ${maxResults}`);

    const searchUrl = buildSearchUrl({ query, location });
    return await this._performSearch(searchUrl, maxResults);
  }

  async searchByZipCode({ query, zipCode, maxResults = 100 }) {
    console.log(`Searching for: "${query}" in ZIP code "${zipCode}"`);
    console.log(`Max results: ${maxResults}`);

    const searchUrl = buildSearchUrl({ query, location: zipCode });
    return await this._performSearch(searchUrl, maxResults);
  }

  async searchByRadius({ query, latitude, longitude, radiusMeters = 1000, maxResults = 100 }) {
    console.log(`Searching for: "${query}" within ${radiusMeters}m of [${latitude}, ${longitude}]`);
    console.log(`Max results: ${maxResults}`);
    const searchUrl = buildSearchUrl({ 
      query, 
      latitude, 
      longitude, 
      radius: radiusMeters 
    });

    const results = await this._performSearch(searchUrl, maxResults);

    const centerPoint = { latitude, longitude };
    const filteredResults = results.filter(business => {
      if (!business.coordinates.latitude || !business.coordinates.longitude) {
        return false;
      }

      const distance = calculateDistance(
        centerPoint.latitude,
        centerPoint.longitude,
        business.coordinates.latitude,
        business.coordinates.longitude
      );

      business.distanceFromCenter = Math.round(distance);
      return distance <= radiusMeters;
    });

    console.log(`Found ${filteredResults.length} businesses within ${radiusMeters}m radius`);
    return filteredResults.slice(0, maxResults);
  }

  async _performSearch(searchUrl, maxResults) {
    this.results = [];
    const businessUrls = [];

    const crawler = new PlaywrightCrawler({
      headless: this.config.headless,
      maxConcurrency: 1,
      requestHandlerTimeoutSecs: 120,
      
      async requestHandler({ page, request, log }) {
        if (request.url.includes('/maps/search/')) {
          await page.waitForLoadState('networkidle').catch(() => {});
          await sleep(5000);
          
          const urls = await extractBusinessUrls(page, maxResults);
          businessUrls.push(...urls);
        }
      },

      failedRequestHandler({ request, log }) {
        log.error(`Request ${request.url} failed`);
      },
    });

    await crawler.run([searchUrl]);

    if (businessUrls.length > 0) {
      const detailCrawler = new PlaywrightCrawler({
        headless: this.config.headless,
        maxConcurrency: this.config.maxConcurrency,
        requestHandlerTimeoutSecs: 90,
        maxRequestRetries: 1,
        
        requestHandler: async ({ page, request, log }) => {
          try {            
            const businessData = await extractBusinessData(page);
            businessData.scrapedAt = new Date().toISOString();
            
            this.results.push(businessData);
            
            if (this.results.length % 5 === 0 || this.results.length === businessUrls.length) {
              console.log(`Progress: [${this.results.length}/${businessUrls.length}] ${businessData.name}`);
            }
          } catch (error) {
            log.error(`Error extracting business data: ${error.message}`);
          }
        },

        failedRequestHandler: ({ request, log }) => {
          log.error(`Failed to process: ${request.url}`);
        },
      });

      await detailCrawler.run(businessUrls);
    }

    return this.results;
  }

  async export(format = 'json', filename = null) {
    if (this.results.length === 0) {
      console.log('[WARN] No results to export');
      return;
    }

    if (format === 'csv') {
      return await exportToCSV(this.results, filename);
    } else {
      return await exportToJSON(this.results, filename);
    }
  }

  getResults() {
    return this.results;
  }

  clearResults() {
    this.results = [];
  }
}

export default GoogleMapsScraper;
