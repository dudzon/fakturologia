# Architektura UI - Fakturologia MVP

## 1. Przegląd

Dokument opisuje architekturę interfejsu użytkownika dla aplikacji Fakturologia MVP - webowej aplikacji do wystawiania faktur VAT dla freelancerów i mikroprzedsiębiorców.

### 1.1 Stack technologiczny Frontend

| Technologia          | Wersja | Zastosowanie                                |
| -------------------- | ------ | ------------------------------------------- |
| Angular              | 21     | Framework aplikacji (Standalone Components) |
| Angular Material     | 21     | Biblioteka komponentów UI                   |
| Angular Signals      | -      | Zarządzanie stanem reaktywnym               |
| Angular Resource API | -      | Deklaratywne pobieranie danych HTTP         |
| pdfmake              | latest | Generowanie PDF po stronie klienta          |
| Vitest               | latest | Testy jednostkowe                           |
| Playwright           | latest | Testy E2E                                   |

### 1.2 Kluczowe decyzje architektoniczne

- **Standalone Components**: Brak NgModules, lazy loading przez `loadComponent` w routes
- **Signal Stores**: Zarządzanie stanem aplikacji (UserStore, ContractorsStore)
- **Resource API / httpResource**: Deklaratywne pobieranie danych dla GET requests
- **HttpClient**: Tradycyjne podejście dla mutacji (POST, PUT, DELETE)
- **Reactive Forms**: Formularze z walidacją
- **Client-side PDF**: pdfmake w Web Worker

---

## 2. Mapa widoków i routing

### 2.1 Struktura URL

```
/                           # Landing Page (publiczny)
├── /auth
│   ├── /login              # Logowanie
│   ├── /register           # Rejestracja
│   ├── /forgot-password    # Zapomniałem hasła
│   └── /reset-password     # Reset hasła (z tokenem)
├── /invoices               # Lista faktur (chroniony)
│   ├── /new                # Nowa faktura
│   ├── /:id                # Szczegóły faktury
│   └── /:id/edit           # Edycja faktury
├── /contractors            # Lista kontrahentów (chroniony)
│   ├── /new                # Nowy kontrahent
│   └── /:id/edit           # Edycja kontrahenta
├── /profile                # Profil firmy (chroniony)
└── /**                     # 404 Not Found
```

### 2.2 Konfiguracja routingu

```typescript
// app.routes.ts
export const routes: Routes = [
  // Publiczne
  { path: "", component: LandingPageComponent },
  {
    path: "auth",
    children: [
      {
        path: "login",
        loadComponent: () => import("./features/auth/login.component"),
      },
      {
        path: "register",
        loadComponent: () => import("./features/auth/register.component"),
      },
      {
        path: "forgot-password",
        loadComponent: () =>
          import("./features/auth/forgot-password.component"),
      },
      {
        path: "reset-password",
        loadComponent: () => import("./features/auth/reset-password.component"),
      },
    ],
    canActivate: [guestGuard],
  },

  // Chronione
  {
    path: "invoices",
    canActivate: [authGuard],
    children: [
      {
        path: "",
        loadComponent: () =>
          import("./features/invoices/invoice-list.component"),
      },
      {
        path: "new",
        loadComponent: () =>
          import("./features/invoices/invoice-form.component"),
        canActivate: [profileCompleteGuard],
      },
      {
        path: ":id",
        loadComponent: () =>
          import("./features/invoices/invoice-detail.component"),
      },
      {
        path: ":id/edit",
        loadComponent: () =>
          import("./features/invoices/invoice-form.component"),
      },
    ],
  },
  {
    path: "contractors",
    canActivate: [authGuard],
    children: [
      {
        path: "",
        loadComponent: () =>
          import("./features/contractors/contractor-list.component"),
      },
      {
        path: "new",
        loadComponent: () =>
          import("./features/contractors/contractor-form.component"),
      },
      {
        path: ":id/edit",
        loadComponent: () =>
          import("./features/contractors/contractor-form.component"),
      },
    ],
  },
  {
    path: "profile",
    loadComponent: () => import("./features/profile/profile.component"),
    canActivate: [authGuard],
  },

  // Fallback
  {
    path: "**",
    loadComponent: () => import("./shared/components/not-found.component"),
  },
];
```

### 2.3 Guards

| Guard                  | Zastosowanie                                                                |
| ---------------------- | --------------------------------------------------------------------------- |
| `authGuard`            | Sprawdza czy użytkownik zalogowany, redirect do `/auth/login` z `returnUrl` |
| `guestGuard`           | Dla stron auth, redirect do `/invoices` jeśli zalogowany                    |
| `profileCompleteGuard` | Dla `/invoices/new`, sprawdza kompletność profilu, redirect do `/profile`   |
| `canDeactivateGuard`   | Ostrzeżenie przy niezapisanych zmianach w formularzach                      |

