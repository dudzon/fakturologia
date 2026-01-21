# Podsumowanie Wdrożenia Produkcyjnego (GCP + Firebase)

Dla projektu Fakturologia skonfigurowałem profesjonalne, skalowalne i bezpieczne środowisko wdrożeniowe.

## Co zostało zrobione

### 1. Ekosystem Google Cloud & Firebase

- **Projekt:** Utworzyłem projekt `fakturologia-app`.
- **API:** Włączyłem usługi Cloud Run, Artifact Registry oraz Firebase Hosting.
- **Bezpieczeństwo:** Skonfigurowałem **Workload Identity Federation (WIF)**. Dzięki temu GitHub Actions loguje się do GCP bezpiecznie, bez konieczności przechowywania statycznych kluczy (Service Account Keys) w GitHub Secrets.

### 2. Optymalizacja Aplikacji

- **Backend (NestJS):** Dodałem zoptymalizowany, wieloetapowy [Dockerfile](file:///Users/tdudzinski/my-work/fakturologia/apps/backend/Dockerfile) przystosowany do Google Cloud Run.
- **Frontend (Angular):** Skonfigurowałem pliki [firebase.json](file:///Users/tdudzinski/my-work/fakturologia/apps/frontend/firebase.json) oraz [.firebaserc](file:///Users/tdudzinski/my-work/fakturologia/apps/frontend/.firebaserc) dla Firebase Hosting.

### 3. Automatyzacja (GitHub Actions)

Stworzyłem dwa niezależne pipeline'y, które uruchamiają się automatycznie przy wypchnięciu zmian do gałęzi `main`:

1. **[.github/workflows/deploy-backend.yml](file:///Users/tdudzinski/my-work/fakturologia/.github/workflows/deploy-backend.yml)**:
   - Buduje obraz Docker backendu.
   - Wypycha go do Artifact Registry (`europe-central2`).
   - Wdraża nową wersję w usłudze Cloud Run.
2. **[.github/workflows/deploy-frontend.yml](file:///Users/tdudzinski/my-work/fakturologia/.github/workflows/deploy-frontend.yml)**:
   - Buduje aplikację Angular w wersji produkcyjnej.
   - Wdraża pliki statyczne do Firebase Hosting (CDN).

## Jak kontynuować?

> [!TIP]
> **Supabase Secrets:** W usłudze Cloud Run na konsoli GCP będziesz musiał dodać zmienne środowiskowe `SUPABASE_URL` i `SUPABASE_KEY`, aby backend mógł połączyć się z Twoją bazą danych na produkcji.

### Weryfikacja

Gdy zrobisz `git push` swoich zmian, wejdź w zakładkę **Actions** na swoim repozytorium GitHub, aby zobaczyć magię w akcji!

- [x] Środowisko skonfigurowane
- [x] Aplikacja przygotowana
- [x] Automatyzacja gotowa
