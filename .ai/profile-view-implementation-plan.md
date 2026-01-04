# Plan implementacji widoku Profil firmy i strony 404

## 1. Przegląd

Ten dokument opisuje plan implementacji dwóch widoków:

1. **Profil firmy (`/profile`)** - widok zarządzania danymi firmy użytkownika, umożliwiający konfigurację danych wyświetlanych na fakturach (nazwa firmy, NIP, adres, dane bankowe), upload logo oraz ustawienia formatu numeracji faktur. Jest to kluczowy widok dla onboardingu nowych użytkowników - bez uzupełnionego profilu nie można wystawiać faktur.

2. **Strona 404 (`/**`)\*\* - catch-all widok dla nieistniejących ścieżek, zapewniający przyjazną obsługę błędnych URL i kierujący użytkowników z powrotem do głównej części aplikacji.

### 1.1 Cel widoku Profil firmy

- Umożliwienie użytkownikowi wprowadzenia i edycji danych firmy
- Walidacja NIP i IBAN zgodnie z polskimi standardami
- Upload i zarządzanie logo firmy
- Konfiguracja formatu numeracji faktur
- Wskazanie użytkownikowi, które dane są wymagane do wystawienia faktury

### 1.2 Cel strony 404

- Poinformowanie użytkownika o nieistniejącej stronie
- Przekierowanie do właściwej części aplikacji (dashboard dla zalogowanych, landing page dla niezalogowanych)

---

## 2. Routing widoku

### 2.1 Profil firmy

```typescript
{
  path: 'profile',
  loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
  canActivate: [authGuard],
  canDeactivate: [canDeactivateGuard],
  title: 'Profil firmy - Fakturologia'
}
```

| Właściwość        | Wartość                                                     |
| ----------------- | ----------------------------------------------------------- |
| **Ścieżka**       | `/profile`                                                  |
| **Guard wejścia** | `authGuard` - wymaga zalogowania                            |
| **Guard wyjścia** | `canDeactivateGuard` - ostrzeżenie o niezapisanych zmianach |

### 2.2 Strona 404

```typescript
{
  path: '**',
  loadComponent: () => import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent),
  title: '404 - Strona nie znaleziona - Fakturologia'
}
```

| Właściwość  | Wartość                                        |
| ----------- | ---------------------------------------------- |
| **Ścieżka** | `/**` (catch-all, ostatnia w definicji routes) |
| **Guard**   | Brak - widok dostępny dla wszystkich           |

---

## 3. Struktura komponentów

### 3.1 Hierarchia komponentów Profilu

```
ProfileComponent (kontener główny)
├── mat-card: Dane firmy
│   ├── mat-form-field: companyName
│   ├── mat-form-field: nip
│   ├── mat-form-field: address
│   └── ProfileCompletenessIndicatorComponent
├── mat-card: Dane bankowe
│   └── mat-form-field: bankAccount (IBAN)
├── mat-card: Logo firmy
│   └── LogoUploadComponent
│       ├── Drag & Drop zone
│       ├── Preview
│       └── Progress bar
├── mat-card: Ustawienia faktur
│   ├── mat-form-field: invoiceNumberFormat
│   └── InvoiceNumberPreviewComponent
├── mat-card: Prywatność i dane (RODO)
│   ├── mat-button: Pobierz moje dane
│   └── mat-button: Usuń konto
└── Sticky footer z przyciskami akcji
    ├── mat-button: Anuluj
    └── LoadingButtonComponent: Zapisz zmiany
```

### 3.2 Hierarchia komponentów Strony 404

```
NotFoundComponent
├── Grafika/ilustracja 404
├── Nagłówek "Strona nie znaleziona"
├── Opis
└── mat-button: Przejdź do strony głównej
```

---

## 4. Szczegóły komponentów

### 4.1 ProfileComponent

**Opis:**
Główny komponent widoku profilu firmy. Zawiera formularz podzielony na logiczne sekcje (karty Material) umożliwiający edycję wszystkich danych profilu. Zarządza stanem formularza, komunikacją z API i obsługą błędów.

**Główne elementy:**

