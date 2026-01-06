# Architektura UI dla Fakturologia MVP

## 1. Przegląd struktury UI

Fakturologia to webowa aplikacja do wystawiania faktur VAT dla freelancerów i mikroprzedsiębiorców. Architektura UI opiera się na następujących założeniach:

### 1.1 Stack technologiczny

- **Angular 21** ze Standalone Components (bez NgModules)
- **Angular Material 21** jako biblioteka komponentów UI
- **Angular Signals** i Signal Stores do zarządzania stanem
- **Reactive Forms** z walidacją
- **pdfmake** w Web Worker do generowania PDF client-side
- **Vitest** do testów jednostkowych

### 1.2 Struktura aplikacji

Aplikacja dzieli się na dwie główne strefy:

- **Strefa publiczna**: Landing page, strony autentykacji (login, rejestracja, reset hasła)
- **Strefa chroniona**: Dashboard faktur, kontrahenci, profil firmy

### 1.3 Podejście responsywne

- Mobile-first z breakpointami Angular CDK
- Desktop (>960px): Stały sidenav po lewej stronie
- Tablet (600-960px): Zwijany sidenav
- Mobile (<600px): Drawer menu otwierany hamburgerem

### 1.4 Kluczowe wzorce

- Lazy loading dla wszystkich feature routes
- Signal Stores dla stanu globalnego (UserStore, ContractorsStore)
- Resource API dla deklaratywnego pobierania danych
- Paginacja serwerowa z parametrami w URL
- Soft delete dla kontrahentów i faktur

---

## 2. Lista widoków

### 2.1 Landing Page

| Właściwość  | Wartość                                                   |
| ----------- | --------------------------------------------------------- |
| **Ścieżka** | `/`                                                       |
| **Cel**     | Konwersja odwiedzających na zarejestrowanych użytkowników |
| **Guard**   | `guestGuard` - przekierowanie zalogowanych do `/invoices` |

**Kluczowe informacje do wyświetlenia:**

- Hero section z głównym CTA
- Korzyści z używania aplikacji (3-4 funkcje)
- Screenshot/mockup aplikacji
- Linki do regulaminu i polityki prywatności

**Kluczowe komponenty:**

- `LandingPageComponent` - główny kontener
- Hero section z przyciskiem "Zarejestruj się za darmo"
- Sekcja features z ikonami Material
- Footer z linkami prawnymi

**UX/Dostępność/Bezpieczeństwo:**

- Duży, kontrastowy przycisk CTA
- Przejrzysty heading hierarchy (h1, h2, h3)
- Skip link do głównej treści
- Lazy loading obrazów

---

### 2.2 Logowanie

| Właściwość  | Wartość                                |
| ----------- | -------------------------------------- |
| **Ścieżka** | `/auth/login`                          |
| **Cel**     | Autentykacja istniejących użytkowników |
| **Guard**   | `guestGuard`                           |

**Kluczowe informacje do wyświetlenia:**

- Formularz email/hasło
- Opcja "Zapamiętaj mnie"
- Link do resetowania hasła
- Link do rejestracji

**Kluczowe komponenty:**

- `LoginComponent`
- `mat-form-field` z walidacją
- `mat-checkbox` dla "Zapamiętaj mnie"
- `LoadingButtonComponent` dla submita

**UX/Dostępność/Bezpieczeństwo:**

- Autofocus na polu email
- Komunikaty błędów inline (mat-error)
- Obsługa błędu `EMAIL_NOT_VERIFIED` z opcją ponownego wysłania
- Rate limiting wizualizowany przy `ACCOUNT_LOCKED`
- Maskowanie hasła z opcją pokazania
- ARIA labels dla wszystkich pól

---

### 2.3 Rejestracja

| Właściwość  | Wartość                             |
| ----------- | ----------------------------------- |
| **Ścieżka** | `/auth/register`                    |
| **Cel**     | Utworzenie nowego konta użytkownika |
| **Guard**   | `guestGuard`                        |

**Kluczowe informacje do wyświetlenia:**

- Formularz email/hasło/potwierdzenie hasła
- Wymagania dotyczące hasła (live checklist)
- Checkbox akceptacji regulaminu
- Link do logowania

**Kluczowe komponenty:**

