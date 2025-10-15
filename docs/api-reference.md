# API Reference

Complete API documentation for the RAG Service.

## Base URL

```
http://localhost:3000
```

## Authentication

The service uses Supabase service role key for database access. No client authentication is required for the API endpoints.

## Endpoints

### Health Check

Check if the service is running.

```http
GET /health
```

#### Response

```json
{
  "ok": true
}
```

#### Status Codes

- `200` - Service is healthy

---

### Ingest Content

Ingest content for vector search indexing.

```http
POST /ingest
Content-Type: application/json
```

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | Content type: `"video"`, `"plan"`, or `"coach_info"` |
| `source_id` | string | Yes | Unique identifier for the content |
| `version` | number | No | Version number (default: 1) |
| `to_embedding` | object | Yes | Fields to embed with weights |
| `metadata` | object | Yes | Faceted metadata for filtering |
| `title` | string | No | Display title |
| `description` | string | No | Display description |

#### to_embedding Object

| Field | Type | Weight | Description |
|-------|------|--------|-------------|
| `Title` | string | 3.0 | Primary content title |
| `Transcription` | string | 1.0 | Full text content |
| `Description` | string | 1.2 | Content description |
| `Purpose` | string | 1.5 | Learning objectives |
| `Setup` | string | 1.2 | Setup instructions |
| `CoachingPoints` | string | 2.0 | Key coaching points |
| `Adaptations` | string | 1.1 | Adaptation suggestions |
| `LearningQuestions` | string | 1.1 | Reflection questions |

#### metadata Object

The metadata object supports both predefined fields and custom fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `creator` | string | No | Content creator name |
| `category` | string | No | Content category |
| `timestamp` | string | No | ISO timestamp of content creation |
| `VideosAndTime` | string | No | Video segments with timestamps |
| `Totaltime` | string | No | Total duration of content |
| `Content` | array of strings | No | List of content topics/items |

**Note**: The `Content` field is now an array of strings instead of a single string, allowing you to store multiple content items or topics as a list.

#### Example Request

```json
{
  "type": "video",
  "source_id": "V-000045",
  "version": 1,
  "to_embedding": {
    "Title": "Passing Fundamentals",
    "Transcription": "Today we'll learn the basics of passing...",
    "Description": "Introduction to passing techniques",
    "Purpose": "Develop basic passing skills",
    "Setup": "Set up cones 10 meters apart",
    "CoachingPoints": "Head up, eyes on the ball, follow through",
    "Adaptations": "For beginners, reduce distance",
    "LearningQuestions": "What did you notice about your passing?"
  },
  "metadata": {
    "creator": "Coach Mike Johnson",
    "category": "basketball",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "VideosAndTime": "main_video:15:30",
    "Totaltime": "15:30",
    "Content": [
      "Proper shooting stance and footwork",
      "Hand placement and ball grip",
      "Follow-through technique",
      "Common shooting mistakes to avoid",
      "Practice drills for consistency"
    ],
    "Category": "Passing",
    "Countries": ["NZ"],
    "SkillZone": "Intermediate",
    "AgeGroups": ["U10", "U12"],
    "UniqueID": "V-000045"
  },
  "title": "Passing Fundamentals",
  "description": "Introduction to passing techniques"
}
```

#### Response

