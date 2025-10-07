# Documentation Index

Complete documentation for the RAG Service.

## 📚 Documentation Overview

This documentation provides comprehensive guides for developers, integrators, and operators working with the RAG Service.

## 🚀 Getting Started

- **[Main README](../README.md)** - Quick start guide and overview
- **[Setup Guide](../README.md#setup-guide)** - Environment setup and configuration
- **[API Reference](./api-reference.md)** - Complete API documentation

## 🔧 Development

- **[Architecture Guide](./architecture.md)** - Technical architecture and design decisions
- **[Bubble Integration](./bubble-integration.md)** - Step-by-step Bubble app integration
- **[Deployment Guide](./deployment.md)** - Production deployment strategies

## 📖 Detailed Guides

### API Documentation
- **[API Reference](./api-reference.md)** - Complete endpoint documentation
  - Health Check endpoint
  - Content ingestion API
  - Search API with examples
  - Error handling and status codes
  - Performance considerations

### Architecture Documentation
- **[Architecture Guide](./architecture.md)** - Technical deep dive
  - System overview and components
  - Database schema and indexes
  - Search algorithm details
  - Performance characteristics
  - Security considerations
  - Scalability planning

### Integration Guides
- **[Bubble Integration](./bubble-integration.md)** - Bubble app integration
  - Content ingestion workflows
  - Search implementation
  - Data type setup
  - Error handling
  - Best practices

### Deployment Documentation
- **[Deployment Guide](./deployment.md)** - Production deployment
  - Cloud platform deployment (Vercel, Railway, DigitalOcean)
  - Container deployment (Docker, Kubernetes)
  - Traditional server deployment
  - Environment configuration
  - Monitoring and observability
  - Maintenance procedures

## 🛠️ Quick Reference

### Environment Variables
```env
# Required
OPENAI_API_KEY=sk-your-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional
PORT=3000
EMBED_MODEL=text-embedding-3-small
EMBED_DIM=1536
IVF_LISTS=100
LOG_LEVEL=info
```

### Package Manager Support
- **pnpm** (recommended): `pnpm install && pnpm dev`
- **npm**: `npm install && npm run dev`
- **yarn**: `yarn install && yarn dev`

### Key Endpoints
- `GET /health` - Health check
- `POST /ingest` - Content ingestion
- `POST /search` - Content search

### Database Schema
```sql
content_item (id, type, source_id, version, title, description)
├── content_metadata (item_id, facets)
├── content_chunk (item_id, field, text, embedding)
└── content_item_vector (item_id, method, embedding)
```

## 🔍 Search Algorithm

The service uses a two-stage hybrid search approach:

1. **Coarse Recall**: Vector similarity search (top 50 candidates)
2. **Chunk Refinement**: Detailed search with field weights
3. **BM25 Fusion**: Full-text search over materialized view
4. **RRF Ranking**: Reciprocal Rank Fusion combines scores

## 🏗️ Architecture Highlights

- **Tokenizer-aware chunking** with tiktoken
- **Per-field embeddings** with configurable weights
- **Document-level composite vectors** using weighted mean
- **Idempotent upserts** with versioning support
- **Hybrid search** combining vector similarity and BM25
- **PII stripping** for data protection
- **Production-ready** with structured logging and monitoring

## 📊 Performance Characteristics

- **Embedding Generation**: ~200-500ms per batch
- **Vector Search**: ~10-50ms for coarse recall
- **Full-Text Search**: ~5-20ms for BM25 scoring
- **Memory Usage**: ~100-500MB for production workloads
- **Scalability**: Linear with IVF_LISTS parameter

## 🔒 Security Features

- **Service Role Protection**: Database access via service role key only
- **PII Stripping**: Automatic removal of sensitive data
- **Input Validation**: Zod schema validation
- **Request Limits**: 10MB JSON payload limit
- **Error Sanitization**: No sensitive data in responses

## 🚀 Deployment Options

### Cloud Platforms
- **Vercel**: Serverless deployment with automatic scaling
- **Railway**: Simple deployment with built-in monitoring
- **DigitalOcean App Platform**: Managed container deployment

### Container Deployment
- **Docker**: Single-container deployment
- **Kubernetes**: Multi-container orchestration
- **Docker Compose**: Local development and testing

### Traditional Servers
- **Ubuntu/Debian**: PM2 process management
- **Nginx**: Reverse proxy configuration
- **SSL/TLS**: HTTPS termination

## 📈 Monitoring and Observability

### Health Monitoring
- Service health checks
- Database connection monitoring
- External service availability
- Performance metrics tracking

### Logging
- Structured JSON logging with Pino
- Request ID tracing
- Performance metrics
- Error tracking with stack traces

### Alerting
- Critical alerts for service failures
- Warning alerts for performance issues
- Custom metrics and thresholds

## 🔧 Maintenance

### Regular Tasks
- **Daily**: Health monitoring, error log review
- **Weekly**: Search analytics, query optimization
- **Monthly**: Database maintenance, security audit

### Database Maintenance
- Index optimization and reindexing
- Materialized view refresh
- Query performance analysis
- Backup verification

### Scaling Procedures
- Horizontal scaling with load balancers
- Vertical scaling with resource monitoring
- Auto-scaling based on metrics
- Performance optimization

## 🆘 Support and Troubleshooting

### Common Issues
- Database connection errors
- OpenAI API quota issues
- Vector dimension mismatches
- Search performance problems

### Debug Procedures
- Enable debug logging
- Check service health endpoints
- Monitor database performance
- Analyze search query patterns

### Performance Optimization
- Database index optimization
- Query performance tuning
- Caching implementation
- Resource scaling

## 📝 Contributing

### Development Setup
1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

### Code Standards
- TypeScript with strict mode
- ESLint configuration
- Jest testing framework
- Comprehensive documentation

## 📄 License

MIT License - see [LICENSE](../LICENSE) file for details.

---

**For additional support:**
- Create an issue in the repository
- Check the troubleshooting sections
- Review the API documentation
- Contact the development team
