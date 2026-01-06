# Plan implementacji widoku Contractors

## 1. Przegląd

Moduł Contractors zapewnia pełne zarządzanie kontrahentami (nabywcami faktur) dla uwierzytelnionego użytkownika. Widok składa się z dwóch głównych komponentów: listy kontrahentów z wyszukiwaniem, paginacją i sortowaniem oraz formularza tworzenia/edycji kontrahenta z walidacją polskiego NIP.

Główne funkcjonalności:

- Wyświetlanie listy kontrahentów z paginacją serwerową
- Wyszukiwanie kontrahentów po nazwie lub NIP
- Sortowanie listy po nazwie, dacie utworzenia lub modyfikacji
- Tworzenie nowych kontrahentów z walidacją NIP
- Edycja istniejących kontrahentów
- Usuwanie kontrahentów (soft delete) z dialogiem potwierdzenia
- Cache kontrahentów z TTL 5 minut w ContractorsStore

## 2. Routing widoku

| Ścieżka                 | Komponent                 | Opis                                           |
| ----------------------- | ------------------------- | ---------------------------------------------- |
| `/contractors`          | `ContractorListComponent` | Lista kontrahentów z paginacją i wyszukiwaniem |
| `/contractors/new`      | `ContractorFormComponent` | Formularz tworzenia nowego kontrahenta         |
| `/contractors/:id/edit` | `ContractorFormComponent` | Formularz edycji istniejącego kontrahenta      |

Wszystkie ścieżki są chronione przez `authGuard`.

```typescript
// fragment app.routes.ts
{
  path: 'contractors',
  canActivate: [authGuard],
  children: [
    {
      path: '',
      loadComponent: () => import('./features/contractors/contractor-list.component')
        .then(m => m.ContractorListComponent)
    },
    {
      path: 'new',
      loadComponent: () => import('./features/contractors/contractor-form.component')
        .then(m => m.ContractorFormComponent),
      canDeactivate: [canDeactivateGuard]
    },
    {
      path: ':id/edit',
      loadComponent: () => import('./features/contractors/contractor-form.component')
        .then(m => m.ContractorFormComponent),
      canDeactivate: [canDeactivateGuard]
    }
  ]
}
```

## 3. Struktura komponentów

```
ContractorsModule/
├── ContractorListComponent (standalone)
│   ├── mat-toolbar (wyszukiwarka + przycisk "Nowy kontrahent")
│   ├── mat-table (lista kontrahentów)
│   ├── mat-paginator
│   └── EmptyStateComponent (gdy brak kontrahentów)
│
├── ContractorFormComponent (standalone)
│   ├── mat-card (wrapper formularza)
│   ├── reactive form (name, address, nip)
│   └── LoadingButtonComponent (przycisk zapisz)
│
└── Shared/
    ├── ConfirmDialogComponent (dialog usuwania)
    └── EmptyStateComponent (puste stany)
```

### Drzewo komponentów

```
MainLayoutComponent
└── <router-outlet>
    ├── ContractorListComponent
    │   ├── PageHeaderComponent ("Kontrahenci" + przycisk)
    │   ├── mat-form-field (wyszukiwarka)
    │   ├── mat-table
    │   │   └── [dla każdego wiersza] mat-icon-button (edycja, usuń)
    │   ├── mat-paginator
    │   └── EmptyStateComponent (warunkowo)
    │
    └── ContractorFormComponent
        ├── PageHeaderComponent ("Nowy kontrahent" / "Edycja kontrahenta")
        ├── mat-card
        │   └── form
        │       ├── mat-form-field (name) *required
        │       ├── mat-form-field (address)
        │       └── mat-form-field (nip) + walidacja
        └── mat-card-actions
            ├── button (Anuluj)
            └── LoadingButtonComponent (Zapisz)
```

## 4. Szczegóły komponentów

### 4.1 ContractorListComponent

**Opis komponentu:**
Główny widok listy kontrahentów z wyszukiwarką, tabelą z paginacją i akcjami dla każdego wiersza. Wykorzystuje `ContractorsStore` do cache'owania danych oraz `ContractorService` z Resource API do pobierania listy.

**Główne elementy HTML:**

- `mat-toolbar` z polem wyszukiwania (`mat-form-field` + `mat-icon` search) i przyciskiem "Nowy kontrahent"
- `mat-table` z kolumnami: Nazwa, Adres, NIP, Data utworzenia, Akcje
- `mat-paginator` z opcjami 10/20/50 elementów na stronę
- `EmptyStateComponent` gdy lista jest pusta (z CTA "Dodaj pierwszego kontrahenta")