---

## 3. Struktura katalogów

```
src/app/
├── core/                           # Singleton services, guards, interceptors
│   ├── guards/
│   │   ├── auth.guard.ts
│   │   ├── guest.guard.ts
│   │   ├── profile-complete.guard.ts
│   │   └── can-deactivate.guard.ts
│   ├── interceptors/
│   │   ├── auth.interceptor.ts
│   │   ├── error.interceptor.ts
│   │   └── loading.interceptor.ts
│   ├── constants/
│   │   ├── app.constants.ts
│   │   ├── invoice.constants.ts
│   │   └── validation.constants.ts
│   └── services/
│       ├── notification.service.ts
│       ├── loading.service.ts
│       ├── confirm-dialog.service.ts
│       ├── pdf-generator.service.ts
│       └── amount-to-words.service.ts
│
├── shared/                         # Reusable components, pipes, directives, validators
│   ├── components/
│   │   ├── empty-state/
│   │   ├── error-state/
│   │   ├── loading-spinner/
│   │   ├── loading-button/
│   │   ├── confirm-dialog/
│   │   ├── contractor-select/
│   │   └── invoice-print-preview/
│   ├── pipes/
│   │   └── relative-date.pipe.ts
│   ├── validators/
│   │   ├── nip.validator.ts
│   │   ├── iban.validator.ts
│   │   ├── invoice-number-format.validator.ts
│   │   └── date-range.validator.ts
│   └── directives/
│       └── copy-to-clipboard.directive.ts
│
├── features/                       # Feature-specific components
│   ├── landing/
│   │   └── landing-page.component.ts
│   ├── auth/
│   │   ├── login.component.ts
│   │   ├── register.component.ts
│   │   ├── forgot-password.component.ts
│   │   └── reset-password.component.ts
│   ├── invoices/
│   │   ├── invoice-list.component.ts
│   │   ├── invoice-detail.component.ts
│   │   ├── invoice-form.component.ts
│   │   └── components/
│   │       ├── invoice-items-table.component.ts
│   │       ├── invoice-totals.component.ts
│   │       └── invoice-filters.component.ts
│   ├── contractors/
│   │   ├── contractor-list.component.ts
│   │   └── contractor-form.component.ts
│   └── profile/
│       ├── profile.component.ts
│       └── components/
│           └── logo-upload.component.ts
│
├── services/                       # HTTP services
│   ├── auth.service.ts
│   ├── user.service.ts
│   ├── contractor.service.ts
│   └── invoice.service.ts
│
├── stores/                         # Signal Stores
│   ├── user.store.ts
│   ├── contractors.store.ts
│   └── invoice-form.store.ts
│
├── models/                         # Interfaces/Types
│   ├── user.model.ts
│   ├── contractor.model.ts
│   ├── invoice.model.ts
│   ├── api.model.ts
│   └── index.ts
│
├── app.component.ts
├── app.config.ts
├── app.routes.ts
└── layout/
    ├── main-layout.component.ts
    ├── toolbar.component.ts
    └── sidenav.component.ts
```

---

## 4. Komponenty

### 4.1 Layout Components

#### MainLayoutComponent

- Wrapper dla chronionych stron
- Zawiera `ToolbarComponent` i `SidenavComponent`
- Responsywny: sidenav `side` na desktop (>960px), `over` na mobile

#### ToolbarComponent

- Logo/nazwa aplikacji (link do `/invoices`)
- Nazwa firmy użytkownika (z UserStore)
- Avatar menu: Profil, Wyloguj
- Mobile: hamburger menu toggle

#### SidenavComponent

- Nawigacja: Faktury, Kontrahenci, Profil firmy
- Active link podświetlony (`routerLinkActive`)
- Zamykany po kliknięciu linku na mobile

### 4.2 Feature Components

#### Landing Page

- Hero section z CTA "Zarejestruj się za darmo"
- Sekcja korzyści (3-4 funkcje z ikonami)
- Screenshot/mockup aplikacji
- Linki do regulaminu i polityki prywatności (nowe okno)

#### Auth Components

- `LoginComponent`: formularz email/hasło, checkbox "Zapamiętaj mnie", link do rejestracji i reset hasła
- `RegisterComponent`: formularz email/hasło/potwierdzenie, walidacja, link do logowania
- `ForgotPasswordComponent`: formularz email, komunikat o wysłaniu linku
- `ResetPasswordComponent`: formularz nowe hasło/potwierdzenie, walidacja tokena

