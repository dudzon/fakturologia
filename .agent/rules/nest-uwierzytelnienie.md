---
trigger: always_on
---

# NestJS - Uwierzytelnianie i Autoryzacja

## Ta reguła definiuje standardy Auth w aplikacji NestJS.

## 1. JWT Authentication

### 1.1 Konfiguracja JWT

```typescript
// auth/auth.module.ts
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get("jwt.secret"),
        signOptions: { expiresIn: configService.get("jwt.accessExpiresIn") },
      }),
      inject: [ConfigService],
    }),
    PassportModule.register({ defaultStrategy: "jwt" }),
  ],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

### 1.2 JWT Strategy

```typescript
// auth/strategies/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get("jwt.secret"),
    });
  }
  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.usersService.findOne(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
```

---

## 2. Auth Guards

### 2.1 JWT Guard

```typescript
// common/guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw new UnauthorizedException("Nieprawidłowy token");
    }
    return user;
  }
}
```

### 2.2 Roles Guard

```typescript
// common/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>("roles", [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
// common/decorators/roles.decorator.ts
export const Roles = (...roles: Role[]) => SetMetadata("roles", roles);
```

---

## 3. Dekoratory

### 3.1 Current User Decorator

```typescript
// common/decorators/current-user.decorator.ts
export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  }
);
```

### 3.2 Public Decorator

```typescript
// common/decorators/public.decorator.ts
export const IS_PUBLIC_KEY = "isPublic";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

---

## 4. Użycie w Kontrolerze

```typescript
@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  @Get("profile")
  getProfile(@CurrentUser() user: User) {
    return user;
  }
  @Get("admin")
  @Roles(Role.ADMIN)
  getAdminData() {
    return { secret: "admin data" };
  }
  @Public()
  @Get("public")
  getPublicData() {
    return { message: "public" };
  }
}
```

---

## 5. Hashowanie Haseł

```typescript
import * as bcrypt from "bcrypt";
@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 10;
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }
  async validatePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
```

---

## 6. Zasady Bezpieczeństwa

| Zasada        | Opis                                |
| ------------- | ----------------------------------- |
| Hashowanie    | Zawsze hashuj hasła (bcrypt/argon2) |
| JWT Secret    | Minimum 32 znaki, losowe            |
| Token Expiry  | Access: 15min, Refresh: 7 dni       |
| HTTPS         | Zawsze używaj HTTPS w produkcji     |
| Rate Limiting | Ogranicz próby logowania            |
