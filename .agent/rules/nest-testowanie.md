---
trigger: always_on
---

# NestJS - Testowanie i Dokumentacja API

## Ta reguła definiuje standardy testowania i dokumentacji w NestJS.

## 1. Testowanie

### 1.1 Strategia Testowania

| Typ testu    | Cel                           | Pokrycie           |
| ------------ | ----------------------------- | ------------------ |
| Jednostkowe  | Serwisy, logika biznesowa     | 80%+               |
| Integracyjne | Kontrolery, HTTP flow         | Kluczowe endpointy |
| E2E          | Krytyczne ścieżki użytkownika | Happy path + błędy |

### 1.2 Test Jednostkowy Serwisu

```typescript
// users.service.spec.ts
describe("UsersService", () => {
  let service: UsersService;
  let repository: MockType<Repository<User>>;
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useFactory: () => ({
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          }),
        },
      ],
    }).compile();
    service = module.get(UsersService);
    repository = module.get(getRepositoryToken(User));
  });
  describe("create", () => {
    it("should create a new user", async () => {
      const dto = { email: "test@test.com", password: "12345678" };
      repository.findOne.mockReturnValue(null);
      repository.create.mockReturnValue(dto);
      repository.save.mockReturnValue({ id: "uuid", ...dto });
      const result = await service.create(dto);
      expect(result.email).toBe(dto.email);
      expect(repository.save).toHaveBeenCalled();
    });
    it("should throw ConflictException if email exists", async () => {
      repository.findOne.mockReturnValue({ id: "existing" });
      await expect(
        service.create({ email: "test@test.com", password: "123" })
      ).rejects.toThrow(ConflictException);
    });
  });
  describe("findOne", () => {
    it("should throw NotFoundException if user not found", async () => {
      repository.findOne.mockReturnValue(null);
      await expect(service.findOne("non-existing-id")).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
```

### 1.3 Test E2E

```typescript
// test/users.e2e-spec.ts
describe("UsersController (e2e)", () => {
  let app: INestApplication;
  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });
  afterEach(async () => {
    await app.close();
  });
  it("/users (POST) - should create user", () => {
    return request(app.getHttpServer())
      .post("/users")
      .send({ email: "test@test.com", password: "12345678" })
      .expect(201)
      .expect((res) => {
        expect(res.body.email).toBe("test@test.com");
        expect(res.body).not.toHaveProperty("password");
      });
  });
  it("/users (POST) - should return 400 for invalid email", () => {
    return request(app.getHttpServer())
      .post("/users")
      .send({ email: "invalid", password: "12345678" })
      .expect(400);
  });
});
```

---

## 2. Dokumentacja Swagger

### 2.1 Konfiguracja

```typescript
// main.ts
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle("API")
    .setDescription("API Documentation")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);
  await app.listen(3000);
}
```

### 2.2 Dekoratory Swagger

```typescript
@ApiTags("Users")
@ApiBearerAuth()
@Controller("users")
export class UsersController {
  @Post()
  @ApiOperation({ summary: "Utwórz użytkownika" })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, type: UserResponseDto })
  @ApiResponse({ status: 400, description: "Nieprawidłowe dane" })
  @ApiResponse({ status: 409, description: "Email zajęty" })
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(dto);
  }
  @Get(":id")
  @ApiOperation({ summary: "Pobierz użytkownika" })
  @ApiParam({ name: "id", type: "string", format: "uuid" })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 404, description: "Nie znaleziono" })
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }
}
```

### 2.3 Dokumentacja DTO

```typescript
export class CreateUserDto {
  @ApiProperty({
    example: "jan@example.com",
    description: "Email użytkownika",
  })
  @IsEmail()
  email: string;
  @ApiProperty({
    minLength: 8,
    description: "Hasło (min. 8 znaków)",
  })
  @MinLength(8)
  password: string;
  @ApiPropertyOptional({ example: "Jan" })
  @IsOptional()
  firstName?: string;
}
```

---

## 3. Checklist Jakości Kodu

Przed oddaniem kodu zweryfikuj:

- [ ] Wszystkie endpointy mają dokumentację Swagger
- [ ] Wszystkie wejścia są walidowane DTO
- [ ] Wrażliwe dane ukryte w odpowiedziach
- [ ] Błędy obsługiwane wyjątkami HTTP
- [ ] Logika biznesowa w serwisach
- [ ] Hasła hashowane
- [ ] Zmienne środowiskowe walidowane
- [ ] Testy jednostkowe napisane
- [ ] Brak hardkodowanych sekretów
- [ ] Paginacja dla list