- `RegisterComponent`
- Password strength indicator
- Checkbox z linkiem do regulaminu (nowe okno)
- `LoadingButtonComponent`

**UX/Dostępność/Bezpieczeństwo:**

- Real-time walidacja siły hasła
- Wizualna checklista wymagań hasła
- Potwierdzenie hasła z walidacją zgodności
- Po sukcesie: komunikat o konieczności weryfikacji email
- Regulamin wymagany do zaakceptowania

---

### 2.4 Zapomniałem hasła

| Właściwość  | Wartość                             |
| ----------- | ----------------------------------- |
| **Ścieżka** | `/auth/forgot-password`             |
| **Cel**     | Inicjacja procesu resetowania hasła |
| **Guard**   | `guestGuard`                        |

**Kluczowe informacje do wyświetlenia:**

- Formularz z polem email
- Komunikat sukcesu (zawsze taki sam dla bezpieczeństwa)
- Link powrotu do logowania

**Kluczowe komponenty:**

- `ForgotPasswordComponent`
- Pojedynczy `mat-form-field` dla email
- `LoadingButtonComponent`

**UX/Dostępność/Bezpieczeństwo:**

- Zawsze wyświetla "Jeśli konto istnieje, link został wysłany" (zapobieganie enumeracji)
- Cooldown na ponowne wysłanie (60s z odliczaniem)
- Autofocus na polu email

---

### 2.5 Reset hasła

| Właściwość  | Wartość                                   |
| ----------- | ----------------------------------------- |
| **Ścieżka** | `/auth/reset-password`                    |
| **Cel**     | Ustawienie nowego hasła z tokena z emaila |
| **Guard**   | `guestGuard`                              |

**Kluczowe informacje do wyświetlenia:**

- Formularz nowe hasło/potwierdzenie
- Wymagania dotyczące hasła
- Komunikat o wygasłym/nieprawidłowym tokenie

**Kluczowe komponenty:**

- `ResetPasswordComponent`
- Password strength indicator
- Walidacja tokena z query params

**UX/Dostępność/Bezpieczeństwo:**

- Walidacja tokena przy wejściu na stronę
- Obsługa `INVALID_TOKEN` z linkiem do ponownego wysłania
- Po sukcesie: automatyczne przekierowanie do logowania

---

### 2.6 Lista faktur (Dashboard)

| Właściwość  | Wartość                                        |
| ----------- | ---------------------------------------------- |
| **Ścieżka** | `/invoices`                                    |
| **Cel**     | Główny widok aplikacji - zarządzanie fakturami |
| **Guard**   | `authGuard`                                    |

**Kluczowe informacje do wyświetlenia:**

- Tabela faktur z kolumnami: numer, kontrahent, data wystawienia, termin płatności, kwota brutto, status
- Filtry: status, zakres dat, wyszukiwanie
- Paginacja
- Przycisk "Nowa faktura"

**Kluczowe komponenty:**

- `InvoiceListComponent`
- `InvoiceFiltersComponent` - panel filtrów nad tabelą
- `mat-table` z sortowaniem i paginacją
- Status badges (kolorowe chipy)
- `EmptyStateComponent` dla pustej listy
- FAB "+" na mobile

**UX/Dostępność/Bezpieczeństwo:**

- Quick filters dla statusów (all, draft, unpaid, paid)
- Parametry filtrów i paginacji w URL (bookmarkowanie)
- Sortowanie po kliknięciu nagłówka kolumny
- Menu kontekstowe per wiersz: Podgląd, Edytuj, Duplikuj, Zmień status, Usuń
- Keyboard navigation w tabeli
- Responsywna tabela → karty na mobile
- Pull-to-refresh na mobile

---

### 2.7 Szczegóły faktury

| Właściwość  | Wartość                                   |
| ----------- | ----------------------------------------- |
| **Ścieżka** | `/invoices/:id`                           |
| **Cel**     | Podgląd read-only faktury z opcjami akcji |
| **Guard**   | `authGuard`                               |

**Kluczowe informacje do wyświetlenia:**

- Pełne dane faktury w layoucie zbliżonym do PDF
- Dane sprzedawcy i nabywcy
- Lista pozycji z cenami
- Podsumowanie: netto, VAT, brutto
- Kwota słownie
- Status faktury
- Daty: wystawienia, sprzedaży, płatności

