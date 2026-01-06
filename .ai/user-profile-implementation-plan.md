# API Endpoint Implementation Plan: User Profile Endpoints

## 1. Przegląd punktów końcowych

Moduł User Profile obsługuje zarządzanie profilem użytkownika i danymi firmy sprzedawcy. Obejmuje 4 endpointy:

| Endpoint       | Metoda | Ścieżka                      | Opis                                      |
| -------------- | ------ | ---------------------------- | ----------------------------------------- |
| Get Profile    | GET    | `/api/v1/users/profile`      | Pobiera profil użytkownika z danymi firmy |
| Update Profile | PUT    | `/api/v1/users/profile`      | Aktualizuje dane firmy użytkownika        |
| Upload Logo    | POST   | `/api/v1/users/profile/logo` | Uploaduje/zastępuje logo firmy            |
| Delete Logo    | DELETE | `/api/v1/users/profile/logo` | Usuwa logo firmy                          |

Wszystkie endpointy wymagają uwierzytelnienia poprzez JWT token w nagłówku `Authorization: Bearer <accessToken>`.

---

## 2. Szczegóły żądań

### 2.1 GET `/api/v1/users/profile`

- **Metoda HTTP:** GET
- **Parametry:** Brak
- **Request Body:** Brak
- **Headers:**
  ```
  Authorization: Bearer <accessToken>
  ```

### 2.2 PUT `/api/v1/users/profile`

- **Metoda HTTP:** PUT
- **Parametry:** Brak
- **Request Body:**
  ```json
  {
    "companyName": "string (optional)",
    "address": "string (optional)",
    "nip": "string (optional) - 10 cyfr, walidowany checksum",
    "bankAccount": "string (optional) - format IBAN, max 32 znaki",
    "invoiceNumberFormat": "string (optional) - musi zawierać {NNN}"
  }
  ```
- **Headers:**
  ```
  Authorization: Bearer <accessToken>
  ```

### 2.3 POST `/api/v1/users/profile/logo`

- **Metoda HTTP:** POST
- **Parametry:** Brak
- **Request Body:** `multipart/form-data`
  - `file`: Plik obrazu (PNG, JPG), max 2MB
- **Headers:**
  ```
  Authorization: Bearer <accessToken>
  Content-Type: multipart/form-data
  ```

### 2.4 DELETE `/api/v1/users/profile/logo`

- **Metoda HTTP:** DELETE
- **Parametry:** Brak
- **Request Body:** Brak
- **Headers:**
  ```
  Authorization: Bearer <accessToken>
  ```

---

## 3. Wykorzystywane typy

### 3.1 DTOs (Data Transfer Objects)

```typescript
// modules/users/dto/user-profile-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class UserProfileResponseDto {
  @ApiProperty({ description: "ID użytkownika (UUID)", format: "uuid" })
  @Expose()
  id: string;

  @ApiProperty({
    description: "Email użytkownika",
    example: "user@example.com",
  })
  @Expose()
  email: string;

  @ApiPropertyOptional({ description: "Nazwa firmy", example: "Firma ABC" })
  @Expose()
  companyName: string | null;

  @ApiPropertyOptional({
    description: "Adres firmy",
    example: "ul. Przykładowa 123, 00-001 Warszawa",
  })
  @Expose()
  address: string | null;

  @ApiPropertyOptional({
    description: "NIP firmy (10 cyfr)",
    example: "1234567890",
  })
  @Expose()
  nip: string | null;

  @ApiPropertyOptional({
    description: "Numer konta bankowego (IBAN)",
    example: "PL61109010140000071219812874",
  })
  @Expose()
  bankAccount: string | null;

  @ApiPropertyOptional({ description: "URL do logo firmy" })
  @Expose()
  logoUrl: string | null;

  @ApiProperty({
    description: "Format numeracji faktur",
    example: "FV/{YYYY}/{NNN}",
  })
  @Expose()
  invoiceNumberFormat: string;

  @ApiProperty({ description: "Licznik numeracji faktur", example: 5 })
  @Expose()
  invoiceNumberCounter: number;

  @ApiProperty({ description: "Data utworzenia profilu" })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: "Data ostatniej aktualizacji" })
  @Expose()
  updatedAt: Date;
}
```

