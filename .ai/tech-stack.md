# Tech Stack - Fakturologia MVP

## 1. Przegląd stosu technologicznego

Aplikacja Fakturologia wykorzystuje nowoczesny stack technologiczny łączący sprawdzone rozwiązania frontend i backend, z naciskiem na naukę i rozwijanie umiejętności backendowych.

### Podsumowanie technologii

| Warstwa              | Technologia           | Uzasadnienie                                                   |
| -------------------- | --------------------- | -------------------------------------------------------------- |
| **Frontend**         | Angular 21            | Dojrzały framework, Standalone Components, Reactive Forms      |
| **State Management** | Angular Signals       | Nowoczesne zarządzanie stanem, dobra integracja z formularzami |
| **UI Components**    | Angular Material      | Gotowe komponenty, Material Design, dostępność                 |
| **Backend**          | NestJS                | Modułowa architektura, TypeScript, nauka wzorców backendowych  |
| **Baza danych**      | Supabase (PostgreSQL) | Managed DB, Row Level Security, REST API                       |
| **Autentykacja**     | Supabase Auth         | Email/password, JWT, gotowe flow                               |
| **Storage**          | Supabase Storage      | Przechowywanie logo firm                                       |
| **PDF**              | pdfmake               | Client-side rendering, definicja JSON                          |
| **Hosting**          | Digital Ocean         | VPS, Docker, pełna kontrola                                    |
| **CI/CD**            | GitHub Actions        | Automatyzacja deploymentu                                      |
| **Konteneryzacja**   | Docker                | Spójne środowisko, przenośność                                 |

---

## 2. Architektura systemu

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│                     Angular 21 + Material                    │
│                   (Standalone Components)                    │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/REST
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│                         NestJS                               │
│           (Walidacja, Logika biznesowa, API)                │
└─────────────────────────┬───────────────────────────────────┘
                          │ Supabase Client SDK
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                       SUPABASE                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │   Auth   │  │ PostgreSQL│  │ Storage  │  │   RLS    │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Frontend

### 3.1 Angular 21

**Wybór:** Angular 21 z Standalone Components

**Uzasadnienie:**

- Dojrzały ekosystem z bogatą dokumentacją
- Silne typowanie TypeScript out-of-the-box
- Dependency Injection ułatwiający testowanie
- Standalone Components upraszczają architekturę (brak NgModules)
- Reactive Forms idealne dla złożonych formularzy faktur

**Kluczowe cechy wykorzystane w projekcie:**

- `Reactive Forms` - walidacja i dynamiczne pola pozycji faktury
- `Angular Signals` - reaktywne obliczenia (netto → VAT → brutto)
- `HttpClient` - komunikacja z NestJS API
- `Router` - nawigacja między widokami
- `Guards` - ochrona tras wymagających autoryzacji

### 3.2 Angular Material

**Wybór:** Angular Material

**Uzasadnienie:**

- Oficjalna biblioteka UI od zespołu Angular
- Gotowe komponenty zgodne z Material Design
- Wbudowana dostępność (a11y)
- Spójny wygląd bez konieczności projektowania od zera

**Komponenty kluczowe dla MVP:**

- `mat-form-field`, `mat-input` - formularze
- `mat-table` - lista faktur
- `mat-autocomplete` - wybór kontrahenta
- `mat-select` - wybór stawki VAT
- `mat-datepicker` - daty faktur
- `mat-button`, `mat-icon` - akcje

### 3.3 Zarządzanie stanem

**Wybór:** Angular Signals (wbudowane)

**Uzasadnienie:**

- Natywne rozwiązanie Angular 21 (brak zewnętrznych zależności)
- Doskonałe dla reaktywnych obliczeń w formularzach
- Prostsze niż NgRx dla skali MVP
- Automatyczne śledzenie zależności

**Przykład użycia w formularzu faktury:**

```typescript
// Reaktywne obliczenia pozycji faktury
nettoAmount = signal(0);
vatRate = signal(23);
bruttoAmount = computed(() => this.nettoAmount() * (1 + this.vatRate() / 100));
```

---

## 4. Backend

### 4.1 NestJS

**Wybór:** NestJS jako warstwa API

**Uzasadnienie:**

- Modułowa architektura inspirowana Angularem
- Natywne wsparcie TypeScript
- Bogaty ekosystem (walidacja, transformacja, dokumentacja)
- Wzorce enterprise (DI, Guards, Interceptors, Pipes)
- **Wartość edukacyjna:** nauka wzorców backendowych, architektury warstwowej