**Obsługiwane interakcje:**

- Wpisanie tekstu w wyszukiwarkę → debounce 300ms → wywołanie API z parametrem `search`
- Kliknięcie nagłówka kolumny → zmiana sortowania (`sortBy`, `sortOrder`)
- Zmiana strony w paginatorze → wywołanie API z nowymi parametrami `page`, `limit`
- Kliknięcie "Nowy kontrahent" → nawigacja do `/contractors/new`
- Kliknięcie ikony edycji → nawigacja do `/contractors/:id/edit`
- Kliknięcie ikony usuwania → otwarcie `ConfirmDialogComponent`, po potwierdzeniu wywołanie DELETE

**Obsługiwana walidacja:**

- Brak walidacji formularza (tylko wyświetlanie danych)

**Typy:**

- `ContractorListResponse` - odpowiedź API z listą kontrahentów
- `ContractorListQuery` - parametry zapytania (page, limit, search, sortBy, sortOrder)
- `ContractorResponse` - pojedynczy kontrahent w liście
- `PaginationInfo` - metadane paginacji

**Propsy:**

- Komponent nie przyjmuje propsów (standalone, pobiera dane z serwisu)

### 4.2 ContractorFormComponent

**Opis komponentu:**
Formularz tworzenia i edycji kontrahenta. Wykorzystuje Angular Reactive Forms z walidacją NIP. W trybie edycji pobiera dane kontrahenta po ID z URL.

**Główne elementy HTML:**

- `mat-card` jako wrapper
- `form[formGroup]` z polami:
  - `mat-form-field` dla `name` (wymagane, max 255 znaków)
  - `mat-form-field` dla `address` (opcjonalne, max 500 znaków)
  - `mat-form-field` dla `nip` (opcjonalne, walidacja formatu i sumy kontrolnej)
- `mat-card-actions`:
  - `button mat-button` "Anuluj" → nawigacja wstecz
  - `LoadingButtonComponent` "Zapisz" → submit formularza

**Obsługiwane interakcje:**

- Wprowadzenie danych w pola formularza
- Kliknięcie "Anuluj" → nawigacja do `/contractors` (z dialogiem jeśli są niezapisane zmiany)
- Kliknięcie "Zapisz" → walidacja, wywołanie POST/PUT, nawigacja do listy
- Blur na polu NIP → normalizacja (usunięcie myślników/spacji)

**Obsługiwana walidacja:**

- `name`: required, maxLength(255)
- `address`: maxLength(500)
- `nip`: custom validator `nipValidator` (10 cyfr, prawidłowa suma kontrolna)

**Komunikaty błędów:**

- `name`: "Nazwa kontrahenta jest wymagana"
- `nip`: "Nieprawidłowy format NIP" lub "Nieprawidłowa suma kontrolna NIP"
- Błąd API `NIP_EXISTS`: "Kontrahent z tym NIP już istnieje" (link do istniejącego)

**Typy:**

- `CreateContractorCommand` - dane do utworzenia kontrahenta
- `UpdateContractorCommand` - dane do aktualizacji kontrahenta
- `ContractorResponse` - odpowiedź po zapisie
- `ContractorFormViewModel` - model widoku formularza

**Propsy:**

- Komponent nie przyjmuje propsów (dane z ActivatedRoute)

### 4.3 ConfirmDialogComponent (shared)

**Opis komponentu:**
Reużywalny dialog potwierdzenia akcji z konfigurowalnym tytułem, wiadomością i przyciskami.

**Główne elementy HTML:**

- `mat-dialog-content` z tytułem i wiadomością
- `mat-dialog-actions` z przyciskami Anuluj/Potwierdź

**Obsługiwane interakcje:**

- Kliknięcie "Anuluj" → zamknięcie dialogu z wynikiem `false`
- Kliknięcie "Potwierdź" → zamknięcie dialogu z wynikiem `true`

**Typy:**

- `ConfirmDialogData` - dane wejściowe dialogu

**Propsy (poprzez MAT_DIALOG_DATA):**

- `title: string` - tytuł dialogu
- `message: string` - treść wiadomości
- `confirmText?: string` - tekst przycisku potwierdzenia (domyślnie "Usuń")
- `cancelText?: string` - tekst przycisku anulowania (domyślnie "Anuluj")
- `confirmColor?: 'primary' | 'warn'` - kolor przycisku (domyślnie "warn")