#### Invoice Components

- `InvoiceListComponent`: tabela z paginacją, filtry (status, daty, wyszukiwanie), sortowanie, akcje (podgląd, edycja, duplikuj, usuń, zmień status)
- `InvoiceDetailComponent`: read-only widok faktury, podgląd print preview, przyciski akcji (Edytuj, Duplikuj, Generuj PDF, Zmień status)
- `InvoiceFormComponent`: formularz tworzenia/edycji, reużywany dla new/edit
- `InvoiceItemsTableComponent`: dynamiczna tabela pozycji z FormArray
- `InvoiceTotalsComponent`: podsumowanie kwot (suma netto, VAT, brutto)
- `InvoiceFiltersComponent`: quick filters, date range, wyszukiwarka

#### Contractor Components

- `ContractorListComponent`: tabela z wyszukiwarką, akcje (edycja, usuń)
- `ContractorFormComponent`: formularz tworzenia/edycji
- `ContractorFormDialogComponent`: modal do szybkiego dodania kontrahenta z formularza faktury

#### Profile Components

- `ProfileComponent`: sekcje w kartach (dane firmy, dane bankowe, logo, numeracja)
- `LogoUploadComponent`: drag&drop, podgląd, progress bar, walidacja

### 4.3 Shared Components

| Komponent                      | Zastosowanie             |
| ------------------------------ | ------------------------ |
| `EmptyStateComponent`          | Puste listy z CTA        |
| `ErrorStateComponent`          | Wyświetlanie błędów      |
| `LoadingSpinnerComponent`      | Stan ładowania           |
| `LoadingButtonComponent`       | Przycisk z loader        |
| `ConfirmDialogComponent`       | Dialog potwierdzenia     |
| `ContractorSelectComponent`    | Autocomplete kontrahenta |
| `InvoicePrintPreviewComponent` | Podgląd faktury A4       |
| `NotFoundComponent`            | Strona 404               |

---

## 5. Serwisy

### 5.1 HTTP Services z Resource API

```typescript
// invoice.service.ts
@Injectable({ providedIn: "root" })
export class InvoiceService {
  private http = inject(HttpClient);

  // Resource API dla odczytu (GET)
  invoicesResource = httpResource<InvoiceListResponse>(() => ({
    url: "/api/v1/invoices",
    params: this.queryParams(),
  }));

  invoiceResource = httpResource<Invoice>(
    () => `/api/v1/invoices/${this.invoiceId()}`
  );

  nextNumberResource = httpResource<NextNumberResponse>(
    () => "/api/v1/invoices/next-number"
  );

  // HttpClient dla mutacji (POST, PUT, DELETE)
  createInvoice(dto: CreateInvoiceDto): Promise<Invoice> {
    return firstValueFrom(this.http.post<Invoice>("/api/v1/invoices", dto));
  }

  updateInvoice(id: string, dto: UpdateInvoiceDto): Promise<Invoice> {
    return firstValueFrom(
      this.http.put<Invoice>(`/api/v1/invoices/${id}`, dto)
    );
  }

  updateStatus(id: string, status: InvoiceStatus): Promise<Invoice> {
    return firstValueFrom(
      this.http.patch<Invoice>(`/api/v1/invoices/${id}/status`, { status })
    );
  }

  duplicateInvoice(id: string): Promise<Invoice> {
    return firstValueFrom(
      this.http.post<Invoice>(`/api/v1/invoices/${id}/duplicate`, {})
    );
  }

  deleteInvoice(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`/api/v1/invoices/${id}`));
  }
}
```

### 5.2 Struktura serwisów

| Serwis                     | Odpowiedzialność                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------ |
| `AuthService`              | login, register, logout, refresh, forgot/reset password, token management            |
| `UserService`              | getProfile (resource), updateProfile, uploadLogo, deleteLogo                         |
| `ContractorService`        | list (resource), get, create, update, delete                                         |
| `InvoiceService`           | list (resource), get, create, update, delete, updateStatus, duplicate, getNextNumber |
| `NotificationService`      | success(), error(), info(), warning() - wrapper dla MatSnackBar                      |
| `LoadingService`           | globalny loading state (signal)                                                      |
| `ConfirmDialogService`     | confirm() - otwiera dialog potwierdzenia                                             |
| `PdfGeneratorService`      | generateInvoicePdf() - pdfmake w Web Worker                                          |
| `AmountToWordsService`     | convert() - kwota na słownie po polsku                                               |
| `FormErrorService`         | mapowanie błędów API na pola formularza                                              |
| `InvoiceValidationService` | validateForIssuing() - walidacja kompletności faktury                                |

