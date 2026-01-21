# Fakturologia

Aplikacja do wystawiania faktur VAT dla freelancerów i mikroprzedsiębiorców.

## Struktura projektu

- `apps/frontend` - Frontend (Angular 21 + Material + Signals)
- `apps/backend` - Backend (NestJS 11 + Supabase)
- `packages/shared` - Współdzielone typy i interfejsy

## Wymagania

- Node.js (v20+)
- Docker (opcjonalnie)
- Supabase CLI (`npm install -g supabase`)

## Uruchomienie lokalne

### 1. Supabase (autentykacja i baza danych)

Uruchom lokalny Supabase:

```bash
supabase start
```

Po uruchomieniu zapisz dane z `supabase status -o env`:

- `ANON_KEY` - klucz publiczny
- `SERVICE_ROLE_KEY` - klucz administratora
- `JWT_SECRET` - sekret do weryfikacji tokenów

### 2. Konfiguracja środowiska

**Frontend:**

Skopiuj przykładowy plik konfiguracji:

```bash
cp apps/frontend/src/environments/environment.example.ts apps/frontend/src/environments/environment.ts
```

Uzupełnij wartości z `supabase status`:

```typescript
export const environment = {
  production: false,
  apiUrl: "http://localhost:3000",
  supabaseUrl: "http://127.0.0.1:54321",
  supabaseKey: "your-anon-key-from-supabase-status",
};
```

**Backend:**

Plik `.env` w `apps/backend/` powinien zawierać:

```bash
NODE_ENV=development
PORT=3000

SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

ALLOWED_ORIGINS=http://localhost:4200
```

### 3. Instalacja zależności

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

### 4. Start aplikacji

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

## Testy

### Stos testowy

- Frontend – testy jednostkowe i komponentów: Vitest + Angular Testing Library (środowisko: Happy DOM/JSDOM)
- Backend – testy jednostkowe: Jest
- E2E – testy end‑to‑end: Playwright (Chromium/WebKit/Firefox)

### Uruchamianie testów

- Frontend (Vitest):

```bash
cd apps/frontend
npx vitest
```

- Backend (Jest):

```bash
cd apps/backend
npm test
```

- E2E (Playwright):

```bash
cd apps/frontend
npx playwright test
```

## Bezpieczeństwo

⚠️ **WAŻNE:** Pliki zawierające sekrety są ignorowane przez git:

- `apps/backend/.env`
- `apps/frontend/src/environments/environment.ts`

Nigdy nie commituj tych plików. Używaj plików `.example` jako szablonów.
