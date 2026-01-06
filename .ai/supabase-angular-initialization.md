# Supabase Angular Initialization

This document provides a reproducible guide to create the necessary file structure for integrating Supabase with your Angular project.

## Prerequisites

- Your project should use Angular 21, TypeScript 5.9, and standalone components architecture.
- Install the `@supabase/supabase-js` package in frontend:
  ```bash
  cd apps/frontend
  npm install @supabase/supabase-js@^2.89.0
  ```
- Ensure that config.toml exists
- Ensure that database.types.ts exists and contains the correct type definitions for your database.
- Ensure that index.ts exports database types:
  ```ts
  export * from "./database.types";
  ```

IMPORTANT: Check prerequisites before performing actions below. If they're not met, stop and ask a user for the fix.

## File Structure and Setup

### 1. Environment Configuration

Create the file `/apps/frontend/src/environments/environment.ts` with the following content:

```ts
export const environment = {
  production: false,
  supabaseUrl: "http://127.0.0.1:54321",
  supabaseKey: "your-local-anon-key",
};
```

Create the file `/apps/frontend/src/environments/environment.prod.ts` with the following content:

```ts
export const environment = {
  production: true,
  supabaseUrl: "${SUPABASE_URL}",
  supabaseKey: "${SUPABASE_KEY}",
};
```

### 2. Supabase Provider with Injection Token

Create the file `/apps/frontend/src/app/core/supabase.provider.ts` with the following content:

```ts
import { InjectionToken, Provider } from "@angular/core";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@fakturologia/shared";
import { environment } from "../../environments/environment";

export const SUPABASE_CLIENT = new InjectionToken<SupabaseClient<Database>>(
  "SupabaseClient"
);

export function provideSupabase(): Provider {
  return {
    provide: SUPABASE_CLIENT,
    useFactory: () =>
      createClient<Database>(environment.supabaseUrl, environment.supabaseKey),
  };
}
```

This file creates an injection token and provider factory for the Supabase client, enabling Angular's dependency injection system.

### 3. Supabase Service

Create the file `/apps/frontend/src/app/core/supabase.service.ts` with the following content:

```ts
import { inject, Injectable } from "@angular/core";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@fakturologia/shared";
import { SUPABASE_CLIENT } from "./supabase.provider";

@Injectable({ providedIn: "root" })
export class SupabaseService {
  private readonly supabase: SupabaseClient<Database> = inject(SUPABASE_CLIENT);

  get client(): SupabaseClient<Database> {
    return this.supabase;
  }

  from<T extends keyof Database["public"]["Tables"]>(table: T) {
    return this.supabase.from(table);
  }
}
```

This service wraps the Supabase client and provides type-safe access to database tables.

### 4. Auth Service

Create the file `/apps/frontend/src/app/core/auth.service.ts` with the following content:

```ts
import { inject, Injectable, signal } from "@angular/core";
import type { User, Session } from "@supabase/supabase-js";
import { SUPABASE_CLIENT } from "./supabase.provider";

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly supabase = inject(SUPABASE_CLIENT);

  currentUser = signal<User | null>(null);
  currentSession = signal<Session | null>(null);

  constructor() {
    this.supabase.auth.onAuthStateChange((event, session) => {
      this.currentSession.set(session);
      this.currentUser.set(session?.user ?? null);
    });
  }

  async signInWithEmail(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  async signUp(email: string, password: string) {
    return this.supabase.auth.signUp({ email, password });
  }

  async signOut() {
    return this.supabase.auth.signOut();
  }

  async getSession() {
    return this.supabase.auth.getSession();
  }
}
```

This service handles authentication state using Angular signals and provides methods for sign-in, sign-up, and sign-out.

### 5. Auth Guard

Create the file `/apps/frontend/src/app/core/auth.guard.ts` with the following content:

```ts
import { inject } from "@angular/core";
import { Router, type CanActivateFn } from "@angular/router";
import { AuthService } from "./auth.service";

export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const { data } = await authService.getSession();

  if (data.session) {
    return true;
  }

  return router.createUrlTree(["/login"]);
};
```

This functional guard protects routes that require authentication.

### 6. App Configuration Update

Update the file app.config.ts to include the Supabase provider:

```ts
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from "@angular/core";
import { provideRouter } from "@angular/router";

import { routes } from "./app.routes";
import { provideSupabase } from "./core/supabase.provider";

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideSupabase(),
  ],
};
```

### 7. Angular Build Configuration (File Replacement)

Update angular.json to add file replacement for production builds. In the `build.configurations.production` section, add:

```json
"fileReplacements": [
  {
    "replace": "src/environments/environment.ts",
    "with": "src/environments/environment.prod.ts"
  }
]
```

## Usage Example

### Database Query

```ts
import { Component, inject, OnInit, signal } from "@angular/core";
import { SupabaseService } from "./core/supabase.service";
import type { Database } from "@fakturologia/shared";

type Invoice = Database["public"]["Tables"]["invoices"]["Row"];

@Component({
  selector: "app-invoices",
  template: `...`,
})
export class InvoicesComponent implements OnInit {
  private readonly supabase = inject(SupabaseService);

  invoices = signal<Invoice[]>([]);

  async ngOnInit() {
    const { data, error } = await this.supabase.from("invoices").select("*");

    if (data) {
      this.invoices.set(data);
    }
  }
}
```

### Protected Route

```ts
// app.routes.ts
import { authGuard } from "./core/auth.guard";

export const routes: Routes = [
  { path: "login", component: LoginComponent },
  {
    path: "invoices",
    component: InvoicesComponent,
    canActivate: [authGuard],
  },
];
```
