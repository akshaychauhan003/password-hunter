# Quick Reference - Password Hunter Setup

## 🚀 Start Everything Locally (5 minutes)

### Option 1: Docker Compose (Recommended)

```bash
# From project root
docker-compose up -d

# Check everything started
docker-compose ps

# Access services
# Frontend: http://localhost:3000
# Backend API: http://localhost:8080
# MongoDB: localhost:27017
# Redis: localhost:6379

# Stop everything
docker-compose down
```

### Option 2: Manual Start (Step by Step)

#### Terminal 1: Start Databases
```bash
# macOS
brew services start mongodb-community
brew services start redis

# Linux (Docker)
docker run -d -p 27017:27017 mongo:latest
docker run -d -p 6379:6379 redis:latest
```

#### Terminal 2: Start Backend
```bash
cd backend
mvn spring-boot:run
# Runs on http://localhost:8080
```

#### Terminal 3: Start Frontend
```bash
npm install  # First time only
npm run dev
# Runs on http://localhost:3000
```

---

## 🔄 Environment Variables

### `.env.local` (Frontend)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

### `backend/src/main/resources/application.yml`
```yaml
spring:
  data:
    mongodb:
      uri: mongodb://localhost:27017/password-hunter
  redis:
    host: localhost
    port: 6379
server:
  port: 8080
```

### Android (`RetrofitClient.kt`)
```kotlin
// Emulator
private const val BASE_URL = "http://10.0.2.2:8080/"

// Physical device (replace with your IP)
private const val BASE_URL = "http://192.168.x.x:8080/"
```

---

## 📱 Build & Run Android

```bash
cd android

# Build
./gradlew build

# Install to emulator/device
./gradlew installDebug

# Or open in Android Studio: Open → android/ → Run
```

---

## 🧪 Test the System

### Test Backend API
```bash
# Password analysis
curl -X POST http://localhost:8080/api/analysis \
  -H "Content-Type: application/json" \
  -d '{"password": "Test@123"}'

# Get history
curl http://localhost:8080/api/history

# Check health
curl http://localhost:8080/actuator/health
```

### Test Frontend
1. Open http://localhost:3000
2. Enter password (e.g., "MyP@ssw0rd")
3. Click "START" button
4. Should see 14.00s timer and 12.0M attempts
5. Check "HISTORY" to see saved results

### Test Android App
1. Build and install APK
2. Open app on emulator/device
3. Enter password
4. Tap "ANALYZE"
5. See analysis results from backend

---

## 🛠️ Common Commands

### Frontend
```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm run lint             # Lint code
npm run type-check       # Check TypeScript
npm test                 # Run tests
npm start                # Start production server
```

### Backend
```bash
cd backend

mvn spring-boot:run      # Run dev server
mvn test                 # Run tests
mvn package              # Build JAR
mvn clean                # Clean artifacts
mvn verify               # Verify build

# Build & run JAR
mvn clean package
java -jar target/password-hunter-backend-1.0.0.jar
```

### Android
```bash
cd android

./gradlew build          # Build APK
./gradlew clean          # Clean build
./gradlew test           # Run unit tests
./gradlew installDebug   # Install debug APK
./gradlew connectedAndroidTest  # Instrumented tests
```

### Docker
```bash
# Build services
docker-compose build

# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Rebuild and restart
docker-compose up -d --build
```

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check port 8080 is free
lsof -i :8080

# Check MongoDB is running
brew services list
mongosh mongodb://localhost:27017

# Check Redis is running
redis-cli ping  # Should respond "PONG"

# View error logs
docker-compose logs backend
```

### Frontend can't reach API
```bash
# Make sure backend is running
curl http://localhost:8080/actuator/health

# Check env variable
cat .env.local  # Should have NEXT_PUBLIC_API_BASE_URL

# Clear cache and rebuild
rm -rf .next
npm run build
```

### Android can't reach API
```bash
# For emulator, use 10.0.2.2 instead of localhost
# In RetrofitClient.kt, set:
private const val BASE_URL = "http://10.0.2.2:8080/"

# For physical device, use your machine's IP
# Find IP: ipconfig getifaddr en0  # macOS
```

### Port already in use
```bash
# Port 3000 (frontend)
lsof -i :3000
kill -9 <PID>

# Port 8080 (backend)
lsof -i :8080
kill -9 <PID>

# Port 27017 (MongoDB)
lsof -i :27017
kill -9 <PID>

# Port 6379 (Redis)
lsof -i :6379
kill -9 <PID>
```

---

## 📊 API Endpoints Summary

```
POST   /api/analysis                    # Analyze password
GET    /api/history                     # Get history
POST   /api/history                     # Save to history
DELETE /api/history/{id}                # Delete entry
DELETE /api/history/all                 # Clear all history
```

---

## 🚀 Deploy to Production

### Docker Compose
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### AWS Elastic Beanstalk
```bash
cd backend
eb init && eb create prod && eb deploy
```

### Google Cloud Run
```bash
gcloud run deploy password-hunter-backend \
  --source ./backend --platform managed --region us-central1
```

### Kubernetes
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/*.yaml
```

---

## 📚 Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System design & architecture
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Detailed deployment guide
- **[backend/README.md](backend/README.md)** - Backend API docs
- **[android/README.md](android/README.md)** - Android app docs
- **[README_NEW.md](README_NEW.md)** - Project overview

---

## ✅ Checklist

Before deploying to production:

- [ ] Verify simulation shows 14.00s and 12.0M attempts
- [ ] Test all three clients (web, Android, API)
- [ ] Configure MongoDB authentication
- [ ] Set secure environment variables
- [ ] Enable HTTPS/TLS
- [ ] Set up monitoring & logging
- [ ] Load test the backend
- [ ] Test database backups
- [ ] Configure rate limiting
- [ ] Document deployment procedure

---

## 💡 Tips

1. **Use Docker Compose** for local development - simplest way
2. **Check logs** with `docker-compose logs -f` when debugging
3. **Clear caches** if you see stale data
4. **Test with curl** before testing in UI
5. **Use emulator** for Android, not always physical device
6. **Keep MongoDB running** - it's required for everything

---

## 🎯 Next Steps

1. Start with Docker Compose: `docker-compose up -d`
2. Visit http://localhost:3000 to test frontend
3. Try Android app build: `cd android && ./gradlew installDebug`
4. Read [DEPLOYMENT.md](DEPLOYMENT.md) for production setup
5. Follow [ARCHITECTURE.md](ARCHITECTURE.md) for system understanding

---

**Everything is ready! You can start right now.** 🚀
