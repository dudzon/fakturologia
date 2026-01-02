# Plan Implementacji Endpointów API - Faktury (Invoice Endpoints)

## Analiza

### Kluczowe punkty specyfikacji API

1. **8 endpointów do zaimplementowania:**

   - GET `/api/v1/invoices` - Lista faktur (paginacja, filtrowanie, sortowanie)
   - GET `/api/v1/invoices/next-number` - Następny numer faktury
   - GET `/api/v1/invoices/:id` - Szczegóły faktury
   - POST `/api/v1/invoices` - Tworzenie faktury
   - PUT `/api/v1/invoices/:id` - Aktualizacja faktury
   - PATCH `/api/v1/invoices/:id/status` - Zmiana statusu
   - POST `/api/v1/invoices/:id/duplicate` - Duplikacja faktury
   - DELETE `/api/v1/invoices/:id` - Soft delete faktury

2. **Wszystkie endpointy wymagają uwierzytelnienia** - JWT Bearer Token
3. **Operacje są ograniczone do zalogowanego użytkownika** - RLS (Row Level Security)
4. **Snapshot danych sprzedawcy** - automatycznie z profilu użytkownika
5. **Obliczenia kwot** - server-side (netto, VAT, brutto)
6. **Soft delete** - pole `deleted_at`

### Wymagane parametry

**Query Parameters (Lista):**

- `page` (opcjonalny, domyślnie 1)
- `limit` (opcjonalny, domyślnie 20, max 100)
- `status` (opcjonalny: draft, unpaid, paid)
- `search` (opcjonalny: wyszukiwanie po numerze faktury lub nazwie nabywcy)
- `dateFrom`, `dateTo` (opcjonalne: filtrowanie po dacie wystawienia)
- `sortBy` (opcjonalny: invoiceNumber, issueDate, dueDate, totalGross, createdAt)
- `sortOrder` (opcjonalny: asc, desc)

**Path Parameters:**

- `id` (UUID faktury)

**Request Body (Create/Update):**

- `invoiceNumber`, `issueDate`, `dueDate`, `status`, `paymentMethod`, `notes`
- `contractorId` (opcjonalne powiązanie z kontrahentem)
- `buyer` (obiekt: name, address?, nip?)
- `items` (tablica pozycji faktury)

### Niezbędne typy DTO i Command Models

**Z types.ts (już zdefiniowane):**

- `InvoiceListQuery` - parametry zapytania listy
- `InvoiceListResponse`, `InvoiceListItem` - odpowiedź listy
- `InvoiceResponse` - pełne szczegóły faktury
- `NextInvoiceNumberResponse` - odpowiedź następnego numeru
- `CreateInvoiceCommand` - tworzenie faktury
- `UpdateInvoiceCommand` - aktualizacja faktury
- `UpdateInvoiceStatusCommand`, `UpdateInvoiceStatusResponse` - zmiana statusu
- `DuplicateInvoiceCommand` - duplikacja
- `DeleteInvoiceResponse` - usunięcie
- `InvoiceItemRequest`, `InvoiceItemResponse` - pozycje faktury
- `BuyerInfo`, `BuyerInfoRequest` - dane nabywcy
- `SellerInfo` - dane sprzedawcy (snapshot)

**Do stworzenia w NestJS:**

- DTOs z walidacją class-validator
- Entity mapowanie z Supabase

### Logika serwisowa

**InvoicesService powinien zawierać:**

1. `findAll(userId, query)` - lista z paginacją i filtrami
2. `findOne(userId, id)` - pojedyncza faktura z items
3. `getNextNumber(userId)` - generowanie następnego numeru
4. `create(userId, dto)` - tworzenie z snapshot sprzedawcy i obliczeniami
5. `update(userId, id, dto)` - aktualizacja z zarządzaniem items
6. `updateStatus(userId, id, dto)` - zmiana statusu z walidacją
7. `duplicate(userId, id, dto)` - duplikacja z nowym numerem
8. `remove(userId, id)` - soft delete

**Pomocnicze serwisy:**

- `InvoiceCalculationService` - obliczenia kwot (netto → VAT → brutto)
- `InvoiceNumberService` - parsowanie formatu i generowanie numeru
- `UserProfilesService` - pobieranie danych sprzedawcy (do snapshotu)

### Walidacja danych wejściowych

1. **invoiceNumber**: wymagany, unikalny per użytkownik
2. **issueDate**: wymagany, poprawna data
3. **dueDate**: wymagany, musi być >= issueDate
4. **status**: draft | unpaid | paid
5. **buyer.name**: wymagany
6. **buyer.nip**: opcjonalny, jeśli podany musi być poprawny NIP (10 cyfr + suma kontrolna)
7. **items**: minimum 1 pozycja
8. **items[].quantity**: > 0
9. **items[].unitPrice**: >= 0
10. **items[].vatRate**: 23 | 8 | 5 | 0 | zw

**Walidacja zależna od statusu:**

- Dla `unpaid` lub `paid`: profil użytkownika musi być kompletny (companyName, address, nip)

### Potencjalne zagrożenia bezpieczeństwa

1. **Autoryzacja**: Użytkownik może widzieć tylko swoje faktury
2. **IDOR (Insecure Direct Object Reference)**: Walidacja user_id przy każdej operacji
3. **SQL Injection**: Używanie parametryzowanych zapytań Supabase
4. **Mass Assignment**: Whitelist pól w DTO
5. **Rate Limiting**: Ochrona przed nadmierną liczbą żądań
6. **Input Validation**: Walidacja wszystkich wejść przed przetwarzaniem

### Scenariusze błędów

| Status | Kod                       | Komunikat                                   |
| ------ | ------------------------- | ------------------------------------------- |
| 400    | `INVOICE_NUMBER_REQUIRED` | Numer faktury jest wymagany                 |
| 400    | `INVALID_DATES`           | Data płatności musi być >= data wystawienia |
| 400    | `ITEMS_REQUIRED`          | Wymagana minimum jedna pozycja              |
| 400    | `INVALID_VAT_RATE`        | Nieprawidłowa stawka VAT                    |
| 400    | `INVALID_BUYER_NIP`       | Nieprawidłowy NIP nabywcy                   |
| 400    | `INCOMPLETE_PROFILE`      | Uzupełnij profil firmy                      |
| 400    | `INVALID_STATUS`          | Nieprawidłowy status                        |
| 400    | `INCOMPLETE_INVOICE`      | Faktura niekompletna do zmiany statusu      |
| 401    | `UNAUTHORIZED`            | Nieprawidłowy token                         |
| 404    | `INVOICE_NOT_FOUND`       | Faktura nie znaleziona                      |
| 409    | `INVOICE_NUMBER_EXISTS`   | Numer faktury już istnieje                  |

