---
trigger: always_on
---

# NestJS - Bezpieczeństwo i Wydajność

## Ta reguła definiuje standardy bezpieczeństwa i optymalizacji wydajności w NestJS.

## 1. Bezpieczeństwo

### 1.1 Konfiguracja main.ts

```typescript
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { ValidationPipe } from "@nestjs/common";
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Nagłówki bezpieczeństwa
  app.use(helmet());
  // CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [],
    credentials: true,
  });
  // Rate limiting
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minut
      max: 100, // max 100 żądań na IP
    })
  );
  // Walidacja globalna
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Usuń nieznane pola
      forbidNonWhitelisted: true, // Błąd przy nieznanych polach
      transform: true,
    })
  );
  // Prefiks API
  app.setGlobalPrefix("api/v1");
  await app.listen(3000);
}
```

### 1.2 Zasady Bezpieczeństwa

| Zasada        | Implementacja                    |
| ------------- | -------------------------------- |
| Helmet        | Nagłówki HTTP security           |
| CORS          | Określone originy, nie `*`       |
| Rate Limiting | Ochrona przed DDoS/brute force   |
| Walidacja     | Whitelist + forbidNonWhitelisted |
| HTTPS         | Zawsze w produkcji               |
| Hashowanie    | bcrypt/argon2 dla haseł          |

### 1.3 Czego NIGDY nie robić

❌ Nie loguj wrażliwych danych (hasła, tokeny)
❌ Nie zwracaj stack trace w produkcji
❌ Nie ufaj danym użytkownika
❌ Nie przechowuj haseł w plain text

---

## 2. Wydajność

### 2.1 Paginacja

```typescript
export class PaginationDto {
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
}
export class PaginatedResponseDto<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

### 2.2 Caching

```typescript
// Użyj CacheModule
@Module({
  imports: [
    CacheModule.register({
      ttl: 60, // sekundy
      max: 100, // max elementów
    }),
  ],
})
export class AppModule {}
// W kontrolerze
@Controller("products")
@UseInterceptors(CacheInterceptor)
export class ProductsController {
  @Get()
  @CacheTTL(30)
  findAll() {
    return this.productsService.findAll();
  }
}
```

### 2.3 Kompresja

```typescript
import compression from "compression";
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(compression());
}
```

---

## 3. Health Checks

```typescript
// health/health.controller.ts
@Controller("health")
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator
  ) {}
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([() => this.db.pingCheck("database")]);
  }
}
```

---

## 4. Logging Interceptor

```typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger("HTTP");
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();
    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        this.logger.log(
          `${method} ${url} ${response.statusCode} - ${Date.now() - now}ms`
        );
      })
    );
  }
}
```

---

## 5. Zależności

```json
{
  "dependencies": {
    "@nestjs/common": "^10.x",
    "@nestjs/core": "^10.x",
    "@nestjs/config": "^3.x",
    "@nestjs/typeorm": "^10.x",
    "@nestjs/swagger": "^7.x",
    "@nestjs/passport": "^10.x",
    "@nestjs/jwt": "^10.x",
    "class-validator": "^0.14.x",
    "class-transformer": "^0.5.x",
    "helmet": "^7.x",
    "bcrypt": "^5.x"
  }
}
```
