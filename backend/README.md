# Password Hunter Backend - Java Spring Boot API

A Java Spring Boot REST API that powers the Password Hunter application, providing password analysis and simulation history management.

## Prerequisites

- Java 17+
- Maven 3.8+
- MongoDB 5+
- Redis 6+

## Setup

### 1. Build the Project

```bash
cd backend
mvn clean install
```

### 2. Configure Environment

Edit `src/main/resources/application.yml` if needed:
- MongoDB URI (default: `mongodb://localhost:27017/password-hunter`)
- Redis host/port (default: `localhost:6379`)
- Server port (default: `8080`)

### 3. Start MongoDB and Redis

```bash
# macOS with Homebrew
brew services start mongodb-community
brew services start redis
```

### 4. Run the Application

```bash
mvn spring-boot:run
```

Or build and run:

```bash
mvn package
java -jar target/password-hunter-backend-1.0.0.jar
```

The API will be available at `http://localhost:8080`

## API Endpoints

### Password Analysis
**POST** `/api/analysis`

Request:
```json
{
  "password": "MyP@ssw0rd123"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "score": 85,
    "label": "Very Strong",
    "entropy": 65.5,
    "charsetSize": 94,
    "crackTimeDisplay": "2.5 hours",
    "charDiversity": {
      "hasLower": true,
      "hasUpper": true,
      "hasDigit": true,
      "hasSymbol": true
    },
    "weaknesses": [],
    "suggestions": ["Consider using a passphrase"],
    "difficultyLevel": "Extreme"
  }
}
```

### History - Get
**GET** `/api/history?page=1&limit=20&search=&difficulty=`

Query Parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 50)
- `search`: Search in masked passwords
- `difficulty`: Filter by difficulty level

Response:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "...",
        "target": "MyP@ssw0rd",
        "maskedTarget": "My*****...",
        "totalAttempts": 12000000,
        "timeTakenMs": 14000,
        "modeUsed": "alphanumeric",
        "difficultyLabel": "Hard",
        "difficultyScore": 65.2,
        "entropy": 53.3,
        "dateTime": "2024-05-16T10:30:00"
      }
    ],
    "total": 42,
    "page": 1,
    "limit": 20
  }
}
```

### History - Save
**POST** `/api/history`

Request:
```json
{
  "target": "MyP@ssw0rd",
  "maskedTarget": "My*****...",
  "totalAttempts": 12000000,
  "timeTakenMs": 14000,
  "modeUsed": "alphanumeric",
  "difficultyLabel": "Hard",
  "difficultyScore": 65.2,
  "estimatedCrackTime": "2.5 hours",
  "charLength": 10,
  "charsetSize": 94,
  "entropy": 53.3
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "...",
    "target": "MyP@ssw0rd",
    "maskedTarget": "My*****...",
    "totalAttempts": 12000000,
    "timeTakenMs": 14000,
    "modeUsed": "alphanumeric",
    "difficultyLabel": "Hard",
    "difficultyScore": 65.2,
    "entropy": 53.3,
    "dateTime": "2024-05-16T10:30:00"
  }
}
```

## CORS Configuration

The backend is configured to accept requests from:
- `http://localhost:3000` (Next.js frontend)
- `http://localhost:8081` (Android development)

## Environment Variables (Optional)

Create a `.env` file in the backend directory:

```
SPRING_DATA_MONGODB_URI=mongodb://localhost:27017/password-hunter
SPRING_REDIS_HOST=localhost
SPRING_REDIS_PORT=6379
SERVER_PORT=8080
```

## Docker Deployment

Build Docker image:

```bash
docker build -t password-hunter-backend .
```

Run container:

```bash
docker run -p 8080:8080 \
  -e SPRING_DATA_MONGODB_URI=mongodb://host.docker.internal:27017/password-hunter \
  -e SPRING_REDIS_HOST=host.docker.internal \
  password-hunter-backend
```
