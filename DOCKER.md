# Docker Deployment Guide

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

The application will be available at **http://localhost:3000**

### Using Docker CLI

```bash
# Build the image
docker build -t claude-explorer .

# Run the container
docker run -d \
  --name claude-explorer \
  -p 3000:3000 \
  -v "/path/to/your/claude-export:/data:ro" \
  -e DATA_PATH=/data \
  claude-explorer

# View logs
docker logs -f claude-explorer

# Stop and remove
docker stop claude-explorer
docker rm claude-explorer
```

## Configuration

### Environment Variables

- `PORT` - Server port (default: 3000)
- `DATA_PATH` - Path to Claude.ai backup data (default: /data)
- `NODE_ENV` - Environment (default: production)

### Volume Mounts

The container expects your Claude.ai backup data to be mounted at `/data`. Update the volume path in `docker-compose.yml`:

```yaml
volumes:
  - /path/to/your/claude-backup:/data:ro
```

**Windows paths:** Use forward slashes or escape backslashes:
- ✅ `C:/Users/username/Documents/Claude.ai Backup:/data:ro`
- ✅ `C:\\Users\\username\\Documents\\Claude.ai Backup:/data:ro`

### Port Configuration

To use a different port, update both the environment variable and port mapping:

```yaml
ports:
  - "8080:3000"  # Host:Container
environment:
  - PORT=3000    # Keep this as 3000 (internal)
```

## Health Checks

The container includes a health check that verifies the API is responding:

```bash
# Check container health
docker ps

# Manual health check
docker exec claude-explorer node -e "require('http').get('http://localhost:3000/api/stats', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
```

## Multi-Architecture Support

The image is based on `node:20-alpine` which supports:
- `linux/amd64` (x86_64)
- `linux/arm64` (ARM64)
- `linux/arm/v7` (ARM32)

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs claude-explorer

# Check if port is already in use
netstat -ano | findstr :3000
```

### Data not loading

Ensure the volume mount path is correct:

```bash
# Exec into container and check
docker exec -it claude-explorer sh
ls -la /data
```

### Permission issues

If running on Linux/Mac, ensure the data directory has proper read permissions:

```bash
chmod -R 755 "/path/to/claude-backup"
```

## Development

### Rebuild after code changes

```bash
# Rebuild and restart
docker-compose up -d --build

# Or with Docker CLI
docker build -t claude-explorer .
docker stop claude-explorer
docker rm claude-explorer
docker run -d --name claude-explorer -p 3000:3000 -v "/path/to/your/claude-export:/data:ro" claude-explorer
```

### Access container shell

```bash
docker exec -it claude-explorer sh
```

## Production Deployment

### Using Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml claude-explorer

# Check services
docker service ls
docker service logs claude-explorer_claude-explorer
```

### Using Kubernetes

See `k8s/` directory for Kubernetes manifests (coming soon).

## Image Size

The multi-stage build produces a lean production image:
- Builder stage: ~1GB (includes dev dependencies)
- Final image: ~200MB (production dependencies only)

## Security

- Data volume mounted as **read-only** (`:ro`) for safety
- Non-root user execution (Alpine default)
- Minimal attack surface (Alpine Linux)
- Health checks for monitoring
- No sensitive data in image layers

## Updates

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up -d --build
```