---

## 6. Signal Stores

### 6.1 UserStore

```typescript
// stores/user.store.ts
export const UserStore = signalStore(
  { providedIn: "root" },
  withState<UserState>({
    profile: null,
    isLoading: false,
    error: null,
  }),
  withComputed((store) => ({
    isProfileComplete: computed(() => {
      const p = store.profile();
      return !!(p?.companyName && p?.address && p?.nip);
    }),
    isLoggedIn: computed(() => !!store.profile()),
  })),
  withMethods((store, userService = inject(UserService)) => ({
    async loadProfile() {
      patchState(store, { isLoading: true });
      try {
        const profile = await userService.getProfile();
        patchState(store, { profile, isLoading: false });
      } catch (error) {
        patchState(store, { error, isLoading: false });
      }
    },
    async updateProfile(data: UpdateProfileDto) {
      // ...
    },
    clearProfile() {
      patchState(store, { profile: null });
    },
  }))
);
```

### 6.2 ContractorsStore

```typescript
// stores/contractors.store.ts
export const ContractorsStore = signalStore(
  { providedIn: "root" },
  withState<ContractorsState>({
    contractors: [],
    isLoading: false,
    lastFetched: null,
  }),
  withComputed((store) => ({
    // Cache TTL 5 minut
    shouldRefetch: computed(() => {
      const lastFetched = store.lastFetched();
      if (!lastFetched) return true;
      return Date.now() - lastFetched > 5 * 60 * 1000;
    }),
  })),
  withMethods((store, contractorService = inject(ContractorService)) => ({
    async loadContractors(force = false) {
      if (!force && !store.shouldRefetch()) return;
      // fetch and update state
    },
    invalidateCache() {
      patchState(store, { lastFetched: null });
    },
  }))
);
```

### 6.3 InvoiceFormStore

```typescript
// stores/invoice-form.store.ts
export const InvoiceFormStore = signalStore(
  withState<InvoiceFormState>({
    items: [],
    // ...
  }),
  withComputed((store) => ({
    totalNet: computed(() =>
      store.items().reduce((sum, item) => sum + item.netAmount, 0)
    ),
    totalVat: computed(() =>
      store.items().reduce((sum, item) => sum + item.vatAmount, 0)
    ),
    totalGross: computed(() => store.totalNet() + store.totalVat()),
    vatBreakdown: computed(() => {
      // grupowanie VAT według stawek
    }),
  }))
);
```

---

## 7. Formularze i walidacja

### 7.1 Walidatory

| Walidator                      | Plik                                 | Zastosowanie                    |
| ------------------------------ | ------------------------------------ | ------------------------------- |
| `nipValidator`                 | `nip.validator.ts`                   | Format 10 cyfr + suma kontrolna |
| `ibanValidator`                | `iban.validator.ts`                  | Format IBAN + MOD-97 checksum   |
| `invoiceNumberFormatValidator` | `invoice-number-format.validator.ts` | Wymaga {NNN} placeholder        |
| `minDateValidator`             | `date-range.validator.ts`            | Data minimalna                  |
| `dueDateValidator`             | `date-range.validator.ts`            | Termin >= data wystawienia      |

### 7.2 Struktura formularza faktury

```typescript
interface InvoiceForm {
  invoiceNumber: FormControl<string>;
  issueDate: FormControl<Date>;
  dueDate: FormControl<Date>;
  placeOfIssue: FormControl<string>;
  contractorId: FormControl<string | null>;
  buyer: FormGroup<{
    name: FormControl<string>;
    address: FormControl<string>;
    nip: FormControl<string>;
  }>;
  items: FormArray<FormGroup<InvoiceItemForm>>;
  notes: FormControl<string>;
  status: FormControl<InvoiceStatus>;
}

interface InvoiceItemForm {
  name: FormControl<string>;
  quantity: FormControl<number>;
  unit: FormControl<string>;
  unitPrice: FormControl<number>;
  vatRate: FormControl<VatRate>;
}
```

### 7.3 Obsługa błędów formularza

- Inline błędy pod polami (`mat-error`)
- Błędy API mapowane na pola przez `FormErrorService`
- Alert nad formularzem dla błędów ogólnych
- Formularz zachowuje dane przy błędzie zapisu

---

## 8. Obsługa stanów

### 8.1 Loading States

