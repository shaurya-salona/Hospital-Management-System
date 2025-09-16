# ☁️ Cloud Deployment Guide

## 🚀 **Quick Start - Deploy to Cloud**

### **1. AWS Deployment**

#### **Using AWS ECS (Elastic Container Service):**

```bash
# 1. Install AWS CLI
aws --version

# 2. Configure AWS credentials
aws configure

# 3. Create ECS cluster
aws ecs create-cluster --cluster-name hmis-cluster

# 4. Build and push Docker images
docker build -t hmis-backend ./backend
docker build -t hmis-frontend ./frontend
docker tag hmis-backend:latest your-account.dkr.ecr.region.amazonaws.com/hmis-backend:latest
docker tag hmis-frontend:latest your-account.dkr.ecr.region.amazonaws.com/hmis-frontend:latest

# 5. Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account.dkr.ecr.region.amazonaws.com
docker push your-account.dkr.ecr.region.amazonaws.com/hmis-backend:latest
docker push your-account.dkr.ecr.region.amazonaws.com/hmis-frontend:latest
```

#### **Using AWS App Runner:**

```yaml
# apprunner.yaml
version: 1.0
runtime: docker
build:
  commands:
    build:
      - echo "Building HMIS application"
run:
  runtime-version: latest
  command: docker-compose -f docker-compose.production.yml up
  network:
    port: 80
    env: PORT
  env:
    - name: NODE_ENV
      value: production
    - name: DB_HOST
      value: your-rds-endpoint.amazonaws.com
```

### **2. Google Cloud Platform (GCP)**

#### **Using Google Cloud Run:**

```bash
# 1. Install Google Cloud SDK
gcloud --version

# 2. Authenticate
gcloud auth login

# 3. Set project
gcloud config set project your-project-id

# 4. Enable APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# 5. Deploy backend
gcloud run deploy hmis-backend \
  --source ./backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 5000

# 6. Deploy frontend
gcloud run deploy hmis-frontend \
  --source ./frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000
```

### **3. Microsoft Azure**

#### **Using Azure Container Instances:**

```bash
# 1. Install Azure CLI
az --version

# 2. Login
az login

# 3. Create resource group
az group create --name hmis-rg --location eastus

# 4. Create container registry
az acr create --resource-group hmis-rg --name hmisregistry --sku Basic

# 5. Build and push images
az acr build --registry hmisregistry --image hmis-backend ./backend
az acr build --registry hmisregistry --image hmis-frontend ./frontend

# 6. Deploy containers
az container create \
  --resource-group hmis-rg \
  --name hmis-backend \
  --image hmisregistry.azurecr.io/hmis-backend:latest \
  --cpu 1 \
  --memory 1 \
  --ports 5000 \
  --environment-variables NODE_ENV=production
```

### **4. DigitalOcean**

#### **Using DigitalOcean App Platform:**

```yaml
# .do/app.yaml
name: hmis
services:
- name: backend
  source_dir: /backend
  github:
    repo: your-username/hmis
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  http_port: 5000
  envs:
  - key: NODE_ENV
    value: production
  - key: DB_HOST
    value: ${db.DATABASE_HOST}
    type: SECRET

- name: frontend
  source_dir: /frontend
  github:
    repo: your-username/hmis
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  http_port: 3000

databases:
- name: hmis-db
  engine: PG
  version: "13"
```

## 🐳 **Docker Swarm Deployment**

### **Multi-Node Deployment:**

```bash
# 1. Initialize swarm
docker swarm init

# 2. Create overlay network
docker network create --driver overlay hmis-network

# 3. Deploy stack
docker stack deploy -c docker-compose.production.yml hmis

# 4. Check services
docker service ls
docker service ps hmis_backend
```

### **Kubernetes Deployment:**

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: hmis

---
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: hmis-config
  namespace: hmis
data:
  NODE_ENV: "production"
  DB_HOST: "postgres-service"
  DB_PORT: "5432"
  REDIS_HOST: "redis-service"
  REDIS_PORT: "6379"

---
# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: hmis-secrets
  namespace: hmis
type: Opaque
data:
  DB_PASSWORD: <base64-encoded-password>
  JWT_SECRET: <base64-encoded-jwt-secret>

---
# k8s/postgres.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: hmis
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        env:
        - name: POSTGRES_DB
          value: "hmis_db"
        - name: POSTGRES_USER
          value: "postgres"
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: hmis-secrets
              key: DB_PASSWORD
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc

---
# k8s/backend.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: hmis
spec:
  replicas: 3
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
        image: hmis-backend:latest
        ports:
        - containerPort: 5000
        envFrom:
        - configMapRef:
            name: hmis-config
        - secretRef:
            name: hmis-secrets
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 5

