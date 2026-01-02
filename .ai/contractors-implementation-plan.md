# Plan Wdrożenia API: Contractor Endpoints

## 1. Przegląd punktów końcowych

Moduł Contractors zapewnia pełne zarządzanie kontrahentami (nabywcami faktur) dla uwierzytelnionego użytkownika. Obejmuje operacje CRUD z paginacją, wyszukiwaniem, sortowaniem oraz walidacją polskiego NIP.

### Endpointy w zakresie:

| Metoda | Ścieżka                   | Opis                              |
| ------ | ------------------------- | --------------------------------- |
| GET    | `/api/v1/contractors`     | Lista kontrahentów z paginacją    |
| GET    | `/api/v1/contractors/:id` | Pobranie pojedynczego kontrahenta |
| POST   | `/api/v1/contractors`     | Utworzenie nowego kontrahenta     |
| PUT    | `/api/v1/contractors/:id` | Aktualizacja kontrahenta          |
| DELETE | `/api/v1/contractors/:id` | Soft delete kontrahenta           |

---

## 2. Szczegóły żądań

### 2.1 GET `/api/v1/contractors` - Lista kontrahentów

**Parametry Query:**
| Parametr | Typ | Domyślnie | Wymagany | Opis |
|----------|-----|-----------|----------|------|
| `page` | integer | 1 | Nie | Numer strony (1-based) |
| `limit` | integer | 20 | Nie | Elementów na stronę (max 100) |
| `search` | string | - | Nie | Wyszukiwanie po nazwie lub NIP |
| `sortBy` | enum | `createdAt` | Nie | Pole sortowania: `name`, `createdAt`, `updatedAt` |
| `sortOrder` | enum | `desc` | Nie | Kierunek: `asc`, `desc` |

### 2.2 GET `/api/v1/contractors/:id` - Pobranie kontrahenta

**Parametry Path:**
| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `id` | UUID | Tak | Identyfikator kontrahenta |

### 2.3 POST `/api/v1/contractors` - Utworzenie kontrahenta

**Request Body:**

```json
{
  "name": "string (required)",
  "address": "string (optional)",
  "nip": "string (optional, 10 digits, valid checksum)"
}
```

### 2.4 PUT `/api/v1/contractors/:id` - Aktualizacja kontrahenta

**Parametry Path:**
| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `id` | UUID | Tak | Identyfikator kontrahenta |

**Request Body:**

```json
{
  "name": "string (optional)",
  "address": "string (optional)",
  "nip": "string (optional, 10 digits, valid checksum)"
}
```

### 2.5 DELETE `/api/v1/contractors/:id` - Usunięcie kontrahenta

**Parametry Path:**
| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `id` | UUID | Tak | Identyfikator kontrahenta |

---

## 3. Wykorzystywane typy

### 3.1 DTOs (Data Transfer Objects)

```typescript
// modules/contractors/dto/contractor-list-query.dto.ts
export class ContractorListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsEnum(["name", "createdAt", "updatedAt"])
  sortBy?: "name" | "createdAt" | "updatedAt" = "createdAt";

  @IsOptional()
  @IsEnum(["asc", "desc"])
  sortOrder?: "asc" | "desc" = "desc";
}
```

```typescript
// modules/contractors/dto/create-contractor.dto.ts
export class CreateContractorDto {
  @ApiProperty({ description: "Nazwa kontrahenta", example: "Firma ABC" })
  @IsString()
  @IsNotEmpty({ message: "Contractor name is required" })
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: "Adres kontrahenta" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ description: "NIP kontrahenta (10 cyfr)" })
  @IsOptional()
  @IsPolishNIP({ message: "Invalid NIP format or checksum" })
  nip?: string;
}
```

```typescript
// modules/contractors/dto/update-contractor.dto.ts
export class UpdateContractorDto extends PartialType(CreateContractorDto) {}
```

```typescript
// modules/contractors/dto/contractor-response.dto.ts
export class ContractorResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  address: string | null;

  @ApiPropertyOptional()
  nip: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
```

```typescript
// modules/contractors/dto/contractor-list-response.dto.ts
export class ContractorListResponseDto {
  @ApiProperty({ type: [ContractorResponseDto] })
  data: ContractorResponseDto[];

  @ApiProperty()
  pagination: PaginationMeta;
}
```

### 3.2 Custom Validator - IsPolishNIP

```typescript
// common/validators/is-polish-nip.validator.ts
export function IsPolishNIP(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "isPolishNIP",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any): boolean {
          if (!value) return true; // Optional field
          if (typeof value !== "string") return false;
          if (!/^\d{10}$/.test(value)) return false;

          const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
          const checksum =
            weights.reduce(
              (sum, weight, i) => sum + weight * parseInt(value[i], 10),
              0
            ) % 11;

          return checksum === parseInt(value[9], 10);
        },
        defaultMessage(): string {
          return "Invalid NIP format or checksum";
        },
      },
    });
  };
}
```

