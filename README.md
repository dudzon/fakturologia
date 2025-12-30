# Fakturologia

Aplikacja do wystawiania faktur VAT dla freelancerów i mikroprzedsiębiorców.

## Struktura projektu

- `apps/frontend` - Frontend (Angular 21 + Material + Signals)
- `apps/backend` - Backend (NestJS 11 + Supabase)
- `packages/shared` - Współdzielone typy i interfejsy

## Wymagania

- Node.js (v20+)
- Docker (opcjonalnie)

## Uruchomienie lokalne

### 1. Instalacja zależności

Frontend:

```bash
cd apps/frontend
npm install
```

Backend:

```bash
cd apps/backend
npm install
```

### 2. Baza danych

Uruchom lokalną bazę PostgreSQL:

```bash
docker-compose up -d db
```

### 3. Start aplikacji

Backend (http://localhost:3000):

```bash
cd apps/backend
npm run start:dev
```

Frontend (http://localhost:4200):

```bash
cd apps/frontend
npm start
```
