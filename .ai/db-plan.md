# Schemat Bazy Danych PostgreSQL - Fakturologia MVP

## 1. Tabele

### 1.1 `user_profiles` (Profil użytkownika / dane firmy sprzedawcy)

Rozszerzenie danych użytkownika z Supabase Auth. Relacja 1:1 z `auth.users`.

| Kolumna                  | Typ          | Ograniczenia                              | Opis                           |
| ------------------------ | ------------ | ----------------------------------------- | ------------------------------ |
| `id`                     | UUID         | PK, FK → auth.users(id) ON DELETE CASCADE | ID użytkownika z Supabase Auth |
| `company_name`           | TEXT         | NULL                                      | Nazwa firmy                    |
| `address`                | TEXT         | NULL                                      | Adres firmy (jedno pole)       |
| `nip`                    | VARCHAR(10)  | NULL                                      | NIP firmy                      |
| `bank_account`           | VARCHAR(32)  | NULL                                      | Numer konta bankowego (IBAN)   |
| `logo_url`               | TEXT         | NULL                                      | URL do logo w Supabase Storage |
| `invoice_number_format`  | VARCHAR(100) | DEFAULT 'FV/{YYYY}/{NNN}'                 | Wzorzec numeracji faktur       |
| `invoice_number_counter` | INTEGER      | DEFAULT 0                                 | Licznik dla numeracji          |
| `created_at`             | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()                   | Data utworzenia                |
| `updated_at`             | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()                   | Data modyfikacji               |

---

### 1.2 `contractors` (Kontrahenci / nabywcy)

| Kolumna      | Typ         | Ograniczenia                                    | Opis                                 |
| ------------ | ----------- | ----------------------------------------------- | ------------------------------------ |
| `id`         | UUID        | PK, DEFAULT uuid_generate_v4()                  | ID kontrahenta                       |
| `user_id`    | UUID        | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | Właściciel rekordu                   |
| `name`       | TEXT        | NOT NULL                                        | Nazwa kontrahenta                    |
| `address`    | TEXT        | NULL                                            | Adres kontrahenta                    |
| `nip`        | VARCHAR(10) | NULL                                            | NIP (opcjonalny dla osób fizycznych) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()                         | Data utworzenia                      |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()                         | Data modyfikacji                     |
| `deleted_at` | TIMESTAMPTZ | NULL                                            | Soft delete                          |

**Constraints:**

- `UNIQUE (user_id, nip) WHERE nip IS NOT NULL` (partial unique index)

---

### 1.3 `invoices` (Faktury)

| Kolumna                 | Typ            | Ograniczenia                                    | Opis                                   |
| ----------------------- | -------------- | ----------------------------------------------- | -------------------------------------- |
| `id`                    | UUID           | PK, DEFAULT uuid_generate_v4()                  | ID faktury                             |
| `user_id`               | UUID           | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | Właściciel                             |
| `contractor_id`         | UUID           | NULL, FK → contractors(id) ON DELETE SET NULL   | Referencja do kontrahenta (opcjonalna) |
| `invoice_number`        | VARCHAR(50)    | NOT NULL                                        | Numer faktury                          |
| `issue_date`            | DATE           | NOT NULL, DEFAULT CURRENT_DATE                  | Data wystawienia                       |
| `due_date`              | DATE           | NOT NULL                                        | Termin płatności                       |
| `status`                | invoice_status | NOT NULL, DEFAULT 'draft'                       | Status: draft/unpaid/paid              |
| `payment_method`        | VARCHAR(20)    | NOT NULL, DEFAULT 'transfer'                    | Metoda płatności                       |
| `currency`              | VARCHAR(3)     | NOT NULL, DEFAULT 'PLN'                         | Waluta                                 |
| `notes`                 | TEXT           | NULL                                            | Uwagi dodatkowe                        |
| **Snapshot sprzedawcy** |                |                                                 |                                        |
| `seller_company_name`   | TEXT           | NOT NULL                                        | Nazwa firmy sprzedawcy                 |
| `seller_address`        | TEXT           | NOT NULL                                        | Adres sprzedawcy                       |
| `seller_nip`            | VARCHAR(10)    | NOT NULL                                        | NIP sprzedawcy                         |
| `seller_bank_account`   | VARCHAR(32)    | NULL                                            | Konto bankowe sprzedawcy               |
| `seller_logo_url`       | TEXT           | NULL                                            | Logo sprzedawcy                        |
| **Snapshot nabywcy**    |                |                                                 |                                        |
| `buyer_name`            | TEXT           | NOT NULL                                        | Nazwa nabywcy                          |
| `buyer_address`         | TEXT           | NULL                                            | Adres nabywcy                          |
| `buyer_nip`             | VARCHAR(10)    | NULL                                            | NIP nabywcy (opcjonalny)               |
| **Sumy**                |                |                                                 |                                        |
| `total_net`             | DECIMAL(12,2)  | NOT NULL                                        | Suma netto                             |
| `total_vat`             | DECIMAL(12,2)  | NOT NULL                                        | Suma VAT                               |
| `total_gross`           | DECIMAL(12,2)  | NOT NULL                                        | Suma brutto                            |
| **Timestamps**          |                |                                                 |                                        |
| `created_at`            | TIMESTAMPTZ    | NOT NULL, DEFAULT NOW()                         | Data utworzenia                        |
| `updated_at`            | TIMESTAMPTZ    | NOT NULL, DEFAULT NOW()                         | Data modyfikacji                       |
| `deleted_at`            | TIMESTAMPTZ    | NULL                                            | Soft delete                            |