**Kluczowe komponenty:**

- `InvoiceDetailComponent`
- `InvoicePrintPreviewComponent` - podgląd w formacie A4
- Toolbar z akcjami: Edytuj, Duplikuj, Generuj PDF, Zmień status
- `StatusBadgeComponent`

**UX/Dostępność/Bezpieczeństwo:**

- Przyciski akcji dostosowane do statusu (np. Edytuj tylko dla draft)
- Potwierdzenie przed zmianą statusu na "wystawiona"
- Generowanie PDF z loaderem (Web Worker)
- Ostrzeżenie dla drafts o niekompletnych danych
- Breadcrumb lub przycisk powrotu do listy

---

### 2.8 Formularz faktury (Nowa)

| Właściwość  | Wartość                                                   |
| ----------- | --------------------------------------------------------- |
| **Ścieżka** | `/invoices/new`                                           |
| **Cel**     | Tworzenie nowej faktury                                   |
| **Guard**   | `authGuard`, `profileCompleteGuard`, `canDeactivateGuard` |

**Kluczowe informacje do wyświetlenia:**

- Sekcja: Dane nabywcy (autocomplete kontrahenta lub ręczne)
- Sekcja: Dane faktury (numer, daty)
- Sekcja: Pozycje faktury (dynamiczna tabela)
- Sekcja: Podsumowanie (obliczane automatycznie)
- Sekcja: Uwagi (opcjonalne)
- Przyciski: Zapisz jako szkic, Wystaw fakturę

**Kluczowe komponenty:**

- `InvoiceFormComponent`
- `ContractorSelectComponent` - mat-autocomplete z opcją dodania nowego
- `InvoiceItemsTableComponent` - FormArray z drag&drop
- `InvoiceTotalsComponent` - computed signals
- `mat-datepicker` dla dat
- `LoadingButtonComponent`

**UX/Dostępność/Bezpieczeństwo:**

- Automatyczne pobranie następnego numeru faktury
- Autouzupełnianie danych z wybranego kontrahenta
- Przeliczanie sum przy każdej zmianie pozycji
- Walidacja: min 1 pozycja, wszystkie wymagane pola
- Walidacja dla "Wystaw": kompletność danych sprzedawcy i nabywcy
- Scroll do pierwszego błędu przy submit
- Ostrzeżenie przy opuszczaniu z niezapisanymi zmianami
- Focus management przy dodawaniu nowego wiersza
- Sticky footer z sumami na mobile

---

### 2.9 Formularz faktury (Edycja)

| Właściwość  | Wartość                                  |
| ----------- | ---------------------------------------- |
| **Ścieżka** | `/invoices/:id/edit`                     |
| **Cel**     | Edycja istniejącej faktury (tylko draft) |
| **Guard**   | `authGuard`, `canDeactivateGuard`        |

**Kluczowe informacje do wyświetlenia:**

- Jak w formularzu nowej faktury
- Załadowane istniejące dane faktury

**Kluczowe komponenty:**

- Reużyty `InvoiceFormComponent` z trybem edycji

**UX/Dostępność/Bezpieczeństwo:**

- Edycja dozwolona tylko dla status=draft
- Przy próbie edycji wystawionej faktury → przekierowanie do podglądu z informacją
- Optymistyczne blokowanie: sprawdzenie updatedAt przed zapisem

---

### 2.10 Lista kontrahentów

| Właściwość  | Wartość                       |
| ----------- | ----------------------------- |
| **Ścieżka** | `/contractors`                |
| **Cel**     | Zarządzanie bazą kontrahentów |
| **Guard**   | `authGuard`                   |

**Kluczowe informacje do wyświetlenia:**

- Tabela kontrahentów: nazwa, NIP, adres
- Wyszukiwarka (po nazwie i NIP)
- Paginacja
- Przycisk "Nowy kontrahent"

**Kluczowe komponenty:**

- `ContractorListComponent`
- `mat-table` z sortowaniem
- Wyszukiwarka z debounce
- `EmptyStateComponent`
- Menu kontekstowe: Edytuj, Usuń

**UX/Dostępność/Bezpieczeństwo:**

- Soft delete z potwierdzeniem
- Info o fakturach powiązanych przy usuwaniu
- Server-side search z parametrem w URL

