import { parseAddress, formatPhoneNumber, extractCoordinatesFromUrl, parseOpeningHours, sleep } from './utils.js';

export async function extractBusinessData(page) {
  try {
    if (page.isClosed()) {
      throw new Error('Page is already closed');
    }

    // Tiempo de espera reducido para extracción más rápida
    await page.waitForSelector('[role="main"]', { timeout: 10000 }).catch(() => null);
    await sleep(500);

    // Intentar expandir la sección de horarios para datos completos
    try {
      if (!page.isClosed()) {
        const hoursButton = await page.$('button[aria-label*="Hours"], button[data-item-id*="hours"]');
        if (hoursButton) {
          await hoursButton.click().catch(() => { });
          await sleep(300);
        }
      }
    } catch (error) {
      // Ignorar silenciosamente
    }

    if (page.isClosed()) {
      throw new Error('Page closed before data extraction');
    }

    const data = await page.evaluate(() => {
      const result = {
        name: '',
        type: '',
        phone: '',
        whatsapp: '',
        email: '',
        website: '',
        address: {
          full: '',
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
        },
        coordinates: {
          latitude: null,
          longitude: null,
        },
        openingHours: [],
        rating: null,
        reviewsCount: 0,
        totalReviews: 0,
        priceLevel: '',
        description: '',
        imageUrl: '',
        googleMapsUrl: '',
        placeId: '',
        plusCode: '',
        manager: '',
        amenities: [],
        attributes: {},
      };

      const getText = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.textContent.trim() : '';
      };

      try {
        result.name = getText('h1.DUwDvf') || getText('h1');

        const categoryButton = document.querySelector('button[jsaction*="category"]');
        if (categoryButton) {
          result.type = categoryButton.textContent.trim();
        }
        if (!result.type) {
          const typeButtons = document.querySelectorAll('button');
          for (const btn of typeButtons) {
            const text = btn.textContent.trim();
            if (text && (text.includes('restaurant') || text.includes('shop') || text.includes('store') ||
              text.includes('service') || text.includes('Pizza') || text.includes('Hotel'))) {
              result.type = text;
              break;
            }
          }
        }

        const ratingImages = document.querySelectorAll('img[aria-label*="stars"], img[alt*="stars"]');
        for (const img of ratingImages) {
          const label = img.getAttribute('aria-label') || img.getAttribute('alt') || '';
          const ratingMatch = label.match(/(\d+\.?\d*)\s*stars?/i);
          if (ratingMatch) {
            result.rating = parseFloat(ratingMatch[1]);
            break;
          }
        }
        if (!result.rating) {
          const ratingSpan = document.querySelector('div.F7nice span[aria-hidden="true"]');
          if (ratingSpan) {
            const ratingMatch = ratingSpan.textContent.match(/(\d+\.?\d*)/);
            if (ratingMatch) {
              result.rating = parseFloat(ratingMatch[1]);
            }
          }
        }

        const reviewImages = document.querySelectorAll('img[aria-label*="reviews"], img[alt*="reviews"]');
        for (const img of reviewImages) {
          const label = img.getAttribute('aria-label') || img.getAttribute('alt') || '';
          const reviewsMatch = label.match(/(\d+(?:,\d+)*)\s*reviews?/i);
          if (reviewsMatch) {
            result.reviewsCount = parseInt(reviewsMatch[1].replace(/,/g, ''), 10);
            result.totalReviews = result.reviewsCount;
            break;
          }
        }
        if (!result.reviewsCount) {
          const allText = document.body.innerText;
          const reviewsMatch = allText.match(/\((\d{1,3}(?:,\d{3})*)\)/);
          if (reviewsMatch) {
            result.reviewsCount = parseInt(reviewsMatch[1].replace(/,/g, ''), 10);
            result.totalReviews = result.reviewsCount;
          }
        }
        if (!result.reviewsCount) {
          const reviewButton = document.querySelector('button[aria-label*="reviews"]');
          if (reviewButton) {
            const label = reviewButton.getAttribute('aria-label') || reviewButton.textContent;
            const reviewsMatch = label.match(/(\d+(?:,\d+)*)\s*reviews?/i);
            if (reviewsMatch) {
              result.reviewsCount = parseInt(reviewsMatch[1].replace(/,/g, ''), 10);
              result.totalReviews = result.reviewsCount;
            }
          }
        }

        const priceImages = document.querySelectorAll('img[aria-label*="priced"], img[alt*="priced"]');
        for (const img of priceImages) {
          const label = img.getAttribute('aria-label') || img.getAttribute('alt') || '';
          result.priceLevel = label;
          break;
        }
        if (!result.priceLevel) {
          const priceMatch = document.body.innerText.match(/(\${1,4})(?=\s|·|$)/);
          if (priceMatch) {
            result.priceLevel = priceMatch[1];
          }
        }

        const addressButtons = document.querySelectorAll('button[aria-label^="Address"]');
        for (const btn of addressButtons) {
          const label = btn.getAttribute('aria-label') || '';
          result.address.full = label.replace('Address: ', '').trim();
          break;
        }
        if (!result.address.full) {
          const addressButton = document.querySelector('button[data-item-id="address"]');
          if (addressButton) {
            result.address.full = addressButton.getAttribute('aria-label')?.replace('Address: ', '') ||
              addressButton.textContent.trim();
          }
        }

        const phoneButtons = document.querySelectorAll('button[aria-label^="Phone"]');
        for (const btn of phoneButtons) {
          const label = btn.getAttribute('aria-label') || '';
          result.phone = label.replace('Phone: ', '').trim();
          break;
        }
        if (!result.phone) {
          const phoneButton = document.querySelector('button[data-item-id*="phone"]');
          if (phoneButton) {
            result.phone = phoneButton.getAttribute('aria-label')?.replace('Phone: ', '') ||
              phoneButton.textContent.trim();
          }
        }

        const websiteLinks = document.querySelectorAll('a[aria-label^="Website"]');
        for (const link of websiteLinks) {
          result.website = link.href;
          break;
        }
        if (!result.website) {
          const websiteLink = document.querySelector('a[data-item-id="authority"]');
          if (websiteLink) {
            result.website = websiteLink.href;
          }
        }

        const plusCodeButtons = document.querySelectorAll('button[aria-label^="Plus code"]');
        for (const btn of plusCodeButtons) {
          const label = btn.getAttribute('aria-label') || '';
          result.plusCode = label.replace('Plus code: ', '').trim();
          break;
        }

        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        const hoursCopyButtons = document.querySelectorAll('button[aria-label*="Copy open hours"]');
        if (hoursCopyButtons.length > 0) {
          hoursCopyButtons.forEach(btn => {
            const label = btn.getAttribute('aria-label') || '';
            const parts = label.split(',');
            if (parts.length >= 2) {
              const dayPart = parts[0].trim();
              const timePart = parts[1].trim().replace(' to ', '–');
              const day = daysOfWeek.find(d => dayPart.includes(d)) || dayPart;
              result.openingHours.push({
                day: day,
                hours: timePart
              });
            }
          });
        }

        if (result.openingHours.length === 0) {
          const hoursSection = document.querySelector('button[aria-label*="Hours"]');
          if (hoursSection) {
            const parent = hoursSection.closest('div');
            if (parent) {
              const textContent = parent.textContent;
              for (const day of daysOfWeek) {
                const regex = new RegExp(`${day}[^\\d]*(\\d{1,2}(?:\\s*am|\\s*pm)?\\s*[–-]\\s*\\d{1,2}(?:\\s*am|\\s*pm)?)`, 'i');
                const match = textContent.match(regex);
                if (match) {
                  result.openingHours.push({
                    day: day,
                    hours: match[1].trim()
                  });
                }
              }
            }
          }
        }

        const hoursButton = document.querySelector('button[aria-label*="Hours"]');
        if (hoursButton) {
          const hoursLabel = hoursButton.getAttribute('aria-label') || '';
          if (hoursLabel.includes('Open') || hoursLabel.includes('Closes') || hoursLabel.includes('Closed')) {
            const statusMatch = hoursLabel.match(/(Open|Closes?\s*(?:soon)?|Closed)[^·]*(?:·\s*(\d+\s*(?:am|pm)?))?/i);
            if (statusMatch && result.openingHours.length === 0) {
              result.openingHours.push({
                day: 'Current',
                hours: hoursLabel.split('Show')[0].replace('Hours', '').trim()
              });
            }
          }
        }

        const mainImage = document.querySelector('button[aria-label*="Photo"] img, img[src*="googleusercontent"]');
        if (mainImage && mainImage.src && mainImage.src.includes('googleusercontent')) {
          result.imageUrl = mainImage.src;
        }

        const aboutRegion = document.querySelector('region[aria-label*="About"], div[aria-label*="About"]');
        if (aboutRegion) {
          result.description = aboutRegion.textContent.trim();
        }
        if (!result.description) {
          const descButton = document.querySelector('button[aria-label*="Local institution"], button[aria-label*="Known for"]');
          if (descButton) {
            const label = descButton.getAttribute('aria-label') || descButton.textContent;
            const descMatch = label.match(/^([^·]+)/);
            if (descMatch) {
              result.description = descMatch[1].trim();
            }
          }
        }

        const amenityPatterns = ['LGBTQ+ friendly', 'Wheelchair accessible', 'Dine-in', 'Takeaway',
          'Delivery', 'Outdoor seating', 'Free WiFi', 'Parking'];
        const pageText = document.body.innerText;
        for (const pattern of amenityPatterns) {
          if (pageText.includes(pattern)) {
            result.amenities.push(pattern);
          }
        }

        const serviceGroups = document.querySelectorAll('group');
        serviceGroups.forEach(group => {
          const label = group.getAttribute('aria-label') || '';
          if (label.includes('dine-in') || label.includes('takeaway') || label.includes('delivery')) {
            result.amenities.push(label);
          }
        });

        result.googleMapsUrl = window.location.href;

        const placeIdMatch = window.location.href.match(/!1s([^!]+)/);
        if (placeIdMatch) {
          result.placeId = placeIdMatch[1];
        }
        if (!result.placeId) {
          const placeIdMatch2 = window.location.href.match(/place\/[^/]+\/.*?0x[0-9a-f]+:(0x[0-9a-f]+)/i);
          if (placeIdMatch2) {
            result.placeId = placeIdMatch2[1];
          }
        }

        return result;
      } catch (error) {
        console.error('Error en evaluación de página:', error);
        return result;
      }
    });

    data.address = parseAddress(data.address.full);
    data.phone = formatPhoneNumber(data.phone);

    const coords = extractCoordinatesFromUrl(data.googleMapsUrl);
    if (coords) {
      data.coordinates = coords;
    } else {
      const latitude = await page.$eval('meta[itemprop="latitude"]', el => el.content).catch(() => null);
      const longitude = await page.$eval('meta[itemprop="longitude"]', el => el.content).catch(() => null);
      if (latitude && longitude) {
        data.coordinates = {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        };
      }
    }



    const whatsappButton = await page.$('a[href*="wa.me"], a[href*="whatsapp"]');
    if (whatsappButton) {
      const whatsappUrl = await whatsappButton.getAttribute('href');
      const phoneMatch = whatsappUrl?.match(/\d+/);
      if (phoneMatch) {
        data.whatsapp = `+${phoneMatch[0]}`;
      }
    }

    data.openingHours = parseOpeningHours(data.openingHours);

    return data;
  } catch (error) {
    console.error('Error extrayendo datos del negocio:', error);
    throw error;
  }
}