```typescript
// modules/users/dto/update-user-profile.dto.ts
import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  Length,
  Matches,
  Validate,
} from "class-validator";
import { IsPolishNIP } from "../../../common/validators/polish-nip.validator";
import { IsValidIBAN } from "../../../common/validators/iban.validator";
import { ContainsPlaceholder } from "../../../common/validators/invoice-number-format.validator";

export class UpdateUserProfileDto {
  @ApiPropertyOptional({
    description: "Nazwa firmy",
    example: "Firma ABC Sp. z o.o.",
  })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({
    description: "Adres firmy",
    example: "ul. Nowa 456, 00-002 Warszawa",
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: "NIP firmy (10 cyfr)",
    example: "1234567890",
  })
  @IsOptional()
  @IsString()
  @Length(10, 10, { message: "NIP must be exactly 10 digits" })
  @Matches(/^\d{10}$/, { message: "NIP must contain only digits" })
  @IsPolishNIP({ message: "Invalid NIP checksum" })
  nip?: string;

  @ApiPropertyOptional({
    description: "Numer konta bankowego (IBAN)",
    example: "PL61109010140000071219812874",
  })
  @IsOptional()
  @IsString()
  @Length(1, 32, { message: "Bank account must be max 32 characters" })
  @IsValidIBAN({ message: "Invalid IBAN format" })
  bankAccount?: string;

  @ApiPropertyOptional({
    description: "Format numeracji faktur",
    example: "FV/{YYYY}/{MM}/{NNN}",
  })
  @IsOptional()
  @IsString()
  @ContainsPlaceholder("{NNN}", {
    message: "Invoice number format must contain {NNN} placeholder",
  })
  invoiceNumberFormat?: string;
}
```

```typescript
// modules/users/dto/upload-logo-response.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class UploadLogoResponseDto {
  @ApiProperty({ description: "URL do uploadowanego logo" })
  @Expose()
  logoUrl: string;
}
```

```typescript
// modules/users/dto/message-response.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class MessageResponseDto {
  @ApiProperty({ description: "Komunikat odpowiedzi" })
  @Expose()
  message: string;
}
```

### 3.2 Custom Validators

```typescript
// common/validators/polish-nip.validator.ts
import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";

export function IsPolishNIP(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "isPolishNIP",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== "string" || !/^\d{10}$/.test(value)) {
            return false;
          }
          const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
          const digits = value.split("").map(Number);
          const sum = weights.reduce(
            (acc, weight, i) => acc + weight * digits[i],
            0
          );
          return sum % 11 === digits[9];
        },
      },
    });
  };
}
```

```typescript
// common/validators/iban.validator.ts
import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";

export function IsValidIBAN(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "isValidIBAN",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== "string") return false;
          // Basic IBAN validation - remove spaces and check format
          const iban = value.replace(/\s/g, "").toUpperCase();
          if (!/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/.test(iban)) return false;
          // Move first 4 chars to end and convert letters to numbers
          const rearranged = iban.slice(4) + iban.slice(0, 4);
          const numericString = rearranged.replace(/[A-Z]/g, (char) =>
            (char.charCodeAt(0) - 55).toString()
          );
          // Mod 97 check
          let remainder = numericString;
          while (remainder.length > 2) {
            const block = remainder.slice(0, 9);
            remainder =
              (parseInt(block, 10) % 97).toString() +
              remainder.slice(block.length);
          }
          return parseInt(remainder, 10) % 97 === 1;
        },
      },
    });
  };
}
```

```typescript
// common/validators/invoice-number-format.validator.ts
import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";

export function ContainsPlaceholder(
  placeholder: string,
  validationOptions?: ValidationOptions
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "containsPlaceholder",
      target: object.constructor,
      propertyName: propertyName,
      constraints: [placeholder],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [requiredPlaceholder] = args.constraints;
          return (
            typeof value === "string" && value.includes(requiredPlaceholder)
          );
        },
      },
    });
  };
}
```

