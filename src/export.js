import { createObjectCsvWriter } from 'csv-writer';
import fs from 'fs/promises';
import path from 'path';
import { getTimestamp } from './utils.js';

const RESULTS_DIR = './results';

async function ensureResultsDir() {
  try {
    await fs.mkdir(RESULTS_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating results directory:', error);
  }
}

export async function exportToJSON(data, filename = null) {
  await ensureResultsDir();

  const timestamp = getTimestamp();
  const name = filename || `google_maps_results_${timestamp}.json`;
  const filePath = path.join(RESULTS_DIR, name);

  try {
    const jsonData = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, jsonData, 'utf-8');
    
    console.log(`Results exported to: ${filePath}`);
    console.log(`Total records: ${data.length}`);
    
    return filePath;
  } catch (error) {
    console.error('Error exporting to JSON:', error);
    throw error;
  }
}

export async function exportToCSV(data, filename = null) {
  await ensureResultsDir();

  const timestamp = getTimestamp();
  const name = filename || `google_maps_results_${timestamp}.csv`;
  const filePath = path.join(RESULTS_DIR, name);

  try {
    const flattenedData = data.map(item => ({
      name: item.name || '',
      type: item.type || '',
      phone: item.phone || '',
      whatsapp: item.whatsapp || '',
      email: item.email || '',
      website: item.website || '',
      address_full: item.address?.full || '',
      address_street: item.address?.street || '',
      address_city: item.address?.city || '',
      address_state: item.address?.state || '',
      address_zipCode: item.address?.zipCode || '',
      address_country: item.address?.country || '',
      latitude: item.coordinates?.latitude || '',
      longitude: item.coordinates?.longitude || '',
      rating: item.rating || '',
      reviewsCount: item.reviewsCount || 0,
      totalReviews: item.totalReviews || 0,
      priceLevel: item.priceLevel || '',
      description: item.description || '',
      openingHours: item.openingHours?.map(h => `${h.day}: ${h.hours}`).join('; ') || '',
      plusCode: item.plusCode || '',
      placeId: item.placeId || '',
      googleMapsUrl: item.googleMapsUrl || '',
      imageUrl: item.imageUrl || '',
      distanceFromCenter: item.distanceFromCenter || '',
      amenities: item.amenities?.join('; ') || '',
      scrapedAt: item.scrapedAt || '',
    }));

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'name', title: 'Business Name' },
        { id: 'type', title: 'Business Type' },
        { id: 'phone', title: 'Phone' },
        { id: 'whatsapp', title: 'WhatsApp' },
        { id: 'email', title: 'Email' },
        { id: 'website', title: 'Website' },
        { id: 'address_full', title: 'Full Address' },
        { id: 'address_street', title: 'Street' },
        { id: 'address_city', title: 'City' },
        { id: 'address_state', title: 'State' },
        { id: 'address_zipCode', title: 'ZIP Code' },
        { id: 'address_country', title: 'Country' },
        { id: 'latitude', title: 'Latitude' },
        { id: 'longitude', title: 'Longitude' },
        { id: 'rating', title: 'Rating' },
        { id: 'reviewsCount', title: 'Reviews Count' },
        { id: 'totalReviews', title: 'Total Reviews' },
        { id: 'priceLevel', title: 'Price Level' },
        { id: 'description', title: 'Description' },
        { id: 'openingHours', title: 'Opening Hours' },
        { id: 'plusCode', title: 'Plus Code' },
        { id: 'placeId', title: 'Place ID' },
        { id: 'googleMapsUrl', title: 'Google Maps URL' },
        { id: 'imageUrl', title: 'Image URL' },
        { id: 'distanceFromCenter', title: 'Distance From Center (m)' },
        { id: 'amenities', title: 'Amenities' },
        { id: 'scrapedAt', title: 'Scraped At' },
      ],
    });

    await csvWriter.writeRecords(flattenedData);
    
    console.log(`Results exported to: ${filePath}`);
    console.log(`Total records: ${data.length}`);
    
    return filePath;
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    throw error;
  }
}

export async function exportToBoth(data, baseFilename = null) {
  const timestamp = getTimestamp();
  const baseName = baseFilename || `google_maps_results_${timestamp}`;

  const jsonPath = await exportToJSON(data, `${baseName}.json`);
  const csvPath = await exportToCSV(data, `${baseName}.csv`);

  return { jsonPath, csvPath };
}

export default {
  exportToJSON,
  exportToCSV,
  exportToBoth,
};