---

## 1. Przegląd endpointów

Moduł faktur (`InvoicesModule`) obsługuje pełny cykl życia faktur w systemie Fakturologia. Umożliwia tworzenie, edycję, przeglądanie, zmianę statusu, duplikowanie i usuwanie faktur. Każda faktura zawiera snapshot danych sprzedawcy (z profilu użytkownika) i nabywcy, co zapewnia niezmienność danych historycznych.

### Główne funkcjonalności:

- **Lista faktur** z paginacją, filtrowaniem i sortowaniem
- **Generowanie numeru faktury** według konfigurowalnego wzorca
- **CRUD operacje** z walidacją biznesową
- **Zmiana statusu** (draft → unpaid → paid)
- **Duplikowanie faktur** z automatycznym numerowaniem
- **Soft delete** z zachowaniem historii

---

## 2. Szczegóły żądań

### 2.1 GET `/api/v1/invoices` - Lista faktur

| Parametr    | Typ     | Domyślnie | Opis                                 |
| ----------- | ------- | --------- | ------------------------------------ |
| `page`      | integer | 1         | Numer strony (1-based)               |
| `limit`     | integer | 20        | Elementy na stronę (max 100)         |
| `status`    | string  | -         | Filtr statusu: draft, unpaid, paid   |
| `search`    | string  | -         | Szukaj po numerze lub nazwie nabywcy |
| `dateFrom`  | date    | -         | Data wystawienia od                  |
| `dateTo`    | date    | -         | Data wystawienia do                  |
| `sortBy`    | string  | createdAt | Pole sortowania                      |
| `sortOrder` | string  | desc      | Kierunek: asc, desc                  |

### 2.2 GET `/api/v1/invoices/next-number` - Następny numer

Brak parametrów - używa formatu i licznika z profilu użytkownika.

### 2.3 GET `/api/v1/invoices/:id` - Szczegóły faktury

| Parametr | Typ  | Opis       |
| -------- | ---- | ---------- |
| `id`     | UUID | ID faktury |

### 2.4 POST `/api/v1/invoices` - Tworzenie faktury

```typescript
{
  invoiceNumber: string;      // Wymagany, unikalny
  issueDate: string;          // Wymagany, format YYYY-MM-DD
  dueDate: string;            // Wymagany, format YYYY-MM-DD, >= issueDate
  status?: InvoiceStatus;     // Opcjonalny, domyślnie 'draft'
  paymentMethod?: string;     // Opcjonalny, domyślnie 'transfer'
  notes?: string;             // Opcjonalny
  contractorId?: string;      // Opcjonalny, UUID kontrahenta
  buyer: {
    name: string;             // Wymagany
    address?: string;
    nip?: string;             // Opcjonalny, walidacja NIP
  };
  items: [{
    position: number;
    name: string;             // Wymagany
    unit?: string;            // Opcjonalny, domyślnie 'szt.'
    quantity: string;         // Wymagany, > 0
    unitPrice: string;        // Wymagany, >= 0
    vatRate: VatRate;         // Wymagany: 23|8|5|0|zw
  }];
}
```

### 2.5 PUT `/api/v1/invoices/:id` - Aktualizacja faktury

```typescript
{
  invoiceNumber?: string;
  issueDate?: string;
  dueDate?: string;
  status?: InvoiceStatus;
  paymentMethod?: string;
  notes?: string;
  buyer?: {
    name: string;
    address?: string;
    nip?: string;
  };
  items?: [{
    id?: string;              // Istniejący item lub pominięty dla nowego
    position: number;
    name: string;
    unit?: string;
    quantity: string;
    unitPrice: string;
    vatRate: VatRate;
  }];
}
```

### 2.6 PATCH `/api/v1/invoices/:id/status` - Zmiana statusu

```typescript
{
  status: InvoiceStatus; // draft | unpaid | paid
}
```

### 2.7 POST `/api/v1/invoices/:id/duplicate` - Duplikacja

```typescript
{
  invoiceNumber?: string;  // Opcjonalny, jeśli brak - generowany automatycznie
}
```

### 2.8 DELETE `/api/v1/invoices/:id` - Usunięcie

Brak body - soft delete przez ustawienie `deleted_at`.

---

## 3. Wykorzystywane typy

### 3.1 Typy domenowe (z types.ts)

```typescript
/** Invoice status enum aligned with database */
export type InvoiceStatus = "draft" | "unpaid" | "paid";

/** VAT rate values allowed in the system */
export type VatRate = "23" | "8" | "5" | "0" | "zw";

/** Payment method options */
export type PaymentMethod = "transfer" | "cash" | "card";

/** Currency code (ISO 4217) */
export type Currency = "PLN" | "EUR" | "USD";
```

### 3.2 Request DTOs (Query Parameters)

```typescript
// src/modules/invoices/dto/invoice-list-query.dto.ts
import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsString,
  MaxLength,
  IsDateString,
} from "class-validator";
import { Type } from "class-transformer";

export class InvoiceListQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: ["draft", "unpaid", "paid"] })
  @IsOptional()
  @IsEnum(["draft", "unpaid", "paid"])
  status?: InvoiceStatus;

  @ApiPropertyOptional({
    description: "Szukaj po numerze faktury lub nazwie nabywcy",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ description: "Data wystawienia od (YYYY-MM-DD)" })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: "Data wystawienia do (YYYY-MM-DD)" })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({
    enum: ["invoiceNumber", "issueDate", "dueDate", "totalGross", "createdAt"],
    default: "createdAt",
  })
  @IsOptional()
  @IsEnum(["invoiceNumber", "issueDate", "dueDate", "totalGross", "createdAt"])
  sortBy?: string = "createdAt";

  @ApiPropertyOptional({ enum: ["asc", "desc"], default: "desc" })
  @IsOptional()
  @IsEnum(["asc", "desc"])
  sortOrder?: string = "desc";
}
```

### 3.3 Request DTOs (Body - Create/Update)

```typescript
// src/modules/invoices/dto/buyer-info.dto.ts
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional, Matches } from "class-validator";
import { IsPolishNIP } from "../../../common/validators/polish-nip.validator";

export class BuyerInfoDto {
  @ApiProperty({
    description: "Nazwa nabywcy",
    example: "Firma XYZ Sp. z o.o.",
  })
  @IsString()
  @IsNotEmpty({ message: "Nazwa nabywcy jest wymagana" })
  name: string;

  @ApiPropertyOptional({
    description: "Adres nabywcy",
    example: "ul. Handlowa 10, 00-100 Warszawa",
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: "NIP nabywcy (10 cyfr)",
    example: "9876543210",
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{10}$/, { message: "NIP musi składać się z 10 cyfr" })
  @IsPolishNIP({ message: "Nieprawidłowa suma kontrolna NIP" })
  nip?: string;
}
```