---

## 4. Szczegóły odpowiedzi

### 4.1 GET `/api/v1/users/profile`

**Success (200 OK):**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "companyName": "Firma ABC",
  "address": "ul. Przykładowa 123, 00-001 Warszawa",
  "nip": "1234567890",
  "bankAccount": "PL61109010140000071219812874",
  "logoUrl": "https://storage.supabase.co/logos/uuid/logo.png",
  "invoiceNumberFormat": "FV/{YYYY}/{NNN}",
  "invoiceNumberCounter": 5,
  "createdAt": "2025-01-01T10:00:00Z",
  "updatedAt": "2025-01-15T14:30:00Z"
}
```

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 401 | `UNAUTHORIZED` | Invalid or missing authentication token |
| 404 | `PROFILE_NOT_FOUND` | User profile not found |

### 4.2 PUT `/api/v1/users/profile`

**Success (200 OK):** Struktura identyczna jak GET, z zaktualizowanymi polami.

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 400 | `INVALID_NIP` | Invalid NIP format or checksum |
| 400 | `INVALID_IBAN` | Invalid bank account format |
| 400 | `INVALID_NUMBER_FORMAT` | Invoice number format must contain {NNN} placeholder |
| 401 | `UNAUTHORIZED` | Invalid or missing authentication token |

### 4.3 POST `/api/v1/users/profile/logo`

**Success (200 OK):**

```json
{
  "logoUrl": "https://storage.supabase.co/logos/uuid/logo.png"
}
```

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 400 | `INVALID_FILE_TYPE` | Only PNG and JPG files are allowed |
| 400 | `FILE_TOO_LARGE` | File size must not exceed 2MB |
| 401 | `UNAUTHORIZED` | Invalid or missing authentication token |

### 4.4 DELETE `/api/v1/users/profile/logo`

**Success (200 OK):**

```json
{
  "message": "Logo successfully deleted"
}
```

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 401 | `UNAUTHORIZED` | Invalid or missing authentication token |
| 404 | `LOGO_NOT_FOUND` | No logo to delete |

---

## 5. Przepływ danych

### 5.1 GET Profile Flow

```
Request → JwtAuthGuard → Controller.getProfile()
    → UsersService.getProfile(userId)
        → Supabase: auth.users.get(userId) [email]
        → Supabase: user_profiles.select(userId)
        → Map to UserProfileResponseDto
    → Response (200)
```

### 5.2 PUT Profile Flow

```
Request → JwtAuthGuard → ValidationPipe → Controller.updateProfile(dto)
    → UsersService.updateProfile(userId, dto)
        → Supabase: user_profiles.update(userId, data)
        → Supabase: auth.users.get(userId) [email]
        → Map to UserProfileResponseDto
    → Response (200)
```

### 5.3 POST Logo Flow

```
Request → JwtAuthGuard → FileInterceptor → Controller.uploadLogo(file)
    → Validate file (type, size)
    → UsersService.uploadLogo(userId, file)
        → Delete old logo if exists (Supabase Storage)
        → Upload new logo to Supabase Storage: logos/{userId}/logo.{ext}
        → Supabase: user_profiles.update(userId, { logo_url })
        → Return logoUrl
    → Response (200)
```

### 5.4 DELETE Logo Flow

```
Request → JwtAuthGuard → Controller.deleteLogo()
    → UsersService.deleteLogo(userId)
        → Supabase: user_profiles.select(userId).logo_url
        → If no logo → throw NotFoundException
        → Delete from Supabase Storage
        → Supabase: user_profiles.update(userId, { logo_url: null })
    → Response (200)
