# Analiza Scenariuszy Wdrożeniowych - Fakturologia

## 1. Analiza głównego frameworka

Głównym frameworkiem determinującym wybór hostingu dla Twojej aplikacji jest **NestJS (Node.js)** współpracujący z **Angular 21**. Model operacyjny to architektura rozproszona (Decoupled Architecture). Aplikacja wymaga środowiska zdolnego do:

- Uruchamiania kontenerów Node.js (dla NestJS), najlepiej z obsługą auto-skalowania (od 0 do N), aby zoptymalizować koszty MVP.
- Serwowania plików statycznych (dla frontendowego SPA w Angularze) przez globalną sieć CDN.
- Bezpiecznej komunikacji z warstwą danych w **Supabase** (PostgreSQL) poprzez tokeny JWT i protokół HTTPS.
  W tym modelu **konteneryzacja (Docker)** jest kluczowa, gdyż zapewnia pełną kontrolę nad środowiskiem backendowym i ułatwia ewentualną migrację między dostawcami w przyszłości.

## 2. Rekomendowane usługi hostingowe

- **Google Cloud Platform (GCP) - Cloud Run**: Jako twórca Angulara, Google oferuje Cloud Run – w pełni zarządzaną platformę bezserwerową do uruchamiania kontenerów. Idealna dla NestJS ze względu na model "pay-as-you-go" i skalowanie do zera.
- **Firebase App Hosting**: Rozwiązanie od Google dedykowane nowoczesnym frameworkom (w tym Angularowi), które automatyzuje wdrażanie frontendu i integruje się z usługami GCP dla backendu w jednym ekosystemie.
- **Supabase Cloud**: Oficjalna platforma twórców Supabase. Zapewnia zarządzaną bazę PostgreSQL, Auth i Storage. To tutaj powinny znajdować się Twoje dane, aby w pełni wykorzystać potencjał Row Level Security (RLS) i uniknąć opóźnień sieciowych.

## 3. Alternatywne platformy

- **Railway.app**: Nowoczesna platforma PaaS, która natywnie wspiera Docker. Pozwala na błyskawiczne wdrożenie NestJS bezpośrednio z repozytorium GitHub przy minimalnej konfiguracji.
- **Vercel**: Choć zoptymalizowany pod Next.js, oferuje świetne wsparcie dla Angulara i NestJS (wdrażanego jako funkcje bezserwerowe). Jego główną zaletą jest bezkonkurencyjne DX (Preview Deployments).

## 4. Krytyka rozwiązań

### GCP / Firebase

- **Słabości:** Bardzo duża złożoność konfiguracji (IAM, VPC, regionalizacja).
- **Wdrażanie:** Wymaga znajomości narzędzi CLI i często potoku CI/CD.
- **Środowiska:** Przejrzyste (projekty separujące strefy), ale czasochłonne w setupie.
- **Plany:** Darmowy limit jest hojny, ale "Blaze Plan" (PAYG) może generować niespodziewane koszty przy błędach w kodzie.

### Supabase Cloud

- **Słabości:** Uzależnienie od jednego dostawcy danych (vendor lock-in dla Auth/RLS).
- **Plany:** Plan Pro ($25/mo) jest dobrym punktem startu, ale dodatkowe opłaty za egress i storage mogą zaskoczyć.

### Railway.app

- **Słabości:** Brak całkowicie darmowego planu (Hobby kosztuje $5/mo).
- **Wdrażanie:** Ekstremalnie proste, ale mniej zaawansowane opcje sieciowe niż u gigantów.

### Vercel

- **Słabości:** Bardzo restrykcyjne warunki planu darmowego dla projektów komercyjnych (wymuszone przejście na Pro $20/msc/user).

## 5. Oceny platform

| Platforma          |   Ocena   | Uzasadnienie                                                               |
| :----------------- | :-------: | :------------------------------------------------------------------------- |
| **Supabase Cloud** | **10/10** | Bezpośrednia rekomendacja dla warstwy danych i auth.                       |
| **Railway.app**    | **9/10**  | Najlepszy stosunek prostoty do możliwości dla hostingu NestJS/Docker.      |
| **GCP / Firebase** | **8/10**  | Potężna platforma, która "urośnie" ze startupem, ale trudna na starcie.    |
| **Vercel**         | **7/10**  | Świetne dla frontendu, ale model serverless dla NestJS może być wyzwaniem. |
| **Digital Ocean**  | **6/10**  | Pełna kontrola, ale zbyt duży narzut administracyjny dla małego startupu.  |
