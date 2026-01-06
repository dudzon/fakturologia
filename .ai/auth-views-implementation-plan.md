# Plan implementacji widoków autentykacji

## 1. Przegląd

Moduł autentykacji obejmuje pięć widoków publicznych obsługujących pełny cykl życia uwierzytelniania użytkownika w aplikacji Fakturologia:

- **Landing Page** (`/`) - strona powitalna z CTA do rejestracji
- **Logowanie** (`/auth/login`) - uwierzytelnianie istniejących użytkowników
- **Rejestracja** (`/auth/register`) - tworzenie nowych kont
- **Zapomniałem hasła** (`/auth/forgot-password`) - inicjacja procesu resetowania hasła
- **Reset hasła** (`/auth/reset-password`) - ustawienie nowego hasła z tokena

Widoki wykorzystują Angular 21 ze Standalone Components, Angular Material dla UI oraz Reactive Forms z walidacją. Wszystkie strony autentykacji są chronione przez `guestGuard`, który przekierowuje zalogowanych użytkowników do `/invoices`.

---

## 2. Routing widoków

```typescript
// Ścieżki do dodania w app.routes.ts

// Landing Page - główna strona publiczna
{
  path: '',
  loadComponent: () =>
    import('./features/landing/landing-page.component').then(m => m.LandingPageComponent),
  canActivate: [guestGuard],
  title: 'Fakturologia - Proste fakturowanie dla freelancerów'
}

// Moduł autentykacji
{
  path: 'auth',
  canActivate: [guestGuard],
  children: [
    {
      path: 'login',
      loadComponent: () =>
        import('./features/auth/login.component').then(m => m.LoginComponent),
      title: 'Logowanie - Fakturologia'
    },
    {
      path: 'register',
      loadComponent: () =>
        import('./features/auth/register.component').then(m => m.RegisterComponent),
      title: 'Rejestracja - Fakturologia'
    },
    {
      path: 'forgot-password',
      loadComponent: () =>
        import('./features/auth/forgot-password.component').then(m => m.ForgotPasswordComponent),
      title: 'Odzyskiwanie hasła - Fakturologia'
    },
    {
      path: 'reset-password',
      loadComponent: () =>
        import('./features/auth/reset-password.component').then(m => m.ResetPasswordComponent),
      title: 'Resetowanie hasła - Fakturologia'
    }
  ]
}
```

---

## 3. Struktura komponentów

```
src/app/
├── features/
│   ├── landing/
│   │   └── landing-page.component.ts          # Strona powitalna
│   └── auth/
│       ├── login.component.ts                  # Formularz logowania
│       ├── register.component.ts               # Formularz rejestracji
│       ├── forgot-password.component.ts        # Formularz zapomniałem hasła
│       ├── reset-password.component.ts         # Formularz reset hasła
│       └── components/
│           ├── auth-layout.component.ts        # Wrapper dla stron auth
│           ├── password-strength.component.ts  # Wskaźnik siły hasła
│           └── password-requirements.component.ts # Checklist wymagań hasła
├── shared/
│   └── components/
│       └── loading-button/                     # Istniejący komponent
├── core/
│   ├── guards/
│   │   └── guest.guard.ts                      # Guard dla stron publicznych
│   └── services/
│       └── notification.service.ts             # Serwis snackbar
└── services/
    └── auth.service.ts                         # Serwis autentykacji (do rozszerzenia)
```

### Hierarchia komponentów

```
LandingPageComponent
├── Hero Section
├── Features Section
└── Footer

AuthLayoutComponent (wrapper dla wszystkich stron auth)
├── LoginComponent
│   └── LoadingButtonComponent
├── RegisterComponent
│   ├── PasswordStrengthComponent
│   ├── PasswordRequirementsComponent
│   └── LoadingButtonComponent
├── ForgotPasswordComponent
│   └── LoadingButtonComponent
└── ResetPasswordComponent
    ├── PasswordStrengthComponent
    ├── PasswordRequirementsComponent
    └── LoadingButtonComponent
```

---

## 4. Szczegóły komponentów

### 4.1 LandingPageComponent

**Opis:** Strona powitalna aplikacji, odpowiedzialna za prezentację wartości produktu i konwersję odwiedzających na zarejestrowanych użytkowników. Zawiera hero section z głównym CTA, sekcję korzyści z ikonami oraz footer z linkami prawnymi.

**Główne elementy:**