```

---

## 6. Względy bezpieczeństwa

### 6.1 Uwierzytelnianie

- Wszystkie endpointy wymagają JWT tokenu w nagłówku `Authorization: Bearer <token>`
- Implementacja JwtAuthGuard na poziomie kontrolera
- Token weryfikowany przez Supabase Auth

### 6.2 Autoryzacja

- Użytkownik może modyfikować tylko własny profil
- ID użytkownika pobierane z tokenu JWT, nie z request body/params
- RLS (Row Level Security) w Supabase jako dodatkowa warstwa zabezpieczeń

### 6.3 Walidacja danych wejściowych

| Pole                  | Walidacja                                   |
| --------------------- | ------------------------------------------- |
| `nip`                 | Dokładnie 10 cyfr, walidacja checksum NIP   |
| `bankAccount`         | Format IBAN, max 32 znaki, walidacja mod-97 |
| `invoiceNumberFormat` | Musi zawierać placeholder `{NNN}`           |
| `file` (logo)         | Typy: PNG, JPG; Max rozmiar: 2MB            |

### 6.4 Zabezpieczenia plików

- Whitelisting typów MIME: `image/png`, `image/jpeg`
- Limit rozmiaru pliku: 2MB
- Przechowywanie w Supabase Storage z odpowiednimi uprawnieniami
- Nazewnictwo plików: `logos/{userId}/logo.{timestamp}.{ext}` - zapobiega kolizjom

### 6.5 Sanityzacja danych

- Użycie ValidationPipe z `whitelist: true` i `forbidNonWhitelisted: true`
- Transformacja danych wejściowych do odpowiednich typów

---

## 7. Obsługa błędów

### 7.1 Kody błędów domenowych

```typescript
// common/exceptions/user-profile.exceptions.ts
import { BadRequestException, NotFoundException } from "@nestjs/common";

export class InvalidNipException extends BadRequestException {
  constructor() {
    super({ code: "INVALID_NIP", message: "Invalid NIP format or checksum" });
  }
}

export class InvalidIbanException extends BadRequestException {
  constructor() {
    super({ code: "INVALID_IBAN", message: "Invalid bank account format" });
  }
}

export class InvalidNumberFormatException extends BadRequestException {
  constructor() {
    super({
      code: "INVALID_NUMBER_FORMAT",
      message: "Invoice number format must contain {NNN} placeholder",
    });
  }
}

export class ProfileNotFoundException extends NotFoundException {
  constructor() {
    super({ code: "PROFILE_NOT_FOUND", message: "User profile not found" });
  }
}

export class LogoNotFoundException extends NotFoundException {
  constructor() {
    super({ code: "LOGO_NOT_FOUND", message: "No logo to delete" });
  }
}

export class InvalidFileTypeException extends BadRequestException {
  constructor() {
    super({
      code: "INVALID_FILE_TYPE",
      message: "Only PNG and JPG files are allowed",
    });
  }
}

