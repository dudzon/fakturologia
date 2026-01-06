Oto zaktualizowany i poprawiony plan testów dla projektu **Fakturologia**. Zgodnie z Twoją dyspozycją, strategia testowania frontendu została oparta na środowisku **Vitest**, co jest nowoczesnym i wydajnym wyborem dla ekosystemu Angular 21, zapewniającym szybkość i natywne wsparcie dla ESM.

---

# Plan Testów - Projekt Fakturologia (Aktualizacja: Vitest)

## 1. Wprowadzenie i cele testowania

Celem planu jest zapewnienie najwyższej jakości aplikacji do fakturowania. Kluczowym wyzwaniem jest zapewnienie integralności danych finansowych w architekturze rozproszonej (Angular ↔ NestJS ↔ Supabase). Wybór **Vitest** dla frontendu ma na celu przyspieszenie cyklu deweloperskiego (feedback loop) oraz zapewnienie spójności składniowej z testami backendowymi (Jest).

**Główne cele:**

- **Poprawność fiskalna:** Gwarancja bezbłędnych obliczeń netto/brutto/VAT.
- **Bezpieczeństwo danych:** Weryfikacja izolacji danych (RLS) i autoryzacji JWT.
- **Szybkość regresji:** Wykorzystanie Vitest do błyskawicznego uruchamiania testów jednostkowych i komponentów.
- **Zgodność PDF:** Weryfikacja dokumentów wyjściowych z polskimi przepisami.

## 2. Zakres testów

### 2.1. W zakresie (In-Scope):

- **Logika biznesowa (Frontend):** Obliczenia oparte na _Angular Signals_, walidacja formularzy reaktywnych.
- **Warstwa API (Backend):** Kontrolery NestJS, transformacja DTO, integracja z Supabase SDK.
- **Baza danych:** Polityki Row Level Security (RLS) w PostgreSQL.
- **Generowanie PDF:** Poprawność JSON definicji w _pdfmake_ i wynikowy render.
- **Integracja:** Flow od logowania, przez wystawienie faktury, do zapisu w Storage.

### 2.2. Poza zakresem (Out-of-Scope):

- Wydajność infrastruktury Digital Ocean pod ekstremalnym obciążeniem.
- Kompleksowe testy penetracyjne infrastruktury Supabase (odpowiedzialność dostawcy).

## 3. Typy testów do przeprowadzenia

1.  **Testy Jednostkowe i Komponentów - Frontend (Vitest + Angular Testing Library):**
    - Testowanie logiki _Signals_ w izolacji.
    - Testowanie komponentów standalone (interakcje użytkownika, stan UI) bez konieczności uruchamiania przeglądarki (wykorzystanie JSDOM/Happy-DOM).
2.  **Testy Jednostkowe - Backend (Jest):**
    - Walidacja logiki numeracji faktur i serwisów biznesowych NestJS.
3.  **Testy Integracyjne:**
    - Weryfikacja kontraktu API między Angularem a NestJS.
    - Testy polityk RLS bezpośrednio na bazie danych (Supabase).
4.  **Testy End-to-End (Playwright):**
    - Pełne scenariusze użytkownika w rzeczywistych przeglądarkach.
5.  **Testy Smoke:**
    - Szybka weryfikacja po deploymentu na Digital Ocean (czy aplikacja "wstaje").

## 4. Scenariusze testowe dla kluczowych funkcjonalności