```html
<!-- Przykład z Resource API -->
@if (invoices.isLoading()) {
<mat-progress-bar mode="indeterminate" />
} @else if (invoices.error()) {
<app-error-state [error]="invoices.error()" (retry)="invoices.reload()" />
} @else if (invoices.value()?.data.length === 0) {
<app-empty-state
  title="Nie masz jeszcze żadnych faktur"
  description="Wystaw pierwszą fakturę, aby rozpocząć"
  actionLabel="Wystaw fakturę"
  (action)="createInvoice()"
/>
} @else {
<app-invoice-table [data]="invoices.value()!.data" />
}
```

### 8.2 Status faktury

| Status   | Badge       | Kolor        | Opis                           |
| -------- | ----------- | ------------ | ------------------------------ |
| `draft`  | Szkic       | Szary        | Niekompletna faktura           |
| `unpaid` | Nieopłacona | Pomarańczowy | Wystawiona, oczekuje płatności |
| `paid`   | Opłacona    | Zielony      | Płatność otrzymana             |

Przeterminowane faktury (unpaid + dueDate < today): czerwona data + ikona ostrzeżenia.

---

## 9. Nawigacja i UX

### 9.1 Hierarchia nawigacji

- **Desktop (>960px)**: Stały sidenav po lewej + toolbar na górze
- **Tablet/Mobile (<960px)**: Hamburger menu + wysuwany sidenav overlay

### 9.2 Przepływ onboardingu

```
1. Landing Page → "Zarejestruj się"
2. /auth/register → Formularz → "Sprawdź email"
3. Klik link w email → /auth/login z komunikatem
4. Logowanie → Redirect do /profile (profil pusty)
5. /profile → Welcome banner → Wypełnienie danych → Zapisz
6. Snackbar: "Teraz możesz wystawić pierwszą fakturę"
7. /invoices (empty state) → "Wystaw fakturę"
8. /invoices/new → Formularz → Zapisz
9. /invoices/:id → "Generuj PDF" → Pobieranie pliku
```

### 9.3 Ochrona przed utratą danych

- `CanDeactivateGuard` na formularzach
- Dialog: "Masz niezapisane zmiany. Czy chcesz opuścić stronę?"
- Opcje: "Zostań", "Opuść bez zapisywania", "Zapisz i opuść"
- Obsługa `beforeunload` event dla zamknięcia karty

---

## 10. Responsywność

### 10.1 Breakpointy

| Breakpoint | Szerokość | Layout                                              |
| ---------- | --------- | --------------------------------------------------- |
| Mobile     | <600px    | Single column, karty zamiast tabel, sidenav overlay |
| Tablet     | 600-960px | Single/two column, ukryte mniej ważne kolumny       |
| Desktop    | >960px    | Multi column, pełne tabele, stały sidenav           |

### 10.2 Adaptacje komponentów

- **Tabela faktur na mobile**: Karty z kluczowymi danymi (numer, kontrahent, kwota, status)
- **Formularz faktury na mobile**: Single column, zwijalne sekcje (accordion)
- **Tabela pozycji na mobile**: Każda pozycja jako rozwijana karta

---

## 11. Generowanie PDF

### 11.1 Architektura

```
InvoiceDetailComponent
    │
    ▼ (click "Generuj PDF")
PdfGeneratorService
    │
    ▼ (prepare definition)
Web Worker
    │
    ▼ (pdfmake.createPdf)
Blob → Download
```

### 11.2 Layout PDF

```
┌─────────────────────────────────────────┐
│ [LOGO]              DANE SPRZEDAWCY     │
│                     Firma ABC           │
│                     ul. Przykładowa 1   │
│                     NIP: 123-456-78-90  │
├─────────────────────────────────────────┤
│ FAKTURA VAT nr FV/2025/001              │
│ Data wystawienia: 15.01.2025            │
│ Termin płatności: 29.01.2025            │
│ Miejsce wystawienia: Warszawa           │
├─────────────────────────────────────────┤
│ NABYWCA:                                │
│ Kontrahent XYZ                          │
│ ul. Testowa 2                           │
│ NIP: 987-654-32-10                      │
├─────────────────────────────────────────┤
│ Lp │ Nazwa │ Ilość │ J.m. │ Cena │ VAT │
│ 1  │ ...   │ ...   │ szt. │ ...  │ 23% │
├─────────────────────────────────────────┤
│                    Razem netto: 1000.00 │
│                    VAT 23%:      230.00 │
│                    Razem brutto: 1230.00│
│                                         │
│ Słownie: jeden tysiąc dwieście          │
│ trzydzieści złotych 00/100              │
├─────────────────────────────────────────┤
│ Uwagi: ...                              │
├─────────────────────────────────────────┤
│ Nr konta: PL61 1090 1014 0000 0712 1981 │
└─────────────────────────────────────────┘
```

---

## 12. Integracja z API

### 12.1 Interceptory