```typescript
// src/modules/invoices/dto/invoice-item.dto.ts
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
  IsEnum,
  Matches,
} from "class-validator";
import {
  IsPositiveDecimal,
  IsNonNegativeDecimal,
} from "../../../common/validators/decimal.validators";

export class InvoiceItemDto {
  @ApiPropertyOptional({
    description: "ID istniejącej pozycji (dla aktualizacji)",
    format: "uuid",
  })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({
    description: "Numer pozycji na fakturze",
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  position: number;

  @ApiProperty({
    description: "Nazwa towaru/usługi",
    example: "Usługa programistyczna",
  })
  @IsString()
  @IsNotEmpty({ message: "Nazwa pozycji jest wymagana" })
  name: string;

  @ApiPropertyOptional({
    description: "Jednostka miary",
    example: "szt.",
    default: "szt.",
  })
  @IsOptional()
  @IsString()
  unit?: string = "szt.";

  @ApiProperty({ description: "Ilość (format dziesiętny)", example: "10.00" })
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: "Ilość musi być liczbą z max 2 miejscami po przecinku",
  })
  @IsPositiveDecimal({ message: "Ilość musi być większa od 0" })
  quantity: string;

  @ApiProperty({
    description: "Cena jednostkowa netto (format dziesiętny)",
    example: "150.00",
  })
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: "Cena musi być liczbą z max 2 miejscami po przecinku",
  })
  @IsNonNegativeDecimal({ message: "Cena nie może być ujemna" })
  unitPrice: string;

  @ApiProperty({
    description: "Stawka VAT",
    enum: ["23", "8", "5", "0", "zw"],
    example: "23",
  })
  @IsEnum(["23", "8", "5", "0", "zw"], { message: "Nieprawidłowa stawka VAT" })
  vatRate: VatRate;
}
```

```typescript
// src/modules/invoices/dto/create-invoice.dto.ts
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsDateString,
  IsOptional,
  IsEnum,
  IsUUID,
  ValidateNested,
  IsArray,
  ArrayMinSize,
} from "class-validator";
import { Type } from "class-transformer";
import { IsDateAfterOrEqual } from "../../../common/validators/date.validators";
import { BuyerInfoDto } from "./buyer-info.dto";
import { InvoiceItemDto } from "./invoice-item.dto";

export class CreateInvoiceDto {
  @ApiProperty({
    description: "Numer faktury",
    example: "FV/2026/001",
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty({ message: "Numer faktury jest wymagany" })
  @MaxLength(50)
  invoiceNumber: string;

  @ApiProperty({
    description: "Data wystawienia (YYYY-MM-DD)",
    example: "2026-01-02",
  })
  @IsDateString({}, { message: "Nieprawidłowy format daty wystawienia" })
  issueDate: string;

  @ApiProperty({
    description: "Termin płatności (YYYY-MM-DD)",
    example: "2026-01-16",
  })
  @IsDateString({}, { message: "Nieprawidłowy format terminu płatności" })
  @IsDateAfterOrEqual("issueDate", {
    message:
      "Termin płatności musi być równy lub późniejszy niż data wystawienia",
  })
  dueDate: string;

  @ApiPropertyOptional({
    description: "Status faktury",
    enum: ["draft", "unpaid", "paid"],
    default: "draft",
  })
  @IsOptional()
  @IsEnum(["draft", "unpaid", "paid"], {
    message: "Nieprawidłowy status faktury",
  })
  status?: InvoiceStatus = "draft";

  @ApiPropertyOptional({
    description: "Metoda płatności",
    enum: ["transfer", "cash", "card"],
    default: "transfer",
  })
  @IsOptional()
  @IsEnum(["transfer", "cash", "card"], {
    message: "Nieprawidłowa metoda płatności",
  })
  paymentMethod?: PaymentMethod = "transfer";

  @ApiPropertyOptional({ description: "Uwagi do faktury" })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: "ID kontrahenta (opcjonalne powiązanie)",
    format: "uuid",
  })
  @IsOptional()
  @IsUUID("4", { message: "Nieprawidłowy format ID kontrahenta" })
  contractorId?: string;

  @ApiProperty({ description: "Dane nabywcy", type: BuyerInfoDto })
  @ValidateNested()
  @Type(() => BuyerInfoDto)
  buyer: BuyerInfoDto;

  @ApiProperty({
    description: "Pozycje faktury (min. 1)",
    type: [InvoiceItemDto],
  })
  @IsArray()
  @ArrayMinSize(1, {
    message: "Faktura musi zawierać przynajmniej jedną pozycję",
  })
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];
}
```

```typescript
// src/modules/invoices/dto/update-invoice.dto.ts
import { PartialType, OmitType } from "@nestjs/mapped-types";
import { CreateInvoiceDto } from "./create-invoice.dto";

export class UpdateInvoiceDto extends PartialType(
  OmitType(CreateInvoiceDto, ["contractorId"] as const)
) {}
```

```typescript
// src/modules/invoices/dto/update-invoice-status.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";

export class UpdateInvoiceStatusDto {
  @ApiProperty({
    description: "Nowy status faktury",
    enum: ["draft", "unpaid", "paid"],
  })
  @IsEnum(["draft", "unpaid", "paid"], {
    message: "Nieprawidłowy status faktury",
  })
  status: InvoiceStatus;
}
```

```typescript
// src/modules/invoices/dto/duplicate-invoice.dto.ts
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class DuplicateInvoiceDto {
  @ApiPropertyOptional({
    description:
      "Numer dla zduplikowanej faktury (jeśli brak - generowany automatycznie)",
    example: "FV/2026/002",
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  invoiceNumber?: string;
}
```

### 3.4 Response DTOs

```typescript
// src/modules/invoices/dto/responses/seller-info-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class SellerInfoResponseDto {
  @ApiProperty({ description: "Nazwa firmy sprzedawcy" })
  @Expose()
  companyName: string;

  @ApiProperty({ description: "Adres sprzedawcy" })
  @Expose()
  address: string;

  @ApiProperty({ description: "NIP sprzedawcy" })
  @Expose()
  nip: string;

  @ApiPropertyOptional({ description: "Numer konta bankowego" })
  @Expose()
  bankAccount: string | null;

  @ApiPropertyOptional({ description: "URL logo firmy" })
  @Expose()
  logoUrl: string | null;
}
```

