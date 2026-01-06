---
trigger: always_on
---

# NestJS - Baza Danych i ORM

## Ta reguła definiuje standardy pracy z bazą danych i TypeORM w aplikacji NestJS.

## 1. Konfiguracja TypeORM

### 1.1 Moduł Bazodanowy

```typescript
// database/database.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        host: configService.get("DATABASE_HOST"),
        port: configService.get("DATABASE_PORT"),
        username: configService.get("DATABASE_USER"),
        password: configService.get("DATABASE_PASSWORD"),
        database: configService.get("DATABASE_NAME"),
        entities: [__dirname + "/../**/*.entity{.ts,.js}"],
        migrations: [__dirname + "/migrations/*{.ts,.js}"],
        synchronize: false, // NIGDY true w produkcji!
        logging: configService.get("NODE_ENV") === "development",
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
```

### 1.2 Ważne Zasady Konfiguracji

- **NIGDY** nie używaj `synchronize: true` w produkcji
- Włączaj `logging` tylko w środowisku development
- Używaj zmiennych środowiskowych dla wszystkich danych połączeniowych

---

## 2. Definicja Encji

### 2.1 Standardowa Encja

```typescript
// modules/users/entities/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Index,
} from "typeorm";
@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;
  @Index()
  @Column({ unique: true })
  email: string;
  @Column({ select: false }) // Nie pobieraj hasła domyślnie
  password: string;
  @Column({ nullable: true })
  firstName: string;
  @Column({ nullable: true })
  lastName: string;
  @Column({ type: "enum", enum: UserRole, default: UserRole.USER })
  role: UserRole;
  @Column({ default: true })
  isActive: boolean;
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
  @DeleteDateColumn() // Dla soft delete
  deletedAt: Date;
  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];
}
```

### 2.2 Zasady dla Encji

| Zasada        | Opis                                              |
| ------------- | ------------------------------------------------- |
| UUID          | Zawsze używaj UUID dla kluczy głównych            |
| Timestamps    | Zawsze dodawaj `createdAt` i `updatedAt`          |
| Soft Delete   | Używaj `deletedAt` dla ważnych encji              |
| Indeksy       | Definiuj indeksy na często odpytywanych kolumnach |
| Select: false | Ukrywaj wrażliwe dane jak hasła                   |

---

## 3. Migracje

### 3.1 Konfiguracja CLI

```typescript
// database/data-source.ts
import { DataSource } from "typeorm";
import { config } from "dotenv";
config();
export default new DataSource({
  type: "postgres",
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT, 10),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: ["src/**/*.entity.ts"],
  migrations: ["src/database/migrations/*.ts"],
});
```

### 3.2 Skrypty w package.json

```json
{
  "scripts": {
    "migration:generate": "typeorm-ts-node-commonjs migration:generate -d src/database/data-source.ts",
    "migration:run": "typeorm-ts-node-commonjs migration:run -d src/database/data-source.ts",
    "migration:revert": "typeorm-ts-node-commonjs migration:revert -d src/database/data-source.ts"
  }
}
```

### 3.3 Przykładowa Migracja

```typescript
// database/migrations/1703936400000-CreateUsersTable.ts
import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";
export class CreateUsersTable1703936400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "users",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "email",
            type: "varchar",
            isUnique: true,
          },
          {
            name: "password",
            type: "varchar",
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "updated_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "deleted_at",
            type: "timestamp",
            isNullable: true,
          },
        ],
      })
    );
    await queryRunner.createIndex(
      "users",
      new TableIndex({ columnNames: ["email"] })
    );
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("users");
  }
}
```

---

## 4. Wzorzec Repository

### 4.1 Użycie w Serwisie

```typescript
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}
  async findAll(pagination: PaginationDto): Promise<[User[], number]> {
    const { page, limit } = pagination;
    return this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: "DESC" },
    });
  }
  async findOneWithOrders(id: string): Promise<User> {
    return this.userRepository.findOne({
      where: { id },
      relations: ["orders"],
    });
  }
}
```

### 4.2 QueryBuilder dla Złożonych Zapytań

```typescript
async searchUsers(searchDto: SearchUsersDto): Promise<User[]> {
  const query = this.userRepository
    .createQueryBuilder('user')
    .leftJoinAndSelect('user.orders', 'order');
  if (searchDto.email) {
    query.andWhere('user.email ILIKE :email', {
      email: `%${searchDto.email}%`
    });
  }
  if (searchDto.role) {
    query.andWhere('user.role = :role', { role: searchDto.role });
  }
  if (searchDto.hasOrders) {
    query.andWhere('order.id IS NOT NULL');
  }
  return query
    .orderBy('user.createdAt', 'DESC')
    .skip(searchDto.offset)
    .take(searchDto.limit)
    .getMany();
}
```

---

## 5. Transakcje

### 5.1 Użycie DataSource

```typescript
@Injectable()
export class OrdersService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>
  ) {}
  async createOrderWithItems(dto: CreateOrderDto): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // Utwórz zamówienie
      const order = queryRunner.manager.create(Order, {
        userId: dto.userId,
        status: OrderStatus.PENDING,
      });
      await queryRunner.manager.save(order);
      // Utwórz pozycje zamówienia
      for (const item of dto.items) {
        const orderItem = queryRunner.manager.create(OrderItem, {
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
        });
        await queryRunner.manager.save(orderItem);
        // Zmniejsz stan magazynowy
        await queryRunner.manager.decrement(
          Product,
          { id: item.productId },
          "stock",
          item.quantity
        );
      }
      await queryRunner.commitTransaction();
      return order;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
```

---

## 6. Relacje

### 6.1 One-to-Many / Many-to-One

```typescript
// User entity
@OneToMany(() => Order, (order) => order.user)
orders: Order[];
// Order entity
@ManyToOne(() => User, (user) => user.orders)
@JoinColumn({ name: 'user_id' })
user: User;
@Column({ name: 'user_id' })
userId: string;
```

### 6.2 Many-to-Many

```typescript
// Product entity
@ManyToMany(() => Category, (category) => category.products)
@JoinTable({
  name: 'products_categories',
  joinColumn: { name: 'product_id' },
  inverseJoinColumn: { name: 'category_id' },
})
categories: Category[];
```

### 6.3 Ładowanie Relacji

```typescript
// Unikaj eager loading - preferuj jawne relations
// ❌ W encji
@OneToMany(() => Order, (order) => order.user, { eager: true })
// ✅ W zapytaniu
const user = await this.userRepository.findOne({
  where: { id },
  relations: ['orders', 'orders.items'],
});
```