export class FileTooLargeException extends BadRequestException {
  constructor() {
    super({ code: "FILE_TOO_LARGE", message: "File size must not exceed 2MB" });
  }
}
```

### 7.2 Mapowanie błędów na kody HTTP

| Scenariusz              | Exception                    | HTTP Status |
| ----------------------- | ---------------------------- | ----------- |
| Brak tokenu JWT         | UnauthorizedException        | 401         |
| Nieprawidłowy token     | UnauthorizedException        | 401         |
| Profil nie istnieje     | ProfileNotFoundException     | 404         |
| Nieprawidłowy NIP       | InvalidNipException          | 400         |
| Nieprawidłowy IBAN      | InvalidIbanException         | 400         |
| Brak {NNN} w formacie   | InvalidNumberFormatException | 400         |
| Nieprawidłowy typ pliku | InvalidFileTypeException     | 400         |
| Plik za duży            | FileTooLargeException        | 400         |
| Logo nie istnieje       | LogoNotFoundException        | 404         |
| Błąd serwera/DB         | InternalServerErrorException | 500         |

---

## 8. Rozważania dotyczące wydajności

### 8.1 Optymalizacje

1. **Pojedyncze zapytanie dla profilu:**

   - Połączenie danych z `auth.users` i `user_profiles` w jednym wywołaniu gdzie możliwe

2. **Lazy loading logo:**

   - Logo URL przechowywany w bazie, sam obraz serwowany przez Supabase CDN

3. **Cache considerations:**
   - Rozważenie cachowania profilu użytkownika (TTL: 5 min)
   - Invalidacja cache przy aktualizacji profilu

### 8.2 Optymalizacje plików

1. **Stream upload:**

   - Użycie stream dla uploadu plików zamiast buforowania w pamięci

2. **Async delete:**
   - Usuwanie starego logo może być wykonane asynchronicznie

### 8.3 Limity

| Zasób                | Limit                                  |
| -------------------- | -------------------------------------- |
| Rozmiar logo         | 2 MB                                   |
| Rozmiar request body | 5 MB (z zapasem na multipart overhead) |
| Rate limiting        | 100 req/15min per IP (globalny)        |

---

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie struktury modułu

1.1. Utworzenie struktury katalogów:

```
src/
├── common/
│   ├── decorators/
│   │   └── current-user.decorator.ts
│   ├── exceptions/
│   │   └── user-profile.exceptions.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── guards/
│   │   └── jwt-auth.guard.ts
│   └── validators/
│       ├── polish-nip.validator.ts
│       ├── iban.validator.ts
│       └── invoice-number-format.validator.ts
├── config/
│   └── configuration.ts
├── modules/
│   └── users/
│       ├── dto/
│       │   ├── user-profile-response.dto.ts
│       │   ├── update-user-profile.dto.ts
│       │   ├── upload-logo-response.dto.ts
│       │   └── message-response.dto.ts
│       ├── users.controller.ts
│       ├── users.service.ts
│       └── users.module.ts
```

### Krok 2: Konfiguracja podstawowa

2.1. Konfiguracja `main.ts`:

- Dodanie globalnego ValidationPipe
- Konfiguracja CORS
- Ustawienie globalnego prefixu `/api/v1`
- Konfiguracja Swagger

  2.2. Konfiguracja `ConfigModule`:

- Zmienne środowiskowe dla Supabase (URL, Key, JWT Secret)
- Walidacja zmiennych przy starcie

### Krok 3: Implementacja warstwy autoryzacji

3.1. Implementacja `JwtAuthGuard`:

- Weryfikacja tokenu Supabase
- Ekstrakcja danych użytkownika

  3.2. Implementacja `@CurrentUser()` decorator:

- Pobieranie użytkownika z requestu

### Krok 4: Implementacja walidatorów

4.1. Implementacja `IsPolishNIP` validator:

- Walidacja formatu (10 cyfr)
- Walidacja checksum NIP

  4.2. Implementacja `IsValidIBAN` validator:

- Walidacja formatu IBAN
- Walidacja checksum mod-97

  4.3. Implementacja `ContainsPlaceholder` validator:

- Sprawdzenie obecności `{NNN}` w formacie

### Krok 5: Implementacja DTOs

5.1. Utworzenie `UserProfileResponseDto`:

- Mapowanie z snake_case (DB) na camelCase (API)
- Dekoratory Swagger

  5.2. Utworzenie `UpdateUserProfileDto`:

- Wszystkie pola opcjonalne
- Dekoratory walidacji

  5.3. Utworzenie `UploadLogoResponseDto` i `MessageResponseDto`

### Krok 6: Implementacja UsersService

6.1. Metoda `getProfile(userId: string)`:

- Pobranie danych z Supabase
- Mapowanie na DTO

  6.2. Metoda `updateProfile(userId: string, dto: UpdateUserProfileDto)`:

- Aktualizacja w Supabase
- Zwrot zaktualizowanego profilu

  6.3. Metoda `uploadLogo(userId: string, file: Express.Multer.File)`:

- Walidacja pliku
- Upload do Supabase Storage
- Aktualizacja URL w bazie

  6.4. Metoda `deleteLogo(userId: string)`:

- Sprawdzenie istnienia logo
- Usunięcie z Storage
- Aktualizacja bazy

### Krok 7: Implementacja UsersController

7.1. Endpoint `GET /profile`:

- Guard: JwtAuthGuard
- Dekoratory Swagger

  7.2. Endpoint `PUT /profile`:

- Guard: JwtAuthGuard
- ValidationPipe dla body
- Dekoratory Swagger

  7.3. Endpoint `POST /profile/logo`:

- Guard: JwtAuthGuard
- FileInterceptor
- Walidacja pliku (typ, rozmiar)
- Dekoratory Swagger

  7.4. Endpoint `DELETE /profile/logo`:

- Guard: JwtAuthGuard
- Dekoratory Swagger

### Krok 8: Konfiguracja modułu i integracja

8.1. Utworzenie `UsersModule`:

- Import wymaganych modułów
- Rejestracja kontrolera i serwisu

  8.2. Import `UsersModule` w `AppModule`

### Krok 9: Dokumentacja Swagger

9.1. Konfiguracja Swagger w `main.ts`:

- Tytuł, opis, wersja API
- Konfiguracja Bearer Auth

  9.2. Dodanie dekoratorów Swagger do wszystkich endpointów:

- `@ApiTags('Users')`
- `@ApiBearerAuth()`
- `@ApiOperation()`
- `@ApiResponse()`

### Krok 10: Testy

10.1. Testy jednostkowe `UsersService`:

- Mock Supabase client
- Testy dla każdej metody
- Testy scenariuszy błędów

  10.2. Testy E2E:

- Test GET profile
- Test PUT profile z walidacją
- Test upload/delete logo
- Testy błędów autoryzacji

### Krok 11: Obsługa błędów

11.1. Implementacja globalnego `HttpExceptionFilter`:

- Ujednolicony format odpowiedzi błędów
- Logowanie błędów

  11.2. Rejestracja filtra w `main.ts`

### Krok 12: Finalizacja

12.1. Code review i refactoring

12.2. Aktualizacja dokumentacji

12.3. Testy integracyjne z frontendem

---

## 10. Struktura plików końcowa

```
apps/backend/src/
├── common/
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   └── public.decorator.ts
│   ├── exceptions/
│   │   └── user-profile.exceptions.ts
│   ├── filters/
│   │   ├── http-exception.filter.ts
│   │   └── all-exceptions.filter.ts
│   ├── guards/
│   │   └── jwt-auth.guard.ts
│   ├── interceptors/
│   │   └── logging.interceptor.ts
│   └── validators/
│       ├── polish-nip.validator.ts
│       ├── iban.validator.ts
│       └── invoice-number-format.validator.ts
├── config/
│   ├── configuration.ts
│   └── env.validation.ts
├── modules/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   └── strategies/
│   │       └── jwt.strategy.ts
│   └── users/
│       ├── dto/
│       │   ├── user-profile-response.dto.ts
│       │   ├── update-user-profile.dto.ts
│       │   ├── upload-logo-response.dto.ts
│       │   └── message-response.dto.ts
│       ├── users.controller.ts
│       ├── users.controller.spec.ts
│       ├── users.service.ts
│       ├── users.service.spec.ts
│       └── users.module.ts
├── app.module.ts
└── main.ts
```

---

## 11. Zależności do zainstalowania

```json
{
  "dependencies": {
    "@nestjs/common": "^10.x",
    "@nestjs/core": "^10.x",
    "@nestjs/config": "^3.x",
    "@nestjs/swagger": "^7.x",
    "@nestjs/passport": "^10.x",
    "@nestjs/jwt": "^10.x",
    "@nestjs/platform-express": "^10.x",
    "@supabase/supabase-js": "^2.x",
    "class-validator": "^0.14.x",
    "class-transformer": "^0.5.x",
    "passport": "^0.7.x",
    "passport-jwt": "^4.x",
    "multer": "^1.x",
    "helmet": "^7.x"
  },
  "devDependencies": {
    "@types/multer": "^1.x",
    "@types/passport-jwt": "^4.x"
  }
}
```