**Constraints:**

- `UNIQUE (user_id, invoice_number)` - unikalność numeru faktury per użytkownik

---

### 1.4 `invoice_items` (Pozycje faktury)

| Kolumna      | Typ           | Ograniczenia                                  | Opis                              |
| ------------ | ------------- | --------------------------------------------- | --------------------------------- |
| `id`         | UUID          | PK, DEFAULT uuid_generate_v4()                | ID pozycji                        |
| `invoice_id` | UUID          | NOT NULL, FK → invoices(id) ON DELETE CASCADE | Faktura                           |
| `position`   | INTEGER       | NOT NULL                                      | Kolejność pozycji                 |
| `name`       | TEXT          | NOT NULL                                      | Nazwa towaru/usługi               |
| `unit`       | VARCHAR(20)   | NOT NULL, DEFAULT 'szt.'                      | Jednostka miary                   |
| `quantity`   | DECIMAL(12,2) | NOT NULL                                      | Ilość                             |
| `unit_price` | DECIMAL(12,2) | NOT NULL                                      | Cena jednostkowa netto            |
| `vat_rate`   | VARCHAR(5)    | NOT NULL                                      | Stawka VAT: '23'/'8'/'5'/'0'/'zw' |
| `created_at` | TIMESTAMPTZ   | NOT NULL, DEFAULT NOW()                       | Data utworzenia                   |
| `updated_at` | TIMESTAMPTZ   | NOT NULL, DEFAULT NOW()                       | Data modyfikacji                  |

---

## 2. Typy ENUM

```sql
CREATE TYPE invoice_status AS ENUM ('draft', 'unpaid', 'paid');
```

**Mapowanie na UI:**
| Wartość | Polski UI | Opis |
| -------- | -------------- | ----------------------------------------- |
| `draft` | Szkic | Niekompletna, nie można generować PDF |
| `unpaid` | Nieopłacona | Wystawiona, oczekuje na płatność |
| `paid` | Opłacona | Płatność otrzymana |

---

## 3. Relacje między tabelami

```
┌─────────────────────┐
│    auth.users       │ (Supabase Auth)
│    (id: UUID)       │
└──────────┬──────────┘
           │
           │ 1:1 (trigger automatyczny)
           ▼
┌─────────────────────┐
│   user_profiles     │
│    (id: UUID)       │
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     │           │
     │ 1:N       │ 1:N
     ▼           ▼
┌──────────┐  ┌──────────┐
│contractors│  │ invoices │
│(id: UUID)│  │(id: UUID)│
└────┬─────┘  └────┬─────┘
     │             │
     │    N:1      │ 1:N
     │  (opcjonalna)│
     └──────┬──────┘
            │
            ▼
     ┌─────────────┐
     │invoice_items│
     │ (id: UUID)  │
     └─────────────┘
```

| Relacja                        | Typ              | Klucz obcy                 | Opis                                        |
| ------------------------------ | ---------------- | -------------------------- | ------------------------------------------- |
| `auth.users` → `user_profiles` | 1:1              | `user_profiles.id`         | Trigger tworzy profil przy rejestracji      |
| `auth.users` → `contractors`   | 1:N              | `contractors.user_id`      | Użytkownik ma wielu kontrahentów            |
| `auth.users` → `invoices`      | 1:N              | `invoices.user_id`         | Użytkownik ma wiele faktur                  |
| `contractors` → `invoices`     | 1:N (opcjonalna) | `invoices.contractor_id`   | Faktura może mieć referencję do kontrahenta |
| `invoices` → `invoice_items`   | 1:N              | `invoice_items.invoice_id` | Faktura ma wiele pozycji (CASCADE DELETE)   |