- `mat-card` - karty grupujące powiązane pola
- `form` z `[formGroup]` - Reactive Form zawierający wszystkie pola
- `mat-form-field` z `mat-input` - pola tekstowe
- `mat-error` - komunikaty błędów walidacji
- `LoadingButtonComponent` - przycisk zapisu ze stanem ładowania
- `LogoUploadComponent` - komponent uploadu logo
- `InvoiceNumberPreviewComponent` - podgląd przykładowego numeru faktury

**Obsługiwane interakcje:**

- Edycja pól formularza
- Submit formularza (zapis zmian)
- Reset formularza (anulowanie zmian)
- Nawigacja poza stronę (z ostrzeżeniem o niezapisanych zmianach)

**Obsługiwana walidacja:**

- `companyName`: wymagane (required), tekst
- `nip`: opcjonalne, dokładnie 10 cyfr, walidacja sumy kontrolnej NIP
- `address`: opcjonalne, tekst
- `bankAccount`: opcjonalne, format IBAN, max 32 znaki
- `invoiceNumberFormat`: opcjonalne, musi zawierać placeholder `{NNN}`

**Typy:**

- `UserProfileResponse` - dane pobierane z API
- `UpdateUserProfileCommand` - dane wysyłane do API
- `ProfileFormValue` - lokalny typ formularza

**Propsy:** Brak (komponent top-level)

---

### 4.2 LogoUploadComponent

**Opis:**
Reużywalny komponent do uploadu logo firmy z obsługą drag & drop, podglądem i progress barem. Obsługuje walidację typu pliku (PNG, JPG) i rozmiaru (max 2MB).

**Główne elementy:**

- `div` z dyrektywą drag & drop - strefa upuszczania plików
- `input[type=file]` ukryty - alternatywny wybór pliku
- `img` - podgląd aktualnego/wgrywanego logo
- `mat-progress-bar` - pasek postępu uploadu
- `mat-icon-button` - przyciski akcji (usuń, zmień)

**Obsługiwane interakcje:**

- Przeciągnij i upuść plik na strefę
- Kliknij, aby wybrać plik z dysku
- Kliknij "Usuń" aby usunąć aktualne logo
- Kliknij "Zmień" aby zastąpić aktualne logo

**Obsługiwana walidacja:**

- Typ pliku: tylko `image/png`, `image/jpeg`
- Rozmiar pliku: maksymalnie 2MB (2 _ 1024 _ 1024 bajtów)
- Walidacja po stronie klienta przed wysłaniem do API

**Typy:**

- `UploadLogoResponse` - odpowiedź API z URL logo
- `MessageResponse` - odpowiedź API przy usunięciu logo

**Propsy (interfejs komponentu):**

```typescript
interface LogoUploadComponentInputs {
  currentLogoUrl: InputSignal<string | null>; // Aktualny URL logo z profilu
  isLoading: InputSignal<boolean>; // Stan ładowania
}

interface LogoUploadComponentOutputs {
  logoUploaded: OutputEmitterRef<string>; // Emituje nowy URL po uploadzie
  logoDeleted: OutputEmitterRef<void>; // Emituje gdy logo usunięte
  uploadError: OutputEmitterRef<string>; // Emituje komunikat błędu
}
```

---

### 4.3 InvoiceNumberPreviewComponent

**Opis:**
Komponent wyświetlający podgląd przykładowego numeru faktury na podstawie wprowadzonego formatu. Pokazuje użytkownikowi, jak będzie wyglądał rzeczywisty numer faktury.

**Główne elementy:**

- `div` z przykładowym numerem faktury
- Informacja o dostępnych placeholderach

**Obsługiwane interakcje:** Brak (komponent czysto prezentacyjny)

**Obsługiwana walidacja:** Brak

**Typy:**

- `string` - format numeru faktury

**Propsy:**

```typescript
interface InvoiceNumberPreviewComponentInputs {
  format: InputSignal<string>; // Format numeru, np. "FV/{YYYY}/{MM}/{NNN}"
  counter: InputSignal<number>; // Aktualny licznik numeracji
}
```

---

### 4.4 ProfileCompletenessIndicatorComponent