---

### 2.11 Formularz kontrahenta (Nowy)

| Właściwość  | Wartość                           |
| ----------- | --------------------------------- |
| **Ścieżka** | `/contractors/new`                |
| **Cel**     | Dodanie nowego kontrahenta        |
| **Guard**   | `authGuard`, `canDeactivateGuard` |

**Kluczowe informacje do wyświetlenia:**

- Pola: Nazwa (wymagane), NIP (opcjonalne), Adres (ulica, kod, miasto)

**Kluczowe komponenty:**

- `ContractorFormComponent`
- Walidator NIP z komunikatem
- Osobne pola adresowe

**UX/Dostępność/Bezpieczeństwo:**

- Walidacja NIP (format + suma kontrolna)
- Obsługa `NIP_EXISTS` z linkiem do istniejącego kontrahenta
- Normalizacja NIP (usunięcie spacji i myślników)
- Format kodu pocztowego XX-XXX

---

### 2.12 Formularz kontrahenta (Edycja)

| Właściwość  | Wartość                           |
| ----------- | --------------------------------- |
| **Ścieżka** | `/contractors/:id/edit`           |
| **Cel**     | Edycja istniejącego kontrahenta   |
| **Guard**   | `authGuard`, `canDeactivateGuard` |

**Kluczowe komponenty:**

- Reużyty `ContractorFormComponent` z trybem edycji

---

### 2.13 Modal dodawania kontrahenta

| Właściwość  | Wartość                                          |
| ----------- | ------------------------------------------------ |
| **Ścieżka** | Modal (bez dedykowanej ścieżki)                  |
| **Cel**     | Szybkie dodanie kontrahenta z formularza faktury |

**Kluczowe komponenty:**

- `ContractorFormDialogComponent`
- Uproszczony formularz w mat-dialog
- Po zapisie: automatyczne wybranie w formularzu faktury

---

### 2.14 Profil firmy

| Właściwość  | Wartość                              |
| ----------- | ------------------------------------ |
| **Ścieżka** | `/profile`                           |
| **Cel**     | Zarządzanie danymi firmy użytkownika |
| **Guard**   | `authGuard`, `canDeactivateGuard`    |

**Kluczowe informacje do wyświetlenia:**

- Sekcja: Dane firmy (nazwa, NIP, adres)
- Sekcja: Dane bankowe (nazwa banku, IBAN)
- Sekcja: Logo firmy (upload/usunięcie)
- Sekcja: Ustawienia faktur (format numeru, domyślne uwagi)
- Sekcja: RODO (pobierz dane, usuń konto)

**Kluczowe komponenty:**

- `ProfileComponent`
- `LogoUploadComponent` - drag&drop, preview, progress
- Expansion panels lub tabs dla sekcji
- Podgląd przykładowego numeru faktury

**UX/Dostępność/Bezpieczeństwo:**

- Walidacja NIP i IBAN
- Format numeru wymaga placeholder {NNN}
- Upload logo: max 2MB, PNG/JPG
- Potwierdzenie przy usunięciu konta
- Wskaźnik kompletności profilu dla onboardingu

---

### 2.15 Strona 404

| Właściwość  | Wartość                         |
| ----------- | ------------------------------- |
| **Ścieżka** | `/**` (catch-all)               |
| **Cel**     | Obsługa nieistniejących ścieżek |

**Kluczowe komponenty:**

- `NotFoundComponent`
- Przyjazna grafika
- Link do strony głównej (lub `/invoices` dla zalogowanych)

---

## 3. Mapa podróży użytkownika

### 3.1 Onboarding nowego użytkownika

```
Landing Page (/)
    │
    ▼ [Klik: "Zarejestruj się za darmo"]
Rejestracja (/auth/register)
    │
    ▼ [Submit formularza]
Komunikat: "Sprawdź email"
    │
    ▼ [Klik linku w emailu]
Logowanie (/auth/login)
    │
    ▼ [Sukces logowania]
Profil (/profile) ←── [Guard: profil niekompletny]
    │
    ▼ [Uzupełnienie wymaganych danych]
Lista faktur (/invoices)
    │
    ▼ [Klik: "Nowa faktura"]
Formularz faktury (/invoices/new)
```

