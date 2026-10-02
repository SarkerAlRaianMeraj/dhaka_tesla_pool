# Project Rules - Backend (CSC 4182)

## Tech Stack
- **Backend**: Node.js + NestJS (TypeScript)
- **Frontend**: Next.js (React/TypeScript)
- **Database**: PostgreSQL + TypeORM

---

## TypeScript Fundamentals

- Use `let` for reassignable block-scoped variables
- Use `const` for constants (never reassigned)
- **Avoid `var`** (legacy, function-scoped, hoisted)
- Use **arrow functions**: `const fn = () => {}`
- Use **template strings**: `` `Hello ${name}` ``
- Use **destructuring**: `const { name, email } = user`
- Use **spread operator**: `const arr = [...existing, newItem]`
- Use **async/await** with try/catch for async operations
- Use **Generics** for reusable components: `class Box<T>`

---

## NestJS Architecture (3-Tier)

1. **Controllers** - Handle HTTP routes/requests
2. **Service Layer** - Business logic only (CRUD operations)
3. **Data Access Layer** - Database access (TypeORM/PostgreSQL)

---

## Project Structure

```
src/
  module-name/
    module-name.module.ts
    module-name.controller.ts
    module-name.service.ts
    module-name.entity.ts
    dto/
      create-module-name.dto.ts
      update-module-name.dto.ts
  app.module.ts
  main.ts
```

---

## Module Pattern

```typescript
import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';

@Module({
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
```

---

## Controller Pattern

```typescript
import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  getUsers() { return this.userService.getAllUsers(); }

  @Get(':id')
  getUser(@Param('id', ParseIntPipe) id: number) { return this.userService.getUserById(id); }

  @Post()
  @UsePipes(new ValidationPipe())
  createUser(@Body() createUserDto: CreateUserDto) { return this.userService.createUser(createUserDto); }

  @Put(':id')
  updateUser(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto) { return this.userService.updateUser(id, updateUserDto); }

  @Patch(':id')
  updatePartial(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto) { return this.userService.updateUser(id, updateUserDto); }

  @Delete(':id')
  deleteUser(@Param('id', ParseIntPipe) id: number) { return this.userService.deleteUser(id); }
}
```

---

## Service Pattern

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private userRepository: Repository<User>) {}

  async createUser(user: User): Promise<User> { return this.userRepository.save(user); }
  async getAllUsers(): Promise<User[]> { return this.userRepository.find(); }
  async getUserById(id: number): Promise<User> { return this.userRepository.findOneBy({ id }); }
  async updateUser(id: number, updatedUser: User): Promise<User> {
    await this.userRepository.update(id, updatedUser);
    return this.userRepository.findOneBy({ id });
  }
  async deleteUser(id: number): Promise<void> { await this.userRepository.delete(id); }
}
```

---

## Entity Pattern (TypeORM)

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('table_name')
export class EntityName {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

---

## Relationships

- **OneToOne**: `@OneToOne(() => Target, target => target.source, { cascade: true })` + `@JoinColumn()`
- **OneToMany**: `@OneToMany(() => Target, target => target.source, { cascade: true })`
- **ManyToOne**: `@ManyToOne(() => Target, target => target.targets)`
- **ManyToMany**: `@ManyToMany(() => Target, target => targets)` + `@JoinTable()`

---

## Relationship CRUD Examples

### OneToOne: User ↔ Profile

```typescript
// User Entity
@OneToOne(() => Profile, profile => profile.user, { cascade: true })
@JoinColumn()
profile: Profile;

// Profile Entity
@OneToOne(() => User, user => user.profile)
user: User;

// Controller Routes
@Get(':id/profile')
getUserProfile(@Param('id', ParseIntPipe) id: number) {
  return this.userService.getProfile(id);
}

@Post(':id/profile')
createProfile(@Param('id', ParseIntPipe) id: number, @Body() createProfileDto: CreateProfileDto) {
  return this.userService.createProfile(id, createProfileDto);
}

@Delete(':id/profile')
deleteProfile(@Param('id', ParseIntPipe) id: number) {
  return this.userService.deleteProfile(id);
}
```

### OneToMany: User ↔ Orders

```typescript
// User Entity
@OneToMany(() => Order, order => order.user, { cascade: true })
orders: Order[];

