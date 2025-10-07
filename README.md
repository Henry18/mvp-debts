# Deudas App (Frontend + Backend)

Aplicación para gestionar deudas entre amigos.  
Monorepo con dos proyectos:

- **backend/** – API GraphQL (Node/Nest) + Redis (Docker)
- **frontend/** – Angular (Material + Apollo)

## Requisitos

- Node 18+ y npm 9+
- Docker y Docker Compose
- (Opcional) Postman/Insomnia o GraphQL Playground

## TL;DR – Arranque rápido

```bash
# 1) Levantar Redis con Docker
docker compose -f infra/docker-compose.redis.yml up -d

# 2) Backend
cd backend
npm install
npm start

# 3) Frontend
cd ../frontend
npm install
npm start
```