### 3.2 Główny flow: Tworzenie faktury

```
Lista faktur (/invoices)
    │
    ▼ [Klik: "Nowa faktura"]
Formularz faktury (/invoices/new)
    │
    ├──▶ [Wybór kontrahenta z autocomplete]
    │         │
    │         ▼ [Lub: "Dodaj nowego"]
    │    Modal kontrahenta
    │         │
    │         ▼ [Zapis → automatyczny wybór]
    │
    ├──▶ [Dodawanie pozycji]
    │         │
    │         ▼ [Automatyczne przeliczanie sum]
    │
    ├──▶ [Klik: "Zapisz jako szkic"]
    │         │
    │         ▼ [Zapis → przekierowanie do listy]
    │
    └──▶ [Klik: "Wystaw fakturę"]
              │
              ▼ [Walidacja kompletności]
              │
              ├── [Błędy] → Scroll do pierwszego błędu
              │
              └── [OK] → Zapis ze statusem "unpaid"
                           │
                           ▼
                  Szczegóły faktury (/invoices/:id)
```

### 3.3 Flow: Zmiana statusu faktury

```
Lista faktur lub Szczegóły faktury
    │
    ▼ [Akcja: "Zmień status"]
Dialog potwierdzenia
    │
    ├── draft → unpaid: "Czy na pewno chcesz wystawić fakturę? Nie będzie można jej edytować."
    │
    ├── unpaid → paid: "Potwierdź opłacenie faktury" + opcjonalna data płatności
    │
    └── [Potwierdzenie]
         │
         ▼
    Aktualizacja statusu + odświeżenie widoku
```

### 3.4 Flow: Generowanie PDF

```
Szczegóły faktury (/invoices/:id)
    │
    ▼ [Klik: "Generuj PDF"]
    │
    ├── [Status = draft]
    │         │
    │         ▼ [Blokada + tooltip: "Najpierw wystaw fakturę"]
    │
    └── [Status = unpaid/paid]
              │
              ▼
         Loader: "Generowanie PDF..."
              │
              ▼ [Web Worker: pdfmake]
              │
              ├── [Sukces] → Automatyczne pobieranie pliku
              │
              └── [Błąd/Timeout] → Komunikat z opcją retry
```

### 3.5 Flow: Duplikowanie faktury

```
Lista faktur lub Szczegóły faktury
    │
    ▼ [Akcja: "Duplikuj"]
    │
    ▼ [POST /invoices/:id/duplicate]
    │
    ▼ [Snackbar: "Faktura zduplikowana"]
    │
    ▼ Formularz edycji (/invoices/:newId/edit)
         │
         ▼ [Nowy numer, dzisiejsza data, status=draft]
```

### 3.6 Flow: Reset hasła

```
Logowanie (/auth/login)
    │
    ▼ [Klik: "Zapomniałem hasła"]
Forgot Password (/auth/forgot-password)
    │
    ▼ [Submit email]
    │
    ▼ [Komunikat: "Jeśli konto istnieje, link został wysłany"]
    │
    ▼ [Email z linkiem]
    │
    ▼ [Klik linku]
Reset Password (/auth/reset-password?token=xxx)
    │
    ▼ [Submit nowego hasła]
    │
    ▼ [Sukces] → Przekierowanie do logowania
```

---

## 4. Układ i struktura nawigacji

### 4.1 Layout publiczny (strefa gościnna)

```
┌────────────────────────────────────────────────┐
│  [Logo]                    [Zaloguj] [Rejestruj]│
├────────────────────────────────────────────────┤
│                                                │
│              [Treść strony]                    │
│                                                │
├────────────────────────────────────────────────┤
│  Footer: Regulamin | Polityka prywatności      │
└────────────────────────────────────────────────┘
```

### 4.2 Layout chroniony (zalogowany użytkownik)

**Desktop (>960px):**

```
┌────────────────────────────────────────────────┐
│  [Logo]        [Nazwa firmy]    [Avatar ▼]     │
├──────────┬─────────────────────────────────────┤
│          │                                     │
│ Faktury  │        [Treść widoku]               │
│          │                                     │
│Kontrah.  │                                     │
│          │                                     │
│ Profil   │                                     │
│          │                                     │
└──────────┴─────────────────────────────────────┘
```

