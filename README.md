# RAG Service

A production-ready Node/Express service for vector and hybrid search with Supabase, featuring tokenizer-aware chunking, per-field embeddings, document-level composite vectors, and hybrid (ANN + BM25) retrieval.

## 🚀 Quick Start

```bash
# 1. Clone and install
git clone <your-repo>
cd rag-service

# Install dependencies (choose one)
pnpm install  # or npm install

# 2. Setup environment
cp env.example .env
# Edit .env with your keys

# 3. Setup database
# Run src/sql/schema.sql in Supabase SQL editor
# Run src/sql/rpc_refresh_mv.sql in Supabase SQL editor

# 4. Start development
pnpm dev  # or npm run dev
```

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [API Documentation](#api-documentation)
- [Setup Guide](#setup-guide)
- [Bubble Integration](#bubble-integration)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

## ✨ Features

- **🧠 Tokenizer-aware chunking** using `@dqbd/tiktoken` with configurable token limits
- **📊 Per-field embeddings** with configurable weights for different content types
- **🔗 Document-level composite vectors** using weighted mean of field vectors
- **🔄 Idempotent upserts** with versioning support for reliable data ingestion
- **🔍 Hybrid search** combining vector similarity (ANN) and BM25 full-text search
- **🛡️ PII stripping** for automatic removal of emails and phone numbers
- **📈 Production-ready** with structured logging, error handling, and observability
- **🔒 Security-first** with service role key protection and no CORS by default

## 🏗️ Architecture

### High-Level Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Bubble App    │───▶│   RAG Service   │───▶│   Supabase DB   │
│                 │    │                 │    │                 │
│ - Content Forms │    │ - Ingest API    │    │ - pgvector      │
│ - Search UI     │    │ - Search API    │    │ - Full-text     │
│ - Workflows     │    │ - Hybrid Search │    │ - Materialized │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Search Flow

1. **Query Processing**: User query → OpenAI embedding
2. **Coarse Recall**: Vector similarity search (top 50 candidates)
3. **Chunk Refinement**: Detailed search on individual chunks
4. **BM25 Fusion**: Full-text search over materialized view
5. **RRF Ranking**: Reciprocal Rank Fusion combines scores
6. **Result Formatting**: Ranked results with snippets and metadata

### Database Schema

```sql
content_item (id, type, source_id, version, title, description)
├── content_metadata (item_id, facets)
├── content_chunk (item_id, field, text, embedding)
└── content_item_vector (item_id, method, embedding)
```

## 📚 API Documentation

### Health Check

```http
GET /health
```

**Response:**
```json
{ "ok": true }
```

### Ingest Content

```http
POST /ingest
Content-Type: application/json
```

**Request Body:**
```json
{
  "type": "video | plan | coach_info",
  "source_id": "unique-identifier",
  "version": 1,
  "to_embedding": {
    "Title": "Content title",
    "Transcription": "Full text content",
    "Description": "Content description",
    "Purpose": "Learning objectives",
    "Setup": "Setup instructions",
    "CoachingPoints": "Key coaching points",
    "Adaptations": "Adaptation suggestions",
    "LearningQuestions": "Reflection questions"
  },
  "metadata": {
    "Content": "Football",
    "Category": "Passing",
    "Countries": ["NZ"],
    "SkillZone": "Intermediate",
    "AgeGroups": ["U10", "U12"],
    "UniqueID": "V-000045"
  },
  "title": "Optional display title",
  "description": "Optional display description"
}
```

**Response:**
```json
{
  "ok": true,
  "item_id": "uuid",
  "message": "Already ingested" // if idempotent
}
```

### Search Content

```http
POST /search
Content-Type: application/json
```

**Request Body:**
```json
{
  "query": "search query text",
  "type": "video | plan | coach_info | null",
  "filters": {
    "Category": "Passing",
    "Countries": ["NZ"]
  },
  "k": 10,
  "fieldWeights": {
    "Title": 3,
    "CoachingPoints": 2
  }
}
```

**Response:**
```json
{
  "matches": [
    {
      "item_id": "uuid",
      "type": "video",
      "score": 0.83,
      "field": "CoachingPoints",
      "snippet": "Head up, eyes on the ball...",
      "metadata": {
        "Category": "Passing",
        "Countries": ["NZ"],
        "SkillZone": "Intermediate"
      }
    }
  ]
}
```

## 🛠️ Setup Guide

### Prerequisites

- Node.js 20+
- Supabase account with pgvector extension
- OpenAI API key
- pnpm (recommended) or npm

### 1. Environment Configuration

```bash
cp env.example .env
```

Edit `.env`:
```env
PORT=3000
OPENAI_API_KEY=sk-your-openai-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
EMBED_MODEL=text-embedding-3-large
EMBED_DIM=1536
IVF_LISTS=100
```

### 2. Database Setup

Run these SQL scripts in your Supabase SQL editor:

1. **Schema Setup**: Run `src/sql/schema.sql`
2. **Functions Setup**: Run `src/sql/rpc_refresh_mv.sql`

### 3. Install Dependencies

**Option 1: Using pnpm (recommended)**
```bash
pnpm install
```

**Option 2: Using npm (if pnpm is not available)**
```bash
npm install
```

### 4. Development

**With pnpm:**
```bash
pnpm dev
```

**With npm:**
```bash
npm run dev
```

Server starts on `http://localhost:3000`

### 5. Testing

**With pnpm:**
```bash
pnpm test
```

**With npm:**
```bash
npm test
```

## 🔗 Bubble Integration

### Ingesting Content from Bubble

#### Backend Workflow Setup

1. **Create Backend Workflow** in Bubble
2. **Trigger**: On create/update of your content records
3. **Action**: API Call to your RAG service

#### Example Bubble Workflow

```javascript
// Backend Workflow: "Ingest Video Content"
// Trigger: When a Video is created or updated

const videoData = {
  type: "video",
  source_id: This_Video.unique_id,
  version: 1,
  to_embedding: {
    Title: This_Video.title,
    Transcription: This_Video.transcription,
    Description: This_Video.description,
    Purpose: This_Video.purpose,
    Setup: This_Video.setup_instructions,
    CoachingPoints: This_Video.coaching_points,
    Adaptations: This_Video.adaptations,
    LearningQuestions: This_Video.learning_questions
  },
  metadata: {
    Content: This_Video.content,
    Category: This_Video.category,
    Countries: This_Video.countries,
    SkillZone: This_Video.skill_zone,
    AgeGroups: This_Video.age_groups,
    UniqueID: This_Video.unique_id
  },
  title: This_Video.title,
  description: This_Video.description
};

const response = await fetch('https://your-rag-service.com/ingest', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(videoData)
});

if (response.ok) {
  const result = await response.json();
  // Log success or handle response
  console.log('Content ingested:', result.item_id);
} else {
  // Handle error
  console.error('Ingestion failed:', await response.text());
}
```

### Searching from Bubble

#### Frontend Workflow Setup

1. **Create Frontend Workflow** in Bubble
2. **Trigger**: User search action
3. **Action**: API Call to search endpoint
4. **Display**: Process and show results

#### Example Bubble Search Workflow

```javascript
// Frontend Workflow: "Search Content"
// Trigger: When user clicks search button

const searchData = {
  query: Search_Input.value,
  type: Content_Type_Selector.value, // or null for all types
  filters: {
    Category: Category_Filter.value,
    Countries: Country_Filter.value,
    SkillZone: Skill_Zone_Filter.value
  },
  k: 10
};

const response = await fetch('https://your-rag-service.com/search', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(searchData)
});

if (response.ok) {
  const results = await response.json();
  
  // Process results for display
  const searchResults = results.matches.map(match => ({
    item_id: match.item_id,
    type: match.type,
    score: match.score,
    field: match.field,
    snippet: match.snippet,
    metadata: match.metadata
  }));
  
  // Set search results in your Bubble app
  Search_Results_List.set_contents(searchResults);
} else {
  // Handle search error
  console.error('Search failed:', await response.text());
}
```

### Field Mapping Guide

| Bubble Field | RAG Service Field | Weight | Description |
|-------------|------------------|--------|-------------|
| `title` | `Title` | 3.0 | Primary content title |
| `coaching_points` | `CoachingPoints` | 2.0 | Key coaching insights |
| `purpose` | `Purpose` | 1.5 | Learning objectives |
| `description` | `Description` | 1.2 | Content description |
| `setup_instructions` | `Setup` | 1.2 | Setup instructions |
| `adaptations` | `Adaptations` | 1.1 | Adaptation suggestions |
| `learning_questions` | `LearningQuestions` | 1.1 | Reflection questions |
| `transcription` | `Transcription` | 1.0 | Full text content |

## 🚀 Production Deployment

### Environment Variables

```env
# Required
OPENAI_API_KEY=sk-your-production-key
SUPABASE_URL=https://your-prod-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key

# Optional (with defaults)
PORT=3000
EMBED_MODEL=text-embedding-3-large
EMBED_DIM=1536
IVF_LISTS=100
LOG_LEVEL=info
```

### Database Migration

1. **Backup existing data** (if any)
2. **Run schema migration**:
   ```sql
   -- Run src/sql/schema.sql
   -- Run src/sql/rpc_refresh_mv.sql
   ```
3. **Verify indexes** are created properly
4. **Test with sample data**

### Security Checklist

- ✅ Service role key never exposed to client
- ✅ CORS not enabled by default
- ✅ Request size limits (10MB)
- ✅ Input validation with Zod
- ✅ PII stripping enabled
- ✅ Structured logging (no secrets in logs)

### Monitoring

The service includes structured logging with:
- Request IDs for tracing
- Performance metrics (duration, token counts)
- Error tracking with stack traces
- Search result counts and candidate counts

### Scaling Considerations

- **Vector Index**: Adjust `IVF_LISTS` based on data size
- **Embedding Model**: Consider switching to `text-embedding-3-small` for cost optimization
- **Database**: Monitor pgvector index performance
- **API Rate Limits**: Implement rate limiting for production use

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Errors

```bash
Error: Failed to connect to Supabase
```

**Solution**: Verify your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`

#### 2. OpenAI API Errors

```bash
Error: OpenAI embedding failed
```

**Solution**: Check your `OPENAI_API_KEY` and API quota

#### 3. Vector Dimension Mismatch

```bash
Error: Vector dimension mismatch
```

**Solution**: Ensure `EMBED_DIM` matches your embedding model:
- `text-embedding-3-large`: 3072
- `text-embedding-3-small`: 1536

#### 4. Search Returns No Results

**Debug Steps**:
1. Check if content is ingested: `SELECT COUNT(*) FROM content_item;`
2. Verify embeddings exist: `SELECT COUNT(*) FROM content_chunk WHERE embedding IS NOT NULL;`
3. Test with simple query first
4. Check materialized view: `SELECT COUNT(*) FROM content_item_ft;`

#### 5. pnpm Command Not Found

```bash
Error: 'pnpm' is not recognized as an internal or external command
```

**Solutions**:
1. **Install pnpm**: `npm install -g pnpm`
2. **Use npm instead**: Replace `pnpm` commands with `npm` equivalents
3. **Use npx**: `npx pnpm install` (if pnpm is not globally installed)

### Performance Optimization

#### 1. Slow Search Performance

- **Increase IVF lists**: Update `IVF_LISTS` in environment
- **Check index usage**: `EXPLAIN ANALYZE` your search queries
- **Optimize chunk size**: Adjust `MAX_TOKENS` in chunking

#### 2. High Embedding Costs

- **Switch to smaller model**: Use `text-embedding-3-small`
- **Optimize chunking**: Reduce `MAX_TOKENS` or improve chunking strategy
- **Cache embeddings**: Implement embedding caching for repeated content

#### 3. Database Performance

- **Monitor index usage**: Check if IVFFLAT indexes are being used
- **Optimize queries**: Use `EXPLAIN ANALYZE` for slow queries
- **Consider partitioning**: For very large datasets

### Debug Mode

Enable debug logging:

```env
LOG_LEVEL=debug
```

This will show:
- Request/response details
- Embedding token counts
- Search performance metrics
- Database query details

## 📖 Additional Documentation

- **[Documentation Index](./docs/README.md)** - Complete documentation overview
- **[API Reference](./docs/api-reference.md)** - Detailed API documentation with examples
- **[Architecture Guide](./docs/architecture.md)** - Technical architecture and design decisions
- **[Bubble Integration Guide](./docs/bubble-integration.md)** - Step-by-step Bubble app integration
- **[Deployment Guide](./docs/deployment.md)** - Production deployment strategies and maintenance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section above
- Review the API documentation

---

**Built with ❤️ for production RAG applications**
