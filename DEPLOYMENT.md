# Deployment Guide - Password Hunter

Complete guide for deploying Password Hunter to production environments.

## Table of Contents

1. [Local Development](#local-development)
2. [Docker Deployment](#docker-deployment)
3. [Cloud Deployment](#cloud-deployment)
4. [Kubernetes Deployment](#kubernetes-deployment)
5. [Monitoring & Logging](#monitoring--logging)
6. [Rollback & Recovery](#rollback--recovery)

## Local Development

### Prerequisites

- Node.js 18+
- Java 17+
- MongoDB 5+
- Redis 6+
- Android Studio (for mobile)

### Setup

1. **Clone and Install**
   ```bash
   git clone https://github.com/yourusername/password-hunter.git
   cd password-hunter
   npm install
   ```

2. **Database Setup**
   ```bash
   # macOS
   brew install mongodb-community redis
   brew services start mongodb-community
   brew services start redis
   ```

3. **Backend Start**
   ```bash
   cd backend
   mvn spring-boot:run
   # Backend runs on http://localhost:8080
   ```

4. **Frontend Start** (new terminal)
   ```bash
   npm run dev
   # Frontend runs on http://localhost:3000
   ```

5. **Android (Optional)** (Android Studio)
   ```bash
   cd android
   # Open in Android Studio and run on emulator/device
   ```

## Docker Deployment

### Single Container (Backend)

**Build Backend Image:**
```bash
cd backend
docker build -t password-hunter-backend:latest .
```

**Run Backend:**
```bash
docker run -d \
  --name password-hunter-backend \
  -p 8080:8080 \
  -e SPRING_DATA_MONGODB_URI=mongodb://mongo:27017/password-hunter \
  -e SPRING_REDIS_HOST=redis \
  --link mongodb \
  --link redis \
  password-hunter-backend:latest
```

### Docker Compose (Full Stack)

**Create `docker-compose.yml`:**

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7-alpine
    container_name: ph-mongodb
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: secure_password_here
    volumes:
      - mongodb_data:/data/db
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - password-hunter

  redis:
    image: redis:7-alpine
    container_name: ph-redis
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - password-hunter

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: ph-backend
    ports:
      - "8080:8080"
    environment:
      SPRING_DATA_MONGODB_URI: mongodb://admin:secure_password_here@mongodb:27017/password-hunter?authSource=admin
      SPRING_REDIS_HOST: redis
      SPRING_REDIS_PORT: 6379
      SERVER_PORT: 8080
      SPRING_PROFILES_ACTIVE: production
    depends_on:
      mongodb:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - password-hunter
    restart: unless-stopped

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
      args:
        - NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
    container_name: ph-frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_BASE_URL: http://backend:8080
    depends_on:
      - backend
    networks:
      - password-hunter
    restart: unless-stopped

networks:
  password-hunter:
    driver: bridge

volumes:
  mongodb_data:
    driver: local
  redis_data:
    driver: local
```

**Deploy:**
```bash
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop everything
docker-compose down
```

### Frontend Dockerfile

**Create `Dockerfile.frontend`:**

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY . .
RUN npm run build

# Runtime stage
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
```

## Cloud Deployment

### AWS Deployment

#### Using Elastic Beanstalk (Backend)

```bash
# Install EB CLI
brew install awsebcli

# Initialize
eb init -p "Java 17 running on 64bit Amazon Linux 2" password-hunter-backend

# Create environment
eb create password-hunter-prod --instance-type t3.small --envvars \
  SPRING_DATA_MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/password-hunter,\
  SPRING_REDIS_HOST=redis-host.amazonaws.com

# Deploy
eb deploy
```

#### Using Amplify (Frontend)

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize
amplify init

# Add hosting
amplify add hosting

# Publish
amplify publish
```

#### Using RDS/DocumentDB for Database

```bash
# Create MongoDB Atlas cluster
# https://www.mongodb.com/cloud/atlas

# Create ElastiCache Redis cluster
# https://aws.amazon.com/elasticache/

# Update environment variables in Elastic Beanstalk
eb setenv \
  SPRING_DATA_MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/password-hunter" \
  SPRING_REDIS_HOST="redis-cluster.abc123.ng.0001.use1.cache.amazonaws.com"
```

### Google Cloud Deployment

#### Using Cloud Run (Backend)

```bash
# Build image
gcloud builds submit --tag gcr.io/PROJECT-ID/password-hunter-backend ./backend

# Deploy
gcloud run deploy password-hunter-backend \
  --image gcr.io/PROJECT-ID/password-hunter-backend \
  --platform managed \
  --region us-central1 \
  --set-env-vars SPRING_DATA_MONGODB_URI="mongodb+srv://..." \
  --memory 512Mi \
  --cpu 1
```

#### Using Cloud Static Sites (Frontend)

```bash
# Build
npm run build

# Deploy
gsutil -m cp -r .next/static gs://your-bucket/
gsutil -m cp -r public gs://your-bucket/
```

#### Using Firestore & Memorystore

```bash
# Create Firestore database
gcloud firestore databases create --region=us-central1

# Create Memorystore instance
gcloud redis instances create password-hunter-cache \
  --size=2 \
  --region=us-central1
```

### Azure Deployment

```bash
# Create resource group
az group create --name password-hunter --location eastus

# Deploy backend (App Service)
az appservice plan create --name password-hunter-plan \
  --resource-group password-hunter --sku B2

az webapp create --resource-group password-hunter \
  --plan password-hunter-plan \
  --name password-hunter-api \
  --deployment-container-image-name password-hunter-backend:latest

# Deploy frontend
az staticwebapp create --name password-hunter-web \
  --resource-group password-hunter \
  --source https://github.com/yourusername/password-hunter \
  --branch main
```

## Kubernetes Deployment

### Prerequisites

- kubectl installed
- Kubernetes cluster (EKS, GKE, AKS, or local)
- Docker images pushed to registry

### Manifests

**namespace.yaml**
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: password-hunter
```

**mongodb-statefulset.yaml**
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mongodb
  namespace: password-hunter
spec:
  serviceName: mongodb
  replicas: 1
  selector:
    matchLabels:
      app: mongodb
  template:
    metadata:
      labels:
        app: mongodb
    spec:
      containers:
      - name: mongodb
        image: mongo:7-alpine
        ports:
        - containerPort: 27017
        volumeMounts:
        - name: mongodb-storage
          mountPath: /data/db
        env:
        - name: MONGO_INITDB_ROOT_USERNAME
          valueFrom:
            secretKeyRef:
              name: mongodb-secret
              key: username
        - name: MONGO_INITDB_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mongodb-secret
              key: password
  volumeClaimTemplates:
  - metadata:
      name: mongodb-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 10Gi
```

**redis-deployment.yaml**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: password-hunter
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "500m"
```

**backend-deployment.yaml**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: password-hunter
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: gcr.io/PROJECT-ID/password-hunter-backend:latest
        ports:
        - containerPort: 8080
        env:
        - name: SPRING_DATA_MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: backend-secret
              key: mongodb-uri
        - name: SPRING_REDIS_HOST
          value: redis
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /actuator/health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: password-hunter
spec:
  selector:
    app: backend
  ports:
  - port: 8080
    targetPort: 8080
  type: ClusterIP
```

**frontend-deployment.yaml**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: password-hunter
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: gcr.io/PROJECT-ID/password-hunter-frontend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NEXT_PUBLIC_API_BASE_URL
          value: http://backend:8080
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: frontend
  namespace: password-hunter
spec:
  selector:
    app: frontend
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

**Deploy to Kubernetes:**
```bash
# Create namespace
kubectl apply -f namespace.yaml

# Create secrets
kubectl create secret generic mongodb-secret \
  --from-literal=username=admin \
  --from-literal=password=secure_password \
  -n password-hunter

# Deploy
kubectl apply -f mongodb-statefulset.yaml
kubectl apply -f redis-deployment.yaml
kubectl apply -f backend-deployment.yaml
kubectl apply -f frontend-deployment.yaml

# Check deployment
kubectl get pods -n password-hunter
kubectl get svc -n password-hunter

# Port forward (for testing)
kubectl port-forward -n password-hunter svc/frontend 3000:80
```

## Monitoring & Logging

### Backend Monitoring

```java
// Add Spring Actuator
// pom.xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>

// application.yml
management:
  endpoints:
    web:
      exposure:
        include: health,metrics,prometheus
  metrics:
    export:
      prometheus:
        enabled: true
```

### Prometheus Metrics

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'password-hunter'
    static_configs:
      - targets: ['localhost:8080']
    metrics_path: '/actuator/prometheus'
```

### Grafana Dashboard

Access Grafana at `http://localhost:3000` after adding Prometheus data source.

### Logging

```bash
# View backend logs
docker-compose logs -f backend

# View frontend logs
docker-compose logs -f frontend

# Stream logs from Kubernetes
kubectl logs -f deployment/backend -n password-hunter
```

## Rollback & Recovery

### Docker Rollback

```bash
# Check image history
docker image history password-hunter-backend:latest

# Rollback to previous version
docker run -d --name backend-rollback \
  password-hunter-backend:v1.0.0 ...

# Remove failed version
docker rmi password-hunter-backend:v1.0.1
```

### Kubernetes Rollback

```bash
# Check rollout history
kubectl rollout history deployment/backend -n password-hunter

# Rollback to previous version
kubectl rollout undo deployment/backend -n password-hunter

# Rollback to specific revision
kubectl rollout undo deployment/backend --to-revision=2 -n password-hunter
```

### Database Backup

```bash
# MongoDB backup
mongodump --uri="mongodb://admin:pass@localhost:27017/password-hunter" \
  --out=./backup

# MongoDB restore
mongorestore --uri="mongodb://admin:pass@localhost:27017" \
  ./backup

# Redis backup
redis-cli BGSAVE
# Backup is in /var/lib/redis/dump.rdb
```

## Health Checks

### Backend Health Check

```bash
curl http://localhost:8080/actuator/health

# Response
{
  "status": "UP",
  "components": {
    "db": {"status": "UP"},
    "redis": {"status": "UP"}
  }
}
```

### Frontend Health Check

```bash
curl http://localhost:3000

# Should return HTML with 200 OK
```

## Scaling

### Horizontal Scaling (Multiple Instances)

```yaml
# docker-compose.yml
backend:
  deploy:
    replicas: 3
    resources:
      limits:
        cpus: '0.5'
        memory: 512M
      reservations:
        cpus: '0.25'
        memory: 256M
```

### Vertical Scaling (Larger Instances)

Increase CPU/Memory limits in Kubernetes or cloud provider configuration.

## Performance Tuning

### Backend Optimization

```yaml
# application.yml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
```

### Frontend Optimization

```javascript
// next.config.js
module.exports = {
  compress: true,
  poweredByHeader: false,
  swcMinify: true,
  images: {
    minimumCacheTTL: 60,
  }
}
```

## Troubleshooting Production Issues

### Backend not responding

```bash
# Check container logs
docker logs password-hunter-backend

# Check MongoDB connection
mongosh mongodb://admin:pass@localhost:27017/password-hunter

# Check Redis connection
redis-cli ping
```

### High memory usage

```bash
# Monitor memory
docker stats password-hunter-backend

# Set memory limits
docker update --memory 1g password-hunter-backend
```

### Database timeouts

```bash
# Increase connection pool
SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE=30

# Increase query timeout
SPRING_JPA_PROPERTIES_HIBERNATE_JDBC_FETCH_SIZE=100
```

---

For more details, see individual README files in each component directory.