**Mobile (<600px):**

```
┌────────────────────────────────────────────────┐
│  [☰]  [Logo]              [Avatar]             │
├────────────────────────────────────────────────┤
│                                                │
│              [Treść widoku]                    │
│                                                │
│                                                │
│                                         [FAB+] │
└────────────────────────────────────────────────┘

[Drawer menu po kliknięciu ☰]:
┌──────────┐
│ Faktury  │
│ Kontrah. │
│ Profil   │
│──────────│
│ Wyloguj  │
└──────────┘
```

### 4.3 Elementy nawigacji

**Sidenav (MainLayoutComponent):**
| Element | Ikona | Ścieżka | Badge |
|---------|-------|---------|-------|
| Faktury | `receipt_long` | `/invoices` | - |
| Kontrahenci | `people` | `/contractors` | - |
| Profil firmy | `business` | `/profile` | ⚠️ (jeśli niekompletny) |

**Toolbar:**

- Logo (link do `/invoices`)
- Nazwa firmy użytkownika (z UserStore)
- Avatar menu:
  - Profil (`/profile`)
  - Wyloguj (→ `/auth/login`)

### 4.4 Breadcrumbs / Nawigacja kontekstowa

Dla MVP breadcrumbs pominięte (płaska struktura). Zamiast tego:

- Przycisk "← Powrót do listy" w szczegółach i formularzach
- `routerLinkActive` na sidenav linkach

---

## 5. Kluczowe komponenty

### 5.1 Layout Components

| Komponent             | Opis                                                     |
| --------------------- | -------------------------------------------------------- |
| `MainLayoutComponent` | Wrapper dla chronionych stron, zawiera toolbar i sidenav |
| `ToolbarComponent`    | Górny pasek z logo, nazwą firmy, avatar menu             |
| `SidenavComponent`    | Boczna nawigacja, responsywna (side/over/drawer)         |

### 5.2 Shared Components

| Komponent                      | Opis                                | Użycie                     |
| ------------------------------ | ----------------------------------- | -------------------------- |
| `EmptyStateComponent`          | Puste listy z ilustracją i CTA      | Lista faktur, kontrahentów |
| `ErrorStateComponent`          | Wyświetlanie błędów z retry         | Błędy API                  |
| `LoadingSpinnerComponent`      | Spinner ładowania                   | Ładowanie danych           |
| `LoadingButtonComponent`       | Przycisk z loaderem podczas akcji   | Formularze                 |
| `ConfirmDialogComponent`       | Dialog potwierdzenia akcji          | Usuwanie, zmiana statusu   |
| `StatusBadgeComponent`         | Kolorowy chip statusu faktury       | Lista, szczegóły           |
| `ContractorSelectComponent`    | Autocomplete z opcją dodania nowego | Formularz faktury          |
| `InvoicePrintPreviewComponent` | Podgląd faktury w formacie A4       | Szczegóły faktury          |
| `NotFoundComponent`            | Strona 404                          | Routing catch-all          |

### 5.3 Feature Components - Faktury

| Komponent                    | Opis                                      |
| ---------------------------- | ----------------------------------------- |
| `InvoiceListComponent`       | Tabela faktur z filtrami i paginacją      |
| `InvoiceFiltersComponent`    | Panel filtrów: status, daty, wyszukiwanie |
| `InvoiceDetailComponent`     | Read-only widok faktury                   |
| `InvoiceFormComponent`       | Formularz tworzenia/edycji (reużywany)    |
| `InvoiceItemsTableComponent` | Dynamiczna tabela pozycji (FormArray)     |
| `InvoiceTotalsComponent`     | Podsumowanie kwot (computed signals)      |

### 5.4 Feature Components - Kontrahenci

| Komponent                       | Opis                               |
| ------------------------------- | ---------------------------------- |
| `ContractorListComponent`       | Tabela kontrahentów z wyszukiwarką |
| `ContractorFormComponent`       | Formularz tworzenia/edycji         |
| `ContractorFormDialogComponent` | Modal szybkiego dodania            |

### 5.5 Feature Components - Profil

| Komponent             | Opis                              |
| --------------------- | --------------------------------- |
| `ProfileComponent`    | Główny widok profilu z sekcjami   |
| `LogoUploadComponent` | Upload logo z drag&drop i preview |