```typescript
// src/modules/invoices/dto/responses/buyer-info-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class BuyerInfoResponseDto {
  @ApiProperty({ description: "Nazwa nabywcy" })
  @Expose()
  name: string;

  @ApiPropertyOptional({ description: "Adres nabywcy" })
  @Expose()
  address: string | null;

  @ApiPropertyOptional({ description: "NIP nabywcy" })
  @Expose()
  nip: string | null;
}
```

```typescript
// src/modules/invoices/dto/responses/invoice-item-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class InvoiceItemResponseDto {
  @ApiProperty({ description: "ID pozycji", format: "uuid" })
  @Expose()
  id: string;

  @ApiProperty({ description: "Numer pozycji" })
  @Expose()
  position: number;

  @ApiProperty({ description: "Nazwa towaru/usługi" })
  @Expose()
  name: string;

  @ApiPropertyOptional({ description: "Jednostka miary" })
  @Expose()
  unit: string | null;

  @ApiProperty({ description: "Ilość", example: "10.00" })
  @Expose()
  quantity: string;

  @ApiProperty({ description: "Cena jednostkowa netto", example: "150.00" })
  @Expose()
  unitPrice: string;

  @ApiProperty({ description: "Stawka VAT", enum: ["23", "8", "5", "0", "zw"] })
  @Expose()
  vatRate: VatRate;

  @ApiProperty({ description: "Kwota netto (obliczona)", example: "1500.00" })
  @Expose()
  netAmount: string;

  @ApiProperty({ description: "Kwota VAT (obliczona)", example: "345.00" })
  @Expose()
  vatAmount: string;

  @ApiProperty({ description: "Kwota brutto (obliczona)", example: "1845.00" })
  @Expose()
  grossAmount: string;
}
```

```typescript
// src/modules/invoices/dto/responses/invoice-list-item.dto.ts
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class InvoiceListItemDto {
  @ApiProperty({ format: "uuid" })
  @Expose()
  id: string;

  @ApiProperty({ example: "FV/2026/001" })
  @Expose()
  invoiceNumber: string;

  @ApiProperty({ example: "2026-01-02" })
  @Expose()
  issueDate: string;

  @ApiProperty({ example: "2026-01-16" })
  @Expose()
  dueDate: string;

  @ApiProperty({ enum: ["draft", "unpaid", "paid"] })
  @Expose()
  status: InvoiceStatus;

  @ApiProperty({ example: "Firma XYZ Sp. z o.o." })
  @Expose()
  buyerName: string;

  @ApiPropertyOptional({ example: "9876543210" })
  @Expose()
  buyerNip: string | null;

  @ApiProperty({ example: "1500.00" })
  @Expose()
  totalNet: string;

  @ApiProperty({ example: "345.00" })
  @Expose()
  totalVat: string;

  @ApiProperty({ example: "1845.00" })
  @Expose()
  totalGross: string;

  @ApiProperty({ enum: ["PLN", "EUR", "USD"], default: "PLN" })
  @Expose()
  currency: Currency;

  @ApiProperty()
  @Expose()
  createdAt: string;

  @ApiProperty()
  @Expose()
  updatedAt: string;
}
```

```typescript
// src/modules/invoices/dto/responses/invoice-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { SellerInfoResponseDto } from "./seller-info-response.dto";
import { BuyerInfoResponseDto } from "./buyer-info-response.dto";
import { InvoiceItemResponseDto } from "./invoice-item-response.dto";

export class InvoiceResponseDto {
  @ApiProperty({ format: "uuid" })
  @Expose()
  id: string;

  @ApiProperty({ example: "FV/2026/001" })
  @Expose()
  invoiceNumber: string;

  @ApiProperty({ example: "2026-01-02" })
  @Expose()
  issueDate: string;

  @ApiProperty({ example: "2026-01-16" })
  @Expose()
  dueDate: string;

  @ApiProperty({ enum: ["draft", "unpaid", "paid"] })
  @Expose()
  status: InvoiceStatus;

  @ApiProperty({ enum: ["transfer", "cash", "card"] })
  @Expose()
  paymentMethod: PaymentMethod;

  @ApiProperty({ enum: ["PLN", "EUR", "USD"] })
  @Expose()
  currency: Currency;

  @ApiPropertyOptional()
  @Expose()
  notes: string | null;

  @ApiProperty({ type: SellerInfoResponseDto })
  @Expose()
  @Type(() => SellerInfoResponseDto)
  seller: SellerInfoResponseDto;

  @ApiProperty({ type: BuyerInfoResponseDto })
  @Expose()
  @Type(() => BuyerInfoResponseDto)
  buyer: BuyerInfoResponseDto;

  @ApiProperty({ type: [InvoiceItemResponseDto] })
  @Expose()
  @Type(() => InvoiceItemResponseDto)
  items: InvoiceItemResponseDto[];

  @ApiProperty({ example: "1500.00" })
  @Expose()
  totalNet: string;

  @ApiProperty({ example: "345.00" })
  @Expose()
  totalVat: string;

  @ApiProperty({ example: "1845.00" })
  @Expose()
  totalGross: string;

  @ApiPropertyOptional({ format: "uuid" })
  @Expose()
  contractorId: string | null;

  @ApiProperty()
  @Expose()
  createdAt: string;

  @ApiProperty()
  @Expose()
  updatedAt: string;
}
```

```typescript
// src/modules/invoices/dto/responses/invoice-list-response.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { InvoiceListItemDto } from "./invoice-list-item.dto";
import { PaginationMeta } from "../../../../common/dto/pagination.dto";

export class InvoiceListResponseDto {
  @ApiProperty({ type: [InvoiceListItemDto] })
  @Expose()
  @Type(() => InvoiceListItemDto)
  data: InvoiceListItemDto[];

  @ApiProperty({ type: PaginationMeta })
  @Expose()
  @Type(() => PaginationMeta)
  pagination: PaginationMeta;
}
```

```typescript
// src/modules/invoices/dto/responses/next-invoice-number-response.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class NextInvoiceNumberResponseDto {
  @ApiProperty({
    description: "Wygenerowany następny numer faktury",
    example: "FV/2026/006",
  })
  @Expose()
  nextNumber: string;

  @ApiProperty({
    description: "Użyty format numeracji",
    example: "FV/{YYYY}/{NNN}",
  })
  @Expose()
  format: string;

  @ApiProperty({ description: "Wartość licznika", example: 6 })
  @Expose()
  counter: number;
}
```