- Header z logo i przyciskami "Zaloguj się" / "Zarejestruj się"
- Hero section z nagłówkiem h1, opisem i przyciskiem CTA "Zarejestruj się za darmo"
- Sekcja features z 3-4 ikonami Material i opisami korzyści
- Opcjonalny screenshot/mockup aplikacji
- Footer z linkami do regulaminu i polityki prywatności (otwierane w nowych kartach)

**Obsługiwane interakcje:**

- Kliknięcie "Zaloguj się" → nawigacja do `/auth/login`
- Kliknięcie "Zarejestruj się" / CTA → nawigacja do `/auth/register`
- Kliknięcie linków prawnych → otwarcie w nowej karcie

**Obsługiwana walidacja:** Brak

**Typy:** Brak specyficznych typów

**Propsy:** Brak (standalone page)

---

### 4.2 AuthLayoutComponent

**Opis:** Wrapper layout dla wszystkich stron autentykacji. Zapewnia spójny wygląd z wycentrowaną kartą formularza, logo aplikacji i opcjonalnym linkiem powrotu.

**Główne elementy:**

- `mat-card` jako kontener formularza
- Logo aplikacji na górze karty
- Slot `<ng-content>` dla treści formularza
- Opcjonalny link powrotu (np. do logowania)

**Obsługiwane interakcje:**

- Kliknięcie logo → nawigacja do `/`

**Obsługiwana walidacja:** Brak

**Typy:** Brak

**Propsy:**

```typescript
interface AuthLayoutProps {
  title: string; // Tytuł strony wyświetlany w karcie
  subtitle?: string; // Opcjonalny podtytuł
}
```

---

### 4.3 LoginComponent

**Opis:** Formularz logowania użytkownika z polami email/hasło, opcją "Zapamiętaj mnie", linkami do rejestracji i resetowania hasła. Obsługuje różne stany błędów (niepoprawne dane, niezweryfikowany email, zablokowane konto).

**Główne elementy:**

- `<form>` z `[formGroup]="loginForm"`
- `mat-form-field` z `input[type=email]` dla emaila
- `mat-form-field` z `input[type=password]` dla hasła
- Przycisk toggle visibility hasła (`mat-icon-button` z `visibility`/`visibility_off`)
- `mat-checkbox` "Zapamiętaj mnie"
- `app-loading-button` "Zaloguj się"
- Link "Zapomniałem hasła" → `/auth/forgot-password`
- Link "Zarejestruj się" → `/auth/register`
- Alert dla błędów (np. niezweryfikowany email z przyciskiem ponownego wysłania)

**Obsługiwane interakcje:**

- Submit formularza → wywołanie `POST /api/v1/auth/login`
- Toggle visibility hasła
- Checkbox "Zapamiętaj mnie" → przechowywanie refresh token w localStorage vs sessionStorage
- Link "Wyślij ponownie" przy błędzie `EMAIL_NOT_VERIFIED`

**Obsługiwana walidacja:**
| Pole | Walidatory | Komunikaty błędów |
|----------|-------------------------|----------------------------------|
| email | required, email | "Email jest wymagany", "Nieprawidłowy format email" |
| password | required | "Hasło jest wymagane" |

**Typy:**

- `LoginRequest` (request body)
- `LoginResponse` (response)
- `LoginFormValue` (wartość formularza)

**Propsy:** Brak (routed component)

---

### 4.4 RegisterComponent

**Opis:** Formularz rejestracji nowego użytkownika z polami email, hasło, potwierdzenie hasła, wskaźnikiem siły hasła, checklistą wymagań hasła oraz checkboxem akceptacji regulaminu.

**Główne elementy:**

- `<form>` z `[formGroup]="registerForm"`
- `mat-form-field` z `input[type=email]` dla emaila
- `mat-form-field` z `input[type=password]` dla hasła
- `app-password-strength` pod polem hasła
- `app-password-requirements` jako live checklist
- `mat-form-field` z `input[type=password]` dla potwierdzenia hasła
- `mat-checkbox` akceptacji regulaminu z linkiem (otwierany w nowej karcie)
- `app-loading-button` "Zarejestruj się"
- Link "Masz już konto? Zaloguj się" → `/auth/login`
- Widok sukcesu: komunikat o wysłaniu emaila weryfikacyjnego

**Obsługiwane interakcje:**

- Input w polu hasła → aktualizacja wskaźnika siły i checklisty
- Submit formularza → wywołanie `POST /api/v1/auth/register`
- Po sukcesie → wyświetlenie komunikatu o weryfikacji email