**Struktura modułów:**

```
src/
├── auth/           # Obsługa autentykacji (proxy do Supabase)
├── users/          # Profil użytkownika, dane firmy
├── contractors/    # CRUD kontrahentów
├── invoices/       # CRUD faktur, logika numeracji
├── common/         # Pipes, Guards, Interceptory
└── main.ts
```

**Odpowiedzialności NestJS:**

1. **Walidacja danych wejściowych** - class-validator, DTOs
2. **Logika biznesowa** - numeracja faktur, obliczenia, walidacja NIP
3. **Transformacja danych** - class-transformer
4. **Autoryzacja** - sprawdzanie JWT z Supabase
5. **Komunikacja z Supabase** - Supabase JS Client

### 4.2 Dlaczego NestJS + Supabase (a nie tylko Supabase)?

| Aspekt           | Tylko Supabase          | NestJS + Supabase                   |
| ---------------- | ----------------------- | ----------------------------------- |
| Walidacja        | RLS + CHECK constraints | Pełna walidacja w kodzie TypeScript |
| Logika biznesowa | Edge Functions (Deno)   | Controllers + Services              |
| Testowanie       | Ograniczone             | Pełne unit/integration testy        |
| Nauka            | Backend-as-a-Service    | Wzorce backendowe (DI, warstwy)     |
| Debugging        | Logi Supabase           | Pełna kontrola, lokalne debugowanie |
| Elastyczność     | Vendor lock-in          | Łatwa migracja DB w przyszłości     |

> [!NOTE]
> Dla MVP sam Supabase byłby wystarczający. Wybór NestJS jest świadomą decyzją edukacyjną - nauka architektury backendowej w praktyce.

---

## 5. Baza danych i usługi

### 5.1 Supabase

**Wykorzystane usługi:**

| Usługa         | Zastosowanie                                              |
| -------------- | --------------------------------------------------------- |
| **PostgreSQL** | Przechowywanie danych (użytkownicy, kontrahenci, faktury) |
| **Auth**       | Rejestracja, logowanie, reset hasła, JWT                  |
| **Storage**    | Przechowywanie logo firm (buckety)                        |
| **RLS**        | Izolacja danych użytkowników na poziomie DB               |

### 5.2 Schemat bazy danych (uproszczony)

```sql
-- Profil użytkownika (rozszerzenie auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  company_name TEXT,
  company_address TEXT,
  nip VARCHAR(10),
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kontrahenci
CREATE TABLE contractors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  nip VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Faktury
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  contractor_id UUID REFERENCES contractors(id),
  invoice_number VARCHAR(50) NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft', -- draft, issued, paid
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pozycje faktury
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  vat_rate INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.3 Row Level Security (RLS)

```sql
-- Polityki RLS - użytkownik widzi tylko swoje dane
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access own contractors"
ON contractors FOR ALL
USING (auth.uid() = user_id);

-- Analogiczne polityki dla invoices, invoice_items, user_profiles
```

---

## 6. Generowanie PDF

### 6.1 pdfmake (client-side)

**Wybór:** pdfmake

**Uzasadnienie:**

- Generowanie PDF w przeglądarce (bez obciążania serwera)
- Definicja dokumentu jako JSON
- Wsparcie dla polskich znaków (UTF-8)
- Brak zależności serwerowych (headless Chrome)

**Ograniczenia:**

- Ograniczona stylizacja (brak CSS)
- Większe bundle size frontendu

**Alternatywa na przyszłość:**

- Puppeteer/Playwright na serwerze (większa elastyczność szablonów)

---

## 7. Infrastruktura i deployment

### 7.1 Docker

**Konfiguracja:**

- Multi-stage build dla optymalizacji obrazu
- Osobne obrazy dla development i production
- docker-compose dla lokalnego środowiska

**Struktura:**

```
docker/
├── Dockerfile.nestjs    # Backend
├── Dockerfile.angular   # Frontend (nginx)
└── docker-compose.yml   # Lokalne środowisko
```

### 7.2 Digital Ocean

**Wybór:** Digital Ocean Droplet lub App Platform

**Uzasadnienie:**

- Przystępna cena dla MVP
- Dobra dokumentacja
- Wsparcie dla Docker

**Konfiguracja produkcyjna:**

- Droplet z Docker (min. 1GB RAM)
- Nginx jako reverse proxy
- SSL via Let's Encrypt

### 7.3 GitHub Actions

**Pipeline CI/CD:**

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  test:
    # Uruchomienie testów
  build:
    # Budowanie obrazów Docker
  deploy:
    # Push do Digital Ocean
```