```typescript
// src/modules/invoices/dto/responses/update-invoice-status-response.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class UpdateInvoiceStatusResponseDto {
  @ApiProperty({ format: "uuid" })
  @Expose()
  id: string;

  @ApiProperty({ example: "FV/2026/001" })
  @Expose()
  invoiceNumber: string;

  @ApiProperty({ enum: ["draft", "unpaid", "paid"] })
  @Expose()
  status: InvoiceStatus;

  @ApiProperty()
  @Expose()
  updatedAt: string;
}
```

### 3.5 Custom Validators

```typescript
// src/common/validators/polish-nip.validator.ts
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
        defaultMessage(args: ValidationArguments) {
          return "Nieprawidłowa suma kontrolna NIP";
        },
      },
    });
  };
}
```

```typescript
// src/common/validators/decimal.validators.ts
import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";

export function IsPositiveDecimal(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "isPositiveDecimal",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== "string") return false;
          const num = parseFloat(value);
          return !isNaN(num) && num > 0;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} musi być liczbą większą od 0`;
        },
      },
    });
  };
}

export function IsNonNegativeDecimal(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "isNonNegativeDecimal",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== "string") return false;
          const num = parseFloat(value);
          return !isNaN(num) && num >= 0;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} nie może być ujemne`;
        },
      },
    });
  };
}
```

```typescript
// src/common/validators/date.validators.ts
import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";

export function IsDateAfterOrEqual(
  property: string,
  validationOptions?: ValidationOptions
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "isDateAfterOrEqual",
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];
          if (!value || !relatedValue) return true; // Let other validators handle required
          return new Date(value) >= new Date(relatedValue);
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          return `${args.property} musi być równe lub późniejsze niż ${relatedPropertyName}`;
        },
      },
    });
  };
}
```

### 3.6 Error Codes Enum

```typescript
// src/modules/invoices/enums/invoice-error-codes.enum.ts
export enum InvoiceErrorCode {
  INVOICE_NOT_FOUND = "INVOICE_NOT_FOUND",
  INVOICE_NUMBER_REQUIRED = "INVOICE_NUMBER_REQUIRED",
  INVOICE_NUMBER_EXISTS = "INVOICE_NUMBER_EXISTS",
  INVALID_DATES = "INVALID_DATES",
  ITEMS_REQUIRED = "ITEMS_REQUIRED",
  INVALID_VAT_RATE = "INVALID_VAT_RATE",
  INVALID_BUYER_NIP = "INVALID_BUYER_NIP",
  INCOMPLETE_PROFILE = "INCOMPLETE_PROFILE",
  INCOMPLETE_INVOICE = "INCOMPLETE_INVOICE",
  INVALID_STATUS = "INVALID_STATUS",
}
```

---

## 4. Szczegóły odpowiedzi

### 4.1 Lista faktur (200 OK)

```json
{
  "data": [
    {
      "id": "uuid",
      "invoiceNumber": "FV/2025/001",
      "issueDate": "2025-01-15",
      "dueDate": "2025-01-29",
      "status": "unpaid",
      "buyerName": "Kontrahent ABC",
      "buyerNip": "9876543210",
      "totalNet": "1000.00",
      "totalVat": "230.00",
      "totalGross": "1230.00",
      "currency": "PLN",
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### 4.2 Szczegóły faktury (200 OK)

```json
{
  "id": "uuid",
  "invoiceNumber": "FV/2025/001",
  "issueDate": "2025-01-15",
  "dueDate": "2025-01-29",
  "status": "unpaid",
  "paymentMethod": "transfer",
  "currency": "PLN",
  "notes": "Płatność w terminie 14 dni",
  "seller": {
    "companyName": "Moja Firma Sp. z o.o.",
    "address": "ul. Przykładowa 123, 00-001 Warszawa",
    "nip": "1234567890",
    "bankAccount": "PL61109010140000071219812874",
    "logoUrl": "https://storage.supabase.co/logos/uuid/logo.png"
  },
  "buyer": {
    "name": "Kontrahent ABC",
    "address": "ul. Firmowa 10, 00-100 Kraków",
    "nip": "9876543210"
  },
  "items": [
    {
      "id": "uuid",
      "position": 1,
      "name": "Usługa konsultingowa",
      "unit": "godz.",
      "quantity": "10.00",
      "unitPrice": "100.00",
      "vatRate": "23",
      "netAmount": "1000.00",
      "vatAmount": "230.00",
      "grossAmount": "1230.00"
    }
  ],
  "totalNet": "1000.00",
  "totalVat": "230.00",
  "totalGross": "1230.00",
  "contractorId": "uuid",
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:00:00Z"
}
```

### 4.3 Następny numer (200 OK)

```json
{
  "nextNumber": "FV/2025/006",
  "format": "FV/{YYYY}/{NNN}",
  "counter": 6
}
```

### 4.4 Zmiana statusu (200 OK)

```json
{
  "id": "uuid",
  "invoiceNumber": "FV/2025/006",
  "status": "paid",
  "updatedAt": "2025-01-25T09:00:00Z"
}
```

### 4.5 Usunięcie (200 OK)

```json
{
  "message": "Invoice successfully deleted"
}
```

### 4.6 Błędy

```json
{
  "statusCode": 400,
  "code": "INVALID_DATES",
  "message": "Due date must be on or after issue date",
  "timestamp": "2025-01-15T10:00:00Z"
}
```

---

## 5. Przepływ danych

### 5.1 Diagram przepływu - Tworzenie faktury

```
┌────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend     │────▶│ InvoicesController│────▶│ InvoicesService │
│  (Angular)     │     │  @Post()          │     │   create()      │
└────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                                                          ▼
                        ┌─────────────────────────────────────────────┐
                        │                                             │
                        ▼                                             ▼
               ┌─────────────────┐                      ┌─────────────────────┐
               │UserProfilesService│                      │InvoiceCalculation   │
               │ getProfile()    │                      │Service.calculate()  │
               └────────┬────────┘                      └──────────┬──────────┘
                        │                                          │
                        │ Snapshot sprzedawcy                      │ Obliczenia
                        ▼                                          ▼
               ┌─────────────────────────────────────────────────────────────┐
               │                      Supabase                                │
               │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
               │  │user_profiles │  │   invoices   │  │invoice_items │       │
               │  └──────────────┘  └──────────────┘  └──────────────┘       │
               └─────────────────────────────────────────────────────────────┘
