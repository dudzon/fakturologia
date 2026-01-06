---
trigger: always_on
---

# NestJS - Struktura Projektu i Organizacja

## Ta reguła definiuje standardy organizacji projektu dla aplikacji NestJS.

## 1. Architektura Modułowa

- **Zawsze** organizuj kod w moduły funkcjonalne (jeden moduł na domenę/funkcjonalność)
- Każdy moduł powinien być samodzielny ze swoimi kontrolerami, serwisami, DTO, encjami i testami
- Stosuj przejrzystą strukturę katalogów:

```
src/
├── common/                    # Współdzielone narzędzia, dekoratory, guardy, filtry
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── pipes/
│   └── utils/
├── config/                    # Pliki konfiguracyjne i walidacja
├── database/                  # Konfiguracja bazy danych, migracje, seedy
├── modules/                   # Moduły funkcjonalne
│   └── users/
│       ├── dto/
│       │   ├── create-user.dto.ts
│       │   └── update-user.dto.ts
│       ├── entities/
│       │   └── user.entity.ts
│       ├── users.controller.ts
│       ├── users.service.ts
│       ├── users.module.ts
│       ├── users.repository.ts  # Opcjonalnie: własne repozytorium
│       └── users.controller.spec.ts
├── app.module.ts
└── main.ts
```

---

## 2. Konwencje Nazewnictwa

### 2.1 Pliki

- Używaj **kebab-case** dla nazw plików
- Przykłady:
  - `user-profile.service.ts`
  - `create-user.dto.ts`
  - `jwt-auth.guard.ts`

### 2.2 Klasy i Interfejsy

- **Klasy**: Używaj PascalCase (np. `UserProfileService`)
- **Interfejsy**: Prefiksy z `I` (np. `IUserResponse`) lub opisowe nazwy

### 2.3 Sufiksy według typu

| Typ         | Sufiks                | Przykład              |
| ----------- | --------------------- | --------------------- |
| DTO         | `Dto`                 | `CreateUserDto`       |
| Encja       | - (liczba pojedyncza) | `User`                |
| Kontroler   | `Controller`          | `UsersController`     |
| Serwis      | `Service`             | `UsersService`        |
| Moduł       | `Module`              | `UsersModule`         |
| Guard       | `Guard`               | `JwtAuthGuard`        |
| Pipe        | `Pipe`                | `ParseUUIDPipe`       |
| Interceptor | `Interceptor`         | `LoggingInterceptor`  |
| Filter      | `Filter`              | `HttpExceptionFilter` |

---

## 3. Zasady Modułów

### 3.1 Enkapsulacja

- To co nie jest wyeksportowane z modułu, jest prywatne
- Eksportuj tylko to, co ma być używane przez inne moduły
- Unikaj circular dependencies między modułami

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Tylko to co ma być dostępne z zewnątrz
})
export class UsersModule {}
```

### 3.2 Organizacja Importów

```typescript
// 1. Biblioteki zewnętrzne (NestJS, npm packages)
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
// 2. Moduły wewnętrzne (absolute imports)
import { EmailModule } from "../email/email.module";
// 3. Lokalne pliki (relative imports)
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { User } from "./entities/user.entity";
```

---

## 4. Katalog Common

Katalog `common/` zawiera współdzielone elementy używane w całej aplikacji:

### 4.1 Dekoratory (`common/decorators/`)

- Własne dekoratory parametrów
- Dekoratory kompozytowe

### 4.2 Filtry (`common/filters/`)

- Globalne filtry wyjątków
- Filtry domenowe

### 4.3 Guardy (`common/guards/`)

- Guardy uwierzytelniania
- Guardy autoryzacji (role, permissions)

### 4.4 Interceptory (`common/interceptors/`)

- Logging interceptor
- Transform interceptor
- Timeout interceptor

### 4.5 Pipes (`common/pipes/`)

- Własne pipe'y walidacyjne
- Pipe'y transformacyjne

### 4.6 Utils (`common/utils/`)

- Funkcje pomocnicze
- Stałe aplikacji