```typescript
// app.config.ts
provideHttpClient(
  withInterceptors([
    authInterceptor, // Dodaje Bearer token
    errorInterceptor, // Obsługa błędów 401, 4xx, 5xx
    loadingInterceptor, // Sygnalizuje loading state
  ])
);
```

### 12.2 Obsługa błędów

| Status | Obsługa                                                       |
| ------ | ------------------------------------------------------------- |
| 401    | Próba refresh tokena, jeśli fail → logout + redirect do login |
| 400    | Mapowanie błędów walidacji na pola formularza                 |
| 404    | Redirect do strony 404 lub komunikat "Nie znaleziono"         |
| 409    | Komunikat o konflikcie (np. "NIP już istnieje")               |
| 5xx    | Globalny error banner "Wystąpił błąd serwera"                 |

### 12.3 Refresh tokenów

- Access token w pamięci
- Refresh token w localStorage (jeśli "Zapamiętaj mnie") lub sessionStorage
- Automatyczny refresh przy 401 przez interceptor
- Po failed refresh → wylogowanie

---

## 13. Konfiguracja i środowiska

### 13.1 Environment files

```typescript
// environment.ts (development)
export const environment = {
  production: false,
  apiUrl: "http://localhost:3000/api/v1",
  supabaseUrl: "http://localhost:54321",
  supabaseAnonKey: "local-anon-key",
  gaTrackingId: "", // wyłączone w dev
};

// environment.prod.ts (production)
export const environment = {
  production: true,
  apiUrl: "/api/v1",
  supabaseUrl: "https://xxx.supabase.co",
  supabaseAnonKey: "prod-anon-key",
  gaTrackingId: "G-XXXXXXXXXX",
};
```

### 13.2 Stałe aplikacji

```typescript
// core/constants/app.constants.ts
export const LIMITS = {
  MAX_INVOICE_ITEMS: 50,
  MAX_LOGO_SIZE_MB: 2,
  MAX_NOTE_LENGTH: 1000,
  MAX_ITEM_NAME_LENGTH: 200,
  DEFAULT_PAYMENT_DAYS: 14,
};

export const ROUTES = {
  HOME: "/",
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  INVOICES: "/invoices",
  CONTRACTORS: "/contractors",
  PROFILE: "/profile",
};
```

```typescript
// core/constants/invoice.constants.ts
export const VAT_RATES = [
  { value: 23, label: "23%" },
  { value: 8, label: "8%" },
  { value: 5, label: "5%" },
  { value: 0, label: "0%" },
  { value: "zw", label: "zw." },
] as const;

export const INVOICE_STATUSES = {
  DRAFT: "draft",
  UNPAID: "unpaid",
  PAID: "paid",
} as const;

export const UNITS = [
  "szt.",
  "godz.",
  "usł.",
  "kg",
  "m",
  "m²",
  "m³",
  "kpl.",
  "opak.",
];
```

---

## 14. Testowanie

### 14.1 Testy jednostkowe (Vitest)

```typescript
// Przykład testu komponentu
describe("InvoiceListComponent", () => {
  it("should display empty state when no invoices", async () => {
    // ...
  });

  it("should filter invoices by status", async () => {
    // ...
  });
});

// Przykład testu walidatora
describe("nipValidator", () => {
  it("should return null for valid NIP", () => {
    const control = new FormControl("5261040828");
    expect(nipValidator(control)).toBeNull();
  });

  it("should return error for invalid checksum", () => {
    const control = new FormControl("1234567890");
    expect(nipValidator(control)).toEqual({ invalidNip: true });
  });
});
```

### 14.2 Testy E2E (Playwright)

```typescript
// e2e/specs/invoice-flow.spec.ts
test.describe("Invoice creation flow", () => {
  test("should create invoice and generate PDF", async ({ page }) => {
    await page.goto("/auth/login");
    // login...
    await page.goto("/invoices/new");
    // fill form...
    await page.click('button:has-text("Zapisz")');
    await expect(page).toHaveURL(/\/invoices\/[\w-]+$/);
    await page.click('button:has-text("Generuj PDF")');
    // verify download...
  });
});
```

---

## 15. Dostępność (a11y)

### 15.1 Wymagania

- Wszystkie formularze z `<mat-label>` i `aria-describedby` dla błędów
- Focusable elements z widocznym focus ring
- `aria-live` regions dla dynamicznych komunikatów
- Kontrast kolorów min. 4.5:1
- Keyboard navigation dla wszystkich interakcji
- Skip link do głównej treści

### 15.2 Animacje

- Respektowanie `prefers-reduced-motion`
- Minimalistyczne animacje: fade-in, slide-in dla sidenav
- Material ripple dla feedback przy klikaniu