---
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: hmis
spec:
  selector:
    app: backend
  ports:
  - port: 5000
    targetPort: 5000
  type: ClusterIP

---
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: hmis-ingress
  namespace: hmis
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - hmis.yourdomain.com
    secretName: hmis-tls
  rules:
  - host: hmis.yourdomain.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend-service
            port:
              number: 5000
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 3000
```

## 🔧 **Environment Configuration**

### **Production Environment Variables:**

```bash
# .env.production
NODE_ENV=production
PORT=5000

# Database
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=hmis_db
DB_USER=postgres
DB_PASSWORD=your-secure-password
DB_SSL=true

# Redis
REDIS_HOST=your-redis-host
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secure-jwt-secret

# CORS
CORS_ORIGIN=https://yourdomain.com

# Logging
LOG_LEVEL=info

# Features
ENABLE_API_DOCS=true
ENABLE_METRICS_ENDPOINT=true

# Monitoring
GRAFANA_PASSWORD=your-grafana-password
```

## 📊 **Monitoring & Logging**

### **CloudWatch (AWS):**

```yaml
# cloudwatch-config.yaml
version: 1
log_groups:
  - log_group_name: /aws/ecs/hmis-backend
    log_stream_name: "{container_id}"
    timestamp_format: "%Y-%m-%d %H:%M:%S"
    multi_line_start_pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}"
```

### **Stackdriver (GCP):**

```javascript
// logging.js
const { Logging } = require('@google-cloud/logging');
const logging = new Logging();

const log = logging.log('hmis-backend');

const metadata = {
  resource: {
    type: 'gce_instance',
    labels: {
      instance_id: process.env.INSTANCE_ID,
      zone: process.env.ZONE,
    },
  },
};

const entry = log.entry(metadata, {
  message: 'HMIS Backend started',
  severity: 'INFO',
  timestamp: new Date(),
});

log.write(entry);
```

## 🔒 **Security Best Practices**

### **1. Container Security:**
- Use non-root users
- Scan images for vulnerabilities
- Keep base images updated
- Use secrets management

### **2. Network Security:**
- Use private networks
- Implement firewall rules
- Enable SSL/TLS
- Use VPN for database access

### **3. Data Security:**
- Encrypt data at rest
- Encrypt data in transit
- Regular backups
- Access controls

## 🚀 **Deployment Scripts**

### **Automated Deployment:**

```bash
#!/bin/bash
# deploy.sh

set -e

echo "🚀 Starting HMIS deployment..."

# Build images
echo "📦 Building Docker images..."
docker-compose -f docker-compose.production.yml build

# Run tests
echo "🧪 Running tests..."
docker-compose -f docker-compose.production.yml run --rm backend npm test

# Deploy to production
echo "☁️ Deploying to production..."
docker-compose -f docker-compose.production.yml up -d

# Health check
echo "🏥 Performing health check..."
sleep 30
curl -f http://localhost/health || exit 1

echo "✅ Deployment completed successfully!"
```

### **Rollback Script:**

```bash
#!/bin/bash
# rollback.sh

echo "🔄 Rolling back deployment..."

# Stop current services
docker-compose -f docker-compose.production.yml down

# Deploy previous version
docker-compose -f docker-compose.production.yml -f docker-compose.previous.yml up -d

echo "✅ Rollback completed!"
```

## 📈 **Scaling**

### **Horizontal Scaling:**

```yaml
# docker-compose.scale.yml
version: '3.8'
services:
  backend:
    deploy:
      replicas: 5
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
        window: 120s
```

### **Load Balancing:**

```nginx
# nginx-load-balancer.conf
upstream backend {
    least_conn;
    server backend1:5000 weight=3;
    server backend2:5000 weight=3;
    server backend3:5000 weight=2;
    keepalive 32;
}

server {
    listen 80;
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 🎯 **Deployment Checklist**

- [ ] **Environment Setup**
  - [ ] Cloud provider account configured
  - [ ] Container registry set up
  - [ ] Environment variables configured
  - [ ] Secrets management in place

- [ ] **Database Setup**
  - [ ] PostgreSQL instance created
  - [ ] Database schema deployed
  - [ ] Backup strategy configured
  - [ ] Connection pooling configured

- [ ] **Security**
  - [ ] SSL certificates installed
  - [ ] Firewall rules configured
  - [ ] Secrets encrypted
  - [ ] Access controls in place

- [ ] **Monitoring**
  - [ ] Health checks configured
  - [ ] Logging set up
  - [ ] Metrics collection enabled
  - [ ] Alerting configured

- [ ] **Testing**
  - [ ] Load testing completed
  - [ ] Security testing done
  - [ ] Backup/restore tested
  - [ ] Rollback procedure tested

Your HMIS is now ready for cloud deployment! ☁️🚀