**Obsługiwana walidacja:**
| Pole | Walidatory | Komunikaty błędów |
|-----------------|-----------------------------------------------|-------------------------------------------------------------|
| email | required, email | "Email jest wymagany", "Nieprawidłowy format email" |
| password | required, minLength(8), pattern | "Hasło jest wymagane", "Hasło musi mieć min. 8 znaków" |
| confirmPassword | required, matchPassword (custom) | "Potwierdzenie hasła jest wymagane", "Hasła nie są zgodne" |
| acceptTerms | requiredTrue | "Musisz zaakceptować regulamin" |

**Typy:**

- `RegisterRequest` (request body)
- `RegisterResponse` (response)
- `RegisterFormValue` (wartość formularza)

**Propsy:** Brak (routed component)

---

### 4.5 ForgotPasswordComponent

**Opis:** Prosty formularz z polem email do inicjacji procesu resetowania hasła. Zawsze wyświetla ten sam komunikat sukcesu (zapobieganie enumeracji emaili). Zawiera cooldown na ponowne wysłanie.

**Główne elementy:**

- `<form>` z `[formGroup]="forgotPasswordForm"`
- `mat-form-field` z `input[type=email]` dla emaila
- `app-loading-button` "Wyślij link resetujący"
- Link "Powrót do logowania" → `/auth/login`
- Po wysłaniu: komunikat sukcesu z odliczaniem do ponownego wysłania (60s)

**Obsługiwane interakcje:**

- Submit formularza → wywołanie `POST /api/v1/auth/forgot-password`
- Po sukcesie → wyświetlenie komunikatu i start cooldownu
- Ponowne wysłanie po upływie cooldownu

**Obsługiwana walidacja:**
| Pole | Walidatory | Komunikaty błędów |
|-------|------------------|------------------------------------------------------|
| email | required, email | "Email jest wymagany", "Nieprawidłowy format email" |

**Typy:**

- `ForgotPasswordRequest` (request body)
- `ForgotPasswordResponse` (response)

**Propsy:** Brak (routed component)

---

### 4.6 ResetPasswordComponent

**Opis:** Formularz ustawienia nowego hasła z pól hasło i potwierdzenie, wskaźnikiem siły oraz walidacją tokena z query params. Obsługuje przypadki nieprawidłowego/wygasłego tokena.

**Główne elementy:**

- Walidacja tokena przy inicjalizacji (z query params)
- Stan błędu tokena: komunikat + link do `/auth/forgot-password`
- `<form>` z `[formGroup]="resetPasswordForm"`
- `mat-form-field` z `input[type=password]` dla nowego hasła
- `app-password-strength` pod polem hasła
- `app-password-requirements` jako live checklist
- `mat-form-field` z `input[type=password]` dla potwierdzenia
- `app-loading-button` "Ustaw nowe hasło"
- Po sukcesie: komunikat + automatyczne przekierowanie do `/auth/login`

**Obsługiwane interakcje:**

- Wejście na stronę → odczyt tokena z query params
- Submit formularza → wywołanie `POST /api/v1/auth/reset-password`
- Po sukcesie → przekierowanie do logowania po 3s
- Link "Wyślij ponownie" przy błędzie `INVALID_TOKEN`

**Obsługiwana walidacja:**
| Pole | Walidatory | Komunikaty błędów |
|-----------------|-----------------------------------|-------------------------------------------------------------|
| password | required, minLength(8), pattern | "Hasło jest wymagane", "Hasło musi mieć min. 8 znaków" |
| confirmPassword | required, matchPassword (custom) | "Potwierdzenie hasła jest wymagane", "Hasła nie są zgodne" |

**Typy:**

- `ResetPasswordRequest` (request body)
- `ResetPasswordResponse` (response)
- `ResetPasswordFormValue` (wartość formularza)

**Propsy:** Brak (routed component)

---

### 4.7 PasswordStrengthComponent

**Opis:** Wizualny wskaźnik siły hasła w formie paska postępu z etykietą tekstową.

**Główne elementy:**

- `mat-progress-bar` z dynamicznym value i color
- Label tekstowy: "Słabe" / "Średnie" / "Silne" / "Bardzo silne"

**Obsługiwane interakcje:** Brak (display only)

**Obsługiwana walidacja:** Brak

**Typy:**