export async function extractBusinessUrls(page, maxResults = 100) {
  const urls = new Set();
  let previousHeight = 0;
  let scrollAttempts = 0;
  const maxScrollAttempts = 100;
  let noScrollProgress = 0;

  try {

    const feedSelectors = [
      'div[role="feed"]',
      'div[role="main"]',
      'div.PbZDve'
    ];

    for (const selector of feedSelectors) {
      await page.waitForSelector(selector, { timeout: 5000 }).catch(() => null);
    }

    await sleep(1000); // Reduced from 2000ms

    const extractUrls = async () => {
      return await page.evaluate(() => {
        const links = document.querySelectorAll('a[href*="/maps/place/"]');
        const results = [];

        links.forEach(link => {
          try {
            const href = link.href;
            if (!href.includes('/maps/place/')) return;
            const url = new URL(href);
            results.push(url.origin + url.pathname);
          } catch (e) { }
        });

        return results;
      });
    };

    let extractedUrls = await extractUrls();
    extractedUrls.forEach(url => urls.add(url));

    console.log(`Inicial: ${urls.size} listados`);

    if (urls.size >= maxResults) {
      return Array.from(urls).slice(0, maxResults);
    }

    while (urls.size < maxResults && scrollAttempts < maxScrollAttempts) {
      const scrollContainer = await page.$('div[role="feed"]') ||
        await page.$('div[role="main"]') ||
        await page.$('div.PbZDve');

      if (!scrollContainer) break;

      const currentHeight = await scrollContainer.evaluate(el => {
        el.scrollTop = el.scrollHeight;
        return el.scrollHeight;
      });

      await sleep(800); // Reducido desde 1500ms

      const endReached = await page.evaluate(() => {
        const endText = document.body.innerText;
        return endText.includes("You've reached the end of the list") ||
          endText.includes("No more results");
      });

      if (endReached) {
        console.log('Fin de resultados');
        break;
      }

      const prevSize = urls.size;
      extractedUrls = await extractUrls();
      extractedUrls.forEach(url => urls.add(url));

      if (currentHeight === previousHeight && urls.size === prevSize) {
        noScrollProgress++;
        if (noScrollProgress >= 3) { // Reducido desde 5
          console.log('No hay más resultados');
          break;
        }
      } else {
        noScrollProgress = 0;
        previousHeight = currentHeight;
      }

      scrollAttempts++;

      if (scrollAttempts % 5 === 0) {
        console.log(`Desplazando... ${urls.size} listados`);
      }
    }

    console.log(`Recolectados ${urls.size} listados`);
    return Array.from(urls).slice(0, maxResults);
  } catch (error) {
    console.error('Error extrayendo URLs:', error.message);
    return Array.from(urls);
  }
}

export default {
  extractBusinessData,
  extractBusinessUrls,
};
