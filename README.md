# Fullstack Todo App

Simple Todo app with:

- Frontend: React + Vite
- Backend: FastAPI
- Database: PostgreSQL
- Auth: JWT login/register
- Docker + Docker Compose

## Run with Docker

```bash
docker compose up --build
```

Then open:

- Frontend: http://localhost:3000
- Backend API docs: http://localhost:8000/docs

## Default flow

1. Register a user from the frontend.
2. Login with the same email/password.
3. Create, update, complete, and delete todos.

## Services

- `frontend`: React app served by Nginx
- `backend`: FastAPI app
- `db`: PostgreSQL database