### 4.4 EmptyStateComponent (shared)

**Opis komponentu:**
Komponent wyświetlany gdy lista jest pusta, z ikoną, tytułem, opisem i opcjonalnym CTA.

**Główne elementy HTML:**

- `mat-icon` (duża ikona ilustracyjna)
- `h2` z tytułem
- `p` z opisem
- opcjonalny `button mat-raised-button` jako CTA

**Typy:**

- `EmptyStateConfig` - konfiguracja komponentu

**Propsy:**

- `icon: string` - nazwa ikony Material
- `title: string` - tytuł
- `description: string` - opis
- `actionLabel?: string` - tekst przycisku CTA
- `actionRoute?: string` - ścieżka nawigacji po kliknięciu CTA

## 5. Typy

### 5.1 Typy z API (types.ts)

```typescript
// Odpowiedź pojedynczego kontrahenta
export interface ContractorResponse {
  id: string;
  name: string;
  address: string | null;
  nip: string | null;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// Odpowiedź listy kontrahentów
export interface ContractorListResponse {
  data: ContractorResponse[];
  pagination: PaginationInfo;
}

// Parametry zapytania listy
export interface ContractorListQuery {
  page?: number; // domyślnie 1
  limit?: number; // domyślnie 20, max 100
  search?: string; // wyszukiwanie po nazwie lub NIP
  sortBy?: "name" | "createdAt" | "updatedAt"; // domyślnie 'createdAt'
  sortOrder?: "asc" | "desc"; // domyślnie 'desc'
}

// Komenda tworzenia kontrahenta
export interface CreateContractorCommand {
  name: string; // wymagane, max 255 znaków
  address?: string; // opcjonalne, max 500 znaków
  nip?: string; // opcjonalne, 10 cyfr, walidacja sumy kontrolnej
}

// Komenda aktualizacji kontrahenta
export interface UpdateContractorCommand {
  name?: string;
  address?: string;
  nip?: string;
}

// Informacje o paginacji
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Odpowiedź usuwania
export type DeleteContractorResponse = MessageResponse;

export interface MessageResponse {
  message: string;
}
```

### 5.2 Typy widoku (ViewModel)

```typescript
// Model stanu listy kontrahentów
export interface ContractorListState {
  contractors: ContractorResponse[];
  pagination: PaginationInfo;
  isLoading: boolean;
  error: string | null;
  query: ContractorListQuery;
}

// Model formularza kontrahenta
export interface ContractorFormViewModel {
  name: string;
  address: string;
  nip: string;
}

// Dane dialogu potwierdzenia
export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: "primary" | "warn";
}

// Konfiguracja pustego stanu
export interface EmptyStateConfig {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionRoute?: string;
}

// Stan formularza (dla canDeactivate guard)
export interface FormDirtyState {
  isDirty: boolean;
}
```

### 5.3 Typy błędów API

```typescript
// Kody błędów specyficzne dla kontrahentów
export type ContractorErrorCode =
  | "CONTRACTOR_NOT_FOUND"
  | "INVALID_NIP"
  | "NAME_REQUIRED"
  | "NIP_EXISTS";

// Struktura błędu API
export interface ApiError {
  statusCode: number;
  code: string;
  message: string;
  errors?: FieldError[];
  timestamp: string;
}

export interface FieldError {
  field: string;
  message: string;
}
```

## 6. Zarządzanie stanem

### 6.1 ContractorsStore (Signal Store)

