---
trigger: always_on
---

# NestJS - Kontrolery i Serwisy

## Ta reguła definiuje standardy dla warstwy kontrolerów i serwisów w aplikacji NestJS.

## 1. Kontrolery (Controllers)

### 1.1 Projektowanie REST API

- Używaj odpowiednich metod HTTP:
  - `GET` - odczyt zasobów
  - `POST` - tworzenie zasobów
  - `PUT` - pełna aktualizacja zasobu
  - `PATCH` - częściowa aktualizacja zasobu
  - `DELETE` - usuwanie zasobów
- Zwracaj odpowiednie kody HTTP używając dekoratora `@HttpCode()`
- Używaj rzeczowników w liczbie mnogiej dla endpointów (np. `/users`, `/products`)

```typescript
@Controller("users")
@ApiTags("Users") // Zawsze dokumentuj za pomocą Swagger
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Utwórz nowego użytkownika" })
  @ApiResponse({ status: 201, description: "Użytkownik utworzony pomyślnie" })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }
  @Get()
  @ApiOperation({ summary: "Pobierz listę użytkowników" })
  async findAll(
    @Query() paginationDto: PaginationDto
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    return this.usersService.findAll(paginationDto);
  }
  @Get(":id")
  @ApiOperation({ summary: "Pobierz użytkownika po ID" })
  async findOne(
    @Param("id", ParseUUIDPipe) id: string
  ): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }
  @Patch(":id")
  @ApiOperation({ summary: "Aktualizuj użytkownika" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, updateUserDto);
  }
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Usuń użytkownika" })
  async remove(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    return this.usersService.remove(id);
  }
}
```

### 1.2 Zasady dla Kontrolerów

**Kontrolery muszą być "szczupłe" (thin controllers):**

- Zajmują się tylko sprawami HTTP (parsowanie parametrów, walidacja, formatowanie odpowiedzi)
- **Nigdy** nie umieszczaj logiki biznesowej w kontrolerach
- Deleguj całą logikę do serwisów
- **Zawsze** używaj DTO dla payloadów żądań/odpowiedzi
- **Zawsze** używaj pipes do transformacji i walidacji parametrów

### 1.3 Wbudowane Pipes

Używaj wbudowanych pipes dla transformacji prymitywów:

- `ParseIntPipe` - konwersja do liczby całkowitej
- `ParseUUIDPipe` - walidacja UUID
- `ParseBoolPipe` - konwersja do boolean
- `ParseArrayPipe` - parsowanie tablic
- `ParseEnumPipe` - walidacja enum

```typescript
@Get(':id')
async findOne(@Param('id', ParseUUIDPipe) id: string) {
  return this.service.findOne(id);
}
@Get()
async findByStatus(@Query('active', ParseBoolPipe) active: boolean) {
  return this.service.findByStatus(active);
}
```

---

## 2. Serwisy (Services)

### 2.1 Warstwa Logiki Biznesowej

- Serwisy zawierają **całą logikę biznesową**
- Serwisy powinny być **bezstanowe** - żadnych właściwości instancji przechowujących stan między żądaniami
- Używaj dependency injection dla wszystkich zależności

```typescript
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly emailService: EmailService,
    private readonly logger: LoggerService
  ) {}
  async create(createUserDto: CreateUserDto): Promise<User> {
    // Walidacja reguł biznesowych
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new ConflictException("Użytkownik z tym emailem już istnieje");
    }
    // Hashowanie hasła
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
    const savedUser = await this.userRepository.save(user);
    // Efekty uboczne
    await this.emailService.sendWelcomeEmail(savedUser.email);
    this.logger.log(`Użytkownik utworzony: ${savedUser.id}`);
    return savedUser;
  }
  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(
        `Użytkownik o ID ${id} nie został znaleziony`
      );
    }
    return user;
  }
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }
  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.softRemove(user);
  }
}
```

### 2.2 Zasady dla Serwisów

1. **Pojedyncza Odpowiedzialność** - każdy serwis obsługuje jeden obszar domeny
2. **Rzucaj wyjątki domenowe** - używaj wbudowanych wyjątków HTTP NestJS lub własnych
3. **Nigdy** nie łap wyjątków tylko po to, by je zalogować - pozwól globalnemu filtrowi wyjątków to obsłużyć
4. Zwracaj **obiekty domenowe lub DTO**, nie surowe encje bazodanowe z wrażliwymi danymi

### 2.3 Dependency Injection

NestJS opiera się na Dependency Injection. Pamiętaj:

- Każda klasa oznaczona `@Injectable()` może być wstrzykiwana
- Wstrzykuj zależności przez konstruktor
- **Unikaj** tworzenia instancji ręcznie (`new Service()`) - zawsze wstrzykuj

```typescript
// ❌ ŹLE
@Injectable()
export class OrdersService {
  private emailService = new EmailService(); // Nie rób tego!
}
// ✅ DOBRZE
@Injectable()
export class OrdersService {
  constructor(private readonly emailService: EmailService) {}
}
```

---

## 3. Cykl Życia Żądania

Zrozumienie kolejności wykonania jest kluczowe:

1. **Middleware** - przetwarzanie żądania przed routingiem
2. **Guards** - autoryzacja/uwierzytelnianie
3. **Interceptors (przed)** - logika przed handlerem
4. **Pipes** - walidacja i transformacja danych
5. **Controller/Handler** - właściwa obsługa żądania
6. **Interceptors (po)** - logika po handlerze
7. **Exception Filters** - obsługa błędów

```
Request → Middleware → Guards → Interceptors (pre) → Pipes → Handler → Interceptors (post) → Response
                                                                ↓
                                                        Exception Filters (jeśli błąd)
```