### 5.6 Feature Components - Auth

| Komponent                 | Opis                        |
| ------------------------- | --------------------------- |
| `LoginComponent`          | Formularz logowania         |
| `RegisterComponent`       | Formularz rejestracji       |
| `ForgotPasswordComponent` | Formularz zapomniałem hasła |
| `ResetPasswordComponent`  | Formularz resetu hasła      |

### 5.7 Serwisy

| Serwis                 | Odpowiedzialność                            |
| ---------------------- | ------------------------------------------- |
| `AuthService`          | Autentykacja, tokeny, refresh               |
| `UserService`          | Profil użytkownika (Resource API + mutacje) |
| `ContractorService`    | CRUD kontrahentów                           |
| `InvoiceService`       | CRUD faktur, status, duplikowanie           |
| `NotificationService`  | Snackbar notifications                      |
| `LoadingService`       | Globalny loading state                      |
| `ConfirmDialogService` | Otwieranie dialogów potwierdzenia           |
| `PdfGeneratorService`  | Generowanie PDF w Web Worker                |
| `AmountToWordsService` | Kwota na słownie (polski)                   |
| `FormErrorService`     | Mapowanie błędów API na pola formularza     |

### 5.8 Signal Stores

| Store              | Stan                                    | Computed                             |
| ------------------ | --------------------------------------- | ------------------------------------ |
| `UserStore`        | `profile`, `loading`, `error`           | `isProfileComplete`, `companyName`   |
| `ContractorsStore` | `contractors`, `loading`, `lastFetched` | `isStale` (TTL 5 min)                |
| `InvoiceFormStore` | `items`, `buyer`, `dates`               | `totalNet`, `totalVat`, `totalGross` |

### 5.9 Guards

| Guard                  | Opis                                                     |
| ---------------------- | -------------------------------------------------------- |
| `authGuard`            | Sprawdza zalogowanie, redirect do `/auth/login`          |
| `guestGuard`           | Dla stron auth, redirect do `/invoices` jeśli zalogowany |
| `profileCompleteGuard` | Blokuje `/invoices/new` bez kompletnego profilu          |
| `canDeactivateGuard`   | Ostrzeżenie przy niezapisanych zmianach                  |

### 5.10 Walidatory

| Walidator                      | Opis                                 |
| ------------------------------ | ------------------------------------ |
| `nipValidator`                 | Format 10 cyfr + suma kontrolna NIP  |
| `ibanValidator`                | Format IBAN + MOD-97 checksum        |
| `invoiceNumberFormatValidator` | Wymaga placeholder {NNN}             |
| `dueDateValidator`             | Termin płatności >= data wystawienia |

### 5.11 Interceptory

| Interceptor          | Opis                                   |
| -------------------- | -------------------------------------- |
| `authInterceptor`    | Dołącza Bearer token do żądań          |
| `errorInterceptor`   | Globalna obsługa błędów API (401, 5xx) |
| `loadingInterceptor` | Zarządza globalnym loading state       |

---

## 6. Obsługa stanów i błędów

### 6.1 Stany ładowania

- **Route-level**: Skeleton/placeholder podczas lazy loading komponentu
- **Component-level**: Spinner przy pobieraniu danych (Resource API `isLoading()`)
- **Action-level**: Loading button podczas submit formularza

### 6.2 Obsługa błędów

| Typ błędu                 | Obsługa UI                                 |
| ------------------------- | ------------------------------------------ |
| Walidacja pola            | `mat-error` inline pod polem               |
| Błąd biznesowy (400, 409) | Snackbar + mapowanie na pole jeśli dotyczy |
| Brak autoryzacji (401)    | Redirect do login z returnUrl              |
| Brak zasobu (404)         | ErrorStateComponent z opcją powrotu        |
| Błąd serwera (5xx)        | ErrorStateComponent z retry                |
| Timeout                   | Komunikat z manual retry                   |

### 6.3 Empty States

| Widok               | Komunikat                               | CTA                       |
| ------------------- | --------------------------------------- | ------------------------- |
| Lista faktur        | "Nie masz jeszcze żadnych faktur"       | "Utwórz pierwszą fakturę" |
| Lista kontrahentów  | "Nie masz jeszcze żadnych kontrahentów" | "Dodaj kontrahenta"       |
| Wyniki wyszukiwania | "Brak wyników dla [zapytanie]"          | "Wyczyść filtry"          |