---

## 16. Wydajność

### 16.1 Optymalizacje

- Lazy loading dla feature routes
- `pdfmake` jako dynamic import (ładowane na żądanie)
- Tree shaking Angular Material
- `trackBy` w pętlach `@for`
- Preloading strategy: `PreloadAllModules`

### 16.2 Cele

- Initial bundle: <500KB gzipped
- First Contentful Paint: <3s
- Time to Interactive: <5s
- PDF generation: <5s

---

## 17. Analityka (GA4)

### 17.1 Śledzone eventy

| Event                | Trigger              |
| -------------------- | -------------------- |
| `sign_up`            | Pomyślna rejestracja |
| `login`              | Pomyślne logowanie   |
| `invoice_created`    | Utworzenie faktury   |
| `invoice_edited`     | Edycja faktury       |
| `pdf_generated`      | Pobranie PDF         |
| `contractor_created` | Dodanie kontrahenta  |

### 17.2 Implementacja

```typescript
// core/services/analytics.service.ts
@Injectable({ providedIn: "root" })
export class AnalyticsService {
  trackEvent(eventName: string, params?: Record<string, unknown>) {
    if (environment.production && typeof gtag !== "undefined") {
      gtag("event", eventName, params);
    }
  }
}
```

---

## 18. Deployment

### 18.1 Build

```bash
ng build --configuration=production
```

### 18.2 Docker

