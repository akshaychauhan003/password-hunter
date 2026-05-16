# Deprecated Next.js API Routes

⚠️ **These routes are deprecated and should not be used.**

All API functionality has been migrated to the Java Spring Boot backend. The frontend now calls `http://localhost:8080/api/*` endpoints instead of these Next.js routes.

## Previous Routes (No Longer Used)

- `POST /api/analysis` → `POST http://localhost:8080/api/analysis`
- `GET /api/history` → `GET http://localhost:8080/api/history`
- `POST /api/history` → `POST http://localhost:8080/api/history`
- `DELETE /api/history/:id` → `DELETE http://localhost:8080/api/history/:id`
- `DELETE /api/history/all` → `DELETE http://localhost:8080/api/history/all`

## To Remove These Routes

Delete the following directories to clean up:
- `app/api/analysis/`
- `app/api/history/`
- `app/api/auth/` (if using authentication)

## Backend Setup

The Java backend provides the same API contract. Start it with:

```bash
cd backend
mvn spring-boot:run
```

See `backend/README.md` for full setup instructions.
