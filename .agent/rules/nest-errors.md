---
trigger: always_on
---

# NestJS - Obsługa Błędów

## Ta reguła definiuje standardy obsługi błędów i wyjątków w aplikacji NestJS.

## 1. Wbudowane Wyjątki HTTP

NestJS dostarcza gotowe wyjątki HTTP. **Zawsze** używaj ich zamiast tworzenia własnych dla standardowych przypadków:

```typescript
import {
  BadRequestException, // 400 - Nieprawidłowe żądanie
  UnauthorizedException, // 401 - Brak uwierzytelnienia
  ForbiddenException, // 403 - Brak uprawnień
  NotFoundException, // 404 - Zasób nie znaleziony
  ConflictException, // 409 - Konflikt (np. duplikat)
  UnprocessableEntityException, // 422 - Nieprzetworzona encja
  InternalServerErrorException, // 500 - Błąd serwera
} from "@nestjs/common";
```

### 1.1 Użycie w Serwisach

```typescript
@Injectable()
export class UsersService {
  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(
        `Użytkownik o ID ${id} nie został znaleziony`
      );
    }
    return user;
  }
  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException("Użytkownik z tym emailem już istnieje");
    }
    return this.userRepository.save(dto);
  }
  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.findOne(userId);
    if (user.isLocked) {
      throw new ForbiddenException("Profil użytkownika jest zablokowany");
    }
    return this.userRepository.save({ ...user, ...dto });
  }
}
```

---

## 2. Globalny Filtr Wyjątków

### 2.1 Podstawowy Filtr HTTP

```typescript
// common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: this.extractMessage(exceptionResponse),
      error: exception.name,
    };
    // Loguj błędy serwera
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception.stack,
        "HttpException"
      );
    }
    response.status(status).json(errorResponse);
  }
  private extractMessage(response: string | object): string | string[] {
    if (typeof response === "string") {
      return response;
    }
    if (typeof response === "object" && "message" in response) {
      return (response as any).message;
    }
    return "Wystąpił błąd";
  }
}
```

### 2.2 Filtr dla Wszystkich Wyjątków

```typescript
// common/filters/all-exceptions.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Wewnętrzny błąd serwera";
    let error = "InternalServerError";
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === "string"
          ? exceptionResponse
          : (exceptionResponse as any).message;
      error = exception.name;
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    }
    // Zawsze loguj nieoczekiwane błędy
    if (!(exception instanceof HttpException) || status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${message}`,
        exception instanceof Error ? exception.stack : String(exception)
      );
    }
    // NIE zwracaj stack trace w produkcji
    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message:
        status >= 500 && process.env.NODE_ENV === "production"
          ? "Wewnętrzny błąd serwera"
          : message,
      error,
    });
  }
}
```

### 2.3 Rejestracja Globalnych Filtrów

```typescript
// main.ts
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Kolejność ma znaczenie - AllExceptionsFilter jako fallback
  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());
  await app.listen(3000);
}
```

---

## 3. Własne Wyjątki Domenowe

### 3.1 Bazowy Wyjątek Domenowy

```typescript
// common/exceptions/domain.exception.ts
import { HttpException, HttpStatus } from "@nestjs/common";
export class DomainException extends HttpException {
  constructor(
    message: string,
    public readonly errorCode: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST
  ) {
    super(
      {
        message,
        errorCode,
        statusCode: status,
      },
      status
    );
  }
}
```

### 3.2 Specyficzne Wyjątki Biznesowe

```typescript
// modules/orders/exceptions/order.exceptions.ts
import { HttpStatus } from "@nestjs/common";
import { DomainException } from "../../../common/exceptions/domain.exception";
export class OrderNotFoundException extends DomainException {
  constructor(orderId: string) {
    super(
      `Zamówienie o ID ${orderId} nie zostało znalezione`,
      "ORDER_NOT_FOUND",
      HttpStatus.NOT_FOUND
    );
  }
}
export class InsufficientStockException extends DomainException {
  constructor(productId: string, requested: number, available: number) {
    super(
      `Niewystarczająca ilość produktu ${productId}. Żądano: ${requested}, dostępne: ${available}`,
      "INSUFFICIENT_STOCK",
      HttpStatus.UNPROCESSABLE_ENTITY
    );
  }
}
export class OrderAlreadyPaidException extends DomainException {
  constructor(orderId: string) {
    super(
      `Zamówienie ${orderId} zostało już opłacone`,
      "ORDER_ALREADY_PAID",
      HttpStatus.CONFLICT
    );
  }
}
```

### 3.3 Użycie Wyjątków Domenowych

```typescript
@Injectable()
export class OrdersService {
  async processPayment(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });
    if (!order) {
      throw new OrderNotFoundException(orderId);
    }
    if (order.status === OrderStatus.PAID) {
      throw new OrderAlreadyPaidException(orderId);
    }
    // Przetwarzanie płatności...
    order.status = OrderStatus.PAID;
    return this.orderRepository.save(order);
  }
}
```

---

## 4. Zasady Obsługi Błędów

### 4.1 Co Robić

✅ Używaj wbudowanych wyjątków HTTP NestJS
✅ Twórz własne wyjątki domenowe dla złożonej logiki biznesowej
✅ Loguj błędy z kontekstem (ID żądania, ID użytkownika)
✅ Używaj spójnego formatu odpowiedzi błędów w całym API
✅ Waliduj wszystkie zewnętrzne wejścia
✅ Dodawaj kody błędów dla łatwiejszego debugowania po stronie klienta

### 4.2 Czego Unikać

❌ **Nigdy** nie zwracaj stack trace w produkcji
❌ **Nigdy** nie łap wyjątków tylko po to, by je zalogować i rzucić ponownie
❌ **Nigdy** nie ufaj danym użytkownika - zawsze waliduj
❌ **Nigdy** nie używaj ogólnych komunikatów błędów bez szczegółów
❌ **Nigdy** nie ignoruj błędów - zawsze je obsłuż lub pozwól propagować

### 4.3 Anty-wzorce

```typescript
// ❌ ŹLE - łapanie i ponowne rzucanie bez sensu
async findOne(id: string): Promise<User> {
  try {
    return await this.repository.findOne({ where: { id } });
  } catch (error) {
    this.logger.error(error);
    throw error; // Bezcelowe!
  }
}
// ✅ DOBRZE - pozwól błędom propagować naturalnie
async findOne(id: string): Promise<User> {
  const user = await this.repository.findOne({ where: { id } });
  if (!user) {
    throw new NotFoundException(`User ${id} not found`);
  }
  return user;
}
```