| ID        | Moduł            | Scenariusz                                            | Narzędzie  | Oczekiwany rezultat                                                                       |
| :-------- | :--------------- | :---------------------------------------------------- | :--------- | :---------------------------------------------------------------------------------------- |
| **ST-01** | **Signals/Calc** | Zmiana stawki VAT z 23% na 8% dla pozycji.            | Vitest     | Brutto przelicza się natychmiastowo bez przeładowania komponentu.                         |
| **ST-02** | **Invoice**      | Wystawienie faktury z datą wsteczną.                  | Vitest     | Walidator przepuszcza datę, ale system nadaje poprawny numer w sekwencji.                 |
| **ST-03** | **Security**     | Próba edycji kontrahenta przez nieautoryzowany token. | Jest       | Serwer NestJS zwraca 401 Unauthorized lub Supabase RLS blokuje zapis.                     |
| **ST-04** | **PDF**          | Generowanie dokumentu z logo firmy.                   | Playwright | PDF zawiera obraz pobrany z Supabase Storage; brak błędów 404 w konsoli.                  |
| **ST-05** | **UX**           | Responsywność tabeli faktur na urządzeniu 375px.      | Playwright | Tabela Material Design adaptuje się do szerokości (paski przewijania lub ukryte kolumny). |

## 5. Środowisko testowe

- **Lokalne:** Node.js, Docker Desktop (do konteneryzacji NestJS i Angulara), Supabase CLI.
- **CI/CD:** GitHub Actions uruchamiające runnera Vitest (frontend) i Jest (backend) przy każdym pushu.
- **Staging:** Środowisko na Digital Ocean odizolowane od bazy produkcyjnej.

## 6. Narzędzia do testowania

- **Vitest:** Główny runner testów dla frontendu Angular (zastępuje Karma/Jasmine).
- **Angular Testing Library:** Wsparcie dla testowania komponentów z perspektywy użytkownika.
- **Jest:** Testy jednostkowe dla NestJS.
- **Playwright:** Automatyzacja E2E i testy wizualne.
- **JSDOM / Happy-dom:** Środowisko uruchomieniowe dla testów Vitest (brak potrzeby ciężkiej przeglądarki).
- **Postman:** Manualna weryfikacja endpointów API.

## 7. Harmonogram testów

1.  **Tydzień 1:** Konfiguracja Vitest w Angular 21, konfiguracja Jest w NestJS, setup GitHub Actions.
2.  **Tydzień 2-3:** Testy jednostkowe logiki finansowej i walidatorów (Vitest/Jest).
3.  **Tydzień 4:** Implementacja testów integracyjnych RLS i komunikacji API.
4.  **Tydzień 5-6:** Scenariusze E2E w Playwright i testy akceptacyjne (UAT).

## 8. Kryteria akceptacji testów

- Wszystkie testy w **Vitest** i **Jest** muszą przechodzić (0 błędów).
- Pokrycie kodu (Code Coverage) dla krytycznej logiki obliczeniowej: **100%**.
- Poprawna walidacja NIP (zgodność z algorytmem weryfikacyjnym).
- Brak błędów typu "Mixed Content" lub CORS przy komunikacji z Supabase.

## 9. Role i odpowiedzialności

- **Inżynier QA:** Konfiguracja frameworków testowych, pisanie testów E2E (Playwright), nadzór nad procesem raportowania.
- **Frontend Developer:** Pisanie testów jednostkowych i komponentów w **Vitest**, dbanie o reaktywność UI.
- **Backend Developer:** Pisanie testów jednostkowych w **Jest**, weryfikacja polityk RLS w bazie PostgreSQL.
- **DevOps:** Integracja testów z pipeline'em CI/CD (GitHub Actions).

## 10. Procedury raportowania błędów

- Każdy błąd wykryty przez automatyzację (CI) automatycznie blokuje Merge Request.
- Błędy manualne zgłaszane są w **GitHub Issues**.
- **Krytyczność:**
  - _Blocker:_ Błędy w obliczeniach faktur, wyciek danych między użytkownikami (RLS fail).
  - _Major:_ Błąd w generowaniu PDF, niedziałająca autentykacja.
  - _Minor:_ Literówki w UI, drobne przesunięcia w Angular Material.

---

**Uwaga techniczna dotycząca Vitest:**
Wybór Vitest pozwala na współdzielenie konfiguracji transformacji TypeScript między backendem a frontendem, co przy architekturze opartej na NestJS i Angularze znacznie redukuje dług technologiczny w obszarze narzędzi deweloperskich.
