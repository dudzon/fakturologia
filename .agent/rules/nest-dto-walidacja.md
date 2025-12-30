---
trigger: always_on
---

# NestJS - DTO i Walidacja

## Ta reguła definiuje standardy dla Data Transfer Objects (DTO) i walidacji danych w aplikacji NestJS.

## 1. Data Transfer Objects (DTO)

### 1.1 Podstawowe Zasady

- **Zawsze** używaj DTO dla wejścia/wyjścia API
- Używaj dekoratorów walidacji z `class-validator`
- Używaj transformacji danych z `class-transformer`
- Twórz **osobne DTO** dla operacji tworzenia, aktualizacji i odpowiedzi

### 1.2 Przykład Create DTO

```typescript
import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  Matches,
} from "class-validator";
import { Transform } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
export class CreateUserDto {
  @ApiProperty({
    example: "jan@example.com",
    description: "Adres email użytkownika",
  })
  @IsEmail({}, { message: "Podaj prawidłowy adres email" })
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;
  @ApiProperty({
    minLength: 8,
    description: "Hasło - minimum 8 znaków, musi zawierać cyfrę",
  })
  @IsString()
  @MinLength(8, { message: "Hasło musi mieć minimum 8 znaków" })
  @Matches(/\d/, { message: "Hasło musi zawierać przynajmniej jedną cyfrę" })
  password: string;
  @ApiPropertyOptional({ example: "Jan" })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  firstName?: string;
  @ApiPropertyOptional({ example: "Kowalski" })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  lastName?: string;
  @ApiProperty({ enum: UserRole, enumName: "UserRole" })
  @IsEnum(UserRole, { message: "Nieprawidłowa rola użytkownika" })
  role: UserRole;
}
```

### 1.3 Update DTO z PartialType

```typescript
import { PartialType, OmitType } from "@nestjs/mapped-types";
// Wszystkie pola opcjonalne
export class UpdateUserDto extends PartialType(CreateUserDto) {}
// Wszystkie pola opcjonalne, ale bez password
export class UpdateProfileDto extends PartialType(
  OmitType(CreateUserDto, ["password", "role"] as const)
) {}
```

### 1.4 Response DTO

```typescript
import { Expose, Exclude, Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
export class UserResponseDto {
  @ApiProperty()
  @Expose()
  id: string;
  @ApiProperty()
  @Expose()
  email: string;
  @ApiProperty()
  @Expose()
  firstName: string;
  @ApiProperty()
  @Expose()
  lastName: string;
  @ApiProperty()
  @Expose()
  @Transform(({ value }) => value?.toISOString())
  createdAt: Date;
  @Exclude()
  password: string; // Nigdy nie eksponowane
  @Exclude()
  deletedAt: Date; // Ukryte
  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
```

---

## 2. Walidacja

### 2.1 Globalna Konfiguracja ValidationPipe

```typescript
// main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true, // Usuń nieznane właściwości
    forbidNonWhitelisted: true, // Rzuć błąd przy nieznanych właściwościach
    transform: true, // Transformuj payloady do instancji DTO
    transformOptions: {
      enableImplicitConversion: true, // Automatyczna konwersja typów
    },
  })
);
```

### 2.2 Popularne Dekoratory Walidacji

```typescript
// Typy podstawowe
@IsString()
@IsNumber()
@IsBoolean()
@IsDate()
@IsEnum(MyEnum)
@IsUUID()
// Stringi
@IsEmail()
@IsUrl()
@MinLength(5)
@MaxLength(100)
@Matches(/regex/)
@IsNotEmpty()
// Liczby
@Min(0)
@Max(100)
@IsPositive()
@IsInt()
// Tablice i obiekty
@IsArray()
@ArrayMinSize(1)
@ArrayMaxSize(10)
@ValidateNested({ each: true })
@Type(() => NestedDto)
// Opcjonalność
@IsOptional()
// Warunkowa walidacja
@ValidateIf(o => o.type === 'specific')
```

### 2.3 Walidacja Zagnieżdżonych Obiektów

```typescript
import { Type } from "class-transformer";
import { ValidateNested, IsArray } from "class-validator";
class AddressDto {
  @IsString()
  street: string;
  @IsString()
  city: string;
  @IsString()
  @Matches(/^\d{2}-\d{3}$/, { message: "Nieprawidłowy kod pocztowy" })
  postalCode: string;
}
class CreateCompanyDto {
  @IsString()
  name: string;
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddressDto)
  branches: AddressDto[];
}
```

### 2.4 Własne Dekoratory Walidacji

```typescript
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
          if (typeof value !== "string") return false;
          const nip = value.replace(/[- ]/g, "");
          if (nip.length !== 10 || !/^\d+$/.test(nip)) return false;
          const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
          const sum = weights.reduce(
            (acc, w, i) => acc + w * parseInt(nip[i]),
            0
          );
          return sum % 11 === parseInt(nip[9]);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} musi być prawidłowym numerem NIP`;
        },
      },
    });
  };
}
// Użycie
class CompanyDto {
  @IsPolishNIP()
  nip: string;
}
```

---

## 3. Transformacja Danych

### 3.1 Dekoratory Transformacji

```typescript
import { Transform, Type, Exclude, Expose } from "class-transformer";
class QueryDto {
  // Transformacja stringa na lowercase
  @Transform(({ value }) => value?.toLowerCase().trim())
  @IsString()
  search: string;
  // Parsowanie daty
  @Type(() => Date)
  @IsDate()
  startDate: Date;
  // Parsowanie boolean z query string
  @Transform(({ value }) => value === "true")
  @IsBoolean()
  active: boolean;
  // Parsowanie tablicy z query string
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsArray()
  tags: string[];
}
```

### 3.2 Serializacja Odpowiedzi

```typescript
// Używaj ClassSerializerInterceptor globalnie
// main.ts
app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
// Lub na poziomie kontrolera
@Controller("users")
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  @Get(":id")
  async findOne(@Param("id") id: string): Promise<UserResponseDto> {
    const user = await this.usersService.findOne(id);
    return new UserResponseDto(user);
  }
}
```

---

## 4. Paginacja

### 4.1 DTO Paginacji

```typescript
import { IsOptional, IsInt, Min, Max } from "class-validator";
import { Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";
export class PaginationDto {
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
}
```

### 4.2 Paginowana Odpowiedź

```typescript
import { ApiProperty } from "@nestjs/swagger";
export class PaginationMeta {
  @ApiProperty()
  total: number;
  @ApiProperty()
  page: number;
  @ApiProperty()
  limit: number;
  @ApiProperty()
  totalPages: number;
  @ApiProperty()
  hasNextPage: boolean;
  @ApiProperty()
  hasPreviousPage: boolean;
}
export class PaginatedResponseDto<T> {
  @ApiProperty({ isArray: true })
  data: T[];
  @ApiProperty({ type: PaginationMeta })
  meta: PaginationMeta;
  constructor(data: T[], total: number, page: number, limit: number) {
    this.data = data;
    this.meta = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPreviousPage: page > 1,
    };
  }
}
```
