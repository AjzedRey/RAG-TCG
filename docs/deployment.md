# Deployment Guide

Complete guide for deploying the RAG Service to production environments.

## Overview

This guide covers deployment strategies, environment configuration, monitoring setup, and maintenance procedures for the RAG Service in production.

## Deployment Options

### 1. Cloud Platform Deployment

#### Vercel (Recommended for Serverless)

**Prerequisites:**
- Vercel account
- GitHub repository
- Environment variables configured

**Deployment Steps:**

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   
   # Deploy from project directory
   vercel
   ```

2. **Configure Environment Variables**
   ```bash
   vercel env add OPENAI_API_KEY
   vercel env add SUPABASE_URL
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   vercel env add EMBED_MODEL
   vercel env add EMBED_DIM
   vercel env add IVF_LISTS
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

**Vercel Configuration (`vercel.json`):**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "dist/server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

#### Railway

**Prerequisites:**
- Railway account
- GitHub repository
- Railway CLI installed

**Deployment Steps:**

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Deploy Project**
   ```bash
   railway init
   railway up
   ```

3. **Configure Environment Variables**
   ```bash
   railway variables set OPENAI_API_KEY=your-key
   railway variables set SUPABASE_URL=your-url
   railway variables set SUPABASE_SERVICE_ROLE_KEY=your-key
   ```

#### DigitalOcean App Platform

**Prerequisites:**
- DigitalOcean account
- GitHub repository
- App Platform access

**Deployment Steps:**

1. **Create App**
   - Connect GitHub repository
   - Select Node.js buildpack
   - Configure build settings

2. **Environment Variables**
   ```yaml
   # .do/app.yaml
   name: rag-service
   services:
   - name: api
     source_dir: /
     github:
       repo: your-username/rag-service
       branch: main
     run_command: npm start
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
     envs:
     - key: OPENAI_API_KEY
       value: your-key
     - key: SUPABASE_URL
       value: your-url
     - key: SUPABASE_SERVICE_ROLE_KEY
       value: your-key
   ```

### 2. Container Deployment

#### Docker Deployment

**Dockerfile:**
```dockerfile
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN pnpm build

# Remove dev dependencies
RUN pnpm prune --production

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["node", "dist/server.js"]
```

**Docker Compose:**
```yaml
version: '3.8'

services:
  rag-service:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - EMBED_MODEL=text-embedding-3-large
      - EMBED_DIM=1536
      - IVF_LISTS=100
      - LOG_LEVEL=info
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

**Deployment Commands:**
```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Scale service
docker-compose up -d --scale rag-service=3
```

#### Kubernetes Deployment

**Deployment YAML:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rag-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: rag-service
  template:
    metadata:
      labels:
        app: rag-service
    spec:
      containers:
      - name: rag-service
        image: your-registry/rag-service:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: rag-secrets
              key: openai-api-key
        - name: SUPABASE_URL
          valueFrom:
            secretKeyRef:
              name: rag-secrets
              key: supabase-url
        - name: SUPABASE_SERVICE_ROLE_KEY
          valueFrom:
            secretKeyRef:
              name: rag-secrets
              key: supabase-service-role-key
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: rag-service
spec:
  selector:
    app: rag-service
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

### 3. Traditional Server Deployment

#### Ubuntu/Debian Server

**Prerequisites:**
- Ubuntu 20.04+ server
- Node.js 20+ installed
- PM2 for process management
- Nginx for reverse proxy

**Setup Steps:**

1. **Install Dependencies**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js 20
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2
   sudo npm install -g pm2
   
   # Install Nginx
   sudo apt install nginx -y
   ```

2. **Deploy Application**
   ```bash
   # Clone repository
   git clone https://github.com/your-username/rag-service.git
   cd rag-service
   
   # Install dependencies
   npm install
   
   # Build application
   npm run build
   
   # Create environment file
   sudo nano /etc/environment
   # Add your environment variables
   ```

3. **Configure PM2**
   ```bash
   # Create PM2 ecosystem file
   cat > ecosystem.config.js << EOF
   module.exports = {
     apps: [{
       name: 'rag-service',
       script: 'dist/server.js',
       instances: 'max',
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'production',
         PORT: 3000
       },
       error_file: './logs/err.log',
       out_file: './logs/out.log',
       log_file: './logs/combined.log',
       time: true
     }]
   }
   EOF
   
   # Start application
   pm2 start ecosystem.config.js
   
   # Save PM2 configuration
   pm2 save
   pm2 startup
   ```

4. **Configure Nginx**
   ```bash
   # Create Nginx configuration
   sudo nano /etc/nginx/sites-available/rag-service
   ```

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   ```bash
   # Enable site
   sudo ln -s /etc/nginx/sites-available/rag-service /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## Environment Configuration

### Production Environment Variables

```env
# Required
NODE_ENV=production
PORT=3000
OPENAI_API_KEY=sk-your-production-key
SUPABASE_URL=https://your-prod-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key

# Optional (with production defaults)
EMBED_MODEL=text-embedding-3-small
EMBED_DIM=1536
IVF_LISTS=100
LOG_LEVEL=info

# Security
CORS_ORIGIN=https://your-bubble-app.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
SENTRY_DSN=your-sentry-dsn
DATADOG_API_KEY=your-datadog-key
```

### Database Configuration

#### Supabase Production Setup

1. **Create Production Project**
   - Create new Supabase project
   - Enable pgvector extension
   - Configure connection pooling

2. **Run Database Migrations**
   ```sql
   -- Run schema.sql
   -- Run rpc_refresh_mv.sql
   -- Verify indexes are created
   ```

3. **Configure Connection Pooling**
   ```sql
   -- Set connection limits
   ALTER SYSTEM SET max_connections = 100;
   ALTER SYSTEM SET shared_preload_libraries = 'vector';
   ```

4. **Set Up Monitoring**
   - Enable query performance monitoring
   - Set up database alerts
   - Configure backup schedules

### Security Configuration

#### API Security
```typescript
// Add to server.ts
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

