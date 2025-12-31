# REST API Plan - Fakturologia MVP

## 1. Resources

| Resource    | Database Table               | Description                          |
| ----------- | ---------------------------- | ------------------------------------ |
| Auth        | `auth.users` (Supabase)      | Authentication operations            |
| Users       | `user_profiles`              | User profile and company data        |
| Contractors | `contractors`                | Buyer/contractor management          |
| Invoices    | `invoices` + `invoice_items` | Invoice management with inline items |

---

## 2. API Base Configuration

- **Base URL**: `/api/v1`
- **Content-Type**: `application/json`
- **Authentication**: Bearer JWT token in `Authorization` header
- **Date Format**: ISO 8601 (`YYYY-MM-DD` for dates, `YYYY-MM-DDTHH:mm:ssZ` for timestamps)
- **Decimal Format**: String for precision (e.g., `"1234.56"`)

---

## 3. Authentication Endpoints

### 3.1 Register User

**POST** `/api/v1/auth/register`

Creates a new user account. Requires email verification before login.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (201 Created):**

```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "userId": "uuid"
}
```

**Validation:**

- `email`: Valid email format, not already registered
- `password`: Minimum 8 characters

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 400 | `INVALID_EMAIL` | Invalid email format |
| 400 | `WEAK_PASSWORD` | Password must be at least 8 characters |
| 409 | `EMAIL_EXISTS` | Email is already registered |

---

### 3.2 Login User

**POST** `/api/v1/auth/login`

Authenticates user and returns JWT tokens.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 3600,
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 400 | `INVALID_CREDENTIALS` | Invalid email or password |
| 403 | `EMAIL_NOT_VERIFIED` | Please verify your email before logging in |
| 429 | `ACCOUNT_LOCKED` | Account locked due to too many failed attempts. Try again in 15 minutes |

---

### 3.3 Logout User

**POST** `/api/v1/auth/logout`

Invalidates the current session.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**

```json
{
  "message": "Successfully logged out"
}
```

---

### 3.4 Refresh Token

**POST** `/api/v1/auth/refresh`

Refreshes the access token using a refresh token.

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200 OK):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 3600
}
```

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 401 | `INVALID_REFRESH_TOKEN` | Invalid or expired refresh token |

---

### 3.5 Request Password Reset

**POST** `/api/v1/auth/forgot-password`

Sends password reset email.

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**

```json
{
  "message": "If the email exists, a password reset link has been sent"
}
```

**Note:** Always returns 200 to prevent email enumeration.

---

### 3.6 Reset Password

**POST** `/api/v1/auth/reset-password`

Resets password using token from email.

**Request Body:**

```json
{
  "token": "reset-token-from-email",
  "password": "newSecurePassword123"
}
```

**Response (200 OK):**

```json
{
  "message": "Password successfully reset"
}
```

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 400 | `INVALID_TOKEN` | Invalid or expired reset token |
| 400 | `WEAK_PASSWORD` | Password must be at least 8 characters |

---

## 4. User Profile Endpoints

All endpoints require authentication.

### 4.1 Get User Profile

**GET** `/api/v1/users/profile`

Returns the current user's profile and company data.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "companyName": "Firma ABC",
  "address": "ul. Przykładowa 123, 00-001 Warszawa",
  "nip": "1234567890",
  "bankAccount": "PL61109010140000071219812874",
  "logoUrl": "https://storage.supabase.co/logos/uuid/logo.png",
  "invoiceNumberFormat": "FV/{YYYY}/{NNN}",
  "invoiceNumberCounter": 5,
  "createdAt": "2025-01-01T10:00:00Z",
  "updatedAt": "2025-01-15T14:30:00Z"
}
```

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 401 | `UNAUTHORIZED` | Invalid or missing authentication token |
| 404 | `PROFILE_NOT_FOUND` | User profile not found |

---

### 4.2 Update User Profile

**PUT** `/api/v1/users/profile`

Updates user's company data.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

```json
{
  "companyName": "Firma ABC Sp. z o.o.",
  "address": "ul. Nowa 456, 00-002 Warszawa",
  "nip": "1234567890",
  "bankAccount": "PL61109010140000071219812874",
  "invoiceNumberFormat": "FV/{YYYY}/{MM}/{NNN}"
}
```