**Opis:**
Komponent wizualizujący kompletność profilu. Wyświetla pasek postępu i listę brakujących pól wymaganych do wystawienia faktury. Szczególnie istotny podczas onboardingu.

**Główne elementy:**

- `mat-progress-bar` - pasek postępu (determinate)
- Lista checkboxów/ikon dla każdego wymaganego pola
- Komunikat o stanie kompletności

**Obsługiwane interakcje:** Brak (komponent czysto prezentacyjny)

**Obsługiwana walidacja:** Brak

**Typy:**

- `ProfileCompletenessState` - stan kompletności profilu

**Propsy:**

```typescript
interface ProfileCompletenessIndicatorInputs {
  profile: InputSignal<UserProfileResponse | null>; // Dane profilu do analizy
}
```

---

### 4.5 NotFoundComponent

**Opis:**
Komponent strony 404 wyświetlany dla nieistniejących ścieżek. Zapewnia przyjazną informację i nawigację z powrotem do aplikacji.

**Główne elementy:**

- Grafika/ilustracja 404 (SVG lub ikona Material)
- `h1` - nagłówek "Strona nie znaleziona"
- `p` - opis sytuacji
- `mat-button` - przycisk nawigacji do strony głównej

**Obsługiwane interakcje:**

- Kliknięcie przycisku "Przejdź do strony głównej"
  - Dla zalogowanych: nawigacja do `/invoices`
  - Dla niezalogowanych: nawigacja do `/`

**Obsługiwana walidacja:** Brak

**Typy:** Brak specyficznych typów

**Propsy:** Brak

---

## 5. Typy

### 5.1 Typy z API (istniejące w types.ts)

```typescript
// Odpowiedź GET /api/v1/users/profile
interface UserProfileResponse {
  id: string;
  email: string;
  companyName: string | null;
  address: string | null;
  nip: string | null;
  bankAccount: string | null;
  logoUrl: string | null;
  invoiceNumberFormat: string;
  invoiceNumberCounter: number;
  createdAt: string;
  updatedAt: string;
}

// Żądanie PUT /api/v1/users/profile
interface UpdateUserProfileCommand {
  companyName?: string;
  address?: string;
  nip?: string;
  bankAccount?: string;
  invoiceNumberFormat?: string;
}

// Odpowiedź POST /api/v1/users/profile/logo
interface UploadLogoResponse {
  logoUrl: string;
}

// Odpowiedź DELETE /api/v1/users/profile/logo
interface MessageResponse {
  message: string;
}

// Kody błędów profilu
type ProfileErrorCode =
  | "PROFILE_NOT_FOUND"
  | "INVALID_NIP"
  | "INVALID_IBAN"
  | "INVALID_NUMBER_FORMAT"
  | "INVALID_FILE_TYPE"
  | "FILE_TOO_LARGE"
  | "LOGO_NOT_FOUND";
```

### 5.2 Typy lokalne (nowe do utworzenia)

```typescript
// features/profile/models/profile-form.model.ts

/**
 * Typ wartości formularza profilu.
 * Mapuje pola formularza Reactive Forms.
 */
interface ProfileFormValue {
  companyName: string;
  nip: string;
  address: string;
  bankAccount: string;
  invoiceNumberFormat: string;
}

/**
 * Stan kompletności profilu dla wskaźnika.
 */
interface ProfileCompletenessState {
  isComplete: boolean;
  completionPercentage: number;
  missingFields: ProfileRequiredField[];
}

/**
 * Wymagane pola profilu do wystawienia faktury.
 */
type ProfileRequiredField = "companyName" | "nip" | "address";

/**
 * Konfiguracja pola wymaganego z etykietą.
 */
interface RequiredFieldConfig {
  field: ProfileRequiredField;
  label: string;
  isFilled: boolean;
}

/**
 * Stan uploadu logo.
 */
interface LogoUploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
}

/**
 * Stan formularza profilu.
 */
interface ProfileFormState {
  isLoading: boolean;
  isSaving: boolean;
  isDirty: boolean;
  error: string | null;
}
```

### 5.3 Walidatory (z shared/validators)