```

### 5.2 Przepływ - Lista faktur

1. **Request** → Controller (walidacja query params)
2. **Controller** → Service (przekazanie userId i query)
3. **Service** → Supabase (zapytanie z filtrami i paginacją)
4. **Supabase** → RLS (filtrowanie po user_id)
5. **Service** → Mapowanie na DTO (formatowanie kwot jako string)
6. **Response** → Frontend

### 5.3 Przepływ - Tworzenie faktury

1. **Request** → Controller (walidacja DTO)
2. **Controller** → Service.create()
3. **Service** → UserProfilesService.getProfile() (dane sprzedawcy)
4. **Service** → Walidacja kompletności profilu (dla status !== draft)
5. **Service** → Walidacja unikalności numeru faktury
6. **Service** → InvoiceCalculationService (obliczenia pozycji i sum)
7. **Service** → Supabase INSERT (invoices + invoice_items w transakcji)
8. **Service** → Mapowanie na InvoiceResponse
9. **Response** → Frontend

### 5.4 Przepływ - Duplikacja faktury

1. **Request** → Controller (walidacja DTO)
2. **Controller** → Service.duplicate()
3. **Service** → findOne() (pobranie oryginalnej faktury)
4. **Service** → getNextNumber() (jeśli brak invoiceNumber w request)
5. **Service** → UserProfilesService.getProfile() (świeży snapshot)
6. **Service** → Obliczenie nowej dueDate (zachowanie interwału dni)
7. **Service** → create() z nowymi danymi (status = draft)
8. **Response** → Frontend

---

## 6. Względy bezpieczeństwa

### 6.1 Uwierzytelnianie

- **JWT Bearer Token** w nagłówku Authorization
- Walidacja tokenu przez `JwtAuthGuard`
- Ekstrakcja userId z tokenu przez `@CurrentUser()` decorator

```typescript
@Controller("api/v1/invoices")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InvoicesController {
  @Get()
  findAll(
    @CurrentUser("id") userId: string,
    @Query() query: InvoiceListQueryDto
  ) {
    return this.invoicesService.findAll(userId, query);
  }
}
```

### 6.2 Autoryzacja

- **Row Level Security (RLS)** w Supabase
- Każda operacja wymaga `user_id` pasującego do tokenu
- Brak dostępu do faktur innych użytkowników

```sql
-- Polityka RLS dla invoices
CREATE POLICY "Users can only access own invoices"
ON invoices FOR ALL
USING (user_id = auth.uid());
```

### 6.3 Walidacja danych wejściowych

1. **DTO Validation** - class-validator na wszystkich polach
2. **NIP Validation** - suma kontrolna polskiego NIP
3. **UUID Validation** - format UUID dla ID
4. **Date Validation** - poprawne daty, dueDate >= issueDate
5. **Amount Validation** - quantity > 0, unitPrice >= 0

### 6.4 Ochrona przed atakami

| Zagrożenie      | Mitygacja                                   |
| --------------- | ------------------------------------------- |
| SQL Injection   | Parametryzowane zapytania Supabase          |
| IDOR            | Walidacja user_id przy każdej operacji      |
| Mass Assignment | Whitelist pól w DTO                         |
| XSS             | Sanityzacja wyjścia (Angular automatycznie) |
| Rate Limiting   | ThrottlerGuard (opcjonalnie)                |

---

## 7. Obsługa błędów

### 7.1 Wyjątki biznesowe

```typescript
// invoices/exceptions/invoice.exceptions.ts
export class InvoiceNotFoundException extends NotFoundException {
  constructor(id: string) {
    super({ code: "INVOICE_NOT_FOUND", message: "Invoice not found" });
  }
}

export class InvoiceNumberExistsException extends ConflictException {
  constructor(invoiceNumber: string) {
    super({
      code: "INVOICE_NUMBER_EXISTS",
      message: "Invoice with this number already exists",
    });
  }
}

export class InvalidDatesException extends BadRequestException {
  constructor() {
    super({
      code: "INVALID_DATES",
      message: "Due date must be on or after issue date",
    });
  }
}

export class ItemsRequiredException extends BadRequestException {
  constructor() {
    super({
      code: "ITEMS_REQUIRED",
      message: "At least one invoice item is required",
    });
  }
}

export class IncompleteProfileException extends BadRequestException {
  constructor() {
    super({
      code: "INCOMPLETE_PROFILE",
      message: "Complete your company profile before issuing invoices",
    });
  }
}

export class IncompleteInvoiceException extends BadRequestException {
  constructor() {
    super({
      code: "INCOMPLETE_INVOICE",
      message: "Cannot mark as unpaid/paid: invoice data is incomplete",
    });
  }
}

