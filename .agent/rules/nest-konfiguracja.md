---
trigger: always_on
---

# NestJS - Konfiguracja i Zmienne Środowiskowe

## Ta reguła definiuje standardy zarządzania konfiguracją w aplikacji NestJS.

## 1. Moduł Konfiguracji

```typescript
// app.module.ts
import { ConfigModule } from "@nestjs/config";
import configuration from "./config/configuration";
import { validate } from "./config/env.validation";
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
      envFilePath: [`.env.${process.env.NODE_ENV}`, ".env"],
    }),
  ],
})
export class AppModule {}
```

```typescript
// config/configuration.ts
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    name: process.env.DATABASE_NAME,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },
});
```

---

## 2. Walidacja Zmiennych Środowiskowych

```typescript
// config/env.validation.ts
import { plainToInstance } from "class-transformer";
import { IsEnum, IsNumber, IsString, validateSync } from "class-validator";
enum Environment {
  Development = "development",
  Production = "production",
  Test = "test",
}
class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;
  @IsNumber()
  PORT: number;
  @IsString()
  DATABASE_HOST: string;
  @IsNumber()
  DATABASE_PORT: number;
  @IsString()
  JWT_SECRET: string;
}
export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig);
  if (errors.length > 0) {
    throw new Error(`Błąd walidacji env: ${errors.toString()}`);
  }
  return validatedConfig;
}
```

---

## 3. Użycie ConfigService

```typescript
@Injectable()
export class EmailService {
  constructor(private readonly configService: ConfigService) {}
  getSmtpHost(): string {
    return this.configService.get<string>("email.host");
  }
}
```

---

## 4. Zasady

| Zasada        | Opis                                              |
| ------------- | ------------------------------------------------- |
| .gitignore    | Dodaj `.env*` do .gitignore (oprócz .env.example) |
| .env.example  | Commituj przykładowy plik bez sekretów            |
| Walidacja     | Waliduj wszystkie zmienne przy starcie            |
| Hardkodowanie | **Nigdy** nie hardkoduj sekretów w kodzie         |