```typescript
// stores/contractors.store.ts
import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  patchState,
} from "@ngrx/signals";

interface ContractorsState {
  contractors: ContractorResponse[];
  isLoading: boolean;
  lastFetched: number | null; // timestamp
  error: string | null;
}

const initialState: ContractorsState = {
  contractors: [],
  isLoading: false,
  lastFetched: null,
  error: null,
};

export const ContractorsStore = signalStore(
  { providedIn: "root" },
  withState(initialState),
  withComputed((store) => ({
    // Cache jest ważny przez 5 minut
    shouldRefetch: computed(() => {
      const lastFetched = store.lastFetched();
      if (!lastFetched) return true;
      return Date.now() - lastFetched > 5 * 60 * 1000;
    }),
    // Liczba kontrahentów
    contractorsCount: computed(() => store.contractors().length),
  })),
  withMethods((store, contractorService = inject(ContractorService)) => ({
    // Załaduj kontrahentów (z cache lub świeże)
    async loadContractors(query: ContractorListQuery, force = false) {
      if (!force && !store.shouldRefetch()) {
        return; // użyj cache
      }
      patchState(store, { isLoading: true, error: null });
      try {
        const response = await contractorService.getContractors(query);
        patchState(store, {
          contractors: response.data,
          isLoading: false,
          lastFetched: Date.now(),
        });
      } catch (error) {
        patchState(store, {
          error: error.message,
          isLoading: false,
        });
      }
    },

    // Invaliduj cache (po CUD operacjach)
    invalidateCache() {
      patchState(store, { lastFetched: null });
    },

    // Usuń kontrahenta z lokalnego stanu
    removeContractor(id: string) {
      patchState(store, {
        contractors: store.contractors().filter((c) => c.id !== id),
      });
    },
  }))
);
```

### 6.2 Stan lokalny komponentów

**ContractorListComponent:**

```typescript
// Signals lokalne
readonly searchQuery = signal('');
readonly currentPage = signal(1);
readonly pageSize = signal(20);
readonly sortBy = signal<'name' | 'createdAt' | 'updatedAt'>('createdAt');
readonly sortOrder = signal<'asc' | 'desc'>('desc');

// Computed query params
readonly queryParams = computed(() => ({
  page: this.currentPage(),
  limit: this.pageSize(),
  search: this.searchQuery() || undefined,
  sortBy: this.sortBy(),
  sortOrder: this.sortOrder()
}));
```

**ContractorFormComponent:**

```typescript
// Reactive Form
readonly contractorForm = new FormGroup({
  name: new FormControl('', [Validators.required, Validators.maxLength(255)]),
  address: new FormControl('', [Validators.maxLength(500)]),
  nip: new FormControl('', [nipValidator])
});

// Signals
readonly isEditMode = signal(false);
readonly contractorId = signal<string | null>(null);
readonly isLoading = signal(false);
readonly isSaving = signal(false);
```

## 7. Integracja API

### 7.1 ContractorService

```typescript
// services/contractor.service.ts
@Injectable({ providedIn: "root" })
export class ContractorService {
  private http = inject(HttpClient);
  private readonly baseUrl = "/api/v1/contractors";

  // GET - Lista kontrahentów (można użyć httpResource)
  getContractors(
    query: ContractorListQuery
  ): Observable<ContractorListResponse> {
    const params = new HttpParams()
      .set("page", query.page?.toString() ?? "1")
      .set("limit", query.limit?.toString() ?? "20")
      .set("sortBy", query.sortBy ?? "createdAt")
      .set("sortOrder", query.sortOrder ?? "desc");

    if (query.search) {
      params.set("search", query.search);
    }

    return this.http.get<ContractorListResponse>(this.baseUrl, { params });
  }

  // GET - Pojedynczy kontrahent
  getContractor(id: string): Observable<ContractorResponse> {
    return this.http.get<ContractorResponse>(`${this.baseUrl}/${id}`);
  }

  // POST - Utworzenie kontrahenta
  createContractor(
    data: CreateContractorCommand
  ): Observable<ContractorResponse> {
    return this.http.post<ContractorResponse>(this.baseUrl, data);
  }

  // PUT - Aktualizacja kontrahenta
  updateContractor(
    id: string,
    data: UpdateContractorCommand
  ): Observable<ContractorResponse> {
    return this.http.put<ContractorResponse>(`${this.baseUrl}/${id}`, data);
  }

  // DELETE - Usunięcie kontrahenta (soft delete)
  deleteContractor(id: string): Observable<DeleteContractorResponse> {
    return this.http.delete<DeleteContractorResponse>(`${this.baseUrl}/${id}`);
  }
}
```

### 7.2 Mapowanie żądań i odpowiedzi

| Akcja                | Metoda HTTP | URL                       | Request Type                         | Response Type              |
| -------------------- | ----------- | ------------------------- | ------------------------------------ | -------------------------- |
| Lista kontrahentów   | GET         | `/api/v1/contractors`     | `ContractorListQuery` (query params) | `ContractorListResponse`   |
| Pobranie kontrahenta | GET         | `/api/v1/contractors/:id` | -                                    | `ContractorResponse`       |
| Utworzenie           | POST        | `/api/v1/contractors`     | `CreateContractorCommand`            | `ContractorResponse`       |
| Aktualizacja         | PUT         | `/api/v1/contractors/:id` | `UpdateContractorCommand`            | `ContractorResponse`       |
| Usunięcie            | DELETE      | `/api/v1/contractors/:id` | -                                    | `DeleteContractorResponse` |

