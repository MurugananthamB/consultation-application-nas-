# Consultation App - Docker Deployment Guide

## 🐳 Docker Setup and Deployment

This guide provides instructions for building and running the Consultation App using Docker.

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 2GB RAM available
- Ports 443 and 5000 available

## 🚀 Quick Start

### Option 1: Using Docker Compose (Recommended)

```bash
# Build and start the application
docker-compose up --build

# Run in background
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

### Option 2: Using Docker directly

```bash
# Build the image
docker build -t consultation-app .

# Run the container
docker run -d \
  --name consultation-app \
  -p 443:443 \
  -p 5000:5000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  consultation-app
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory with your configuration:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/consultation
# or for external database
# MONGODB_URI=mongodb://username:password@host:port/database

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=24h

# Cloudinary Configuration (for file uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Server Configuration
PORT=5000
NODE_ENV=production

# Email Configuration (if using email features)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### SSL Certificates

The Dockerfile automatically generates self-signed SSL certificates for HTTPS. For production, you should:

1. **Replace with real certificates:**
   ```bash
   # Copy your certificates to the container
   docker cp your-cert.pem consultation-app:/app/certs/localhost.pem
   docker cp your-key.pem consultation-app:/app/certs/localhost-key.pem
   ```

2. **Or mount certificates as volumes:**
   ```yaml
   volumes:
     - ./certs:/app/certs
   ```

## 📊 Health Monitoring

The container includes health checks:

```bash
# Check container health
docker ps

# View health check logs
docker inspect consultation-app | grep -A 10 Health
```

## 🔍 Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   # Check what's using the ports
   netstat -tulpn | grep :443
   netstat -tulpn | grep :5000
   
   # Kill the process or change ports in docker-compose.yml
   ```

2. **Permission issues:**
   ```bash
   # Fix permissions for mounted volumes
   sudo chown -R 1001:1001 ./data ./logs
   ```

3. **Build failures:**
   ```bash
   # Clean build
   docker-compose down
   docker system prune -f
   docker-compose up --build
   ```

### Logs and Debugging

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs consultation-app

# Follow logs in real-time
docker-compose logs -f

# Access container shell
docker exec -it consultation-app sh
```

## 🏗️ Development

### Development Mode

For development, you can override the Dockerfile:

```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  consultation-app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    volumes:
      - ./backend:/app/backend
      - ./frontend:/app/frontend
    environment:
      - NODE_ENV=development
```

### Hot Reload

```bash
# Run with development configuration
docker-compose -f docker-compose.dev.yml up
```

## 🔒 Security Considerations

1. **Non-root user:** The container runs as a non-root user (nodejs)
2. **Alpine Linux:** Uses lightweight Alpine Linux for smaller attack surface
3. **SSL/TLS:** HTTPS enabled by default
4. **Health checks:** Built-in health monitoring
5. **Resource limits:** Consider adding resource constraints in production

### Production Security Checklist

- [ ] Replace self-signed certificates with real SSL certificates
- [ ] Use secrets management for sensitive data
- [ ] Set up proper firewall rules
- [ ] Configure resource limits
- [ ] Set up monitoring and alerting
- [ ] Regular security updates

## 📈 Performance Optimization

### Resource Limits

Add to `docker-compose.yml`:

```yaml
services:
  consultation-app:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
```

### Caching

The Dockerfile is optimized for layer caching:
- Dependencies are installed before copying source code
- Multi-stage builds reduce final image size
- `.dockerignore` excludes unnecessary files

## 🚀 Production Deployment

### Using Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml consultation
```

### Using Kubernetes

```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/
```

## 📝 Maintenance

### Updates

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose up --build -d
```

### Backup

```bash
# Backup data volume
docker run --rm -v consultation-app_data:/data -v $(pwd):/backup alpine tar czf /backup/backup.tar.gz /data
```

## 📞 Support

For issues related to Docker deployment:

1. Check the logs: `docker-compose logs`
2. Verify configuration: `docker-compose config`
3. Test connectivity: `curl -k https://localhost`
4. Check container health: `docker ps`

## 🔗 Useful Commands

```bash
# View running containers
docker ps

# View container resources
docker stats

# Access container shell
docker exec -it consultation-app sh

# View container logs
docker logs consultation-app

# Restart container
docker-compose restart

# Scale services (if multiple instances)
docker-compose up --scale consultation-app=3
```