// Security headers
app.use(helmet());

// Apply rate limiting
app.use('/api/', limiter);
```

#### Environment Security
- Use secrets management (AWS Secrets Manager, Azure Key Vault)
- Rotate API keys regularly
- Monitor for exposed credentials
- Use least privilege access

## Monitoring and Observability

### Application Monitoring

#### Health Checks
```typescript
// Enhanced health check
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: await checkDatabaseHealth(),
    openai: await checkOpenAIHealth()
  };
  
  res.json(health);
});
```

#### Logging Configuration
```typescript
// Production logging
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  }
});
```

### Performance Monitoring

#### Metrics Collection
```typescript
// Custom metrics
const metrics = {
  requests: new Map(),
  embeddings: new Map(),
  searches: new Map()
};

// Request metrics middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    metrics.requests.set(req.path, {
      count: (metrics.requests.get(req.path)?.count || 0) + 1,
      totalDuration: (metrics.requests.get(req.path)?.totalDuration || 0) + duration
    });
  });
  next();
});
```

#### Database Monitoring
```sql
-- Monitor query performance
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements 
WHERE query LIKE '%content_chunk%' 
ORDER BY total_time DESC;

-- Monitor index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public';
```

### Alerting Setup

#### Critical Alerts
- Service down (health check failures)
- High error rates (>5%)
- Database connection failures
- OpenAI API quota exceeded
- High memory usage (>80%)

#### Warning Alerts
- Slow response times (>2s)
- High CPU usage (>70%)
- Database query timeouts
- Embedding generation failures

## Maintenance Procedures

### Regular Maintenance

#### Daily Tasks
- Monitor health checks
- Review error logs
- Check database performance
- Verify backup status

#### Weekly Tasks
- Review search analytics
- Optimize slow queries
- Update dependencies
- Review security logs

#### Monthly Tasks
- Database maintenance (VACUUM, ANALYZE)
- Performance review
- Security audit
- Capacity planning

### Database Maintenance

#### Index Maintenance
```sql
-- Reindex vector indexes
REINDEX INDEX CONCURRENTLY idx_content_chunk_embedding;
REINDEX INDEX CONCURRENTLY idx_content_item_vector_embedding;

-- Update statistics
ANALYZE content_chunk;
ANALYZE content_item_vector;
ANALYZE content_item_ft;
```

#### Materialized View Refresh
```sql
-- Refresh materialized view
REFRESH MATERIALIZED VIEW CONCURRENTLY content_item_ft;

-- Schedule regular refresh
-- Add to cron job: 0 */6 * * * psql -c "REFRESH MATERIALIZED VIEW CONCURRENTLY content_item_ft;"
```

### Backup and Recovery

#### Database Backups
```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > backup_$DATE.sql
gzip backup_$DATE.sql
aws s3 cp backup_$DATE.sql.gz s3://your-backup-bucket/
```

#### Application Backups
- Code repository backups
- Environment configuration backups
- SSL certificate backups
- Log file archives

### Scaling Procedures

#### Horizontal Scaling
1. **Load Balancer Configuration**
   - Configure health checks
   - Set up session persistence
   - Configure SSL termination

2. **Auto-scaling Setup**
   - CPU-based scaling (70% threshold)
   - Memory-based scaling (80% threshold)
   - Custom metrics scaling

#### Vertical Scaling
1. **Resource Monitoring**
   - CPU usage patterns
   - Memory consumption
   - Database connection usage

2. **Scaling Decisions**
   - Increase instance size
   - Add more instances
   - Optimize application code

## Troubleshooting

### Common Production Issues

#### High Memory Usage
```bash
# Check memory usage
free -h
ps aux --sort=-%mem | head

# Node.js memory debugging
node --inspect dist/server.js
```

#### Database Connection Issues
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check connection limits
SHOW max_connections;

-- Monitor slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC;
```

#### OpenAI API Issues
```bash
# Check API quota
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/usage

# Monitor rate limits
# Check response headers for rate limit info
```

### Performance Optimization

#### Database Optimization
```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM content_chunk 
WHERE embedding <#> '[0.1,0.2,...]'::vector 
ORDER BY embedding <#> '[0.1,0.2,...]'::vector 
LIMIT 10;

-- Optimize indexes
CREATE INDEX CONCURRENTLY idx_content_chunk_embedding_optimized 
ON content_chunk USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 200);
```

#### Application Optimization
```typescript
// Connection pooling
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Caching
import NodeCache from 'node-cache';
const cache = new NodeCache({ stdTTL: 600 });
```

## Disaster Recovery

### Backup Strategy
- **Database**: Daily automated backups
- **Code**: Git repository with multiple remotes
- **Configuration**: Version-controlled config files
- **Secrets**: Encrypted secret storage

### Recovery Procedures
1. **Service Recovery**
   - Restore from backup
   - Update DNS records
   - Verify service health

2. **Data Recovery**
   - Restore database from backup
   - Rebuild search indexes
   - Verify data integrity

3. **Full System Recovery**
   - Provision new infrastructure
   - Deploy application
   - Restore data
   - Update monitoring

### Business Continuity
- **RTO**: Recovery Time Objective (4 hours)
- **RPO**: Recovery Point Objective (24 hours)
- **Backup Retention**: 30 days
- **Testing**: Quarterly disaster recovery tests