```dockerfile
# Multi-stage build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration=production

FROM nginx:alpine
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

### 18.3 Nginx config

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://backend:3000/api/;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 19. Podsumowanie decyzji

### Zatwierdzone

| #     | Decyzja                                                          |
| ----- | ---------------------------------------------------------------- |
| 1     | Płaska nawigacja z sidenav, hamburger na mobile                  |
| 2     | Formularz faktury jako osobny widok (nie modal)                  |
| 3     | Onboarding z redirect do /profile dla nowych użytkowników        |
| 4     | Signal Store + Reactive Forms dla formularza faktury             |
| 5     | mat-autocomplete dla wyboru kontrahenta                          |
| 6     | Wizualne badge dla statusów faktur                               |
| 7     | GlobalErrorHandler + inline errors w formularzach                |
| 8     | Paginacja serwerowa z mat-paginator                              |
| 9     | pdfmake w Web Worker                                             |
| 10    | Landing page z CTA, bez nawigacji app                            |
| 11    | Standalone components, lazy loading przez loadComponent          |
| 12    | JWT w pamięci, refresh w storage, auto-refresh przez interceptor |
| 13    | Read-only widok szczegółów z przyciskami akcji                   |
| 14    | Duplikowanie → redirect do edycji nowej faktury                  |
| 15    | Custom nipValidator z sumą kontrolną                             |
| 16    | Mobile-first, karty zamiast tabel na małych ekranach             |
| 17    | UserStore, ContractorsStore z cache TTL                          |
| 19    | Upload logo z drag&drop i podglądem                              |
| 20    | CanDeactivateGuard + beforeunload                                |
| 21    | NotificationService wrapper dla MatSnackBar                      |
| 22    | Feature-based folder structure                                   |
| 23    | InvoiceItemsTableComponent z FormArray                           |
| 24    | Konfigurowalny format numeru faktury                             |
| 25    | Dialog do szybkiego dodania kontrahenta                          |
| 26    | Confirm dialog przed usunięciem                                  |
| 27    | Quick filters + date range + sortowanie w URL                    |
| 28    | Sticky footer z podsumowaniem kwot                               |
| 29    | VAT rates dropdown z "zw."                                       |
| 30    | mat-datepicker z polskim locale                                  |
| 31    | PdfGeneratorService z layoutem A4                                |
| 32    | Skeleton loaders, lokalne spinnery                               |
| 33    | Functional guards (authGuard, guestGuard, profileCompleteGuard)  |
| 34    | NotFoundComponent jako catch-all route                           |
| 35    | Reactive forms z real-time walidacją                             |
| 36    | 3-ekranowy flow resetowania hasła                                |
| 37    | Toolbar z logo, nazwą firmy, avatar menu                         |
| 38    | mat-sidenav responsive (side/over)                               |
| 39    | Polski locale dla dat i walut                                    |
| 40    | WCAG a11y: labels, focus, aria-live, kontrast                    |
| 41    | Komunikacja: Input/Output signals, stores dla cross-feature      |
| 43    | EmptyStateComponent z CTA                                        |
| 44    | InvoicePrintPreviewComponent (podgląd A4)                        |
| 45    | Multi-level protection dla niekompletnego profilu                |
| 46    | ContractorSelectComponent z autocomplete                         |
| 47    | Token refresh przez interceptor, redirect przy fail              |
| 48    | Vitest dla unit testów                                           |
| 49    | Filtry i paginacja w URL query params                            |
| 50    | Optymalny flow od rejestracji do pierwszego PDF                  |
| 51    | AmountToWordsService dla kwoty słownie                           |
| 52    | Łańcuch interceptorów (auth, error, loading)                     |
| 53    | ConfirmDialogComponent reusable                                  |
| 54    | Soft delete kontrahentów, buyer snapshot na fakturze             |
| 55    | FormErrorService mapujący błędy API na pola                      |
| 56    | Responsywny profil z sekcjami w kartach                          |
| 57    | ibanValidator z MOD-97                                           |
| 58    | Przycisk "Wróć" z Location.back()                                |
| 59    | Dialog przy konflikcie edycji (odśwież/nadpisz)                  |
| 61    | Modele w src/app/models/ z barrel export                         |
| 62    | Wizualne oznaczenie przeterminowanych faktur                     |
| 63    | CopyToClipboardDirective                                         |
| 64    | Seller snapshot, opcja "Odśwież dane sprzedawcy"                 |
| 65    | Pole unit z predefiniowaną listą jednostek                       |
| 66    | Async validator unikalności numeru faktury                       |
| 67    | Przycisk "Drukuj" z window.print() (nice-to-have)                |
| 68    | Resource API dla GET, HttpClient dla mutacji                     |
| 69    | Angular Material theme (primary, accent, warn)                   |
| 70    | Welcome modal dla first-time users                               |
| 71-74 | Resource API szczegóły, stany, invalidacja, query params         |
| 75    | Pole "Miejsce wystawienia"                                       |
| 76    | Wyświetlanie createdAt, updatedAt (bez audit log)                |
| 77    | Eksport CSV jako future feature (disabled button)                |
| 78    | Limity w constants (MAX_INVOICE_ITEMS: 50)                       |
| 79    | Environment files dla dev/prod                                   |
| 80    | SEO meta tagi dla landing page                                   |
| 81    | Minimalistyczne animacje, prefers-reduced-motion                 |
| 82    | Validators w shared/validators/                                  |
| 83    | Ekrany dla email verification i reset password                   |
| 84    | Lazy loading obrazów, fallback dla brak logo                     |
| 85    | Timeout config, progress bar dla upload                          |
| 86    | Playwright E2E dla kluczowych flows                              |
| 87    | Loading state dla formularzy wielosekcyjnych                     |
| 89    | GlobalErrorHandler dla nieoczekiwanych błędów                    |
| 90    | PreloadAllModules strategy                                       |
| 91    | UUID w URL, numer faktury tylko do wyświetlania                  |
| 92    | trackBy dla listy pozycji, limit 50                              |
| 93    | InvoiceValidationService.validateForIssuing()                    |
| 94    | Tabela → karty na mobile (<600px)                                |
| 96    | Flat routes z reużywalnym InvoiceFormComponent                   |
| 97    | Autofocus, keyboard navigation, Enter submit                     |
| 98    | LoadingButtonComponent z spinner                                 |
| 99    | Zachowanie danych formularza przy błędzie                        |
| 101   | GA4 integracja z kluczowymi eventami                             |
| 102   | Wsparcie Chrome, Firefox, Safari, Edge                           |
| 103   | Bundle optimization, dynamic import dla pdfmake                  |
| 104   | ng build + Nginx w Docker                                        |
| 105   | Nginx reverse proxy dla API                                      |
| 106   | Checkbox "Zapamiętaj mnie"                                       |
| 107   | Czyszczenie stores przy wylogowaniu                              |
| 108   | Wersja aplikacji w UI                                            |
| 109   | Focus management po zamknięciu dialogu                           |
| 110   | Disable buttons podczas operacji, debounce                       |
| 111   | Constants i enums jako const objects                             |
| 113   | CSS custom properties dla spacing                                |
| 114   | Bezwzględne daty (dd.MM.yyyy)                                    |
| 115   | Material Icons, mapping ICONS const                              |

### Pominięte (nie implementować w MVP)

| #   | Funkcjonalność                                     |
| --- | -------------------------------------------------- |
| 18  | Auto-save drafts do localStorage / offline support |
| 42  | Synchronizacja między kartami przeglądarki         |
| 60  | Footer aplikacji i strona kontaktowa               |
| 88  | Maskowanie pól NIP/IBAN                            |
| 95  | Obsługa maintenance/downtime                       |
| 112 | Obsługa zablokowanych cookies/localStorage         |
