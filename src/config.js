import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
  headless: process.env.HEADLESS === 'true',
  maxResults: parseInt(process.env.MAX_RESULTS || '100', 10),
  timeout: parseInt(process.env.TIMEOUT || '60000', 10),
  defaultRadius: 1000,
  maxConcurrency: 5,
  retryCount: 3,
};

export const selectors = {
  searchBox: 'input#searchboxinput',
  searchButton: 'button#searchbox-searchbutton',
  results: 'div[role="feed"]',
  resultItem: 'div[role="article"]',
  businessName: 'h1.DUwDvf',
  businessType: 'button[jsaction*="category"]',
  rating: 'div.F7nice span[aria-label*="stars"]',
  reviewCount: 'div.F7nice span[aria-label*="reviews"]',
  address: 'button[data-item-id="address"]',
  phone: 'button[data-item-id*="phone"]',
  website: 'a[data-item-id="authority"]',
  hours: 'div[aria-label*="Hours"]',
  placeUrl: 'a.hfpxzc',
  coordinates: 'meta[itemprop="latitude"], meta[itemprop="longitude"]',
  allInfo: 'div.m6QErb',
};

export default config;