## 8. Interakcje użytkownika

### 8.1 Lista kontrahentów

| Interakcja                   | Element UI                 | Akcja                                              | Rezultat                                  |
| ---------------------------- | -------------------------- | -------------------------------------------------- | ----------------------------------------- |
| Wpisanie w wyszukiwarkę      | `mat-form-field`           | Debounce 300ms → aktualizacja `searchQuery` signal | Przeładowanie listy z parametrem `search` |
| Kliknięcie nagłówka kolumny  | `mat-header-cell`          | Toggle `sortOrder` lub zmiana `sortBy`             | Przeładowanie listy z nowym sortowaniem   |
| Zmiana strony                | `mat-paginator`            | Aktualizacja `currentPage`                         | Przeładowanie listy                       |
| Zmiana liczby elementów      | `mat-paginator`            | Aktualizacja `pageSize`, reset `currentPage` do 1  | Przeładowanie listy                       |
| Kliknięcie "Nowy kontrahent" | `button mat-raised-button` | `router.navigate(['/contractors/new'])`            | Nawigacja do formularza                   |
| Kliknięcie ikony edycji      | `mat-icon-button`          | `router.navigate(['/contractors', id, 'edit'])`    | Nawigacja do formularza edycji            |
| Kliknięcie ikony usuwania    | `mat-icon-button`          | Otwarcie `ConfirmDialogComponent`                  | Dialog potwierdzenia                      |
| Potwierdzenie usunięcia      | `ConfirmDialogComponent`   | `DELETE /contractors/:id`                          | Usunięcie z listy, snackbar sukcesu       |
| Kliknięcie wiersza           | `mat-row`                  | `router.navigate(['/contractors', id, 'edit'])`    | Nawigacja do edycji                       |

### 8.2 Formularz kontrahenta

| Interakcja                        | Element UI                | Akcja                                | Rezultat                      |
| --------------------------------- | ------------------------- | ------------------------------------ | ----------------------------- |
| Wprowadzenie nazwy                | `mat-form-field[name]`    | Aktualizacja FormControl             | Walidacja required            |
| Wprowadzenie adresu               | `mat-form-field[address]` | Aktualizacja FormControl             | Walidacja maxLength           |
| Wprowadzenie NIP                  | `mat-form-field[nip]`     | Aktualizacja FormControl             | Walidacja nipValidator        |
| Blur na NIP                       | `mat-form-field[nip]`     | Normalizacja (usunięcie separatorów) | NIP bez myślników/spacji      |
| Kliknięcie "Anuluj"               | `button mat-button`       | Sprawdzenie dirty state              | Dialog lub nawigacja do listy |
| Kliknięcie "Zapisz"               | `LoadingButtonComponent`  | Walidacja → POST/PUT                 | Nawigacja do listy + snackbar |
| Próba opuszczenia z niezapisanymi | Browser navigation        | `canDeactivateGuard`                 | Dialog potwierdzenia          |

## 9. Warunki i walidacja

### 9.1 Walidacja formularza kontrahenta

| Pole      | Walidator                   | Warunek                             | Komunikat błędu                          |
| --------- | --------------------------- | ----------------------------------- | ---------------------------------------- |
| `name`    | `Validators.required`       | Pole nie może być puste             | "Nazwa kontrahenta jest wymagana"        |
| `name`    | `Validators.maxLength(255)` | Max 255 znaków                      | "Nazwa może mieć maksymalnie 255 znaków" |
| `address` | `Validators.maxLength(500)` | Max 500 znaków                      | "Adres może mieć maksymalnie 500 znaków" |
| `nip`     | `nipValidator`              | 10 cyfr + prawidłowa suma kontrolna | "Nieprawidłowy NIP"                      |

### 9.2 Custom validator NIP