---

## 4. Szczegóły odpowiedzi

### 4.1 GET `/api/v1/contractors` - 200 OK

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Kontrahent ABC",
      "address": "ul. Firmowa 10, 00-100 Kraków",
      "nip": "9876543210",
      "createdAt": "2025-01-10T08:00:00Z",
      "updatedAt": "2025-01-10T08:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### 4.2 GET `/api/v1/contractors/:id` - 200 OK

```json
{
  "id": "uuid",
  "name": "Kontrahent ABC",
  "address": "ul. Firmowa 10, 00-100 Kraków",
  "nip": "9876543210",
  "createdAt": "2025-01-10T08:00:00Z",
  "updatedAt": "2025-01-10T08:00:00Z"
}
```

### 4.3 POST `/api/v1/contractors` - 201 Created

```json
{
  "id": "uuid",
  "name": "Nowy Kontrahent",
  "address": "ul. Nowa 5, 00-200 Gdańsk",
  "nip": "5551234567",
  "createdAt": "2025-01-20T12:00:00Z",
  "updatedAt": "2025-01-20T12:00:00Z"
}
```

### 4.4 PUT `/api/v1/contractors/:id` - 200 OK

Struktura identyczna jak POST response.

### 4.5 DELETE `/api/v1/contractors/:id` - 200 OK

```json
{
  "message": "Contractor successfully deleted"
}
```

---

## 5. Przepływ danych

### 5.1 Architektura modułu

```
┌─────────────────────────────────────────────────────────────┐
│                    ContractorsModule                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌─────────────────────────────┐   │
│  │ ContractorsCtrl │───▶│    ContractorsService       │   │
│  └────────┬────────┘    └──────────────┬──────────────┘   │
│           │                            │                   │
│           │ DTOs                       │ Business Logic    │
│           ▼                            ▼                   │
│  ┌─────────────────┐    ┌─────────────────────────────┐   │
│  │ ValidationPipe  │    │      SupabaseService        │   │
│  │ + IsPolishNIP   │    │   (Database Operations)     │   │
│  └─────────────────┘    └─────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Przepływ - Lista kontrahentów

```
1. Request: GET /api/v1/contractors?page=1&limit=20&search=ABC
2. JwtAuthGuard: Walidacja tokenu, ekstrakcja userId
3. ContractorsController.findAll(): Parsowanie query params
4. ValidationPipe: Walidacja ContractorListQueryDto
5. ContractorsService.findAll(userId, query):
   a. Budowanie zapytania Supabase
   b. Filtrowanie: user_id = userId AND deleted_at IS NULL
   c. Wyszukiwanie: name ILIKE %search% OR nip ILIKE %search%
   d. Sortowanie: ORDER BY sortBy sortOrder
   e. Paginacja: LIMIT limit OFFSET (page-1)*limit
   f. Count: Pobranie total count dla paginacji
6. Mapowanie na ContractorListResponseDto
7. Response: 200 OK + JSON
```

### 5.3 Przepływ - Utworzenie kontrahenta

```
1. Request: POST /api/v1/contractors + Body
2. JwtAuthGuard: Walidacja tokenu, ekstrakcja userId
3. ValidationPipe: Walidacja CreateContractorDto
   a. name: IsNotEmpty, IsString
   b. nip: IsPolishNIP (jeśli podany)
4. ContractorsController.create(userId, dto)
5. ContractorsService.create(userId, dto):
   a. Sprawdzenie unikalności NIP dla userId (jeśli podany)
   b. INSERT do tabeli contractors
   c. Zwrot utworzonego rekordu
6. Mapowanie na ContractorResponseDto
7. Response: 201 Created + JSON
```

### 5.4 Przepływ - Aktualizacja kontrahenta

```
1. Request: PUT /api/v1/contractors/:id + Body
2. JwtAuthGuard: Walidacja tokenu, ekstrakcja userId
3. ParseUUIDPipe: Walidacja formatu UUID
4. ValidationPipe: Walidacja UpdateContractorDto
5. ContractorsController.update(userId, id, dto)
6. ContractorsService.update(userId, id, dto):
   a. Sprawdzenie istnienia kontrahenta dla userId
   b. Sprawdzenie unikalności NIP (jeśli zmieniony)
   c. UPDATE rekordu
   d. Zwrot zaktualizowanego rekordu
7. Response: 200 OK + JSON
```

### 5.5 Przepływ - Soft Delete

```
1. Request: DELETE /api/v1/contractors/:id
2. JwtAuthGuard: Walidacja tokenu, ekstrakcja userId
3. ParseUUIDPipe: Walidacja formatu UUID
4. ContractorsController.remove(userId, id)
5. ContractorsService.remove(userId, id):
   a. Sprawdzenie istnienia kontrahenta dla userId
   b. UPDATE: SET deleted_at = NOW()