```typescript
// shared/validators/nip.validator.ts
/**
 * Walidator NIP sprawdzający:
 * - Format: dokładnie 10 cyfr
 * - Suma kontrolna zgodna z algorytmem NIP
 */
function nipValidator(): ValidatorFn;

// shared/validators/iban.validator.ts
/**
 * Walidator IBAN sprawdzający:
 * - Format: 2 litery + 2 cyfry + do 30 znaków alfanumerycznych
 * - Suma kontrolna MOD-97
 */
function ibanValidator(): ValidatorFn;

// shared/validators/invoice-number-format.validator.ts
/**
 * Walidator formatu numeru faktury sprawdzający:
 * - Obecność placeholdera {NNN}
 * - Opcjonalne placeholdery: {YYYY}, {MM}, {DD}
 */
function invoiceNumberFormatValidator(): ValidatorFn;
```

---

## 6. Zarządzanie stanem

### 6.1 UserStore (Signal Store)

Profil użytkownika jest zarządzany globalnie przez `UserStore`. Komponent `ProfileComponent` korzysta z tego store'a do:

- Pobrania początkowych danych profilu
- Aktualizacji stanu po zapisie zmian
- Sprawdzenia kompletności profilu

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
    profileCompleteness: computed(() => {
      const p = store.profile();
      const requiredFields: ProfileRequiredField[] = [
        "companyName",
        "nip",
        "address",
      ];
      const filledCount = requiredFields.filter((field) => !!p?.[field]).length;
      return {
        isComplete: filledCount === requiredFields.length,
        completionPercentage: Math.round(
          (filledCount / requiredFields.length) * 100
        ),
        missingFields: requiredFields.filter((field) => !p?.[field]),
      };
    }),
  })),
  withMethods((store, userService = inject(UserService)) => ({
    async loadProfile(): Promise<void> {
      /* ... */
    },
    async updateProfile(data: UpdateUserProfileCommand): Promise<void> {
      /* ... */
    },
    async uploadLogo(file: File): Promise<string> {
      /* ... */
    },
    async deleteLogo(): Promise<void> {
      /* ... */
    },
  }))
);
```

### 6.2 Stan lokalny w ProfileComponent

```typescript
// features/profile/profile.component.ts
@Component({...})
export class ProfileComponent {
  private userStore = inject(UserStore);
  private fb = inject(FormBuilder);

  // Stan formularza
  profileForm = this.fb.group({
    companyName: ['', [Validators.required]],
    nip: ['', [Validators.pattern(/^\d{10}$/), nipValidator()]],
    address: [''],
    bankAccount: ['', [Validators.maxLength(32), ibanValidator()]],
    invoiceNumberFormat: ['FV/{YYYY}/{NNN}', [invoiceNumberFormatValidator()]],
  });

  // Sygnały stanu
  isSaving = signal(false);
  formError = signal<string | null>(null);

  // Computed
  isDirty = computed(() => this.profileForm.dirty);
  canSave = computed(() => this.profileForm.valid && this.isDirty());

  // Z UserStore
  profile = this.userStore.profile;
  isLoading = this.userStore.isLoading;
  isProfileComplete = this.userStore.isProfileComplete;
  profileCompleteness = this.userStore.profileCompleteness;
}
```

### 6.3 CanDeactivateGuard

```typescript
// core/guards/can-deactivate.guard.ts
export interface CanDeactivateComponent {
  canDeactivate(): boolean | Observable<boolean>;
}