---

## 7. Responsywność i dostępność

### 7.1 Breakpoints

| Breakpoint | Szerokość | Zachowanie                                    |
| ---------- | --------- | --------------------------------------------- |
| xs         | <600px    | Mobile: drawer nav, karty zamiast tabeli, FAB |
| sm         | 600-960px | Tablet: collapsible sidenav                   |
| md+        | >960px    | Desktop: stały sidenav                        |

### 7.2 Dostępność (a11y)

- Skip link do głównej treści
- ARIA labels dla wszystkich interaktywnych elementów
- Focus management (autofocus, focus trap w modalach)
- Keyboard navigation (Tab, Enter, Escape)
- Contrast ratio zgodny z WCAG AA
- Semantic HTML (landmarks, heading hierarchy)
- `prefers-reduced-motion` dla animacji
- Lighthouse accessibility score >90

### 7.3 Internacjonalizacja

- Język polski jako domyślny i jedyny w MVP
- Formatowanie:
  - Daty: `dd.MM.yyyy` (DatePipe z 'pl-PL')
  - Kwoty: `1 234,56 PLN` (CurrencyPipe)
  - Tydzień od poniedziałku
- Strefa czasowa: Europe/Warsaw

---

## 8. Bezpieczeństwo UI

### 8.1 Autentykacja

- Access token w pamięci (nie localStorage)
- Refresh token w httpOnly cookie lub localStorage z krótkim TTL
- Automatyczny refresh przy 401
- Idle timeout 30 min z ostrzeżeniem

### 8.2 Autoryzacja

- Guards blokujące dostęp do chronionych widoków
- Walidacja ownership po stronie API (RLS)
- Ukrywanie akcji niedostępnych dla statusu faktury

### 8.3 Walidacja

- Client-side walidacja dla UX
- Server-side walidacja jako source of truth
- Sanityzacja inputów (Angular domyślnie)
- CSRF protection (Supabase)

---

## 9. Mapowanie wymagań PRD na UI

| User Story                 | Widok/Komponent                                     | Endpoint API                                |
| -------------------------- | --------------------------------------------------- | ------------------------------------------- |
| US-001: Rejestracja        | `RegisterComponent`                                 | POST /auth/register                         |
| US-002: Logowanie          | `LoginComponent`                                    | POST /auth/login                            |
| US-003: Wylogowanie        | Avatar menu                                         | POST /auth/logout                           |
| US-004: Reset hasła        | `ForgotPasswordComponent`, `ResetPasswordComponent` | POST /auth/forgot-password, /reset-password |
| US-005: Profil firmy       | `ProfileComponent`                                  | GET/PUT /users/profile                      |
| US-006: Upload logo        | `LogoUploadComponent`                               | POST /users/profile/logo                    |
| US-007: Lista kontrahentów | `ContractorListComponent`                           | GET /contractors                            |
| US-008: Dodaj kontrahenta  | `ContractorFormComponent`                           | POST /contractors                           |
| US-009: Edytuj kontrahenta | `ContractorFormComponent`                           | PUT /contractors/:id                        |
| US-010: Usuń kontrahenta   | ConfirmDialog + lista                               | DELETE /contractors/:id                     |
| US-011: Lista faktur       | `InvoiceListComponent`                              | GET /invoices                               |
| US-012: Nowa faktura       | `InvoiceFormComponent`                              | POST /invoices                              |
| US-013: Edytuj fakturę     | `InvoiceFormComponent`                              | PUT /invoices/:id                           |
| US-014: Podgląd faktury    | `InvoiceDetailComponent`                            | GET /invoices/:id                           |
| US-015: Zmiana statusu     | StatusDropdown + dialog                             | PUT /invoices/:id/status                    |
| US-016: Duplikowanie       | Menu + redirect                                     | POST /invoices/:id/duplicate                |
| US-017: Generuj PDF        | Button + WebWorker                                  | Client-side pdfmake                         |
| US-018: Usuwanie faktury   | ConfirmDialog                                       | DELETE /invoices/:id                        |