---

## 4. Indeksy

### 4.1 Indeksy dla `user_profiles`

```sql
-- Klucz główny (automatyczny)
-- PRIMARY KEY (id)
```

### 4.2 Indeksy dla `contractors`

```sql
-- Lista kontrahentów użytkownika
CREATE INDEX idx_contractors_user_id ON contractors(user_id);

-- Filtrowanie aktywnych kontrahentów
CREATE INDEX idx_contractors_user_deleted ON contractors(user_id, deleted_at);

-- Unikalność NIP per użytkownik (partial index)
CREATE UNIQUE INDEX idx_contractors_user_nip ON contractors(user_id, nip)
  WHERE nip IS NOT NULL AND deleted_at IS NULL;
```

### 4.3 Indeksy dla `invoices`

```sql
-- Lista faktur użytkownika (sortowanie od najnowszej)
CREATE INDEX idx_invoices_user_created ON invoices(user_id, created_at DESC);

-- Filtrowanie po statusie
CREATE INDEX idx_invoices_user_status ON invoices(user_id, status);

-- Filtrowanie aktywnych faktur
CREATE INDEX idx_invoices_user_deleted ON invoices(user_id, deleted_at);

-- Unikalność numeru faktury per użytkownik
CREATE UNIQUE INDEX idx_invoices_user_number ON invoices(user_id, invoice_number);
```

### 4.4 Indeksy dla `invoice_items`

```sql
-- Pozycje faktury
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
```

---

## 5. Triggery i funkcje

### 5.1 Automatyczne tworzenie profilu użytkownika

```sql
-- Funkcja tworząca profil po rejestracji
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

-- Trigger na auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### 5.2 Automatyczna aktualizacja `updated_at`

```sql
-- Funkcja aktualizująca timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggery dla wszystkich tabel
CREATE TRIGGER set_updated_at_user_profiles
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_contractors
  BEFORE UPDATE ON contractors
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_invoices
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_invoice_items
  BEFORE UPDATE ON invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
```

---

## 6. Polityki Row Level Security (RLS)

### 6.1 Tabela `user_profiles`

```sql
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: użytkownik widzi tylko swój profil
CREATE POLICY "select_own_profile" ON user_profiles
  FOR SELECT
  USING (id = auth.uid());

-- INSERT: użytkownik może utworzyć tylko swój profil
CREATE POLICY "insert_own_profile" ON user_profiles
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- UPDATE: użytkownik może edytować tylko swój profil
CREATE POLICY "update_own_profile" ON user_profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- DELETE: brak - profil nie jest usuwany bezpośrednio
```

### 6.2 Tabela `contractors`

```sql
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;

-- SELECT: użytkownik widzi tylko swoich aktywnych kontrahentów
CREATE POLICY "select_own_contractors" ON contractors
  FOR SELECT
  USING (user_id = auth.uid() AND deleted_at IS NULL);

-- INSERT: użytkownik może dodawać kontrahentów tylko do siebie
CREATE POLICY "insert_own_contractors" ON contractors
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: użytkownik może edytować tylko swoich kontrahentów
CREATE POLICY "update_own_contractors" ON contractors
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: użytkownik może usuwać tylko swoich kontrahentów (soft delete)
CREATE POLICY "delete_own_contractors" ON contractors
  FOR DELETE
  USING (user_id = auth.uid());
```

### 6.3 Tabela `invoices`

```sql
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- SELECT: użytkownik widzi tylko swoje aktywne faktury
CREATE POLICY "select_own_invoices" ON invoices
  FOR SELECT
  USING (user_id = auth.uid() AND deleted_at IS NULL);

-- INSERT: użytkownik może tworzyć faktury tylko dla siebie
CREATE POLICY "insert_own_invoices" ON invoices
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: użytkownik może edytować tylko swoje faktury
CREATE POLICY "update_own_invoices" ON invoices
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: użytkownik może usuwać tylko swoje faktury (soft delete)
CREATE POLICY "delete_own_invoices" ON invoices
  FOR DELETE
  USING (user_id = auth.uid());
