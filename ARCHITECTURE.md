# Password Hunter - Complete Architecture Guide

A modern full-stack application for password strength analysis with:
- **Next.js Browser PWA** (frontend)
- **Java Spring Boot REST API** (backend)
- **Native Android App** (mobile client)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Password Hunter                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │  Browser (PWA)   │         │  Android App     │          │
│  │  - Next.js 14    │         │  - Kotlin        │          │
│  │  - React 18      │         │  - Jetpack       │          │
│  │  - Tailwind CSS  │         │  - Compose       │          │
│  └────────┬─────────┘         └────────┬─────────┘          │
│           │                           │                     │
│           └──────────────┬────────────┘                     │
│                          │                                  │
│              ┌───────────▼──────────┐                       │
│              │  Java Spring Boot    │                       │
│              │  REST API (Port 8080)│                       │
│              │  - Spring Boot 3.2   │                       │
│              │  - Spring Data MongoDB
│              │  - Spring Data Redis │                       │
│              └───────────┬──────────┘                       │
│                          │                                  │
│        ┌─────────────────┼─────────────────┐               │
│        │                 │                 │               │
│    ┌───▼───┐         ┌──▼─────┐      ┌───▼──┐            │
│    │MongoDB│         │  Redis │      │ Auth │            │
│    │ (Data)│         │(Cache) │      │ (JWT)│            │
│    └───────┘         └────────┘      └──────┘            │
│                                                           │
└────────────────────────────────────────────────────────┘
```

## Project Structure

```
password-hunter/
├── app/                          # Next.js Frontend (PWA)
│   ├── api/                      # ⚠️ Deprecated - see README
│   ├── components/               # React components
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Utilities
│   ├── stores/                   # Zustand state management
│   ├── types/                    # TypeScript types
│   ├── page.tsx                  # Main page
│   └── layout.tsx                # Root layout
│
├── backend/                      # Java Spring Boot API
│   ├── src/main/java/com/passwordhunter/
│   │   ├── controller/           # REST endpoints
│   │   ├── service/              # Business logic
│   │   ├── repository/           # Data access
│   │   ├── model/                # Domain models
│   │   ├── dto/                  # Data transfer objects
│   │   └── PasswordHunterApplication.java
│   ├── src/main/resources/
│   │   └── application.yml       # Spring Boot config
│   ├── pom.xml                   # Maven dependencies
│   ├── Dockerfile                # Container image
│   └── README.md                 # Backend setup
│
├── android/                      # Android Mobile App
│   ├── app/
│   │   ├── src/main/java/com/passwordhunter/mobile/
│   │   │   ├── network/          # API client (Retrofit)
│   │   │   ├── ui/               # Jetpack Compose screens
│   │   │   ├── viewmodel/        # MVVM ViewModels
│   │   │   └── MainActivity.kt
│   │   ├── build.gradle.kts
│   │   └── src/main/AndroidManifest.xml
│   ├── build.gradle.kts
│   ├── settings.gradle.kts
│   └── README.md                 # Android setup
│
├── package.json                  # Frontend dependencies
├── tsconfig.json                 # TypeScript config
├── tailwind.config.ts            # Tailwind CSS
├── next.config.js                # Next.js config
└── README.md                     # This file
```

## Quick Start

### 1. Start MongoDB & Redis

**macOS (Homebrew):**
```bash
brew install mongodb-community redis
brew services start mongodb-community
brew services start redis
```

**Linux (Docker):**
```bash
docker run -d -p 27017:27017 mongo:latest
docker run -d -p 6379:6379 redis:latest
```

### 2. Start Java Backend

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

Backend API: `http://localhost:8080`

### 3. Start Next.js Frontend

```bash
# Create .env.local (optional, defaults to localhost:8080)
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8080" > .env.local

npm install
npm run dev
```

Frontend: `http://localhost:3000`

### 4. Build Android App (Optional)

```bash
cd android
./gradlew build
./gradlew installDebug  # Install to emulator/device
```

## API Endpoints

### Password Analysis
**POST** `/api/analysis`
```bash
curl -X POST http://localhost:8080/api/analysis \
  -H "Content-Type: application/json" \
  -d '{"password": "MyP@ssw0rd123"}'
```

### History Management
**GET** `/api/history?page=1&limit=20&search=&difficulty=`
```bash
curl http://localhost:8080/api/history?page=1&limit=20
```

**POST** `/api/history`
```bash
curl -X POST http://localhost:8080/api/history \
  -H "Content-Type: application/json" \
  -d '{...history data...}'
```

**DELETE** `/api/history/{id}` or `/api/history/all`

See `backend/README.md` for detailed API documentation.

## Environment Configuration

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

### Backend (backend/src/main/resources/application.yml)
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

### Android (app/src/main/java/com/passwordhunter/mobile/network/RetrofitClient.kt)
```kotlin
private const val BASE_URL = "http://10.0.2.2:8080/"  // For emulator
private const val BASE_URL = "http://192.168.x.x:8080/"  // For physical device
```

## Production Deployment

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongodb_data:/data/db

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      SPRING_DATA_MONGODB_URI: mongodb://root:password@mongodb:27017/password-hunter
      SPRING_REDIS_HOST: redis
      SERVER_PORT: 8080
    depends_on:
      - mongodb
      - redis

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_BASE_URL: http://backend:8080
    depends_on:
      - backend

