# Docker Configuration Guide

This document explains the Docker setup for the African E-commerce Platform.

## Architecture Overview

The application uses a multi-container Docker architecture:

```
┌─────────────────────────────────────────────────────────┐
│                        Nginx                             │
│              (Reverse Proxy & SSL)                       │
└────────────┬────────────────────────────┬───────────────┘
             │                            │
    ┌────────▼────────┐          ┌───────▼────────┐
    │    Frontend     │          │    Backend     │
    │   (React/Vite)  │          │  (Node/Express)│
    └─────────────────┘          └────────┬───────┘
                                          │
                         ┌────────────────┼────────────────┐
                         │                │                │
                    ┌────▼─────┐    ┌────▼─────┐    ┌────▼─────┐
                    │PostgreSQL│    │  Redis   │    │   S3     │
                    │          │    │ (Cache)  │    │(Storage) │
                    └──────────┘    └──────────┘    └──────────┘
```

## Container Services

### 1. Database (PostgreSQL)

**Image**: `postgis/postgis:15-3.3-alpine`

**Purpose**: Primary data storage with PostGIS extension for geospatial data

**Configuration**:
```yaml
environment:
  POSTGRES_USER: ${DB_USER}
  POSTGRES_PASSWORD: ${DB_PASSWORD}
  POSTGRES_DB: ${DB_NAME}
volumes:
  - postgres_data:/var/lib/postgresql/data
  - ./backups:/backups
ports:
  - "5432:5432" (internal only in production)
```

**Health Check**:
```bash
pg_isready -U ${DB_USER}
```

### 2. Backend (Node.js/Express)

**Build**: Custom Dockerfile (multi-stage build)

**Purpose**: REST API server

**Configuration**:
```yaml
environment:
  NODE_ENV: production
  DATABASE_URL: postgresql://...
  JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET}
  # ... other env vars
volumes:
  - ./backend/logs:/app/logs
  - ./backend/uploads:/app/uploads
```

**Health Check**:
```bash
curl http://localhost:5000/health
```

### 3. Frontend (React/Vite)

**Build**: Custom Dockerfile with Nginx

**Purpose**: Serve static frontend assets

**Configuration**:
```yaml
build:
  args:
    VITE_API_URL: ${VITE_API_URL}
```

**Health Check**:
```bash
wget --quiet --tries=1 --spider http://localhost:80/health
```

### 4. Redis

**Image**: `redis:7-alpine`

**Purpose**: Session storage and caching

**Configuration**:
```yaml
command: redis-server --requirepass ${REDIS_PASSWORD} --maxmemory 256mb
volumes:
  - redis_data:/data
```

**Health Check**:
```bash
redis-cli ping
```

### 5. Nginx (Production Only)

**Image**: `nginx:alpine`

**Purpose**: Reverse proxy, SSL termination, load balancing

**Configuration**:
```yaml
volumes:
  - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
  - ./nginx/ssl:/etc/nginx/ssl:ro
ports:
  - "80:80"
  - "443:443"
```

## Dockerfile Details

### Backend Dockerfile

**Multi-stage build** for optimized image size:

**Stage 1: Builder**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npm run build
```

**Stage 2: Production**
```dockerfile
FROM node:18-alpine
RUN apk add --no-cache dumb-init
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
WORKDIR /app
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
USER nodejs
CMD ["node", "dist/index.js"]
```

**Key Features**:
- Multi-stage build reduces image size
- Non-root user for security
- dumb-init for proper signal handling
- Health check included

### Frontend Dockerfile

**Multi-stage build**:

**Stage 1: Builder**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
```

**Stage 2: Production**
```dockerfile
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
CMD ["nginx", "-g", "daemon off;"]
```

**Key Features**:
- Optimized production build
- Nginx for serving static files
- Custom nginx configuration
- Gzip compression enabled

## Docker Compose Files

### docker-compose.yml (Development)

For local development with hot-reload:

```yaml
services:
  database:
    image: postgres:15-alpine
    ports:
      - "5432:5432"  # Exposed for local access
    
  backend:
    build: ./backend
    volumes:
      - ./backend:/app  # Hot reload
    ports:
      - "5000:5000"
    
  frontend:
    build: ./frontend
    ports:
      - "3000:80"
```

### docker-compose.prod.yml (Production)

For production deployment:

```yaml
services:
  database:
    image: postgis/postgis:15-3.3-alpine
    # No port exposure (internal only)
    restart: always
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
      - frontend
```