6. Response: 200 OK + { message: "..." }
```

---

## 6. Względy bezpieczeństwa

### 6.1 Uwierzytelnianie

- **Mechanizm**: JWT Bearer Token (Supabase Auth)
- **Guard**: `JwtAuthGuard` na poziomie kontrolera
- **Ekstrakcja userId**: `@CurrentUser()` decorator

```typescript
@Controller("contractors")
@UseGuards(JwtAuthGuard)
@ApiTags("Contractors")
@ApiBearerAuth()
export class ContractorsController {
  @Get()
  findAll(
    @CurrentUser("id") userId: string,
    @Query() query: ContractorListQueryDto
  ) {}
}
```

### 6.2 Autoryzacja

- **Row Level Security (RLS)**: Supabase automatycznie filtruje po `user_id = auth.uid()`
- **Weryfikacja w serwisie**: Dodatkowe sprawdzenie `user_id` przy operacjach na pojedynczym rekordzie

### 6.3 Walidacja danych wejściowych

| Pole      | Walidacje                                    |
| --------- | -------------------------------------------- |
| `name`    | Required, string, max 255 znaków             |
| `address` | Optional, string, max 500 znaków             |
| `nip`     | Optional, 10 cyfr, prawidłowa suma kontrolna |
| `page`    | Integer, min 1                               |
| `limit`   | Integer, min 1, max 100                      |
| `id`      | UUID v4 format                               |

### 6.4 Ochrona przed atakami

- **SQL Injection**: Supabase SDK używa parametryzowanych zapytań
- **XSS**: Dane zwracane jako JSON (brak HTML)
- **CSRF**: Token-based auth (nie cookie-based)
- **Rate Limiting**: 100 requests/minute (konfiguracja globalna)

---

## 7. Obsługa błędów

### 7.1 Kody błędów specyficzne dla modułu

| HTTP Status | Kod                    | Wiadomość                               | Kiedy                                                    |
| ----------- | ---------------------- | --------------------------------------- | -------------------------------------------------------- |
| 400         | `INVALID_NIP`          | Invalid NIP format or checksum          | Nieprawidłowy format/suma kontrolna NIP                  |
| 400         | `NAME_REQUIRED`        | Contractor name is required             | Brak nazwy w create                                      |
| 400         | `VALIDATION_ERROR`     | Validation failed                       | Inne błędy walidacji                                     |
| 401         | `UNAUTHORIZED`         | Invalid or missing authentication token | Brak/nieprawidłowy JWT                                   |
| 404         | `CONTRACTOR_NOT_FOUND` | Contractor not found                    | Kontrahent nie istnieje lub należy do innego użytkownika |
| 409         | `NIP_EXISTS`           | Contractor with this NIP already exists | Duplikat NIP dla użytkownika                             |

### 7.2 Wyjątki domenowe

```typescript
// modules/contractors/exceptions/contractor.exceptions.ts
export class ContractorNotFoundException extends NotFoundException {
  constructor(id: string) {
    super({
      statusCode: 404,
      code: "CONTRACTOR_NOT_FOUND",
      message: "Contractor not found",
    });
  }
}

export class NipExistsException extends ConflictException {
  constructor(nip: string) {
    super({
      statusCode: 409,
      code: "NIP_EXISTS",
      message: "Contractor with this NIP already exists",
    });
  }
}
```

### 7.3 Format odpowiedzi błędów

```json
{
  "statusCode": 400,
  "code": "INVALID_NIP",
  "message": "Invalid NIP format or checksum",
  "errors": [
    {
      "field": "nip",
      "message": "Invalid NIP format or checksum"
    }
  ],
  "timestamp": "2025-01-20T14:00:00Z"
}
```

---

## 8. Rozważania dotyczące wydajności

### 8.1 Indeksy bazy danych

Wymagane indeksy (zgodnie z db-plan.md):

```sql
-- Lista kontrahentów użytkownika
CREATE INDEX idx_contractors_user_id ON contractors(user_id);

-- Filtrowanie aktywnych kontrahentów
CREATE INDEX idx_contractors_user_deleted ON contractors(user_id, deleted_at);

-- Unikalność NIP per użytkownik (partial index)
CREATE UNIQUE INDEX idx_contractors_user_nip ON contractors(user_id, nip)
  WHERE nip IS NOT NULL AND deleted_at IS NULL;
