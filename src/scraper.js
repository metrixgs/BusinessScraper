import { PlaywrightCrawler } from 'crawlee';
import { config } from './config.js';
import { buildSearchUrl, calculateDistance, sleep, geocodeLocation, extractCoordinatesFromUrl } from './utils.js';
import { extractBusinessUrls, extractBusinessData } from './extractor.js';
import { exportToCSV, exportToJSON } from './export.js';

// Speed optimization: Block unnecessary resources
const BLOCKED_RESOURCE_TYPES = ['image', 'media', 'font', 'stylesheet'];
const BLOCKED_URL_PATTERNS = [
  'google-analytics.com',
  'googletagmanager.com',
  'facebook.com',
  'doubleclick.net',
  'googlesyndication.com',
  'youtube.com',
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico',
  '.woff', '.woff2', '.ttf', '.eot',
  '.mp4', '.webm', '.ogg'
];

// Pre-navigation hook for speed optimization
const speedOptimizationHook = async ({ page }) => {
  await page.route('**/*', (route) => {
    const request = route.request();
    const resourceType = request.resourceType();
    const url = request.url();
    
    // Block images, fonts, media, stylesheets
    if (BLOCKED_RESOURCE_TYPES.includes(resourceType)) {
      return route.abort();
    }
    
    // Block tracking and unnecessary URLs
    if (BLOCKED_URL_PATTERNS.some(pattern => url.includes(pattern))) {
      return route.abort();
    }
    
    return route.continue();
  });
  
  page.setDefaultTimeout(30000);
};

export class GoogleMapsScraper {
  constructor(options = {}) {
    this.config = { ...config, ...options };
    this.results = [];
  }

  async search({ query, location, city, state, country, countryName, maxResults = 100 }) {
    // Build location string from components if available
    if (city || state || countryName) {
      let locationParts = [];
      if (city) locationParts.push(city);
      if (state) locationParts.push(state);
      if (countryName) locationParts.push(countryName);
      location = locationParts.join(', ');
    }
    
    this.searchLocation = location;
    console.log(`Searching: "${query}" in "${location}" | Max: ${maxResults}`);

    const coords = await geocodeLocation(location);

    let searchUrl;
    if (coords) {
      console.log(`Location: ${coords.displayName} [${coords.latitude}, ${coords.longitude}]`);
      searchUrl = buildSearchUrl({
        query,
        latitude: coords.latitude,
        longitude: coords.longitude,
        radius: 10000
      });
    } else {
      console.log(`Geocoding failed, using text search`);
      searchUrl = buildSearchUrl({ query, location });
    }

    return await this._performSearch(searchUrl, maxResults);
  }

  async searchByZipCode({ query, zipCode, country, countryName, state, maxResults = 100 }) {
    let fullLocation = zipCode;
    if (state) {
      fullLocation = `${zipCode}, ${state}`;
    }
    if (countryName) {
      fullLocation = `${fullLocation}, ${countryName}`;
    }

    console.log(`Searching: "${query}" in ZIP "${zipCode}" | Max: ${maxResults}`);
    if (countryName) console.log(`Country: ${countryName}`);
    if (state) console.log(`State: ${state}`);

    const coords = await geocodeLocation(fullLocation);
    
    let searchUrl;
    let cityName = '';
    let stateName = state || '';
    
    if (coords) {
      console.log(`Location: ${coords.displayName} [${coords.latitude}, ${coords.longitude}]`);
      
      // Extract city name from geocoded result for better filtering
      const displayParts = coords.displayName.split(',').map(p => p.trim());
      if (displayParts.length >= 2) {
        // Usually format is: "ZIP, City, County, State, Country"
        cityName = displayParts[1] || '';
      }
      if (cityName) {
        console.log(`City detected: ${cityName}`);
      }
      
      // Use text-based search with ZIP code for more accurate results
      const searchQuery = `${query} in ${zipCode}`;
      searchUrl = buildSearchUrl({ query: searchQuery, location: '' });
    } else {
      console.log(`Geocoding failed, using text search`);
      const searchQuery = `${query} in ${zipCode}`;
      searchUrl = buildSearchUrl({ query: searchQuery, location: '' });
    }

    // Use parallel search with smart ZIP/city filtering
    return await this._parallelZipCodeSearch(searchUrl, zipCode, cityName, stateName, maxResults);
  }