---

## 8. Narzędzia deweloperskie

| Narzędzie             | Zastosowanie                          |
| --------------------- | ------------------------------------- |
| **ESLint + Prettier** | Linting i formatowanie kodu           |
| **Jest**              | Testy jednostkowe (NestJS)            |
| **Jasmine/Karma**     | Testy jednostkowe (Angular)           |
| **Playwright**        | Testy E2E                             |
| **Supabase CLI**      | Lokalne środowisko Supabase, migracje |
| **class-validator**   | Walidacja DTO w NestJS                |
| **class-transformer** | Transformacja obiektów                |

---

## 9. Zależności i wersje

```json
{
  "frontend": {
    "@angular/core": "^21.0.0",
    "@angular/material": "^21.0.0",
    "pdfmake": "^0.2.x"
  },
  "backend": {
    "@nestjs/core": "^11.0.0",
    "@nestjs/common": "^11.0.0",
    "@supabase/supabase-js": "^2.x",
    "class-validator": "^0.14.x",
    "class-transformer": "^0.5.x"
  }
}
```

---

## 10. Potencjalne ryzyka i mitigacje

| Ryzyko                                   | Prawdopodobieństwo | Wpływ  | Mitigacja                               |
| ---------------------------------------- | ------------------ | ------ | --------------------------------------- |
| Złożoność konfiguracji NestJS + Supabase | Średnie            | Średni | Przygotowane boilerplate, dokumentacja  |
| Problemy z Docker na produkcji           | Niskie             | Wysoki | Lokalne testowanie, staging environment |
| Wydajność pdfmake dla dużych dokumentów  | Niskie             | Niski  | Limit pozycji na fakturze w MVP         |
| Synchronizacja typów frontend-backend    | Średnie            | Średni | Współdzielone interfejsy TypeScript     |

---

## 11. Decyzje architektoniczne (ADR)

### ADR-001: NestJS jako warstwa pośrednia

**Status:** Zaakceptowane

**Kontekst:** Supabase oferuje bezpośredni dostęp do bazy danych z frontendu przez RLS.

**Decyzja:** Używamy NestJS jako warstwy API między frontendem a Supabase.

**Uzasadnienie:**

- Cel edukacyjny - nauka wzorców backendowych
- Lepsza kontrola nad walidacją i logiką biznesową
- Łatwiejsze testowanie jednostkowe
- Przygotowanie pod przyszłą rozbudowę

**Konsekwencje:**

- Dłuższy czas developmentu
- Więcej kodu do utrzymania
- Lepsze zrozumienie architektury backend

### ADR-002: Client-side PDF generation

**Status:** Zaakceptowane

**Kontekst:** PDF można generować po stronie klienta lub serwera.

**Decyzja:** Używamy pdfmake w przeglądarce.

**Uzasadnienie:**

- Brak obciążenia serwera
- Prostsze wdrożenie dla MVP
- Natychmiastowa responsywność

**Konsekwencje:**

- Większy bundle size frontendu
- Ograniczone możliwości stylizacji

### ADR-003: Rezygnacja z Nx Monorepo

**Status:** Zaakceptowane

**Kontekst:** PRD sugerował Nx Monorepo dla współdzielenia typów.

**Decyzja:** Wykorzystujemy prostszą strukturę z shared packages lub ręcznie synchronizowanymi interfejsami.

**Uzasadnienie:**

- Nx dodaje znaczną złożoność konfiguracji
- Dla 1-2 developerów jest to overkill
- Współdzielenie typów można osiągnąć prościej

**Konsekwencje:**

- Prostsze środowisko deweloperskie
- Wymaga dyscypliny w synchronizacji typów

---

## 12. Kolejność implementacji

1. **Tydzień 1-2:** Setup projektu

   - Konfiguracja Angular + NestJS
   - Konfiguracja Supabase (Auth, DB schema, RLS)
   - Podstawowy pipeline CI/CD

2. **Tydzień 3-4:** Core features

   - Autentykacja (login, rejestracja, reset hasła)
   - Profil użytkownika i dane firmy
   - CRUD kontrahentów

3. **Tydzień 5-6:** Faktury i finalizacja
   - CRUD faktur z pozycjami
   - Generowanie PDF
   - Landing page
   - Deployment produkcyjny