```

### 8.2 Optymalizacje zapytań

- **Paginacja**: Używaj `LIMIT` i `OFFSET` zamiast pobierania wszystkich rekordów
- **Selekcja kolumn**: Pobieraj tylko potrzebne kolumny
- **Count optimization**: Używaj `count: 'exact'` tylko gdy potrzebna paginacja

### 8.3 Limity

- **Max limit**: 100 elementów na stronę
- **Search min length**: Brak (ale rozważ min 2-3 znaki dla wydajności)
- **Rate limiting**: 100 req/min per endpoint

---

## 9. Etapy wdrożenia

### Etap 1: Struktura modułu (0.5h)

1. Utworzenie struktury katalogów:

   ```
   src/modules/contractors/
   ├── dto/
   │   ├── contractor-list-query.dto.ts
   │   ├── create-contractor.dto.ts
   │   ├── update-contractor.dto.ts
   │   ├── contractor-response.dto.ts
   │   └── contractor-list-response.dto.ts
   ├── exceptions/
   │   └── contractor.exceptions.ts
   ├── contractors.controller.ts
   ├── contractors.service.ts
   └── contractors.module.ts
   ```

2. Utworzenie walidatora NIP:
   ```
   src/common/validators/is-polish-nip.validator.ts
   ```

### Etap 2: Implementacja DTOs (1h)

1. Implementacja `ContractorListQueryDto` z dekoratorami walidacji
2. Implementacja `CreateContractorDto` z walidacją NIP
3. Implementacja `UpdateContractorDto` (PartialType)
4. Implementacja `ContractorResponseDto` z dekoratorami Swagger
5. Implementacja `ContractorListResponseDto` z paginacją

### Etap 3: Implementacja serwisu (2h)

1. Utworzenie `ContractorsService` z dependency injection
2. Implementacja `findAll(userId, query)`:
   - Budowanie zapytania z filtrami
   - Wyszukiwanie ILIKE po name i nip
   - Sortowanie i paginacja
   - Obliczanie metadanych paginacji
3. Implementacja `findOne(userId, id)`:
   - Pobranie rekordu z walidacją user_id
   - Rzucenie NotFoundException jeśli nie znaleziony
4. Implementacja `create(userId, dto)`:
   - Sprawdzenie unikalności NIP
   - Insert do bazy
   - Zwrot utworzonego rekordu
5. Implementacja `update(userId, id, dto)`:
   - Sprawdzenie istnienia rekordu
   - Walidacja unikalności NIP (jeśli zmieniony)
   - Update i zwrot
6. Implementacja `remove(userId, id)`:
   - Sprawdzenie istnienia
   - Soft delete (set deleted_at)

### Etap 4: Implementacja kontrolera (1h)

1. Utworzenie `ContractorsController` z dekoratorami
2. Dodanie `@UseGuards(JwtAuthGuard)` na poziomie klasy
3. Implementacja endpointów:
   - `@Get()` findAll
   - `@Get(':id')` findOne
   - `@Post()` create
   - `@Put(':id')` update
   - `@Delete(':id')` remove
4. Dokumentacja Swagger dla każdego endpointu

### Etap 5: Implementacja modułu (0.5h)

1. Utworzenie `ContractorsModule`
2. Import zależności (SupabaseModule)
3. Rejestracja kontrolera i serwisu
4. Eksport serwisu (jeśli potrzebny w innych modułach)
5. Import modułu w `AppModule`

### Etap 6: Testy jednostkowe (2h)

1. Testy `ContractorsService`:

   - findAll: paginacja, wyszukiwanie, sortowanie
   - findOne: sukces, not found
   - create: sukces, duplikat NIP, walidacja
   - update: sukces, not found, duplikat NIP
   - remove: sukces, not found

2. Testy `IsPolishNIP` validator:
   - Prawidłowe NIPy
   - Nieprawidłowy format
   - Nieprawidłowa suma kontrolna

### Etap 7: Testy E2E (1.5h)

1. Setup test module z mockami
2. Testy scenariuszy:
   - Lista kontrahentów z paginacją
   - CRUD operations
   - Obsługa błędów (401, 404, 409)
   - Walidacja danych wejściowych

### Etap 8: Dokumentacja Swagger (0.5h)

1. Dodanie `@ApiTags('Contractors')`
2. `@ApiOperation` dla każdego endpointu
3. `@ApiResponse` dla wszystkich kodów statusu
4. `@ApiQuery` dla parametrów query
5. Weryfikacja w Swagger UI

---

## 10. Checklist przed wdrożeniem

- [ ] Wszystkie DTOs mają dekoratory walidacji
- [ ] Walidator IsPolishNIP zaimplementowany i przetestowany
- [ ] JwtAuthGuard zastosowany na kontrolerze
- [ ] Wszystkie metody serwisu sprawdzają user_id
- [ ] Soft delete poprawnie ustawia deleted_at
- [ ] Indeksy bazy danych utworzone
- [ ] Swagger dokumentacja kompletna
- [ ] Testy jednostkowe przechodzą
- [ ] Testy E2E przechodzą
- [ ] Error responses zgodne ze specyfikacją
- [ ] Rate limiting skonfigurowany