```json
{
  "ok": true,
  "item_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

#### Idempotent Response

If content with the same `(type, source_id, version)` already exists:

```json
{
  "ok": true,
  "item_id": "123e4567-e89b-12d3-a456-426614174000",
  "message": "Already ingested"
}
```

#### Error Responses

```json
{
  "ok": false,
  "error": "Validation error message"
}
```

#### Status Codes

- `200` - Content ingested successfully
- `400` - Invalid request or validation error
- `500` - Internal server error

---

### Search Content

Search for content using hybrid vector and full-text search.

```http
POST /search
Content-Type: application/json
```

#### Request Body

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `query` | string | Yes | - | Search query text |
| `type` | string | No | null | Filter by content type |
| `filters` | object | No | {} | Faceted filters |
| `k` | number | No | 10 | Number of results to return |
| `fieldWeights` | object | No | {} | Override field weights |

#### Example Request

```json
{
  "query": "passing techniques for beginners",
  "type": "video",
  "filters": {
    "Category": "Passing",
    "Countries": ["NZ"],
    "SkillZone": "Beginner"
  },
  "k": 5,
  "fieldWeights": {
    "Title": 3,
    "CoachingPoints": 2.5
  }
}
```

#### Response

```json
{
  "matches": [
    {
      "item_id": "123e4567-e89b-12d3-a456-426614174000",
      "type": "video",
      "score": 0.83,
      "field": "CoachingPoints",
      "snippet": "Head up, eyes on the ball, follow through with your pass...",
      "metadata": {
        "Category": "Passing",
        "Countries": ["NZ"],
        "SkillZone": "Beginner",
        "AgeGroups": ["U10", "U12"]
      }
    }
  ]
}
```

#### Match Object

| Field | Type | Description |
|-------|------|-------------|
| `item_id` | string | Unique identifier of the content item |
| `type` | string | Content type |
| `score` | number | Relevance score (0-1) |
| `field` | string | Which field the match came from |
| `snippet` | string | Text snippet (max 200 chars) |
| `metadata` | object | Faceted metadata |

#### Error Responses

```json
{
  "ok": false,
  "error": "Search failed: error message"
}
```

#### Status Codes

- `200` - Search completed successfully
- `400` - Invalid request or search error
- `500` - Internal server error

## Search Algorithm

The service uses a two-stage hybrid search approach:

### Stage 1: Coarse Recall
- Vector similarity search on document-level embeddings
- Returns top 50 candidates
- Uses IVFFLAT index for performance

### Stage 2: Chunk Refinement
- Detailed search on individual chunks
- Applies field weights to vector scores
- BM25 full-text search on materialized view
- Reciprocal Rank Fusion (RRF) combines scores

### Scoring Formula

```
final_score = RRF(vector_rank, bm25_rank)
RRF = 1/(60 + vector_rank) + 1/(60 + bm25_rank)
```

## Rate Limits

No rate limits are currently implemented. For production use, consider implementing rate limiting based on your requirements.

## Error Handling

All endpoints return consistent error responses:

```json
{
  "ok": false,
  "error": "Human-readable error message"
}
```

Common error scenarios:

- **Validation errors**: Invalid request body or missing required fields
- **Database errors**: Connection issues or query failures
- **OpenAI errors**: API key issues or quota exceeded
- **Vector dimension mismatch**: Embedding model configuration issues

## Request/Response Headers

### Request Headers

```
Content-Type: application/json
```

### Response Headers

```
Content-Type: application/json
X-Request-ID: uuid (for tracing)
```

## Examples

### cURL Examples

#### Health Check

```bash
curl -X GET http://localhost:3000/health
```

#### Ingest Content

```bash
curl -X POST http://localhost:3000/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "type": "video",
    "source_id": "V-001",
    "to_embedding": {
      "Title": "Basic Passing",
      "Description": "Learn the fundamentals"
    },
    "metadata": {
      "Category": "Passing"
    }
  }'
```

#### Search Content

```bash
curl -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "passing techniques",
    "type": "video",
    "k": 5
  }'
```

### JavaScript Examples

#### Using Fetch API

```javascript
// Ingest content
const ingestResponse = await fetch('http://localhost:3000/ingest', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'video',
    source_id: 'V-001',
    to_embedding: {
      Title: 'Basic Passing',
      Description: 'Learn the fundamentals'
    },
    metadata: {
      Category: 'Passing'
    }
  })
});

const ingestResult = await ingestResponse.json();
console.log('Ingested:', ingestResult.item_id);

// Search content
const searchResponse = await fetch('http://localhost:3000/search', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: 'passing techniques',
    type: 'video',
    k: 5
  })
});

const searchResults = await searchResponse.json();
console.log('Found', searchResults.matches.length, 'results');
```

## Performance Considerations

- **Embedding generation**: Each field is embedded separately, then composed into document vectors
- **Chunking**: Content is chunked using tiktoken with 1000 token limit and 50 token overlap
- **Vector search**: Uses IVFFLAT indexes for fast approximate nearest neighbor search
- **Full-text search**: Uses PostgreSQL's built-in full-text search with GIN indexes
- **Result fusion**: RRF combines vector and BM25 scores for optimal relevance

## Monitoring

The service logs structured information for monitoring:

- Request IDs for tracing
- Performance metrics (duration, token counts)
- Search result counts and candidate counts
- Error details with stack traces

Enable debug logging by setting `LOG_LEVEL=debug` in your environment.