```

### 6.4 Tabela `invoice_items`

```sql
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- SELECT: użytkownik widzi pozycje tylko swoich faktur
CREATE POLICY "select_own_invoice_items" ON invoice_items
  FOR SELECT
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE user_id = auth.uid()
    )
  );

-- INSERT: użytkownik może dodawać pozycje tylko do swoich faktur
CREATE POLICY "insert_own_invoice_items" ON invoice_items
  FOR INSERT
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices WHERE user_id = auth.uid()
    )
  );

-- UPDATE: użytkownik może edytować pozycje tylko swoich faktur
CREATE POLICY "update_own_invoice_items" ON invoice_items
  FOR UPDATE
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices WHERE user_id = auth.uid()
    )
  );

-- DELETE: użytkownik może usuwać pozycje tylko swoich faktur
CREATE POLICY "delete_own_invoice_items" ON invoice_items
  FOR DELETE
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE user_id = auth.uid()
    )
  );
```

---

## 7. Polityki Supabase Storage

### 7.1 Bucket `logos`

```sql
-- Tworzenie bucketu
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', false);

-- SELECT: użytkownik widzi tylko swoje logo
CREATE POLICY "Users can view own logo"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- INSERT: użytkownik może wgrać logo tylko do swojego folderu
CREATE POLICY "Users can upload own logo"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- UPDATE: użytkownik może aktualizować tylko swoje logo
CREATE POLICY "Users can update own logo"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- DELETE: użytkownik może usuwać tylko swoje logo
CREATE POLICY "Users can delete own logo"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## 8. Pełny skrypt migracji SQL

