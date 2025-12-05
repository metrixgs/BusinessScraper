# 🗺️ Google Maps Business Scraper

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Crawlee](https://img.shields.io/badge/Crawlee-3.7.3-blue.svg)](https://crawlee.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A professional Google Maps scraper built with Crawlee that extracts comprehensive business data with location-based search capabilities.

> ⚡ **Fast** • 🎯 **Accurate** • 🛡️ **Reliable** • 📊 **Comprehensive**

---

## 🎯 Features

### 🔍 Search Methods
- ✅ Search by location (city, address)
- ✅ Search by ZIP code
- ✅ Radius-based search (with distance filtering)

### 📊 Data Extraction (25+ Fields)
- Business name and type/category
- Phone, WhatsApp, Email, Website
- Full address with components (street, city, state, ZIP, country)
- Geographic coordinates (latitude/longitude)
- Opening hours (by day)
- Rating and review count
- Price level and description
- Amenities and images
- Plus code and Place ID

### ⚡ Performance
- 🚀 Fast execution using Crawlee
- 👻 Headless browser automation
- ♻️ Automatic retries on failures
- 🎯 Efficient data extraction
- ⏱️ Configurable timeouts

---

## 🚀 Quick Start

### 1. Installation
```bash
npm install
```

### 2. Start Server
```bash
npm start
```

### 3. Open Web Interface
Go to: **`http://localhost:3000`**

---

## 🧪 Testing

### Search Methods Available

**1. Location Search**
- Query: pizza, restaurants, hotels, dentists, coffee shops
- Location: Chicago IL, New York NY, Los Angeles CA

**2. ZIP Code Search**
- Query: Any business type
- ZIP Codes: 60614, 10001, 90210, 94102

**3. Radius Search (Recommended)**
- Query: Any business type
- Top cities with coordinates ready to test
- Radius: 1km, 5km, 10km options

See [QUICKSTART.md](QUICKSTART.md) for detailed testing data and instructions.

---

## 📊 Sample Results

Each business record includes:

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

## 💾 Export Options

After scraping, download results as:
- **JSON** - For API integration
- **CSV** - For spreadsheet analysis

---

## 📝 Documentation

| Document | Purpose |
|----------|---------|
| [QUICKSTART.md](QUICKSTART.md) | Web testing guide with sample data |
| [START_HERE.md](START_HERE.md) | Complete overview |

---

## ⚙️ Configuration

Environment variables (`.env`):
```env
HEADLESS=true          # Run without visible browser
MAX_RESULTS=100        # Default max results
TIMEOUT=60000          # Request timeout (ms)
```

---

## 📝 License

MIT

---

## 🤝 Support

See [QUICKSTART.md](QUICKSTART.md) for web testing guide and sample test data.