export class InvalidBuyerNipException extends BadRequestException {
  constructor() {
    super({
      code: "INVALID_BUYER_NIP",
      message: "Invalid buyer NIP format or checksum",
    });
  }
}
```

### 7.2 Tabela błędów i kodów HTTP

| Scenariusz             | HTTP | Kod błędu               | Komunikat                                              |
| ---------------------- | ---- | ----------------------- | ------------------------------------------------------ |
| Brak tokenu            | 401  | UNAUTHORIZED            | Invalid or missing authentication token                |
| Faktura nie znaleziona | 404  | INVOICE_NOT_FOUND       | Invoice not found                                      |
| Numer istnieje         | 409  | INVOICE_NUMBER_EXISTS   | Invoice with this number already exists                |
| Brak numeru            | 400  | INVOICE_NUMBER_REQUIRED | Invoice number is required                             |
| Złe daty               | 400  | INVALID_DATES           | Due date must be on or after issue date                |
| Brak pozycji           | 400  | ITEMS_REQUIRED          | At least one invoice item is required                  |
| Zły VAT                | 400  | INVALID_VAT_RATE        | Invalid VAT rate. Allowed: 23, 8, 5, 0, zw             |
| Zły NIP                | 400  | INVALID_BUYER_NIP       | Invalid buyer NIP format or checksum                   |
| Niekompletny profil    | 400  | INCOMPLETE_PROFILE      | Complete your company profile before issuing invoices  |
| Niekompletna faktura   | 400  | INCOMPLETE_INVOICE      | Cannot mark as unpaid/paid: invoice data is incomplete |
| Zły status             | 400  | INVALID_STATUS          | Invalid status. Allowed: draft, unpaid, paid           |
| Błąd serwera           | 500  | INTERNAL_ERROR          | Internal server error                                  |

---

## 8. Rozważania dotyczące wydajności

### 8.1 Optymalizacja zapytań

1. **Indeksy bazy danych:**

   ```sql
   CREATE INDEX idx_invoices_user_id ON invoices(user_id);
   CREATE INDEX idx_invoices_status ON invoices(status);
   CREATE INDEX idx_invoices_issue_date ON invoices(issue_date);
   CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
   CREATE INDEX idx_invoices_deleted_at ON invoices(deleted_at) WHERE deleted_at IS NULL;
   CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
   ```

2. **Paginacja:**

   - Limit max 100 elementów
   - Cursor-based pagination dla dużych zbiorów (opcjonalnie w przyszłości)

3. **Eager loading:**
   - Pobieranie items razem z fakturą w jednym zapytaniu (JOIN)

### 8.2 Caching (opcjonalne)

```typescript
// Dla często odpytywanego next-number
@Get('next-number')
@CacheTTL(60) // 60 sekund
getNextNumber(@CurrentUser('id') userId: string) {
  return this.invoicesService.getNextNumber(userId);
}
```

### 8.3 Transakcje

- Tworzenie/aktualizacja faktury z items w transakcji
- Zapewnienie spójności danych

```typescript
async create(userId: string, dto: CreateInvoiceDto): Promise<InvoiceResponse> {
  // Użyj transakcji Supabase lub RPC
  const { data, error } = await this.supabase.rpc('create_invoice_with_items', {
    p_user_id: userId,
    p_invoice: invoiceData,
    p_items: itemsData
  });
}
```

---

## 9. Etapy wdrożenia

### Faza 1: Przygotowanie infrastruktury

1. **Utworzenie struktury modułu:**

   ```
   apps/backend/src/
   └── invoices/
       ├── invoices.module.ts
       ├── invoices.controller.ts
       ├── invoices.service.ts
       ├── dto/
       │   ├── invoice-list-query.dto.ts
       │   ├── create-invoice.dto.ts
       │   ├── update-invoice.dto.ts
       │   ├── update-invoice-status.dto.ts
       │   └── duplicate-invoice.dto.ts
       ├── exceptions/
       │   └── invoice.exceptions.ts
       └── services/
           ├── invoice-calculation.service.ts
           └── invoice-number.service.ts
   ```

2. **Utworzenie pomocniczych serwisów:**

   - `UserProfilesService` (jeśli nie istnieje) - pobieranie profilu
   - `SupabaseService` - klient Supabase (współdzielony)

3. **Custom Validators:**
   - `IsPolishNIP` - walidacja NIP
   - `IsDateAfterOrEqual` - walidacja dat
   - `IsPositiveDecimal` - walidacja kwot

### Faza 2: Implementacja DTO i walidacji

4. **Implementacja DTOs:**

   - `InvoiceListQueryDto` z walidacją query params
   - `CreateInvoiceDto` z zagnieżdżonymi `BuyerInfoDto` i `InvoiceItemDto`
   - `UpdateInvoiceDto` jako PartialType
   - `UpdateInvoiceStatusDto`
   - `DuplicateInvoiceDto`

5. **Implementacja custom validators:**
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
           validate(value: any) {
             if (!value) return true; // Optional field
             return validateNIP(value);
           },
           defaultMessage() {
             return "Invalid Polish NIP";
           },
         },
       });
     };
   }
   ```

### Faza 3: Implementacja serwisów pomocniczych

6. **InvoiceCalculationService:**

   ```typescript
   @Injectable()
   export class InvoiceCalculationService {
     calculateItem(item: InvoiceItemDto): CalculatedItem {
       const quantity = new Decimal(item.quantity);
       const unitPrice = new Decimal(item.unitPrice);
       const netAmount = quantity.mul(unitPrice);

       const vatRate = item.vatRate === "zw" ? 0 : parseInt(item.vatRate);
       const vatAmount = netAmount.mul(vatRate).div(100);
       const grossAmount = netAmount.add(vatAmount);

       return {
         ...item,
         netAmount: netAmount.toFixed(2),
         vatAmount: vatAmount.toFixed(2),
         grossAmount: grossAmount.toFixed(2),
       };
     }

     calculateTotals(items: CalculatedItem[]): InvoiceTotals {
       const totals = items.reduce(
         (acc, item) => ({
           net: acc.net.add(new Decimal(item.netAmount)),
           vat: acc.vat.add(new Decimal(item.vatAmount)),
           gross: acc.gross.add(new Decimal(item.grossAmount)),
         }),
         { net: new Decimal(0), vat: new Decimal(0), gross: new Decimal(0) }
       );

       return {
         totalNet: totals.net.toFixed(2),
         totalVat: totals.vat.toFixed(2),
         totalGross: totals.gross.toFixed(2),
       };
     }
   }
   ```

7. **InvoiceNumberService:**

   ```typescript
   @Injectable()
   export class InvoiceNumberService {
     generateNumber(
       format: string,
       counter: number,
       date: Date = new Date()
     ): string {
       const year = date.getFullYear();
       const month = (date.getMonth() + 1).toString().padStart(2, "0");
       const paddedCounter = counter.toString().padStart(3, "0");

       return format
         .replace("{YYYY}", year.toString())
         .replace("{MM}", month)
         .replace("{NNN}", paddedCounter)
         .replace("{N}", counter.toString());
     }
   }
   ```

### Faza 4: Implementacja głównego serwisu

8. **InvoicesService - metody odczytu:**

   ```typescript
   @Injectable()
   export class InvoicesService {
     constructor(
       private supabase: SupabaseService,
       private userProfilesService: UserProfilesService,
       private calculationService: InvoiceCalculationService,
       private numberService: InvoiceNumberService
     ) {}

     async findAll(
       userId: string,
       query: InvoiceListQueryDto
     ): Promise<InvoiceListResponse> {
       // Budowanie zapytania z filtrami
       // Wykonanie z paginacją
       // Mapowanie na DTO
     }

     async findOne(userId: string, id: string): Promise<InvoiceResponse> {
       // Pobranie faktury z items
       // Walidacja istnienia i własności
       // Mapowanie na DTO z obliczonymi kwotami
     }

     async getNextNumber(userId: string): Promise<NextInvoiceNumberResponse> {
       // Pobranie profilu (format + counter)
       // Generowanie numeru
     }
   }
   ```