  async _parallelZipCodeSearch(searchUrl, targetZipCode, cityName, stateName, maxResults) {
    this.results = [];
    const validResults = [];
    const processedUrls = new Set();
    const collectedUrls = [];
    let outsideAreaCount = 0;
    
    // Prepare search patterns
    const zipLower = targetZipCode.toLowerCase().trim();
    const cityLower = cityName.toLowerCase().trim();
    const stateLower = stateName.toLowerCase().trim();
    
    // Create multiple ZIP formats to match (e.g., "90401", "90401-1234")
    const zipPatterns = [
      zipLower,
      zipLower.replace(/\s/g, ''), // Remove spaces
    ];

    console.log(`\nSearching for businesses in ${targetZipCode}${cityName ? ` (${cityName})` : ''}...`);

    const urlCollector = new PlaywrightCrawler({
      headless: this.config.headless,
      maxConcurrency: 1,
      requestHandlerTimeoutSecs: 90,
      navigationTimeoutSecs: 60,
      
      preNavigationHooks: [speedOptimizationHook],

      async requestHandler({ page, request, log }) {
        if (request.url.includes('/maps/search/')) {
          await page.waitForLoadState('domcontentloaded').catch(() => { });
          await sleep(2000);

          let previousHeight = 0;
          let noProgressCount = 0;
          const targetUrls = maxResults * 5; // Collect more for better filtering

          while (collectedUrls.length < targetUrls) {
            const newUrls = await page.evaluate(() => {
              const links = document.querySelectorAll('a[href*="/maps/place/"]');
              return Array.from(links).map(link => {
                try {
                  const url = new URL(link.href);
                  return url.origin + url.pathname;
                } catch { return null; }
              }).filter(Boolean);
            });

            for (const url of newUrls) {
              if (!processedUrls.has(url)) {
                collectedUrls.push(url);
                processedUrls.add(url);
              }
            }

            if (collectedUrls.length >= targetUrls) {
              console.log(`Collected ${collectedUrls.length} URLs`);
              break;
            }

            const scrollContainer = await page.$('div[role="feed"]') || await page.$('div[role="main"]');

            if (scrollContainer) {
              const currentHeight = await scrollContainer.evaluate(el => {
                el.scrollTop = el.scrollHeight;
                return el.scrollHeight;
              });

              await sleep(800);

              const endReached = await page.evaluate(() => {
                return document.body.innerText.includes("You've reached the end of the list");
              });

              if (endReached) {
                console.log(`End of results (${collectedUrls.length} URLs)`);
                break;
              }

              if (currentHeight === previousHeight) {
                noProgressCount++;
                if (noProgressCount >= 3) {
                  console.log(`No more results (${collectedUrls.length} URLs)`);
                  break;
                }
              } else {
                noProgressCount = 0;
                previousHeight = currentHeight;
              }
            } else {
              break;
            }
          }
        }
      },

      failedRequestHandler({ request, log }) {
        log.error(`URL collection failed: ${request.url}`);
      },
    });

    await urlCollector.run([searchUrl]);

    if (collectedUrls.length > 0) {
      console.log(`\nProcessing ${collectedUrls.length} businesses...`);

      const batchSize = this.config.maxConcurrency || 5;
      let currentIndex = 0;

      while (validResults.length < maxResults && currentIndex < collectedUrls.length) {
        const remainingNeeded = maxResults - validResults.length;
        const estimatedBatchSize = Math.min(
          Math.ceil(remainingNeeded * 3),
          batchSize * 5,
          collectedUrls.length - currentIndex
        );

        const batch = collectedUrls.slice(currentIndex, currentIndex + estimatedBatchSize);
        currentIndex += estimatedBatchSize;

        const detailCrawler = new PlaywrightCrawler({
          headless: this.config.headless,
          maxConcurrency: batchSize,
          requestHandlerTimeoutSecs: 45,
          maxRequestRetries: 1,
          navigationTimeoutSecs: 30,

          preNavigationHooks: [speedOptimizationHook],

          requestHandler: async ({ page, request, log }) => {
            if (validResults.length >= maxResults) {
              return;
            }

            try {
              await page.waitForLoadState('domcontentloaded').catch(() => { });
              await sleep(500);

              const businessData = await extractBusinessData(page);
              businessData.scrapedAt = new Date().toISOString();

              // Strict ZIP code matching - exact match only
              const addressFull = (businessData.address?.full || '').toLowerCase();
              const addressZip = (businessData.address?.zipCode || '').toLowerCase().trim();
              
              // Check for exact ZIP code match only
              const hasExactZipMatch = zipPatterns.some(pattern => 
                addressZip === pattern ||
                addressZip.startsWith(pattern + '-') ||
                addressFull.includes(pattern)
              );

              const isInArea = hasExactZipMatch;

              if (isInArea) {
                if (validResults.length < maxResults) {
                  validResults.push(businessData);
                  console.log(`[${validResults.length}/${maxResults}] ${businessData.name} (ZIP: ${addressZip || 'N/A'})`);
                }
              } else {
                outsideAreaCount++;
              }
            } catch (error) {
              if (!error.message.includes('closed') && !error.message.includes('Target')) {
                log.error(`Extraction failed: ${error.message}`);
              }
            }
          },

          failedRequestHandler: ({ request, log }) => {
            log.warning(`Request failed: ${request.url}`);
          },
        });

        await detailCrawler.run(batch);

        if (validResults.length >= maxResults) {
          console.log(`\nFound ${maxResults} businesses!`);
          break;
        }
      }
    }

    console.log(`\nFound ${validResults.length} businesses in ${targetZipCode}${cityName ? ` / ${cityName}` : ''}`);

    this.results = validResults.slice(0, maxResults);
    return this.results;
  }