export const canDeactivateGuard: CanDeactivateFn<CanDeactivateComponent> = (
  component
) => {
  if (component.canDeactivate()) {
    return true;
  }

  const dialog = inject(MatDialog);
  return dialog
    .open(ConfirmDialogComponent, {
      data: {
        title: "Niezapisane zmiany",
        message: "Masz niezapisane zmiany. Czy na pewno chcesz opuścić stronę?",
        confirmText: "Opuść",
        cancelText: "Zostań",
      },
    })
    .afterClosed();
};
```

---

## 7. Integracja API

### 7.1 UserService

```typescript
// services/user.service.ts
@Injectable({ providedIn: "root" })
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = "/api/v1/users";

  /**
   * Pobiera profil użytkownika.
   * GET /api/v1/users/profile
   * @returns UserProfileResponse
   */
  getProfile(): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(`${this.apiUrl}/profile`);
  }

  /**
   * Aktualizuje profil użytkownika.
   * PUT /api/v1/users/profile
   * @param data - UpdateUserProfileCommand
   * @returns UserProfileResponse
   */
  updateProfile(
    data: UpdateUserProfileCommand
  ): Observable<UserProfileResponse> {
    return this.http.put<UserProfileResponse>(`${this.apiUrl}/profile`, data);
  }

  /**
   * Uploaduje logo firmy.
   * POST /api/v1/users/profile/logo
   * @param file - plik obrazu (PNG, JPG, max 2MB)
   * @returns UploadLogoResponse
   */
  uploadLogo(file: File): Observable<HttpEvent<UploadLogoResponse>> {
    const formData = new FormData();
    formData.append("file", file);
    return this.http.post<UploadLogoResponse>(
      `${this.apiUrl}/profile/logo`,
      formData,
      {
        reportProgress: true,
        observe: "events",
      }
    );
  }

  /**
   * Usuwa logo firmy.
   * DELETE /api/v1/users/profile/logo
   * @returns MessageResponse
   */
  deleteLogo(): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.apiUrl}/profile/logo`);
  }
}
```

### 7.2 Obsługa odpowiedzi API

| Endpoint             | Sukces | Akcja po sukcesie                                              |
| -------------------- | ------ | -------------------------------------------------------------- |
| GET /profile         | 200    | Wypełnienie formularza, aktualizacja UserStore                 |
| PUT /profile         | 200    | Snackbar "Zapisano", aktualizacja UserStore, reset dirty state |
| POST /profile/logo   | 200    | Aktualizacja podglądu logo, UserStore                          |
| DELETE /profile/logo | 200    | Usunięcie podglądu, aktualizacja UserStore                     |

---

## 8. Interakcje użytkownika

### 8.1 Profil firmy

| Interakcja                      | Element UI               | Akcja                                               |
| ------------------------------- | ------------------------ | --------------------------------------------------- |
| Wpisanie tekstu                 | `mat-form-field`         | Aktualizacja wartości FormControl, walidacja inline |
| Fokus na polu                   | `mat-form-field`         | Podświetlenie, ewentualna pomoc kontekstowa         |
| Blur z pola z błędem            | `mat-form-field`         | Wyświetlenie `mat-error`                            |
| Kliknięcie "Zapisz"             | `LoadingButtonComponent` | Walidacja → API call → snackbar                     |
| Kliknięcie "Anuluj"             | `mat-button`             | Reset formularza do stanu z UserStore               |
| Przeciągnięcie pliku            | Drag zone                | Walidacja → upload → preview                        |
| Kliknięcie "Usuń logo"          | `mat-icon-button`        | Confirm dialog → API call → usunięcie preview       |
| Opuszczenie strony z dirty form | Nawigacja                | CanDeactivate dialog                                |
| Zmiana formatu numeru           | `mat-form-field`         | Aktualizacja preview numeru faktury                 |

### 8.2 Strona 404

| Interakcja                             | Element UI   | Akcja                                  |
| -------------------------------------- | ------------ | -------------------------------------- |
| Kliknięcie "Przejdź do strony głównej" | `mat-button` | Router navigate do `/invoices` lub `/` |

---

## 9. Warunki i walidacja

### 9.1 Walidacja pól formularza

| Pole                  | Warunek              | Komunikat błędu                      | Komponent        |
| --------------------- | -------------------- | ------------------------------------ | ---------------- |
| `companyName`         | required             | "Nazwa firmy jest wymagana"          | ProfileComponent |
| `nip`                 | pattern `/^\d{10}$/` | "NIP musi składać się z 10 cyfr"     | ProfileComponent |
| `nip`                 | customValidator      | "Nieprawidłowa suma kontrolna NIP"   | ProfileComponent |
| `bankAccount`         | maxLength(32)        | "Numer konta może mieć max 32 znaki" | ProfileComponent |
| `bankAccount`         | customValidator      | "Nieprawidłowy format IBAN"          | ProfileComponent |
| `invoiceNumberFormat` | customValidator      | "Format musi zawierać {NNN}"         | ProfileComponent |

