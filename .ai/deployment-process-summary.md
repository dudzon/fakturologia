# Podsumowanie Wdrożenia Produkcyjnego (GCP + Firebase)

Dla projektu Fakturologia skonfigurowałem profesjonalne, skalowalne i bezpieczne środowisko wdrożeniowe.

## Adresy Produkcyjne

- **Frontend (Aplikacja):** [https://fakturologia-app.web.app](https://fakturologia-app.web.app)
- **Backend (API):** [https://fakturologia-backend-d3h7b2tsda-lm.a.run.app](https://fakturologia-backend-d3h7b2tsda-lm.a.run.app)
- **Dokumentacja API (Swagger):** [https://fakturologia-backend-d3h7b2tsda-lm.a.run.app/api/docs](https://fakturologia-backend-d3h7b2tsda-lm.a.run.app/api/docs)

## Co zostało zrobione

### 1. Ekosystem Google Cloud & Firebase

- **Projekt:** Utworzyłem projekt `fakturologia-app`. Możesz nim zarządzać tutaj:
  - [Konsola Firebase](https://console.firebase.google.com/project/fakturologia-app/overview)
  - [Konsola GCP](https://console.cloud.google.com/home/dashboard?project=fakturologia-app)
- **API:** Włączyłem usługi Cloud Run, Artifact Registry oraz Firebase Hosting.
- **Bezpieczeństwo:** Skonfigurowałem **Workload Identity Federation (WIF)**. Pozwala to GitHubowi na bezpieczne logowanie do GCP bez stałych haseł.

### 2. Optymalizacja Aplikacji

- **Backend (NestJS):** Dodałem [Dockerfile](file:///Users/tdudzinski/my-work/fakturologia/apps/backend/Dockerfile) przystosowany do Cloud Run (nasłuchiwanie na `0.0.0.0`).
- **Frontend (Angular):** Skonfigurowałem [firebase.json](file:///Users/tdudzinski/my-work/fakturologia/apps/frontend/firebase.json) z jawnie wskazanym celem `fakturologia-app`.

### 3. Automatyzacja (GitHub Actions)

- **deploy-backend.yml**: Buduje obraz Docker i wdraża go do Cloud Run (korzystając z sekretów Supabase).
- **deploy-frontend.yml**: Buduje Angulara i wdraża do Firebase Hosting.

## Jak kontynuować?

> [!IMPORTANT]
> **GitHub Secrets:** Aby wdrożenie backendu działało, musisz dodać w ustawieniach repozytorium GitHub (Settings -> Secrets -> Actions) zmienne: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` oraz `SUPABASE_JWT_SECRET`.

### Weryfikacja

Po dodaniu sekretów i zrobieniu `git push`, procesy w zakładce **Actions** powinny zakończyć się sukcesem.

- [x] Środowisko GCP/Firebase skonfigurowane
- [x] Aplikacja zoptymalizowana (Dockerfile, firebase.json)
- [x] Automatyzacja Gotowa
