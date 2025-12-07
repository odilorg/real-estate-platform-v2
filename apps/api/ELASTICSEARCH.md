# Elasticsearch Integration

This document describes the Elasticsearch integration for advanced property search functionality.

## Overview

The search module provides:
- Full-text search across properties
- Advanced filtering (price, area, bedrooms, bathrooms, location, etc.)
- Autocomplete/suggestions
- Fuzzy matching for typos
- Geospatial search support
- **Graceful degradation** - falls back to database search when Elasticsearch is not configured

## Setup

### 1. Install Elasticsearch (Optional)

Elasticsearch is **optional**. The API will work without it using database search as fallback.

#### Using Docker

```bash
docker run -d \
  --name elasticsearch \
  -p 9200:9200 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  elasticsearch:8.11.0
```

#### Using Docker Compose

```yaml
services:
  elasticsearch:
    image: elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

volumes:
  elasticsearch_data:
```

### 2. Configure Environment Variables

Add to your `.env` file (optional):

```env
# Elasticsearch Configuration (Optional - API works without it)
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=
```

If these variables are not set, the API will use database search instead.

### 3. Initialize the Index

Once Elasticsearch is running, initialize the index (requires admin authentication):

```bash
curl -X POST http://localhost:3001/api/search/initialize \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

### 4. Index Properties

Reindex all active properties:

```bash
curl -X POST http://localhost:3001/api/search/reindex \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

## API Endpoints

### Search Properties

```http
GET /api/search
```

**Public endpoint** - no authentication required.

**Query Parameters:**
- `query` - Full-text search query
- `city` - Filter by city
- `propertyType` - Filter by property type (APARTMENT, HOUSE, etc.)
- `listingType` - Filter by listing type (SALE, RENT)
- `minPrice` / `maxPrice` - Price range filter
- `minArea` / `maxArea` - Area range filter
- `bedrooms` - Number of bedrooms
- `bathrooms` - Number of bathrooms
- `buildingClass` - Building class filter
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 20)
- `sortBy` - Sort by: `relevance`, `price_asc`, `price_desc`, `date_desc`, `date_asc`

**Example:**
```bash
curl "http://localhost:3001/api/search?query=luxury&city=Tashkent&propertyType=APARTMENT&minPrice=100000&maxPrice=500000&limit=10"
```

**Response:**
```json
{
  "data": [...],
  "total": 42,
  "page": 1,
  "limit": 10,
  "pages": 5
}
```

### Get Search Suggestions

```http
GET /api/search/suggestions?q=lux&limit=5
```

**Public endpoint** - no authentication required.

Returns autocomplete suggestions based on property titles and locations.

**Note:** Only works when Elasticsearch is configured. Returns empty array with database fallback.

### Initialize Index (Admin Only)

```http
POST /api/search/initialize
```

Creates the Elasticsearch index with proper mappings and analyzers.

**Requires:** Admin role + JWT authentication

### Reindex Properties (Admin Only)

```http
POST /api/search/reindex
```

Bulk indexes all active properties from the database to Elasticsearch.

**Requires:** Admin role + JWT authentication

## How It Works

### With Elasticsearch

When `ELASTICSEARCH_URL` is configured:
1. Queries are sent to Elasticsearch
2. Full-text search with fuzzy matching
3. Advanced filtering and scoring
4. Fast autocomplete with edge n-gram tokenization
5. Geospatial search support

### Without Elasticsearch (Database Fallback)

When Elasticsearch is not configured:
1. Queries use Prisma/PostgreSQL
2. Case-insensitive text search with `LIKE`
3. Standard filtering
4. Slower but functional
5. Autocomplete not available

### Automatic Property Indexing

Properties are automatically indexed/updated in Elasticsearch when:
- A new property is created
- An existing property is updated
- A property is deleted

This is handled by the `PropertiesService` which calls the `SearchService` methods.

## Index Mapping

The Elasticsearch index includes:

**Text fields with autocomplete:**
- `title` - Property title
- `city` - City name

**Full-text fields:**
- `description` - Property description
- `address` - Street address

**Keyword fields:**
- `propertyType`, `listingType`, `status`
- `district`, `buildingClass`, `buildingType`, `renovation`
- `amenities` - Array of amenities

**Numeric fields:**
- `price`, `priceUsd`
- `bedrooms`, `bathrooms`
- `area`, `floor`, `totalFloors`, `yearBuilt`
- `views`

**Geo-point:**
- `location` - Latitude/longitude for geospatial queries

**Dates:**
- `createdAt`, `updatedAt`

## Performance

### With Elasticsearch
- Sub-second search across millions of properties
- Efficient autocomplete
- Complex multi-field queries

### Database Fallback
- Acceptable for small to medium datasets (< 10k properties)
- Slower with large datasets
- Simple text matching

## Troubleshooting

### Check Elasticsearch Connection

```bash
curl http://localhost:9200
```

### Check Index Status

```bash
curl http://localhost:9200/properties/_count
```

### View Index Mapping

```bash
curl http://localhost:9200/properties/_mapping
```

### Delete and Recreate Index

```bash
# Delete index
curl -X DELETE http://localhost:9200/properties

# Reinitialize (requires admin auth)
curl -X POST http://localhost:3001/api/search/initialize \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"

# Reindex all properties (requires admin auth)
curl -X POST http://localhost:3001/api/search/reindex \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

## Development

The search module is located at:
- `/apps/api/src/modules/search/`

**Files:**
- `elasticsearch.service.ts` - Elasticsearch client wrapper
- `search.service.ts` - Search business logic
- `search.controller.ts` - REST API endpoints
- `search.module.ts` - NestJS module definition

## Testing

Test the search endpoint:

```bash
# Basic search
curl "http://localhost:3001/api/search?query=apartment&limit=5"

# Advanced filters
curl "http://localhost:3001/api/search?city=Tashkent&propertyType=APARTMENT&minPrice=100000&maxPrice=500000"

# Suggestions (requires Elasticsearch)
curl "http://localhost:3001/api/search/suggestions?q=lux&limit=5"
```

## Production Deployment

For production:
1. Use managed Elasticsearch (AWS OpenSearch, Elastic Cloud, etc.)
2. Enable authentication (set `ELASTICSEARCH_USERNAME` and `ELASTICSEARCH_PASSWORD`)
3. Use HTTPS for the Elasticsearch URL
4. Configure proper sharding and replication
5. Set up monitoring and alerts
6. Schedule periodic reindexing if needed

## Future Enhancements

- Advanced geospatial queries (search within radius)
- Search result highlighting
- Faceted search (aggregations for filters)
- Search analytics and tracking
- Personalized search results
- Multi-language search support