- `PasswordStrength` (enum: 'weak' | 'medium' | 'strong' | 'very-strong')

**Propsy:**

```typescript
interface PasswordStrengthProps {
  password: InputSignal<string>; // Hasło do oceny
}
```

---

### 4.8 PasswordRequirementsComponent

**Opis:** Lista wymagań hasła z ikonami checkmark/cross pokazującymi spełnienie każdego wymagania w czasie rzeczywistym.

**Główne elementy:**

- Lista `<ul>` z elementami wymagań
- `mat-icon` (check_circle / cancel) dla każdego wymagania
- Wymagania: min. 8 znaków, wielka litera, mała litera, cyfra

**Obsługiwane interakcje:** Brak (display only)

**Obsługiwana walidacja:** Brak (tylko prezentacja)

**Typy:**

- `PasswordRequirement` (interface dla pojedynczego wymagania)

**Propsy:**

```typescript
interface PasswordRequirementsProps {
  password: InputSignal<string>; // Hasło do walidacji
}
```

---

## 5. Typy

### 5.1 Typy z types.ts (istniejące)

```typescript
// Request DTOs
interface RegisterRequest {
  email: string;
  password: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface ForgotPasswordRequest {
  email: string;
}

interface ResetPasswordRequest {
  token: string;
  password: string;
}

interface RefreshTokenRequest {
  refreshToken: string;
}

// Response DTOs
interface RegisterResponse {
  message: string;
  userId: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserInfo;
}

interface UserInfo {
  id: string;
  email: string;
}

type ForgotPasswordResponse = MessageResponse;
type ResetPasswordResponse = MessageResponse;
type LogoutResponse = MessageResponse;

interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface MessageResponse {
  message: string;
}

// Error types
interface ErrorResponse {
  statusCode: number;
  code: string;
  message: string;
  errors?: FieldError[];
  timestamp: string;
}

interface FieldError {
  field: string;
  message: string;
}

type AuthErrorCode =
  | "INVALID_EMAIL"
  | "WEAK_PASSWORD"
  | "EMAIL_EXISTS"
  | "INVALID_CREDENTIALS"
  | "EMAIL_NOT_VERIFIED"
  | "ACCOUNT_LOCKED"
  | "INVALID_REFRESH_TOKEN"
  | "INVALID_TOKEN"
  | "UNAUTHORIZED";
```

### 5.2 Nowe typy ViewModel

```typescript
// src/app/features/auth/models/auth.models.ts

/** Wartość formularza logowania */
interface LoginFormValue {
  email: string;
  password: string;
  rememberMe: boolean;
}

/** Wartość formularza rejestracji */
interface RegisterFormValue {
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

/** Wartość formularza resetowania hasła */
interface ResetPasswordFormValue {
  password: string;
  confirmPassword: string;
}

/** Siła hasła */
type PasswordStrength = "weak" | "medium" | "strong" | "very-strong";

/** Pojedyncze wymaganie hasła */
interface PasswordRequirement {
  id: string;
  label: string;
  validator: (password: string) => boolean;
  met: boolean;
}

/** Stan formularza autentykacji */
interface AuthFormState {
  isSubmitting: boolean;
  isSuccess: boolean;
  errorMessage: string | null;
  errorCode: AuthErrorCode | null;
}

/** Konfiguracja wymagań hasła */
const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: "length",
    label: "Minimum 8 znaków",
    validator: (p) => p.length >= 8,
    met: false,
  },
  {
    id: "uppercase",
    label: "Wielka litera",
    validator: (p) => /[A-Z]/.test(p),
    met: false,
  },
  {
    id: "lowercase",
    label: "Mała litera",
    validator: (p) => /[a-z]/.test(p),
    met: false,
  },
  { id: "digit", label: "Cyfra", validator: (p) => /\d/.test(p), met: false },
];
```

---

## 6. Zarządzanie stanem

### 6.1 Stan lokalny komponentów

Każdy komponent formularza zarządza własnym stanem lokalnym używając Angular Signals:

```typescript
// Przykład dla LoginComponent
export class LoginComponent {
  // Reactive Form
  loginForm = new FormGroup({
    email: new FormControl("", [Validators.required, Validators.email]),
    password: new FormControl("", [Validators.required]),
    rememberMe: new FormControl(false),
  });

  // Stan komponentu (signals)
  isSubmitting = signal(false);
  isSuccess = signal(false);
  errorMessage = signal<string | null>(null);
  errorCode = signal<AuthErrorCode | null>(null);
  showPassword = signal(false);

  // Computed
  canSubmit = computed(() => this.loginForm.valid && !this.isSubmitting());
}
```

