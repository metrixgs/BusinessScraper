# Quick Start - Web Testing Guide

Make sure you have install the nodejs of version greater than 18
Latest version should be better

## Setup

```bash
# Install dependencies
npm install

# Start the web server
npm start
```

Open your browser: **`http://localhost:3000`**

---

## Testing via Web Interface

### 1️⃣ Location-Based Search

**Steps:**
1. Open `http://localhost:3000`
2. Select search type: **Location**
3. Enter the following data:

| Field | Test Value 1 | Test Value 2 | Test Value 3 |
|-------|--------------|--------------|--------------|
| Search Query | pizza | restaurants | coffee shops |
| Location | Chicago, IL | New York, NY | Los Angeles, CA |
| Max Results | 10 | 15 | 20 |

**Expected Results:** 10-20 businesses with full details

---

### 2️⃣ ZIP Code Search

**Steps:**
1. Open `http://localhost:3000`
2. Select search type: **ZIP Code**
3. Enter the following data:

| Field | Test Value 1 | Test Value 2 | Test Value 3 | Test Value 4 |
|-------|--------------|--------------|--------------|--------------|
| Search Query | dentists | hotels | restaurants | pizza |
| ZIP Code | 60614 | 10001 | 90210 | 94102 |
| Max Results | 10 | 15 | 10 | 15 |

**Expected Results:** 8-15 businesses within the ZIP code

---

### 3️⃣ Radius-Based Search (Recommended)

**Steps:**
1. Open `http://localhost:3000`
2. Select search type: **Radius**
3. Enter the following data:

#### **Test Location 1: Chicago**
| Field | Value |
|-------|-------|
| Search Query | pizza |
| Latitude | 41.8781 |
| Longitude | -87.6298 |
| Radius (meters) | 5000 |
| Max Results | 20 |

**Expected Results:** 15-20 pizza places within 5km radius

---

#### **Test Location 2: New York**
| Field | Value |
|-------|-------|
| Search Query | restaurants |
| Latitude | 40.7128 |
| Longitude | -74.0060 |
| Radius (meters) | 3000 |
| Max Results | 20 |

**Expected Results:** 15-20 restaurants within 3km radius

---

#### **Test Location 3: Los Angeles**
| Field | Value |
|-------|-------|
| Search Query | coffee shops |
| Latitude | 34.0522 |
| Longitude | -118.2437 |
| Radius (meters) | 5000 |
| Max Results | 20 |

**Expected Results:** 15-20 coffee shops within 5km radius

---

#### **Test Location 4: San Francisco**
| Field | Value |
|-------|-------|
| Search Query | dentists |
| Latitude | 37.7749 |
| Longitude | -122.4194 |
| Radius (meters) | 2000 |
| Max Results | 15 |

**Expected Results:** 8-15 dentists within 2km radius

---

#### **Test Location 5: Houston**
| Field | Value |
|-------|-------|
| Search Query | hotels |
| Latitude | 29.7604 |
| Longitude | -95.3698 |
| Radius (meters) | 5000 |
| Max Results | 15 |

**Expected Results:** 10-15 hotels within 5km radius

---

## Web Interface Features

### During Scraping:
- ✅ Real-time progress updates
- ✅ Business names as they're extracted
- ✅ Live status bar
- ✅ Error notifications (if any)

### After Completion:
- ✅ Full results displayed
- ✅ Download as JSON
- ✅ Download as CSV
- ✅ View full business details
- ✅ Copy to clipboard

---

## Data Fields in Results

Each business includes:
- **Name & Type** - Business name and category
- **Contact** - Phone, WhatsApp, Email, Website
- **Address** - Full address with components
- **Location** - Latitude, Longitude, Distance from center
- **Hours** - Opening hours by day
- **Rating** - Star rating and review count
- **Details** - Price level, description, amenities
- **Images** - Business photos
- **Metadata** - Place ID, Plus code, Maps URL

---

## Testing Checklist

### Radius Search (Most Reliable)
- [ ] Chicago pizza search (41.8781, -87.6298)
- [ ] New York restaurants (40.7128, -74.0060)
- [ ] LA coffee shops (34.0522, -118.2437)
- [ ] SF dentists (37.7749, -122.4194)
- [ ] Houston hotels (29.7604, -95.3698)

### Location Search
- [ ] "pizza" in Chicago, IL
- [ ] "restaurants" in New York, NY
- [ ] "hotels" in Los Angeles, CA

### ZIP Code Search
- [ ] "dentists" in 60614
- [ ] "restaurants" in 10001
- [ ] "pizza" in 90210

---

## Tips

1. **Start with radius search** - Most reliable results
2. **Use max results 15-20** - Balances speed vs. completeness
3. **Wait for "Complete" status** - Don't refresh mid-scrape
4. **Export immediately** - Save results before leaving page
5. **Check distances** - Verify results are within radius