  async searchByRadius({ query, latitude, longitude, radiusMeters = 1000, maxResults = 100 }) {
    console.log(`Searching: "${query}" | Radius: ${radiusMeters}m at [${latitude}, ${longitude}] | Max: ${maxResults}`);

    const searchUrl = buildSearchUrl({
      query,
      latitude,
      longitude,
      radius: radiusMeters
    });

    return await this._parallelRadiusSearch(searchUrl, latitude, longitude, radiusMeters, maxResults);
  }

  async _parallelRadiusSearch(searchUrl, centerLat, centerLng, radiusMeters, maxResults) {
    this.results = [];
    const validResults = [];
    const processedUrls = new Set();
    const collectedUrls = [];
    let outsideRadiusCount = 0;

    console.log(`Starting smart radius search...`);

    const urlCollector = new PlaywrightCrawler({
      headless: this.config.headless,
      maxConcurrency: 1,
      requestHandlerTimeoutSecs: 90,
      navigationTimeoutSecs: 60,
      
      preNavigationHooks: [speedOptimizationHook],

      async requestHandler({ page, request, log }) {
        if (request.url.includes('/maps/search/')) {
          await page.waitForLoadState('domcontentloaded').catch(() => { });
          await sleep(3000);

          let previousHeight = 0;
          let noProgressCount = 0;
          const targetUrls = maxResults * 2.5;

          while (collectedUrls.length < targetUrls) {
            const newUrls = await page.evaluate(() => {
              const links = document.querySelectorAll('a[href*="/maps/place/"]');
              return Array.from(links).map(link => {
                try {
                  const url = new URL(link.href);
                  return url.origin + url.pathname;
                } catch { return null; }
              }).filter(Boolean);
            });

            for (const url of newUrls) {
              if (!processedUrls.has(url)) {
                collectedUrls.push(url);
                processedUrls.add(url);
              }
            }

            if (collectedUrls.length >= targetUrls) {
              console.log(`Collected ${collectedUrls.length} URLs, starting processing...`);
              break;
            }

            const scrollContainer = await page.$('div[role="feed"]') || await page.$('div[role="main"]');

            if (scrollContainer) {
              const currentHeight = await scrollContainer.evaluate(el => {
                el.scrollTop = el.scrollHeight;
                return el.scrollHeight;
              });

              await sleep(1000);

              const endReached = await page.evaluate(() => {
                return document.body.innerText.includes("You've reached the end of the list");
              });

              if (endReached) {
                console.log(`End of results reached with ${collectedUrls.length} URLs`);
                break;
              }

              if (currentHeight === previousHeight) {
                noProgressCount++;
                if (noProgressCount >= 3) {
                  console.log(`No more results available, collected ${collectedUrls.length} URLs`);
                  break;
                }
              } else {
                noProgressCount = 0;
                previousHeight = currentHeight;
              }
            } else {
              break;
            }
          }
        }
      },

      failedRequestHandler({ request, log }) {
        log.error(`URL collection failed: ${request.url}`);
      },
    });

    await urlCollector.run([searchUrl]);

    if (collectedUrls.length > 0) {
      console.log(`Processing ${collectedUrls.length} businesses...`);

      const batchSize = this.config.maxConcurrency || 3;
      let currentIndex = 0;

      while (validResults.length < maxResults && currentIndex < collectedUrls.length) {
        const remainingNeeded = maxResults - validResults.length;
        const estimatedBatchSize = Math.min(
          Math.ceil(remainingNeeded * 2.5),
          batchSize * 10,
          collectedUrls.length - currentIndex
        );

        const batch = collectedUrls.slice(currentIndex, currentIndex + estimatedBatchSize);
        currentIndex += estimatedBatchSize;

        console.log(`Processing batch ${Math.ceil(currentIndex / estimatedBatchSize)} (${validResults.length}/${maxResults} found)...`);

        const detailCrawler = new PlaywrightCrawler({
          headless: this.config.headless,
          maxConcurrency: batchSize,
          requestHandlerTimeoutSecs: 45,
          maxRequestRetries: 1,
          navigationTimeoutSecs: 30,

          preNavigationHooks: [speedOptimizationHook],

          requestHandler: async ({ page, request, log }) => {
            if (validResults.length >= maxResults) {
              return;
            }

            try {
              await page.waitForLoadState('domcontentloaded').catch(() => { });
              await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });

              const businessData = await extractBusinessData(page);
              businessData.scrapedAt = new Date().toISOString();

              if (businessData.coordinates.latitude && businessData.coordinates.longitude) {
                const distance = calculateDistance(
                  centerLat, centerLng,
                  businessData.coordinates.latitude,
                  businessData.coordinates.longitude
                );
                businessData.distanceFromCenter = Math.round(distance);

                if (distance <= radiusMeters) {
                  if (validResults.length < maxResults) {
                    validResults.push(businessData);
                    console.log(`[OK] [${validResults.length}/${maxResults}] ${businessData.name} (${Math.round(distance)}m)`);
                  }
                } else {
                  outsideRadiusCount++;
                }
              }
            } catch (error) {
              if (!error.message.includes('closed') && !error.message.includes('Target')) {
                log.error(`Extraction failed: ${error.message}`);
              }
            }
          },

          failedRequestHandler: ({ request, log }) => {
            log.warning(`Request failed: ${request.url}`);
          },
        });

        await detailCrawler.run(batch);

        if (validResults.length >= maxResults) {
          break;
        }
      }
    }

    console.log(`Found ${validResults.length} businesses within ${radiusMeters}m`);
    if (outsideRadiusCount > 0) {
      console.log(`Skipped ${outsideRadiusCount} outside radius`);
    }

    this.results = validResults.slice(0, maxResults);
    return this.results;
  }

  async _performSearch(searchUrl, maxResults, filterOptions = null) {
    this.results = [];
    const businessUrls = [];

    const crawler = new PlaywrightCrawler({
      headless: this.config.headless,
      maxConcurrency: 1,
      requestHandlerTimeoutSecs: 120,
      navigationTimeoutSecs: 60,
      
      preNavigationHooks: [speedOptimizationHook],

      async requestHandler({ page, request, log }) {
        if (request.url.includes('/maps/search/')) {
          await page.waitForLoadState('domcontentloaded').catch(() => { });
          await sleep(3000);

          const urls = await extractBusinessUrls(page, maxResults);
          businessUrls.push(...urls);
        }
      },

      failedRequestHandler({ request, log }) {
        log.error(`Request failed: ${request.url}`);
      },
    });

    await crawler.run([searchUrl]);

    if (businessUrls.length > 0) {
      const detailCrawler = new PlaywrightCrawler({
        headless: this.config.headless,
        maxConcurrency: this.config.maxConcurrency,
        requestHandlerTimeoutSecs: 45,
        maxRequestRetries: 1,
        navigationTimeoutSecs: 30,

        preNavigationHooks: [speedOptimizationHook],

        requestHandler: async ({ page, request, log }) => {
          try {
            await page.waitForLoadState('domcontentloaded').catch(() => { });
            await sleep(1000);

            const businessData = await extractBusinessData(page);
            businessData.scrapedAt = new Date().toISOString();

            this.results.push(businessData);

            console.log(`Progress: ${this.results.length}/${businessUrls.length} - ${businessData.name}`);
          } catch (error) {
            if (error.message.includes('closed') || error.message.includes('Target')) {
              log.warning(`Page closed: ${request.url}`);
            } else {
              log.error(`Extraction failed: ${error.message}`);
            }
          }
        },

        failedRequestHandler: ({ request, log }) => {
          log.warning(`Request failed (retrying): ${request.url}`);
        },
      });

      await detailCrawler.run(businessUrls);
    }

    return this.results;
  }

  async export(format = 'json', filename = null) {
    if (this.results.length === 0) {
      console.log('No results to export');
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