### 6.2 AuthService (rozszerzenie istniejącego)

Serwis wymaga rozbudowy o metody HTTP do komunikacji z NestJS API:

```typescript
@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = "/api/v1/auth";

  // Istniejące signals
  currentUser = signal<User | null>(null);
  currentSession = signal<Session | null>(null);

  // Nowe computed
  isAuthenticated = computed(() => !!this.currentSession());

  // Metody API
  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.API_URL}/register`, data);
  }

  login(data: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, data);
  }

  logout(): Observable<LogoutResponse> {
    return this.http.post<LogoutResponse>(`${this.API_URL}/logout`, {});
  }

  forgotPassword(
    data: ForgotPasswordRequest
  ): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(
      `${this.API_URL}/forgot-password`,
      data
    );
  }

  resetPassword(data: ResetPasswordRequest): Observable<ResetPasswordResponse> {
    return this.http.post<ResetPasswordResponse>(
      `${this.API_URL}/reset-password`,
      data
    );
  }

  refreshToken(data: RefreshTokenRequest): Observable<RefreshTokenResponse> {
    return this.http.post<RefreshTokenResponse>(
      `${this.API_URL}/refresh`,
      data
    );
  }

  // Zarządzanie tokenami
  setTokens(
    accessToken: string,
    refreshToken: string,
    remember: boolean
  ): void {
    // accessToken w pamięci
    // refreshToken w localStorage (remember) lub sessionStorage
  }

  clearTokens(): void {
    // Czyszczenie tokenów
  }
}
```

### 6.3 NotificationService

```typescript
@Injectable({ providedIn: "root" })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.snackBar.open(message, "OK", {
      duration: 3000,
      panelClass: "snackbar-success",
    });
  }

  error(message: string): void {
    this.snackBar.open(message, "OK", {
      duration: 5000,
      panelClass: "snackbar-error",
    });
  }

  info(message: string): void {
    this.snackBar.open(message, "OK", {
      duration: 3000,
      panelClass: "snackbar-info",
    });
  }
}
```

---

## 7. Integracja API

### 7.1 Endpointy

| Endpoint                       | Metoda | Request Type            | Response Type            | Opis                    |
| ------------------------------ | ------ | ----------------------- | ------------------------ | ----------------------- |
| `/api/v1/auth/register`        | POST   | `RegisterRequest`       | `RegisterResponse`       | Rejestracja użytkownika |
| `/api/v1/auth/login`           | POST   | `LoginRequest`          | `LoginResponse`          | Logowanie               |
| `/api/v1/auth/logout`          | POST   | -                       | `LogoutResponse`         | Wylogowanie             |
| `/api/v1/auth/forgot-password` | POST   | `ForgotPasswordRequest` | `ForgotPasswordResponse` | Żądanie resetu hasła    |
| `/api/v1/auth/reset-password`  | POST   | `ResetPasswordRequest`  | `ResetPasswordResponse`  | Wykonanie resetu hasła  |
| `/api/v1/auth/refresh`         | POST   | `RefreshTokenRequest`   | `RefreshTokenResponse`   | Odświeżenie tokenu      |

### 7.2 Przepływy

**Rejestracja:**

```
1. Użytkownik wypełnia formularz
2. Frontend waliduje dane (email format, hasło min 8 znaków, zgodność haseł, akceptacja regulaminu)
3. POST /api/v1/auth/register
4. Sukces (201): Wyświetl komunikat o wysłaniu emaila weryfikacyjnego
5. Błąd (400/409): Wyświetl komunikat błędu pod formularzem
```

**Logowanie:**

```
1. Użytkownik wypełnia formularz
2. Frontend waliduje dane (wymagane pola)
3. POST /api/v1/auth/login
4. Sukces (200): Zapisz tokeny, przekieruj do /invoices
5. Błąd (400): INVALID_CREDENTIALS - wyświetl komunikat
6. Błąd (403): EMAIL_NOT_VERIFIED - wyświetl alert z opcją ponownego wysłania
7. Błąd (429): ACCOUNT_LOCKED - wyświetl komunikat z informacją o czasie odblokowania
```

**Zapomniałem hasła:**

```
1. Użytkownik wprowadza email
2. Frontend waliduje format emaila
3. POST /api/v1/auth/forgot-password
4. Zawsze wyświetl: "Jeśli konto istnieje, link został wysłany"
5. Uruchom cooldown 60s przed ponownym wysłaniem
```

**Reset hasła:**

```
1. Pobierz token z query params (?token=xxx)
2. Użytkownik wypełnia nowe hasło
3. Frontend waliduje siłę hasła i zgodność
4. POST /api/v1/auth/reset-password
5. Sukces (200): Wyświetl komunikat, przekieruj do /auth/login po 3s
6. Błąd (400): INVALID_TOKEN - wyświetl komunikat z linkiem do ponownego wysłania
```

---

## 8. Interakcje użytkownika

### 8.1 Landing Page

| Interakcja                   | Element                   | Rezultat                                    |
| ---------------------------- | ------------------------- | ------------------------------------------- |
| Kliknięcie "Zaloguj się"     | Przycisk w headerze       | Nawigacja do `/auth/login`                  |
| Kliknięcie "Zarejestruj się" | Przycisk w headerze / CTA | Nawigacja do `/auth/register`               |
| Kliknięcie linku prawnego    | Link w footerze           | Otwarcie regulaminu/polityki w nowej karcie |

### 8.2 Logowanie

| Interakcja               | Element          | Rezultat                                |
| ------------------------ | ---------------- | --------------------------------------- |
| Wpisanie w pole email    | Input email      | Walidacja formatu email                 |
| Wpisanie w pole hasła    | Input password   | Walidacja wymaganego pola               |
| Toggle hasła             | Ikona oka        | Przełączenie visibility hasła           |
| Zaznaczenie "Zapamiętaj" | Checkbox         | Ustawienie flagi remember               |
| Submit formularza        | Przycisk / Enter | Próba logowania, obsługa odpowiedzi     |
| Klik "Zapomniałem hasła" | Link             | Nawigacja do `/auth/forgot-password`    |
| Klik "Zarejestruj się"   | Link             | Nawigacja do `/auth/register`           |
| Klik "Wyślij ponownie"   | Link w alercie   | Ponowne wysłanie emaila weryfikacyjnego |

### 8.3 Rejestracja

| Interakcja             | Element                | Rezultat                                           |
| ---------------------- | ---------------------- | -------------------------------------------------- |
| Wpisanie w pole email  | Input email            | Walidacja formatu email                            |
| Wpisanie w pole hasła  | Input password         | Aktualizacja siły hasła i checklisty wymagań       |
| Wpisanie potwierdzenia | Input confirmPassword  | Walidacja zgodności z hasłem                       |
| Zaznaczenie regulaminu | Checkbox               | Walidacja akceptacji                               |
| Klik linku regulaminu  | Link w labelu checkbox | Otwarcie regulaminu w nowej karcie                 |
| Submit formularza      | Przycisk / Enter       | Próba rejestracji, wyświetlenie komunikatu sukcesu |
| Klik "Zaloguj się"     | Link                   | Nawigacja do `/auth/login`                         |

### 8.4 Zapomniałem hasła

| Interakcja                 | Element                  | Rezultat                                          |
| -------------------------- | ------------------------ | ------------------------------------------------- |
| Wpisanie w pole email      | Input email              | Walidacja formatu email                           |
| Submit formularza          | Przycisk / Enter         | Wysłanie żądania, wyświetlenie komunikatu sukcesu |
| Ponowne wysłanie           | Przycisk (po cooldownie) | Ponowne wysłanie żądania                          |
| Klik "Powrót do logowania" | Link                     | Nawigacja do `/auth/login`                        |

### 8.5 Reset hasła

| Interakcja             | Element                  | Rezultat                                     |
| ---------------------- | ------------------------ | -------------------------------------------- |
| Wejście na stronę      | -                        | Odczyt tokena z URL, walidacja               |
| Wpisanie nowego hasła  | Input password           | Aktualizacja siły hasła i checklisty wymagań |
| Wpisanie potwierdzenia | Input confirmPassword    | Walidacja zgodności z hasłem                 |
| Submit formularza      | Przycisk / Enter         | Reset hasła, przekierowanie do logowania     |
| Klik "Wyślij ponownie" | Link przy błędzie tokena | Nawigacja do `/auth/forgot-password`         |

---

## 9. Warunki i walidacja

### 9.1 Walidacja po stronie frontendu

**Email (wszystkie formularze):**

- Wymagane pole
- Format email (regex lub Validators.email)
- Transformacja: lowercase + trim przed wysłaniem

**Hasło (logowanie):**

- Wymagane pole

**Hasło (rejestracja i reset):**

- Wymagane pole
- Minimum 8 znaków
- Zalecane (UI checklist, nie blokujące): wielka litera, mała litera, cyfra

**Potwierdzenie hasła:**

- Wymagane pole
- Zgodność z hasłem (custom validator)

**Akceptacja regulaminu (rejestracja):**

- Wymagane zaznaczenie (requiredTrue)

### 9.2 Custom validators

```typescript
// src/app/shared/validators/match-password.validator.ts
export function matchPasswordValidator(passwordField: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.parent?.get(passwordField);
    if (password && control.value !== password.value) {
      return { passwordMismatch: true };
    }
    return null;
  };
}
```

### 9.3 Mapowanie błędów API na komunikaty

| Kod błędu API         | Komunikat dla użytkownika                                                    |
| --------------------- | ---------------------------------------------------------------------------- |
| INVALID_EMAIL         | "Nieprawidłowy format adresu email"                                          |
| WEAK_PASSWORD         | "Hasło musi mieć minimum 8 znaków"                                           |
| EMAIL_EXISTS          | "Konto z tym adresem email już istnieje"                                     |
| INVALID_CREDENTIALS   | "Nieprawidłowy email lub hasło"                                              |
| EMAIL_NOT_VERIFIED    | "Zweryfikuj swój adres email przed zalogowaniem"                             |
| ACCOUNT_LOCKED        | "Konto zablokowane z powodu zbyt wielu nieudanych prób. Spróbuj za 15 minut" |
| INVALID_TOKEN         | "Link do resetowania hasła wygasł lub jest nieprawidłowy"                    |
| INVALID_REFRESH_TOKEN | "Sesja wygasła. Zaloguj się ponownie"                                        |

---

## 10. Obsługa błędów

### 10.1 Błędy walidacji (400 Bad Request)

- Wyświetlenie komunikatu pod formularzem (mat-error lub alert)
- Mapowanie kodu błędu na przyjazny komunikat
- Scroll do komunikatu błędu (jeśli poza viewport)

### 10.2 Błędy biznesowe

**EMAIL_EXISTS (409 Conflict):**

- Alert pod formularzem: "Konto z tym adresem email już istnieje. [Zaloguj się]"
- Link do strony logowania

**EMAIL_NOT_VERIFIED (403 Forbidden):**

- Alert z ikoną warning
- Komunikat z opcją ponownego wysłania emaila weryfikacyjnego
- Przycisk "Wyślij ponownie" z cooldownem 60s

**ACCOUNT_LOCKED (429 Too Many Requests):**

- Alert z ikoną error
- Komunikat z informacją o czasie odblokowania
- Zablokowanie przycisku submit na czas blokady

**INVALID_TOKEN (400 Bad Request - reset hasła):**

- Ukrycie formularza
- Wyświetlenie komunikatu o wygaśnięciu linku
- Link do ponownego wysłania: "Wyślij nowy link resetujący"

### 10.3 Błędy sieciowe

**Timeout / Brak połączenia:**

- Snackbar: "Nie można połączyć się z serwerem. Sprawdź połączenie internetowe."
- Przycisk "Spróbuj ponownie" w snackbarze

**Błędy serwera (5xx):**

- Snackbar: "Wystąpił błąd serwera. Spróbuj ponownie później."
- Logowanie błędu do konsoli (development)

### 10.4 Obsługa nieoczekiwanych błędów

```typescript
// W komponentach formularzy
handleError(error: HttpErrorResponse): void {
  this.isSubmitting.set(false);

  if (error.error && typeof error.error === 'object') {
    const apiError = error.error as ErrorResponse;
    this.errorCode.set(apiError.code as AuthErrorCode);
    this.errorMessage.set(this.getErrorMessage(apiError.code));
  } else {
    this.errorMessage.set('Wystąpił nieoczekiwany błąd. Spróbuj ponownie.');
  }
}
```

---

## 11. Kroki implementacji

### Faza 1: Przygotowanie infrastruktury

1. **Utworzenie struktury katalogów:**

   - `src/app/features/landing/`
   - `src/app/features/auth/`
   - `src/app/features/auth/components/`
   - `src/app/features/auth/models/`

2. **Implementacja GuestGuard:**

   - Utworzenie `src/app/core/guards/guest.guard.ts`
   - Sprawdzanie czy użytkownik jest zalogowany
   - Przekierowanie do `/invoices` jeśli zalogowany

3. **Rozszerzenie AuthService:**

   - Dodanie metod HTTP dla wszystkich endpointów auth
   - Implementacja zarządzania tokenami
   - Dodanie computed signal `isAuthenticated`

4. **Implementacja NotificationService:**

   - Utworzenie `src/app/core/services/notification.service.ts`
   - Metody `success()`, `error()`, `info()`

5. **Utworzenie typów:**
   - Utworzenie `src/app/features/auth/models/auth.models.ts`
   - Definicja typów formularzy i ViewModeli

### Faza 2: Komponenty współdzielone

6. **PasswordStrengthComponent:**

   - Input signal dla hasła
   - Obliczanie siły hasła (weak/medium/strong/very-strong)
   - Wyświetlanie mat-progress-bar z odpowiednim kolorem

7. **PasswordRequirementsComponent:**

   - Input signal dla hasła
   - Lista wymagań z ikonami check/cross
   - Live aktualizacja przy zmianie hasła

8. **AuthLayoutComponent:**

   - Input dla tytułu i opcjonalnego podtytułu
   - Mat-card jako kontener
   - Logo i ng-content

9. **Custom validator matchPassword:**
   - Utworzenie `src/app/shared/validators/match-password.validator.ts`

### Faza 3: Widoki autentykacji

10. **LoginComponent:**

    - Reactive form z email, password, rememberMe
    - Toggle visibility hasła
    - Obsługa submitów i błędów
    - Linki do rejestracji i reset hasła
    - Specjalna obsługa EMAIL_NOT_VERIFIED i ACCOUNT_LOCKED

11. **RegisterComponent:**

    - Reactive form z email, password, confirmPassword, acceptTerms
    - Integracja PasswordStrength i PasswordRequirements
    - Obsługa submitów i błędów
    - Widok sukcesu z komunikatem o weryfikacji
    - Link do logowania

12. **ForgotPasswordComponent:**

    - Reactive form z email
    - Cooldown na ponowne wysłanie (60s)
    - Bezpieczny komunikat sukcesu
    - Link do logowania

13. **ResetPasswordComponent:**
    - Pobieranie tokena z query params
    - Reactive form z password, confirmPassword
    - Integracja PasswordStrength i PasswordRequirements
    - Obsługa błędu INVALID_TOKEN
    - Przekierowanie po sukcesie

### Faza 4: Landing Page

14. **LandingPageComponent:**
    - Header z logo i przyciskami auth
    - Hero section z CTA
    - Sekcja features z ikonami Material
    - Footer z linkami prawnymi
    - Responsywny layout (mobile-first)

### Faza 5: Routing i integracja

15. **Aktualizacja app.routes.ts:**

    - Dodanie route dla Landing Page z guestGuard
    - Dodanie routes dla modułu auth z guestGuard
    - Lazy loading dla wszystkich komponentów

16. **Aktualizacja authGuard:**
    - Zmiana redirect z `/login` na `/auth/login`
    - Zachowanie returnUrl w query params

### Faza 6: Testy i finalizacja

17. **Testy jednostkowe (Vitest):**

    - Testy walidatorów (matchPassword)
    - Testy AuthService
    - Testy komponentów formularzy
    - Cel: minimum 70% coverage

18. **Testy manualne:**

    - Wszystkie scenariusze sukcesu
    - Wszystkie scenariusze błędów
    - Responsywność (mobile, tablet, desktop)
    - Accessibility (keyboard navigation, screen reader)

19. **Finalizacja:**
    - Code review
    - Poprawki UX na podstawie testów
    - Dokumentacja komponentów

---

## Podsumowanie

Plan implementacji obejmuje 5 widoków publicznych (Landing Page + 4 strony auth) z następującymi kluczowymi elementami:

- **Bezpieczeństwo:** Walidacja po stronie frontendu i backendu, obsługa rate limiting, bezpieczne przechowywanie tokenów
- **UX:** Live walidacja haseł, przyjazne komunikaty błędów, responsywny design mobile-first
- **Architektura:** Standalone Components, Reactive Forms, Angular Signals, lazy loading
- **Dostępność:** ARIA labels, keyboard navigation, czytelna hierarchia nagłówków

Szacowany czas implementacji: 3-4 dni robocze.