**Key Differences**:
- PostGIS extension for geospatial features
- No port exposure for database
- Nginx reverse proxy
- Logging configuration
- Restart policies
- Health checks

## Volume Management

### Named Volumes

```yaml
volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
```

**Purpose**: Persist data across container restarts

**Location**: `/var/lib/docker/volumes/`

### Bind Mounts

```yaml
volumes:
  - ./backend/logs:/app/logs
  - ./backend/uploads:/app/uploads
  - ./backups:/backups
```

**Purpose**: Access files from host system

## Networking

### Default Network

All services communicate via the `app-network` bridge network:

```yaml
networks:
  app-network:
    driver: bridge
```

**Internal DNS**: Services can reach each other by service name:
- `http://backend:5000`
- `postgresql://database:5432`
- `redis://redis:6379`

## Environment Variables

### Loading Order

1. `.env` file (development)
2. `.env.production` file (production)
3. Environment-specific overrides
4. Command-line arguments

### Best Practices

- Never commit `.env` files
- Use `.env.example` as template
- Generate strong secrets
- Use Docker secrets for sensitive data in production

## Common Commands

### Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build

# Execute command in container
docker-compose exec backend npm run db:migrate
```

### Production

```bash
# Start services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Scale backend
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Update services
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# Clean up
docker-compose -f docker-compose.prod.yml down
docker system prune -af
```

## Debugging

### Access Container Shell

```bash
# Backend
docker-compose exec backend sh

# Database
docker-compose exec database psql -U $DB_USER -d $DB_NAME

# Redis
docker-compose exec redis redis-cli
```

### Check Container Logs

```bash
# All logs
docker-compose logs

# Specific service
docker-compose logs backend

# Follow logs
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Inspect Container

```bash
# Container details
docker inspect <container-id>

# Container stats
docker stats

# Container processes
docker top <container-id>
```

## Performance Optimization

### Image Size Optimization

1. **Multi-stage builds**: Separate build and runtime stages
2. **Alpine base images**: Smaller footprint
3. **Layer caching**: Order Dockerfile commands by change frequency
4. **.dockerignore**: Exclude unnecessary files

### Runtime Optimization

1. **Resource limits**:
```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 4G
    reservations:
      cpus: '1'
      memory: 2G
```

2. **Health checks**: Ensure services are ready before routing traffic

3. **Logging**: Configure log rotation to prevent disk fill

## Security Best Practices

### Container Security

1. **Non-root user**: Run processes as non-root
2. **Read-only filesystem**: Where possible
3. **No privileged mode**: Avoid `--privileged`
4. **Scan images**: Use `docker scan` or Trivy
5. **Minimal base images**: Use Alpine or distroless

### Network Security

1. **Internal networks**: Don't expose unnecessary ports
2. **Secrets management**: Use Docker secrets or vault
3. **TLS/SSL**: Encrypt traffic between services

### Example Security Configuration

```yaml
services:
  backend:
    user: nodejs
    read_only: true
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
```

## Monitoring

### Container Metrics

```bash
# Real-time stats
docker stats

# Specific container
docker stats <container-name>

# Export metrics
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

### Health Checks

All services include health checks:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

## Troubleshooting

### Common Issues

**1. Container won't start**
```bash
# Check logs
docker-compose logs <service>

# Check if port is in use
netstat -tulpn | grep <port>
```

**2. Database connection failed**
```bash
# Verify database is running
docker-compose ps database

# Check connection
docker-compose exec backend node -e "require('./dist/config/database').testConnection()"
```

**3. Out of disk space**
```bash
# Check disk usage
docker system df

# Clean up
docker system prune -af --volumes
```

**4. Permission denied**
```bash
# Fix volume permissions
docker-compose exec backend chown -R nodejs:nodejs /app/logs
```

## Backup and Restore

### Backup Volumes

```bash
# Backup database volume
docker run --rm \
  -v african-ecommerce_postgres_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/postgres-backup.tar.gz -C /data .
```

### Restore Volumes

```bash
# Restore database volume
docker run --rm \
  -v african-ecommerce_postgres_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/postgres-backup.tar.gz -C /data
```

## CI/CD Integration

### Build Images

```bash
# Build with tags
docker build -t myregistry/backend:latest -t myregistry/backend:v1.0.0 ./backend

# Push to registry
docker push myregistry/backend:latest
docker push myregistry/backend:v1.0.0
```

### Automated Deployment

See `.github/workflows/ci-cd.yml` for complete CI/CD pipeline.

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [Dockerfile Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