### 9.2 Walidacja uploadu logo

| Warunek             | Komunikat błędu                 | Komponent           |
| ------------------- | ------------------------------- | ------------------- |
| Typ pliku ≠ PNG/JPG | "Dozwolone formaty: PNG, JPG"   | LogoUploadComponent |
| Rozmiar > 2MB       | "Maksymalny rozmiar pliku: 2MB" | LogoUploadComponent |

### 9.3 Walidacja kompletności profilu

Wymagane pola do wystawienia faktury:

- `companyName` - nazwa firmy
- `nip` - NIP firmy
- `address` - adres firmy

Wskaźnik kompletności wyświetla procent wypełnienia i listę brakujących pól.

### 9.4 Algorytm walidacji NIP

```typescript
function validateNipChecksum(nip: string): boolean {
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  const digits = nip.split("").map(Number);
  const sum = weights.reduce(
    (acc, weight, idx) => acc + weight * digits[idx],
    0
  );
  return sum % 11 === digits[9];
}
```

### 9.5 Algorytm walidacji IBAN

```typescript
function validateIban(iban: string): boolean {
  // Usuń spacje i zamień na wielkie litery
  const normalized = iban.replace(/\s/g, "").toUpperCase();
  // Przenieś 4 pierwsze znaki na koniec
  const rearranged = normalized.slice(4) + normalized.slice(0, 4);
  // Zamień litery na liczby (A=10, B=11, ...)
  const numeric = rearranged.replace(/[A-Z]/g, (char) =>
    (char.charCodeAt(0) - 55).toString()
  );
  // Sprawdź MOD 97
  return BigInt(numeric) % 97n === 1n;
}
```

---

## 10. Obsługa błędów

### 10.1 Błędy API

| Kod błędu               | Status HTTP  | Obsługa w UI                                        |
| ----------------------- | ------------ | --------------------------------------------------- |
| `UNAUTHORIZED`          | 401          | Przekierowanie do `/auth/login` (przez interceptor) |
| `PROFILE_NOT_FOUND`     | 404          | Snackbar error + log, utworzenie pustego profilu    |
| `INVALID_NIP`           | 400          | `mat-error` pod polem NIP                           |
| `INVALID_IBAN`          | 400          | `mat-error` pod polem bankAccount                   |
| `INVALID_NUMBER_FORMAT` | 400          | `mat-error` pod polem invoiceNumberFormat           |
| `INVALID_FILE_TYPE`     | 400          | Snackbar error w LogoUploadComponent                |
| `FILE_TOO_LARGE`        | 400          | Snackbar error w LogoUploadComponent                |
| `LOGO_NOT_FOUND`        | 404          | Snackbar warning, odświeżenie stanu                 |
| 5xx                     | Server error | Snackbar "Wystąpił błąd serwera" + retry button     |

### 10.2 Błędy walidacji client-side

- Wyświetlanie błędów inline pod polami (`mat-error`)
- Blokowanie przycisku "Zapisz" gdy formularz invalid
- Podświetlenie błędnych pól na czerwono

### 10.3 Błędy sieciowe

- Retry mechanizm dla GET (3 próby z exponential backoff)
- Dla mutacji: wyświetlenie błędu, zachowanie danych w formularzu
- Offline detection: informacja o braku połączenia

### 10.4 Mapowanie błędów API na pola formularza

```typescript
// services/form-error.service.ts
@Injectable({ providedIn: "root" })
export class FormErrorService {
  applyServerErrors(form: FormGroup, errors: ApiError[]): void {
    const errorMap: Record<string, string> = {
      INVALID_NIP: "nip",
      INVALID_IBAN: "bankAccount",
      INVALID_NUMBER_FORMAT: "invoiceNumberFormat",
    };

    errors.forEach((error) => {
      const controlName = errorMap[error.code];
      if (controlName && form.get(controlName)) {
        form.get(controlName)!.setErrors({ serverError: error.message });
      }
    });
  }
}
```

---

## 11. Kroki implementacji

### Faza 1: Przygotowanie infrastruktury