```typescript
// shared/validators/nip.validator.ts
export function nipValidator(
  control: AbstractControl
): ValidationErrors | null {
  const value = control.value;

  if (!value) {
    return null; // pole opcjonalne
  }

  // Normalizacja - usuń myślniki i spacje
  const normalized = value.replace(/[-\s]/g, "");

  // Sprawdź czy 10 cyfr
  if (!/^\d{10}$/.test(normalized)) {
    return { nip: { message: "NIP musi składać się z 10 cyfr" } };
  }

  // Walidacja sumy kontrolnej
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  const checksum =
    weights.reduce(
      (sum, weight, i) => sum + weight * parseInt(normalized[i], 10),
      0
    ) % 11;

  if (checksum !== parseInt(normalized[9], 10)) {
    return { nip: { message: "Nieprawidłowa suma kontrolna NIP" } };
  }

  return null;
}
```

### 9.3 Walidacja po stronie API

| Kod błędu              | HTTP Status | Pole   | Opis                                    |
| ---------------------- | ----------- | ------ | --------------------------------------- |
| `NAME_REQUIRED`        | 400         | `name` | Brak wymaganej nazwy                    |
| `INVALID_NIP`          | 400         | `nip`  | Nieprawidłowy format lub suma kontrolna |
| `NIP_EXISTS`           | 409         | `nip`  | NIP już istnieje dla tego użytkownika   |
| `CONTRACTOR_NOT_FOUND` | 404         | -      | Kontrahent nie istnieje                 |

### 9.4 Mapowanie błędów API na formularz

```typescript
// W komponencie formularza
private handleApiError(error: ApiError): void {
  if (error.code === 'NIP_EXISTS') {
    this.contractorForm.get('nip')?.setErrors({
      nipExists: { message: 'Kontrahent z tym NIP już istnieje' }
    });
    return;
  }

  if (error.errors) {
    error.errors.forEach(fieldError => {
      const control = this.contractorForm.get(fieldError.field);
      if (control) {
        control.setErrors({ serverError: { message: fieldError.message } });
      }
    });
  }
}
```

## 10. Obsługa błędów

### 10.1 Błędy sieciowe

| Scenariusz                | Akcja                  | Komunikat użytkownika                                         |
| ------------------------- | ---------------------- | ------------------------------------------------------------- |
| Brak połączenia           | Snackbar error         | "Brak połączenia z serwerem. Sprawdź połączenie internetowe." |
| Timeout (30s)             | Snackbar error + retry | "Przekroczono czas oczekiwania. Spróbuj ponownie."            |
| 500 Internal Server Error | Snackbar error         | "Wystąpił błąd serwera. Spróbuj ponownie później."            |

### 10.2 Błędy biznesowe

| Kod błędu                    | Akcja               | Komunikat użytkownika                                     |
| ---------------------------- | ------------------- | --------------------------------------------------------- |
| `UNAUTHORIZED` (401)         | Redirect do login   | "Sesja wygasła. Zaloguj się ponownie."                    |
| `CONTRACTOR_NOT_FOUND` (404) | Redirect do listy   | "Kontrahent nie został znaleziony."                       |
| `NIP_EXISTS` (409)           | Inline error + link | "Kontrahent z tym NIP już istnieje. [Zobacz kontrahenta]" |
| `INVALID_NIP` (400)          | Inline error        | "Nieprawidłowy format NIP"                                |
| `NAME_REQUIRED` (400)        | Inline error        | "Nazwa kontrahenta jest wymagana"                         |

### 10.3 Implementacja obsługi błędów

```typescript
// W komponencie
async saveContractor(): Promise<void> {
  if (this.contractorForm.invalid) {
    this.contractorForm.markAllAsTouched();
    this.scrollToFirstError();
    return;
  }

  this.isSaving.set(true);

  try {
    const data = this.prepareFormData();

    if (this.isEditMode()) {
      await firstValueFrom(
        this.contractorService.updateContractor(this.contractorId()!, data)
      );
      this.notificationService.success('Kontrahent został zaktualizowany');
    } else {
      await firstValueFrom(
        this.contractorService.createContractor(data)
      );
      this.notificationService.success('Kontrahent został utworzony');
    }

    this.contractorsStore.invalidateCache();
    this.router.navigate(['/contractors']);

  } catch (error) {
    if (this.isApiError(error)) {
      this.handleApiError(error);
    } else {
      this.notificationService.error('Wystąpił nieoczekiwany błąd');
    }
  } finally {
    this.isSaving.set(false);
  }
}
```

### 10.4 Guard dla niezapisanych zmian