// Order Entity
@ManyToOne(() => User, user => user.orders)
user: User;

// Controller Routes
@Get(':id/orders')
getUserOrders(@Param('id', ParseIntPipe) id: number) {
  return this.userService.getOrders(id);
}

@Post(':id/orders')
createOrder(@Param('id', ParseIntPipe) id: number, @Body() createOrderDto: CreateOrderDto) {
  return this.userService.createOrder(id, createOrderDto);
}

@Delete(':id/orders/:orderId')
deleteOrder(@Param('id', ParseIntPipe) id: number, @Param('orderId', ParseIntPipe) orderId: number) {
  return this.userService.deleteOrder(id, orderId);
}
```

---

## DTO Pattern with Validation

```typescript
import { IsString, IsEmail, IsNotEmpty, Length, Matches } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 20)
  password: string;

  @Matches(/^[A-Za-z]+$/)
  firstName: string;
}
```

---

## Pipes

- `ParseIntPipe` - Converts string param to number
- `ParseFloatPipe`, `ParseBoolPipe`, `ParseArrayPipe`, `ParseUUIDPipe`
- `ValidationPipe` - Validates DTOs using class-validator

---

## Guards (Authentication)

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class SessionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    return request.session.email !== undefined;
  }
}
// Usage: @UseGuards(SessionGuard) on route or controller
```

---

## JWT Authentication

### Install
```bash
npm install @nestjs/jwt
```

### Module Setup
```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    JwtModule.register({
      secret: 'your-secret-key',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
```

### JWT Guard
```typescript
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];
    if (!token) throw new UnauthorizedException('No token provided');
    try {
      const payload = this.jwtService.verify(token);
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
// Usage: @UseGuards(JwtAuthGuard) on route or controller
```

### Token Generation (in Service)
```typescript
import { JwtService } from '@nestjs/jwt';

constructor(private jwtService: JwtService) {}

async login(user: any) {
  const payload = { userId: user.id, email: user.email };
  return { access_token: this.jwtService.sign(payload) };
}
```

---

## Session Setup (main.ts)

```typescript
import * as session from 'express-session';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(session({
    secret: 'my-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 300000 }
  }));
  app.enableCors();
  await app.listen(3000);
}
```

---

## Password Hashing (bcrypt)

```typescript
import * as bcrypt from 'bcrypt';

const salt = await bcrypt.genSalt();
const hashedPassword = await bcrypt.hash(password, salt);
const isMatch = await bcrypt.compare(inputPassword, dbPassword);
```

---

## Exception Handling

```typescript
import { HttpException, HttpStatus, NotFoundException, BadRequestException } from '@nestjs/common';

throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
throw new NotFoundException('User not found');
throw new BadRequestException('Invalid input');
```

---

## File Upload

```typescript
@Post('upload')
@UseInterceptors(FileInterceptor('file', {
  fileFilter: (req, file, cb) => {
    if (file.originalname.match(/^.*\.(jpg|webp|png|jpeg)$/)) cb(null, true);
    else cb(new MulterError('LIMIT_UNEXPECTED_FILE', 'image'), false);
  },
  limits: { fileSize: 30000 },
  storage: diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => cb(null, Date.now() + file.originalname)
  })
}))
uploadFile(@UploadedFile() file: Express.Multer.File) { console.log(file); }
```

---

## Mailer

```typescript
import { MailerModule } from '@nestjs-modules/mailer';

// In module:
MailerModule.forRoot({
  transport: {
    host: 'smtp.gmail.com',
    port: 465,
    ignoreTLS: true,
    secure: true,
    auth: { user: 'your gmail', pass: 'app password' }
  }
})

// In service:
import { MailerService } from '@nestjs-modules/mailer/dist';
private mailerService: MailerService;

await this.mailerService.sendMail({
  to: 'receiver@email.com',
  subject: 'Subject',
  text: 'Text content',
});
```

---

## TypeORM PostgreSQL Config (app.module.ts)

```typescript
TypeOrmModule.forRoot({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'root',
  database: 'your_database',
  autoLoadEntities: true,
  synchronize: true,
})
```

---


