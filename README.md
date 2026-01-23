# Fakturologia

Profesjonalna platforma do zarządzania fakturami VAT, dedykowana dla freelancerów oraz sektora MŚP. System zapewniający pełną automatyzację procesu wystawiania faktur.

## Project Architecture

Projekt bazuje na nowoczesnym stacku technologicznym:

- **Frontend (`apps/frontend`):** Angular 21, Angular Material.
- **Backend (`apps/backend`):** NestJS 11, Supabase (Auth, Database, Storage).

---

## Prerequisites

Aby uruchomić projekt lokalnie, wymagane są następujące narzędzia:

- **Node.js:** v22.x (LTS recommended)
- **Supabase CLI:** `npm install -g supabase`
- **Docker Desktop:** Wymagany do uruchomienia lokalnej instancji Supabase.

---

## Local Development Setup

### 1. Supabase Initialization

Uruchom lokalny stos usług (Database, Auth, API, S3 Storage):

```bash
# Start local Supabase containers
supabase start
```

Po pomyślnym uruchomieniu, wykonaj komendę `supabase status -o env`, aby pobrać klucze konfiguracyjne. Będą one niezbędne do konfiguracji plików środowiskowych.

### 2. Environment Configuration

Każda aplikacja wymaga dedykowanego pliku konfiguracyjnego.

#### Backend (`apps/backend/.env`)

Utwórz plik `.env` w folderze `apps/backend/` na podstawie poniższego schematu:

```env
NODE_ENV=development
PORT=3000

# Connection strings from 'supabase status'
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# CORS Security Settings
ALLOWED_ORIGINS=http://localhost:4200
```

#### Frontend (`apps/frontend/src/environments/environment.ts`)

Skopiuj szablon i uzupełnij wartości:

```bash
cp apps/frontend/src/environments/environment.example.ts apps/frontend/src/environments/environment.ts
```

Upewnij się, że plik zawiera poprawne endpointy:

```typescript
export const environment = {
  production: false,
  apiUrl: "http://localhost:3000",
  supabaseUrl: "http://127.0.0.1:54321",
  supabaseKey: "your-anon-key-from-supabase",
};
```

---

## Installation & Execution

Zainstaluj wszystkie zależności z poziomu głównego katalogu:

```bash
npm install
```

### Running the Services

Uruchom backend oraz frontend w trybie deweloperskim:

```bash
# Terminal 1: Backend (Watch mode)
cd apps/backend
npm run start:dev

# Terminal 2: Frontend (Serve)
cd apps/frontend
npm run start
```

---

## Testing Suite

Projekt implementuje rygorystyczne standardy testowania na różnych poziomach:

- **Unit & Component Testing (Frontend):** Vitest + Angular Testing Library (Happy DOM).
  `npm run test -w apps/frontend`
- **Unit Testing (Backend):** Jest.
  `npm run test -w apps/backend`
- **End-to-End (E2E):** Playwright (Chromium/WebKit/Firefox).
  `npm run e2e -w apps/frontend`

---

## Production Deployment

Aplikacja jest w pełni zautomatyzowana w modelu hybrid-cloud na platformie **Google Cloud (GCP)**.

- **Frontend:** Firebase Hosting (CDN) -> [https://fakturologia-app.web.app](https://fakturologia-app.web.app)
- **Backend:** Google Cloud Run (Docker) -> [https://fakturologia-backend-d3h7b2tsda-lm.a.run.app](https://fakturologia-backend-d3h7b2tsda-lm.a.run.app)
- **Dokumentacja API:** [Swagger](https://fakturologia-backend-d3h7b2tsda-lm.a.run.app/api/docs)

### CI/CD Pipeline

Wdrożenie realizowane jest automatycznie przez **GitHub Actions** po każdym **pushu** do brancha `main`:

1. `.github/workflows/deploy-backend.yml` – Build obrazu Docker i rollout na Cloud Run.
2. `.github/workflows/deploy-frontend.yml` – Build produkcyjny Angulara i deploy na Firebase.

### Required GitHub Secrets

Dla poprawnego działania pipeline'u należy skonfigurować następujące sekrety w repozytorium:
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`.

---

## Security Standards

⚠️ **Data Protection:** Pliki `.env` oraz `environment.ts` zawierające wrażliwe dane (Secrets) są wykluczone z kontroli wersji przez `.gitignore`. Nigdy nie commituj tych plików. Używaj wyłącznie rozszerzeń `.example` jako wzorców.

Wszystkie hasła użytkowników są hashowane przez argon2/bcrypt (zarządzane przez Supabase Auth), a dostęp do API jest zabezpieczony tokenami JWT.