**Response (200 OK):**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "companyName": "Firma ABC Sp. z o.o.",
  "address": "ul. Nowa 456, 00-002 Warszawa",
  "nip": "1234567890",
  "bankAccount": "PL61109010140000071219812874",
  "logoUrl": null,
  "invoiceNumberFormat": "FV/{YYYY}/{MM}/{NNN}",
  "invoiceNumberCounter": 5,
  "createdAt": "2025-01-01T10:00:00Z",
  "updatedAt": "2025-01-20T09:15:00Z"
}
```

**Validation:**

- `nip`: Exactly 10 digits, valid Polish NIP checksum
- `bankAccount`: Valid IBAN format (max 32 characters)
- `invoiceNumberFormat`: Must contain `{NNN}` placeholder

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 400 | `INVALID_NIP` | Invalid NIP format or checksum |
| 400 | `INVALID_IBAN` | Invalid bank account format |
| 400 | `INVALID_NUMBER_FORMAT` | Invoice number format must contain {NNN} placeholder |
| 401 | `UNAUTHORIZED` | Invalid or missing authentication token |

---

### 4.3 Upload Company Logo

**POST** `/api/v1/users/profile/logo`

Uploads or replaces company logo.

**Headers:**

```
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
```

**Request Body:**

- `file`: Image file (PNG, JPG), max 2MB

**Response (200 OK):**

```json
{
  "logoUrl": "https://storage.supabase.co/logos/uuid/logo.png"
}
```

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 400 | `INVALID_FILE_TYPE` | Only PNG and JPG files are allowed |
| 400 | `FILE_TOO_LARGE` | File size must not exceed 2MB |
| 401 | `UNAUTHORIZED` | Invalid or missing authentication token |

---

### 4.4 Delete Company Logo

**DELETE** `/api/v1/users/profile/logo`

Removes the company logo.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**

```json
{
  "message": "Logo successfully deleted"
}
```

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 401 | `UNAUTHORIZED` | Invalid or missing authentication token |
| 404 | `LOGO_NOT_FOUND` | No logo to delete |

---

## 5. Contractor Endpoints

All endpoints require authentication. All operations are scoped to the authenticated user.

### 5.1 List Contractors

**GET** `/api/v1/contractors`

Returns paginated list of contractors.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number (1-based) |
| `limit` | integer | 20 | Items per page (max 100) |
| `search` | string | - | Search by name or NIP |
| `sortBy` | string | `createdAt` | Sort field: `name`, `createdAt`, `updatedAt` |
| `sortOrder` | string | `desc` | Sort direction: `asc`, `desc` |

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Kontrahent ABC",
      "address": "ul. Firmowa 10, 00-100 Kraków",
      "nip": "9876543210",
      "createdAt": "2025-01-10T08:00:00Z",
      "updatedAt": "2025-01-10T08:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

### 5.2 Get Contractor

**GET** `/api/v1/contractors/:id`

Returns a single contractor by ID.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**

```json
{
  "id": "uuid",
  "name": "Kontrahent ABC",
  "address": "ul. Firmowa 10, 00-100 Kraków",
  "nip": "9876543210",
  "createdAt": "2025-01-10T08:00:00Z",
  "updatedAt": "2025-01-10T08:00:00Z"
}
```

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 401 | `UNAUTHORIZED` | Invalid or missing authentication token |
| 404 | `CONTRACTOR_NOT_FOUND` | Contractor not found |

---

### 5.3 Create Contractor

**POST** `/api/v1/contractors`

Creates a new contractor.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

```json
{
  "name": "Nowy Kontrahent",
  "address": "ul. Nowa 5, 00-200 Gdańsk",
  "nip": "5551234567"
}
```

**Response (201 Created):**

```json
{
  "id": "uuid",
  "name": "Nowy Kontrahent",
  "address": "ul. Nowa 5, 00-200 Gdańsk",
  "nip": "5551234567",
  "createdAt": "2025-01-20T12:00:00Z",
  "updatedAt": "2025-01-20T12:00:00Z"
}
```

**Validation:**

- `name`: Required, non-empty string
- `nip`: Optional, if provided must be valid Polish NIP (10 digits, valid checksum)
- `nip`: Must be unique per user (among active contractors)

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 400 | `INVALID_NIP` | Invalid NIP format or checksum |
| 400 | `NAME_REQUIRED` | Contractor name is required |
| 401 | `UNAUTHORIZED` | Invalid or missing authentication token |
| 409 | `NIP_EXISTS` | Contractor with this NIP already exists |

---

### 5.4 Update Contractor

**PUT** `/api/v1/contractors/:id`

Updates an existing contractor.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

```json
{
  "name": "Zaktualizowany Kontrahent",
  "address": "ul. Zmieniona 15, 00-300 Poznań",
  "nip": "5551234567"
}
```

**Response (200 OK):**

```json
{
  "id": "uuid",
  "name": "Zaktualizowany Kontrahent",
  "address": "ul. Zmieniona 15, 00-300 Poznań",
  "nip": "5551234567",
  "createdAt": "2025-01-10T08:00:00Z",
  "updatedAt": "2025-01-20T14:00:00Z"
}
```

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 400 | `INVALID_NIP` | Invalid NIP format or checksum |
| 401 | `UNAUTHORIZED` | Invalid or missing authentication token |
| 404 | `CONTRACTOR_NOT_FOUND` | Contractor not found |
| 409 | `NIP_EXISTS` | Contractor with this NIP already exists |

---

### 5.5 Delete Contractor

**DELETE** `/api/v1/contractors/:id`

Soft-deletes a contractor (sets `deleted_at` timestamp).

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**

```json
{
  "message": "Contractor successfully deleted"
}
```

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 401 | `UNAUTHORIZED` | Invalid or missing authentication token |
| 404 | `CONTRACTOR_NOT_FOUND` | Contractor not found |

---

## 6. Invoice Endpoints

All endpoints require authentication. All operations are scoped to the authenticated user.

### 6.1 List Invoices

**GET** `/api/v1/invoices`

Returns paginated list of invoices.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number (1-based) |
| `limit` | integer | 20 | Items per page (max 100) |
| `status` | string | - | Filter by status: `draft`, `unpaid`, `paid` |
| `search` | string | - | Search by invoice number or buyer name |
| `dateFrom` | date | - | Filter by issue date (from) |
| `dateTo` | date | - | Filter by issue date (to) |
| `sortBy` | string | `createdAt` | Sort field: `invoiceNumber`, `issueDate`, `dueDate`, `totalGross`, `createdAt` |
| `sortOrder` | string | `desc` | Sort direction: `asc`, `desc` |

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "uuid",
      "invoiceNumber": "FV/2025/001",
      "issueDate": "2025-01-15",
      "dueDate": "2025-01-29",
      "status": "unpaid",
      "buyerName": "Kontrahent ABC",
      "buyerNip": "9876543210",
      "totalNet": "1000.00",
      "totalVat": "230.00",
      "totalGross": "1230.00",
      "currency": "PLN",
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

### 6.2 Get Invoice

**GET** `/api/v1/invoices/:id`

Returns a single invoice with all details including items.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**

```json
{
  "id": "uuid",
  "invoiceNumber": "FV/2025/001",
  "issueDate": "2025-01-15",
  "dueDate": "2025-01-29",
  "status": "unpaid",
  "paymentMethod": "transfer",
  "currency": "PLN",
  "notes": "Płatność w terminie 14 dni",
  "seller": {
    "companyName": "Moja Firma Sp. z o.o.",
    "address": "ul. Przykładowa 123, 00-001 Warszawa",
    "nip": "1234567890",
    "bankAccount": "PL61109010140000071219812874",
    "logoUrl": "https://storage.supabase.co/logos/uuid/logo.png"
  },
  "buyer": {
    "name": "Kontrahent ABC",
    "address": "ul. Firmowa 10, 00-100 Kraków",
    "nip": "9876543210"
  },
  "items": [
    {
      "id": "uuid",
      "position": 1,
      "name": "Usługa konsultingowa",
      "unit": "godz.",
      "quantity": "10.00",
      "unitPrice": "100.00",
      "vatRate": "23",
      "netAmount": "1000.00",
      "vatAmount": "230.00",
      "grossAmount": "1230.00"
    }
  ],
  "totalNet": "1000.00",
  "totalVat": "230.00",
  "totalGross": "1230.00",
  "contractorId": "uuid",
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:00:00Z"
}
```

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 401 | `UNAUTHORIZED` | Invalid or missing authentication token |
| 404 | `INVOICE_NOT_FOUND` | Invoice not found |

---

### 6.3 Get Next Invoice Number

**GET** `/api/v1/invoices/next-number`

Returns the suggested next invoice number based on user's format and counter.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**

```json
{
  "nextNumber": "FV/2025/006",
  "format": "FV/{YYYY}/{NNN}",
  "counter": 6
}
```

---

### 6.4 Create Invoice

**POST** `/api/v1/invoices`

Creates a new invoice. Seller data is automatically snapshotted from user profile.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

```json
{
  "invoiceNumber": "FV/2025/006",
  "issueDate": "2025-01-20",
  "dueDate": "2025-02-03",
  "status": "draft",
  "paymentMethod": "transfer",
  "notes": "Dziękujemy za współpracę",
  "contractorId": "uuid",
  "buyer": {
    "name": "Kontrahent ABC",
    "address": "ul. Firmowa 10, 00-100 Kraków",
    "nip": "9876543210"
  },
  "items": [
    {
      "position": 1,
      "name": "Usługa programistyczna",
      "unit": "godz.",
      "quantity": "40.00",
      "unitPrice": "150.00",
      "vatRate": "23"
    },
    {
      "position": 2,
      "name": "Licencja oprogramowania",
      "unit": "szt.",
      "quantity": "1.00",
      "unitPrice": "500.00",
      "vatRate": "23"
    }
  ]
}
```

**Notes:**

- `contractorId`: Optional, if provided links invoice to contractor (buyer data still required for snapshot)
- `buyer`: Can be provided manually or auto-filled from contractor
- `status`: Defaults to `draft`
- Seller snapshot is automatically created from user profile
- Item amounts are calculated server-side

**Response (201 Created):**

```json
{
  "id": "uuid",
  "invoiceNumber": "FV/2025/006",
  "issueDate": "2025-01-20",
  "dueDate": "2025-02-03",
  "status": "draft",
  "paymentMethod": "transfer",
  "currency": "PLN",
  "notes": "Dziękujemy za współpracę",
  "seller": {
    "companyName": "Moja Firma Sp. z o.o.",
    "address": "ul. Przykładowa 123, 00-001 Warszawa",
    "nip": "1234567890",
    "bankAccount": "PL61109010140000071219812874",
    "logoUrl": null
  },
  "buyer": {
    "name": "Kontrahent ABC",
    "address": "ul. Firmowa 10, 00-100 Kraków",
    "nip": "9876543210"
  },
  "items": [
    {
      "id": "uuid",
      "position": 1,
      "name": "Usługa programistyczna",
      "unit": "godz.",
      "quantity": "40.00",
      "unitPrice": "150.00",
      "vatRate": "23",
      "netAmount": "6000.00",
      "vatAmount": "1380.00",
      "grossAmount": "7380.00"
    },
    {
      "id": "uuid",
      "position": 2,
      "name": "Licencja oprogramowania",
      "unit": "szt.",
      "quantity": "1.00",
      "unitPrice": "500.00",
      "vatRate": "23",
      "netAmount": "500.00",
      "vatAmount": "115.00",
      "grossAmount": "615.00"
    }
  ],
  "totalNet": "6500.00",
  "totalVat": "1495.00",
  "totalGross": "7995.00",
  "contractorId": "uuid",
  "createdAt": "2025-01-20T14:00:00Z",
  "updatedAt": "2025-01-20T14:00:00Z"
}
```

**Validation:**

- `invoiceNumber`: Required, unique per user
- `issueDate`: Required, valid date
- `dueDate`: Required, must be >= issueDate
- `buyer.name`: Required
- `buyer.nip`: Optional, if provided must be valid NIP
- `items`: At least one item required
- `items[].name`: Required
- `items[].quantity`: Required, > 0
- `items[].unitPrice`: Required, >= 0
- `items[].vatRate`: Required, one of: `23`, `8`, `5`, `0`, `zw`

**Status-specific validation:**

- For `status: "unpaid"` or `status: "paid"`:
  - `seller.companyName`, `seller.address`, `seller.nip` must be set (from profile)
  - `buyer.name` is required

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 400 | `INVOICE_NUMBER_REQUIRED` | Invoice number is required |
| 400 | `INVALID_DATES` | Due date must be on or after issue date |
| 400 | `ITEMS_REQUIRED` | At least one invoice item is required |
| 400 | `INVALID_VAT_RATE` | Invalid VAT rate. Allowed: 23, 8, 5, 0, zw |
| 400 | `INVALID_BUYER_NIP` | Invalid buyer NIP format or checksum |
| 400 | `INCOMPLETE_PROFILE` | Complete your company profile before issuing invoices |
| 401 | `UNAUTHORIZED` | Invalid or missing authentication token |
| 409 | `INVOICE_NUMBER_EXISTS` | Invoice with this number already exists |

---

### 6.5 Update Invoice

**PUT** `/api/v1/invoices/:id`

Updates an existing invoice.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

```json
{
  "invoiceNumber": "FV/2025/006",
  "issueDate": "2025-01-20",
  "dueDate": "2025-02-03",
  "status": "unpaid",
  "paymentMethod": "transfer",
  "notes": "Zaktualizowane uwagi",
  "buyer": {
    "name": "Kontrahent ABC - Zaktualizowany",
    "address": "ul. Nowa 20, 00-200 Kraków",
    "nip": "9876543210"
  },
  "items": [
    {
      "id": "existing-item-uuid",
      "position": 1,
      "name": "Usługa programistyczna - rozszerzona",
      "unit": "godz.",
      "quantity": "50.00",
      "unitPrice": "150.00",
      "vatRate": "23"
    }
  ]
}
```

**Notes:**

- Items without `id` are created as new
- Existing items not included in the request are deleted
- Seller snapshot can be refreshed by omitting seller data (re-snapshots from current profile)

**Response (200 OK):**
Same structure as Create Invoice response.

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 400 | `INVALID_DATES` | Due date must be on or after issue date |
| 400 | `ITEMS_REQUIRED` | At least one invoice item is required |
| 401 | `UNAUTHORIZED` | Invalid or missing authentication token |
| 404 | `INVOICE_NOT_FOUND` | Invoice not found |
| 409 | `INVOICE_NUMBER_EXISTS` | Invoice with this number already exists |

---

### 6.6 Update Invoice Status

**PATCH** `/api/v1/invoices/:id/status`

Updates only the invoice status.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

```json
{
  "status": "paid"
}
```

**Response (200 OK):**

```json
{
  "id": "uuid",
  "invoiceNumber": "FV/2025/006",
  "status": "paid",
  "updatedAt": "2025-01-25T09:00:00Z"
}
```

**Validation:**

- `status`: Must be one of: `draft`, `unpaid`, `paid`
- Transition to `unpaid` requires complete invoice data (see Create Invoice validation)

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 400 | `INVALID_STATUS` | Invalid status. Allowed: draft, unpaid, paid |
| 400 | `INCOMPLETE_INVOICE` | Cannot mark as unpaid/paid: invoice data is incomplete |
| 401 | `UNAUTHORIZED` | Invalid or missing authentication token |
| 404 | `INVOICE_NOT_FOUND` | Invoice not found |

---

### 6.7 Duplicate Invoice

**POST** `/api/v1/invoices/:id/duplicate`

Creates a copy of an existing invoice with new number and current date.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body (optional):**

```json
{
  "invoiceNumber": "FV/2025/007"
}
```

**Notes:**

- If `invoiceNumber` not provided, uses next available number
- `issueDate` set to current date
- `dueDate` calculated based on original payment terms
- `status` set to `draft`
- Seller snapshot refreshed from current profile

**Response (201 Created):**
Same structure as Create Invoice response.

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 401 | `UNAUTHORIZED` | Invalid or missing authentication token |
| 404 | `INVOICE_NOT_FOUND` | Invoice not found |
| 409 | `INVOICE_NUMBER_EXISTS` | Invoice with this number already exists |

---

### 6.8 Delete Invoice

**DELETE** `/api/v1/invoices/:id`

Soft-deletes an invoice (sets `deleted_at` timestamp).

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**

```json
{
  "message": "Invoice successfully deleted"
}
```

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 401 | `UNAUTHORIZED` | Invalid or missing authentication token |
| 404 | `INVOICE_NOT_FOUND` | Invoice not found |

---

## 7. Authentication and Authorization

### 7.1 Authentication Mechanism

**Technology:** Supabase Auth with JWT tokens

**Flow:**

1. User registers/logs in via `/api/v1/auth/*` endpoints
2. Server returns JWT `accessToken` and `refreshToken`
3. Client includes `accessToken` in `Authorization: Bearer <token>` header
4. NestJS Guard validates token with Supabase
5. Request proceeds with authenticated user context

### 7.2 Token Management

| Token         | Lifetime | Storage                   |
| ------------- | -------- | ------------------------- |
| Access Token  | 1 hour   | Memory/localStorage       |
| Refresh Token | 7 days   | httpOnly cookie preferred |

### 7.3 Authorization Layers

1. **NestJS Auth Guard**: Validates JWT token, extracts user ID
2. **Supabase RLS**: Database-level row filtering by `user_id = auth.uid()`
3. **Service-level checks**: Additional business logic validation

### 7.4 Protected Routes

All routes except the following require authentication:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`

---

## 8. Validation and Business Logic

### 8.1 NIP (Polish Tax ID) Validation

**Format:** Exactly 10 digits

**Checksum Algorithm:**

```
weights = [6, 5, 7, 2, 3, 4, 5, 6, 7]
checksum = sum(nip[i] * weights[i] for i in 0..8) % 11
valid if checksum == nip[9]
```

**Applied to:**

- User profile NIP
- Contractor NIP
- Buyer NIP on invoice

### 8.2 Invoice Number Format

**Default format:** `FV/{YYYY}/{NNN}`

**Placeholders:**
| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{YYYY}` | 4-digit year | 2025 |
| `{YY}` | 2-digit year | 25 |
| `{MM}` | 2-digit month | 01 |
| `{NNN}` | Zero-padded counter | 001 |
| `{NN}` | Zero-padded counter (2 digits) | 01 |
| `{N}` | Counter without padding | 1 |

**Counter reset:** Manual only (user can update `invoiceNumberCounter`)

### 8.3 Financial Calculations

**Per item:**

```
netAmount = quantity × unitPrice
vatAmount = netAmount × (vatRate / 100)  // 0 for 'zw'
grossAmount = netAmount + vatAmount
```

**Totals:**

```
totalNet = sum(items.netAmount)
totalVat = sum(items.vatAmount)
totalGross = sum(items.grossAmount)
```

**Rounding:** All amounts rounded to 2 decimal places at each step.

### 8.4 Invoice Status Business Rules

| From Status | To Status | Condition                                         |
| ----------- | --------- | ------------------------------------------------- |
| `draft`     | `unpaid`  | Invoice complete (seller data, buyer name, items) |
| `draft`     | `paid`    | Invoice complete                                  |
| `unpaid`    | `paid`    | None                                              |
| `unpaid`    | `draft`   | Allowed                                           |
| `paid`      | `unpaid`  | Allowed                                           |
| `paid`      | `draft`   | Allowed                                           |

**Draft invoices:**

- Can have incomplete data
- Cannot be exported to PDF (client-side enforcement)

### 8.5 Seller Snapshot Logic

When creating/updating invoice:

1. Copy from `user_profiles`: `company_name`, `address`, `nip`, `bank_account`, `logo_url`
2. Store in invoice: `seller_company_name`, `seller_address`, `seller_nip`, `seller_bank_account`, `seller_logo_url`
3. Snapshot is immutable unless invoice is explicitly updated

### 8.6 Buyer Snapshot Logic

When creating/updating invoice:

1. If `contractorId` provided: Copy contractor data to buyer fields
2. If manual `buyer` provided: Use provided data
3. Store in invoice: `buyer_name`, `buyer_address`, `buyer_nip`
4. Original contractor can be modified without affecting issued invoices

### 8.7 Soft Delete

**Contractors:**

- Setting `deleted_at` hides from list queries
- Existing invoices retain `contractor_id` reference
- NIP uniqueness constraint excludes soft-deleted records

**Invoices:**

- Setting `deleted_at` hides from list queries
- Cascade deletes `invoice_items` (hard delete)
- Required for 5-year legal retention

---

## 9. Error Response Format

All error responses follow a consistent format:

```json
{
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "message": "Human-readable error message",
  "errors": [
    {
      "field": "nip",
      "message": "Invalid NIP checksum"
    }
  ],
  "timestamp": "2025-01-20T14:00:00Z"
}
```

### Common HTTP Status Codes

| Status | Usage                              |
| ------ | ---------------------------------- |
| 200    | Successful GET, PUT, PATCH, DELETE |
| 201    | Successful POST (resource created) |
| 400    | Validation error, bad request      |
| 401    | Missing or invalid authentication  |
| 403    | Authenticated but not authorized   |
| 404    | Resource not found                 |
| 409    | Conflict (duplicate resource)      |
| 429    | Rate limit exceeded                |
| 500    | Internal server error              |

---

## 10. Rate Limiting

| Endpoint Category   | Rate Limit          |
| ------------------- | ------------------- |
| Authentication      | 10 requests/minute  |
| Profile/Logo upload | 20 requests/minute  |
| CRUD operations     | 100 requests/minute |
| List/Search         | 60 requests/minute  |

Rate limit headers included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706187600
```