```sql
-- ============================================
-- Migracja: Initial Schema
-- Baza danych: Fakturologia MVP
-- PostgreSQL 17 + Supabase
-- ============================================

-- 1. Rozszerzenia
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Typy ENUM
CREATE TYPE invoice_status AS ENUM ('draft', 'unpaid', 'paid');

-- 3. Tabele

-- 3.1 user_profiles
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  address TEXT,
  nip VARCHAR(10),
  bank_account VARCHAR(32),
  logo_url TEXT,
  invoice_number_format VARCHAR(100) DEFAULT 'FV/{YYYY}/{NNN}',
  invoice_number_counter INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.2 contractors
CREATE TABLE contractors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  nip VARCHAR(10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 3.3 invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contractor_id UUID REFERENCES contractors(id) ON DELETE SET NULL,
  invoice_number VARCHAR(50) NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  status invoice_status NOT NULL DEFAULT 'draft',
  payment_method VARCHAR(20) NOT NULL DEFAULT 'transfer',
  currency VARCHAR(3) NOT NULL DEFAULT 'PLN',
  notes TEXT,
  -- Snapshot sprzedawcy
  seller_company_name TEXT NOT NULL,
  seller_address TEXT NOT NULL,
  seller_nip VARCHAR(10) NOT NULL,
  seller_bank_account VARCHAR(32),
  seller_logo_url TEXT,
  -- Snapshot nabywcy
  buyer_name TEXT NOT NULL,
  buyer_address TEXT,
  buyer_nip VARCHAR(10),
  -- Sumy
  total_net DECIMAL(12,2) NOT NULL,
  total_vat DECIMAL(12,2) NOT NULL,
  total_gross DECIMAL(12,2) NOT NULL,
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 3.4 invoice_items
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  name TEXT NOT NULL,
  unit VARCHAR(20) NOT NULL DEFAULT 'szt.',
  quantity DECIMAL(12,2) NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  vat_rate VARCHAR(5) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Indeksy

-- contractors
CREATE INDEX idx_contractors_user_id ON contractors(user_id);
CREATE INDEX idx_contractors_user_deleted ON contractors(user_id, deleted_at);
CREATE UNIQUE INDEX idx_contractors_user_nip ON contractors(user_id, nip)
  WHERE nip IS NOT NULL AND deleted_at IS NULL;

-- invoices
CREATE INDEX idx_invoices_user_created ON invoices(user_id, created_at DESC);
CREATE INDEX idx_invoices_user_status ON invoices(user_id, status);
CREATE INDEX idx_invoices_user_deleted ON invoices(user_id, deleted_at);
CREATE UNIQUE INDEX idx_invoices_user_number ON invoices(user_id, invoice_number);

-- invoice_items
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);

-- 5. Funkcje i triggery

-- 5.1 Trigger: tworzenie profilu przy rejestracji
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 5.2 Trigger: aktualizacja updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at_user_profiles
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_contractors
  BEFORE UPDATE ON contractors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_invoices
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_invoice_items
  BEFORE UPDATE ON invoice_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. Row Level Security

-- 6.1 user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_profile" ON user_profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "insert_own_profile" ON user_profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "update_own_profile" ON user_profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- 6.2 contractors
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_contractors" ON contractors
  FOR SELECT USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "insert_own_contractors" ON contractors
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "update_own_contractors" ON contractors
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "delete_own_contractors" ON contractors
  FOR DELETE USING (user_id = auth.uid());

-- 6.3 invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_invoices" ON invoices
  FOR SELECT USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "insert_own_invoices" ON invoices
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "update_own_invoices" ON invoices
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "delete_own_invoices" ON invoices
  FOR DELETE USING (user_id = auth.uid());

-- 6.4 invoice_items
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_invoice_items" ON invoice_items
  FOR SELECT USING (invoice_id IN (SELECT id FROM invoices WHERE user_id = auth.uid()));

CREATE POLICY "insert_own_invoice_items" ON invoice_items
  FOR INSERT WITH CHECK (invoice_id IN (SELECT id FROM invoices WHERE user_id = auth.uid()));

CREATE POLICY "update_own_invoice_items" ON invoice_items
  FOR UPDATE
  USING (invoice_id IN (SELECT id FROM invoices WHERE user_id = auth.uid()))
  WITH CHECK (invoice_id IN (SELECT id FROM invoices WHERE user_id = auth.uid()));

CREATE POLICY "delete_own_invoice_items" ON invoice_items
  FOR DELETE USING (invoice_id IN (SELECT id FROM invoices WHERE user_id = auth.uid()));

-- 7. Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', false);

CREATE POLICY "Users can view own logo" ON storage.objects
  FOR SELECT USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own logo" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own logo" ON storage.objects
  FOR UPDATE USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own logo" ON storage.objects
  FOR DELETE USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 9. Dodatkowe uwagi i decyzje projektowe

### 9.1 Snapshot danych na fakturze

Dane sprzedawcy (`seller_*`) i nabywcy (`buyer_*`) są kopiowane do faktury w momencie wystawienia. Jest to:

- **Wymóg prawny** – faktura musi odzwierciedlać stan na dzień wystawienia
- **Zabezpieczenie** – zmiany w profilu/kontrahentach nie wpływają na historyczne faktury

### 9.2 Soft delete

Tabele `contractors` i `invoices` używają kolumny `deleted_at` zamiast fizycznego usuwania:

- **Wymogi prawne** – faktury VAT należy przechowywać minimum 5 lat
- **Integralność** – kontrahent może być powiązany z historycznymi fakturami
- **Odwracalność** – użytkownik może przypadkowo usunąć dane

### 9.3 Pole `contractor_id` jako opcjonalne

Faktura może być wystawiona na kontrahenta jednorazowego bez zapisywania go w bazie. Dane kontrahenta są zawsze w snapshotach `buyer_*`.

### 9.4 VAT jako VARCHAR

Pole `vat_rate VARCHAR(5)` zamiast INTEGER, ponieważ obsługuje zarówno stawki liczbowe ('23', '8', '5', '0') jak i "zw" (zwolniony z VAT).

### 9.5 Obliczone sumy

Pola `total_net`, `total_vat`, `total_gross` są przechowywane w tabeli `invoices` (nie obliczane dynamicznie) dla:

- **Wydajności** – brak konieczności agregacji przy każdym odczycie
- **Spójności** – unikanie różnic przez zaokrąglenia przy różnych obliczeniach

### 9.6 Numeracja faktur

Format i licznik numeracji (`invoice_number_format`, `invoice_number_counter`) są w `user_profiles`, nie w osobnej tabeli. Dla MVP to wystarczające rozwiązanie.

### 9.7 RLS przez subquery

Polityki RLS dla `invoice_items` używają subquery zamiast denormalizacji `user_id`. Zachowuje to normalizację danych kosztem minimalnie wolniejszych zapytań (akceptowalne dla MVP).

### 9.8 Precyzja kwot

`DECIMAL(12,2)` obsługuje faktury do miliardów PLN z precyzją do grosza. Wystarczające dla freelancerów i mikroprzedsiębiorców.