```typescript
// guards/can-deactivate.guard.ts
export const canDeactivateGuard: CanDeactivateFn<FormDirtyState> = (
  component
) => {
  if (component.isDirty) {
    return inject(ConfirmDialogService).confirm({
      title: "Niezapisane zmiany",
      message:
        "Masz niezapisane zmiany. Czy na pewno chcesz opuścić tę stronę?",
      confirmText: "Opuść",
      cancelText: "Zostań",
    });
  }
  return true;
};
```

## 11. Kroki implementacji

### Krok 1: Utworzenie struktury plików (0.5h)

1. Utworzenie katalogów:

   ```
   src/app/features/contractors/
   src/app/stores/contractors.store.ts
   src/app/services/contractor.service.ts
   src/app/shared/validators/nip.validator.ts
   ```

2. Utworzenie pustych plików komponentów:
   - `contractor-list.component.ts`
   - `contractor-form.component.ts`

### Krok 2: Implementacja walidatora NIP (0.5h)

1. Utworzenie `src/app/shared/validators/nip.validator.ts`
2. Implementacja funkcji walidującej format i sumę kontrolną
3. Dodanie testów jednostkowych dla walidatora

### Krok 3: Implementacja ContractorService (1h)

1. Utworzenie serwisu z metodami HTTP
2. Implementacja `getContractors()` z parametrami query
3. Implementacja `getContractor()`, `createContractor()`, `updateContractor()`, `deleteContractor()`
4. Dodanie obsługi błędów

### Krok 4: Implementacja ContractorsStore (1h)

1. Utworzenie Signal Store z początkowym stanem
2. Implementacja computed signals (`shouldRefetch`, `contractorsCount`)
3. Implementacja metod (`loadContractors`, `invalidateCache`, `removeContractor`)
4. Konfiguracja TTL 5 minut dla cache

### Krok 5: Implementacja ContractorListComponent (3h)

1. Utworzenie standalone component z importami Material
2. Implementacja szablonu HTML z mat-table i mat-paginator
3. Podłączenie wyszukiwarki z debounce
4. Implementacja sortowania kolumn
5. Implementacja akcji edycji i usuwania
6. Dodanie EmptyStateComponent dla pustej listy
7. Synchronizacja parametrów z URL (query params)

### Krok 6: Implementacja ContractorFormComponent (2.5h)

1. Utworzenie standalone component
2. Implementacja Reactive Form z walidatorami
3. Logika trybu tworzenia vs edycji (na podstawie route params)
4. Pobieranie danych kontrahenta w trybie edycji
5. Implementacja zapisywania (POST/PUT)
6. Obsługa błędów API z mapowaniem na pola formularza
7. Implementacja `canDeactivate` interface

### Krok 7: Integracja z routingiem (0.5h)

1. Dodanie routes do `app.routes.ts`
2. Konfiguracja `authGuard` i `canDeactivateGuard`
3. Testowanie nawigacji

### Krok 8: Implementacja shared components (1h)

1. `ConfirmDialogComponent` (jeśli nie istnieje)
2. `EmptyStateComponent` (jeśli nie istnieje)
3. `LoadingButtonComponent` (jeśli nie istnieje)

### Krok 9: Stylowanie i responsywność (1h)

1. SCSS dla komponentów
2. Responsywny layout (mobile-first)
3. Obsługa mat-table na małych ekranach

### Krok 10: Testy (2h)

1. Testy jednostkowe dla `nipValidator`
2. Testy jednostkowe dla `ContractorService` (mocks)
3. Testy komponentu `ContractorListComponent`
4. Testy komponentu `ContractorFormComponent`

### Krok 11: Integracja i code review (1h)

1. Połączenie z resztą aplikacji
2. Testowanie end-to-end flow
3. Przegląd kodu i poprawki
4. Aktualizacja dokumentacji

---

## Podsumowanie czasowe

| Krok     | Opis                    | Czas    |
| -------- | ----------------------- | ------- |
| 1        | Struktura plików        | 0.5h    |
| 2        | Walidator NIP           | 0.5h    |
| 3        | ContractorService       | 1h      |
| 4        | ContractorsStore        | 1h      |
| 5        | ContractorListComponent | 3h      |
| 6        | ContractorFormComponent | 2.5h    |
| 7        | Routing                 | 0.5h    |
| 8        | Shared components       | 1h      |
| 9        | Stylowanie              | 1h      |
| 10       | Testy                   | 2h      |
| 11       | Integracja              | 1h      |
| **SUMA** |                         | **14h** |