9. **InvoicesService - metody zapisu:**

   ```typescript
   async create(userId: string, dto: CreateInvoiceDto): Promise<InvoiceResponse> {
     // 1. Pobranie profilu użytkownika (snapshot sprzedawcy)
     // 2. Walidacja kompletności profilu (dla status !== draft)
     // 3. Walidacja unikalności numeru faktury
     // 4. Walidacja NIP nabywcy (jeśli podany)
     // 5. Obliczenie kwot pozycji i sum
     // 6. INSERT invoices + invoice_items (transakcja)
     // 7. Inkrementacja licznika (jeśli użyto auto-numeru)
     // 8. Mapowanie na response
   }

   async update(userId: string, id: string, dto: UpdateInvoiceDto): Promise<InvoiceResponse> {
     // 1. Pobranie istniejącej faktury
     // 2. Walidacja dat
     // 3. Walidacja unikalności numeru (jeśli zmieniony)
     // 4. Przeliczenie kwot
     // 5. UPDATE invoice
     // 6. Zarządzanie items (usunięcie/dodanie/aktualizacja)
     // 7. Mapowanie na response
   }

   async updateStatus(userId: string, id: string, dto: UpdateInvoiceStatusDto): Promise<UpdateInvoiceStatusResponse> {
     // 1. Pobranie faktury
     // 2. Walidacja kompletności (dla unpaid/paid)
     // 3. UPDATE status
   }

   async duplicate(userId: string, id: string, dto: DuplicateInvoiceDto): Promise<InvoiceResponse> {
     // 1. Pobranie oryginalnej faktury
     // 2. Generowanie numeru (lub z dto)
     // 3. Świeży snapshot sprzedawcy
     // 4. Obliczenie nowej dueDate
     // 5. Wywołanie create() z nowymi danymi
   }

   async remove(userId: string, id: string): Promise<MessageResponse> {
     // 1. Walidacja istnienia
     // 2. UPDATE deleted_at = NOW()
   }
   ```

### Faza 5: Implementacja kontrolera

10. **InvoicesController:**

    ```typescript
    @ApiTags("Invoices")
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Controller("api/v1/invoices")
    export class InvoicesController {
      constructor(private readonly invoicesService: InvoicesService) {}

      @Get()
      @ApiOperation({ summary: "Lista faktur" })
      @ApiResponse({ status: 200, type: InvoiceListResponse })
      findAll(
        @CurrentUser("id") userId: string,
        @Query() query: InvoiceListQueryDto
      ): Promise<InvoiceListResponse> {
        return this.invoicesService.findAll(userId, query);
      }

      @Get("next-number")
      @ApiOperation({ summary: "Następny numer faktury" })
      getNextNumber(
        @CurrentUser("id") userId: string
      ): Promise<NextInvoiceNumberResponse> {
        return this.invoicesService.getNextNumber(userId);
      }

      @Get(":id")
      @ApiOperation({ summary: "Szczegóły faktury" })
      @ApiParam({ name: "id", type: "string", format: "uuid" })
      findOne(
        @CurrentUser("id") userId: string,
        @Param("id", ParseUUIDPipe) id: string
      ): Promise<InvoiceResponse> {
        return this.invoicesService.findOne(userId, id);
      }

      @Post()
      @ApiOperation({ summary: "Utwórz fakturę" })
      @ApiResponse({ status: 201, type: InvoiceResponse })
      create(
        @CurrentUser("id") userId: string,
        @Body() dto: CreateInvoiceDto
      ): Promise<InvoiceResponse> {
        return this.invoicesService.create(userId, dto);
      }

      @Put(":id")
      @ApiOperation({ summary: "Aktualizuj fakturę" })
      update(
        @CurrentUser("id") userId: string,
        @Param("id", ParseUUIDPipe) id: string,
        @Body() dto: UpdateInvoiceDto
      ): Promise<InvoiceResponse> {
        return this.invoicesService.update(userId, id, dto);
      }

      @Patch(":id/status")
      @ApiOperation({ summary: "Zmień status faktury" })
      updateStatus(
        @CurrentUser("id") userId: string,
        @Param("id", ParseUUIDPipe) id: string,
        @Body() dto: UpdateInvoiceStatusDto
      ): Promise<UpdateInvoiceStatusResponse> {
        return this.invoicesService.updateStatus(userId, id, dto);
      }

      @Post(":id/duplicate")
      @ApiOperation({ summary: "Duplikuj fakturę" })
      @ApiResponse({ status: 201, type: InvoiceResponse })
      duplicate(
        @CurrentUser("id") userId: string,
        @Param("id", ParseUUIDPipe) id: string,
        @Body() dto: DuplicateInvoiceDto
      ): Promise<InvoiceResponse> {
        return this.invoicesService.duplicate(userId, id, dto);
      }

      @Delete(":id")
      @ApiOperation({ summary: "Usuń fakturę" })
      remove(
        @CurrentUser("id") userId: string,
        @Param("id", ParseUUIDPipe) id: string
      ): Promise<MessageResponse> {
        return this.invoicesService.remove(userId, id);
      }
    }
    ```

### Faza 6: Rejestracja modułu

11. **InvoicesModule:**

    ```typescript
    @Module({
      imports: [
        // Moduły zależne (Auth, Supabase, UserProfiles)
      ],
      controllers: [InvoicesController],
      providers: [
        InvoicesService,
        InvoiceCalculationService,
        InvoiceNumberService,
      ],
      exports: [InvoicesService],
    })
    export class InvoicesModule {}
    ```

12. **Aktualizacja AppModule:**
    ```typescript
    @Module({
      imports: [
        // ... inne moduły
        InvoicesModule,
      ],
    })
    export class AppModule {}
    ```

### Faza 7: Testy

13. **Testy jednostkowe serwisów:**

    - `InvoiceCalculationService` - obliczenia kwot
    - `InvoiceNumberService` - generowanie numerów
    - `InvoicesService` - mockowanie Supabase

14. **Testy integracyjne kontrolera:**

    - Wszystkie endpointy z różnymi scenariuszami
    - Walidacja DTO
    - Obsługa błędów

15. **Testy E2E:**
    - Pełny flow tworzenia faktury
    - Paginacja i filtrowanie
    - Zmiana statusu

### Faza 8: Dokumentacja i finalizacja

16. **Dokumentacja Swagger:**

    - Wszystkie endpointy z przykładami
    - Opisy błędów
    - Schematy DTO

17. **Przegląd kodu i optymalizacja:**
    - Code review
    - Optymalizacja zapytań
    - Testy wydajnościowe

---

## 10. Zależności

### Pakiety npm wymagane:

```json
{
  "dependencies": {
    "@nestjs/common": "^10.x",
    "@nestjs/swagger": "^7.x",
    "@supabase/supabase-js": "^2.x",
    "class-validator": "^0.14.x",
    "class-transformer": "^0.5.x",
    "decimal.js": "^10.x"
  }
}
```

### Moduły NestJS wymagane:

- `AuthModule` - JWT Guard i CurrentUser decorator
- `SupabaseModule` - klient Supabase
- `UserProfilesModule` - serwis profili (do snapshot sprzedawcy)
- `ConfigModule` - konfiguracja środowiskowa