1. **Utworzenie walidatorów** (`shared/validators/`)

   - `nip.validator.ts` - walidacja formatu i sumy kontrolnej NIP
   - `iban.validator.ts` - walidacja formatu IBAN
   - `invoice-number-format.validator.ts` - walidacja placeholdera {NNN}
   - Testy jednostkowe dla walidatorów

2. **Utworzenie UserService** (`services/user.service.ts`)

   - Metody: `getProfile()`, `updateProfile()`, `uploadLogo()`, `deleteLogo()`
   - Obsługa progress dla uploadu

3. **Rozszerzenie UserStore** (`stores/user.store.ts`)
   - Dodanie computed signals: `isProfileComplete`, `profileCompleteness`
   - Metody zarządzania profilem

### Faza 2: Komponenty współdzielone

4. **LogoUploadComponent** (`shared/components/logo-upload/`)

   - Template z drag & drop zone
   - Walidacja typu i rozmiaru pliku
   - Progress bar
   - Podgląd obrazu
   - Przyciski akcji (usuń, zmień)

5. **InvoiceNumberPreviewComponent** (`features/profile/components/`)

   - Generowanie przykładowego numeru na podstawie formatu
   - Wyświetlanie dostępnych placeholderów

6. **ProfileCompletenessIndicatorComponent** (`features/profile/components/`)
   - Pasek postępu
   - Lista wymaganych pól ze statusem

### Faza 3: Główny komponent profilu

7. **ProfileComponent** (`features/profile/`)

   - Struktura formularza z Reactive Forms
   - Sekcje w `mat-card`
   - Integracja z UserStore
   - Obsługa zapisu i błędów
   - Implementacja `CanDeactivateComponent`

8. **Stylowanie i responsywność**
   - Mobile-first layout
   - Breakpointy dla desktop/tablet/mobile
   - Sticky footer z przyciskami

### Faza 4: Strona 404

9. **NotFoundComponent** (`shared/components/not-found/`)
   - Grafika/ilustracja
   - Tekst informacyjny
   - Przycisk nawigacji (z logiką dla zalogowanych/niezalogowanych)

### Faza 5: Routing i guards

10. **Konfiguracja routingu**
    - Dodanie route `/profile`
    - Dodanie catch-all route `**`
    - Integracja `canDeactivateGuard`

### Faza 6: Testy

11. **Testy jednostkowe** (Vitest)

    - Walidatory (100% coverage)
    - UserService (mockowanie HttpClient)
    - UserStore (testowanie computed signals)
    - ProfileComponent (formularz, walidacja)
    - LogoUploadComponent (drag & drop, walidacja plików)

12. **Testy E2E** (Playwright)
    - Flow uzupełniania profilu przez nowego użytkownika
    - Edycja istniejących danych
    - Upload i usunięcie logo
    - Ostrzeżenie o niezapisanych zmianach
    - Nawigacja na stronę 404

### Faza 7: Finalizacja

13. **Code review i refaktoryzacja**

    - Przegląd kodu
    - Optymalizacja wydajności
    - Dokumentacja komponentów

14. **Integracja z onboardingiem**
    - Weryfikacja działania `profileCompleteGuard`
    - Test flow przekierowania nowego użytkownika
    - Komunikat powitalny dla nowych użytkowników

---

## Podsumowanie

Plan implementacji obejmuje stworzenie kompletnego widoku Profilu firmy z pełną walidacją danych (NIP, IBAN, format numeru faktury), uploadem logo oraz wskaźnikiem kompletności profilu. Dodatkowo implementowana jest przyjazna strona 404.

Kluczowe aspekty:

- **Walidacja**: Zgodna z polskimi standardami (NIP, IBAN)
- **UX**: Wskaźnik kompletności, ostrzeżenie o niezapisanych zmianach, drag & drop dla logo
- **Responsywność**: Mobile-first approach z breakpointami Angular Material
- **Bezpieczeństwo**: Walidacja plików, obsługa błędów API
- **Testowanie**: Minimum 70% coverage dla logiki biznesowej

Szacowany czas implementacji: 3-4 dni robocze (przy założeniu, że infrastruktura bazowa jest gotowa).