volumes:
  mongodb_data:
```

**Start stack:**
```bash
docker-compose up -d
```

### Kubernetes Deployment

Create manifests for:
- MongoDB StatefulSet
- Redis Deployment
- Spring Boot Backend Deployment
- Next.js Frontend Deployment

See individual `README.md` files in each directory for K8s examples.

### Cloud Deployment

#### AWS
```bash
# Backend: AWS Elastic Beanstalk
eb create password-hunter-api --instance-type t3.micro

# Frontend: AWS Amplify
amplify init
amplify publish

# Database: AWS DocumentDB + ElastiCache
```

#### Google Cloud
```bash
# Backend: Cloud Run
gcloud run deploy password-hunter --source .

# Frontend: Cloud Static Sites or App Engine
gcloud app deploy

# Database: Firestore + Cloud Memorystore
```

## Feature Fixes Implemented

### ✅ Simulation Time Display
- **Before**: Variable time based on speed (7s-28s)
- **After**: Always displays exactly **14.00s**
- **Location**: `hooks/useSimulation.ts`

### ✅ Simulation Attempts Display  
- **Before**: Variable attempts based on password length
- **After**: Always displays exactly **12.0M attempts**
- **Location**: `hooks/useSimulation.ts`

### ✅ API Migration
- **Before**: Next.js API routes at `/api/*`
- **After**: Java REST API at `http://localhost:8080/api/*`
- **Benefits**: 
  - Unified backend for web and mobile
  - Better performance and scalability
  - Language-agnostic frontend

### ✅ PWA Install
- **Web**: Still uses browser PWA installation (no changes)
- **Mobile**: Native Android app (separate)
- **Install Button**: Only appears in web app (as required)

## Development Workflow

### Frontend Development
```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm run lint             # Run ESLint
npm run type-check       # Check TypeScript
```

### Backend Development
```bash
mvn spring-boot:run      # Run locally
mvn test                 # Run unit tests
mvn package              # Build JAR
```

### Android Development
```bash
./gradlew build          # Build debug APK
./gradlew installDebug   # Install to emulator
./gradlew connectedAndroidTest  # Run tests
```

## Database Schema

### MongoDB Collections

**history** collection:
```javascript
{
  _id: ObjectId,
  target: String,
  maskedTarget: String,
  totalAttempts: Long,
  timeTakenMs: Long,
  modeUsed: String,
  difficultyLabel: String,
  difficultyScore: Double,
  estimatedCrackTime: String,
  charLength: Int,
  charsetSize: Int,
  entropy: Double,
  userId: String,
  dateTime: ISODate
}
```

## Troubleshooting

### Frontend can't reach backend
```bash
# Check backend is running
curl http://localhost:8080/api/history

# Check frontend env var
grep NEXT_PUBLIC_API_BASE_URL .env.local

# For Android emulator, use 10.0.2.2 instead of localhost
```

### MongoDB connection error
```bash
# Check if MongoDB is running
brew services list  # macOS
mongo --version     # Check if installed

# Start MongoDB
brew services start mongodb-community
```

### Redis connection error
```bash
# Check if Redis is running
brew services list
redis-cli ping      # Should respond with PONG
```

### Port already in use
```bash
# Find process using port 8080 (backend)
lsof -i :8080
kill -9 <PID>

# Find process using port 3000 (frontend)
lsof -i :3000
```

## Testing

### Backend API Testing
```bash
# Using curl
curl -X POST http://localhost:8080/api/analysis \
  -H "Content-Type: application/json" \
  -d '{"password": "Test@123"}'

# Using REST Client (VS Code extension)
# See backend/README.md for examples
```

### Frontend Testing
```bash
npm run test             # Jest unit tests
npm run e2e              # Playwright E2E tests
```

### Android Testing
```bash
./gradlew test           # Unit tests
./gradlew connectedAndroidTest  # Instrumented tests
```

## Performance Optimization

### Frontend
- ✅ Lazy loading with Next.js dynamic imports
- ✅ Image optimization
- ✅ Redis caching on backend
- ✅ PWA offline support

### Backend
- ✅ Connection pooling (HikariCP)
- ✅ Query optimization with MongoDB indexes
- ✅ Response caching with Redis
- ✅ Async processing with Spring WebFlux (optional)

### Android
- ✅ Retrofit connection pooling
- ✅ Coroutine-based async operations
- ✅ Room database for local caching
- ✅ Image caching with OkHttp

## Security Notes

⚠️ **Important for Production:**

1. **HTTPS/TLS**: Enable SSL certificates
2. **Authentication**: Implement JWT or OAuth 2.0
3. **CORS**: Restrict to known origins
4. **Rate Limiting**: Implement with Spring Security
5. **Secrets Management**: Use environment variables, not hardcoded
6. **Database**: Enable authentication, use strong passwords
7. **API Keys**: Protect sensitive endpoints

See `backend/README.md` for security configuration examples.

## License

MIT License - See LICENSE file

## Support

- Frontend Issues: See `README.md` in root directory
- Backend Issues: See `backend/README.md`
- Android Issues: See `android/README.md`

## Contributors

Built with ❤️ using:
- Next.js & React
- Java Spring Boot
- Kotlin & Jetpack Compose
- MongoDB & Redis
