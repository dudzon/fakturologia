# Session Notes - Planowanie bazy danych Fakturologia MVP

Data sesji: 31 grudnia 2025

---

## Decisions

### Runda 1 (Pytania 1-10)

1. Tabela `user_profiles` zawiera `updated_at`, bez soft delete
2. Adres firmy i kontrahenta jako jedno pole `TEXT` (bez rozbicia na komponenty)
3. Unique constraint na parę `(user_id, nip)` w tabeli `contractors`
4. PostgreSQL ENUM dla statusów faktury
5. Snapshot danych kontrahenta przechowywany bezpośrednio w tabeli `invoices`
6. Stawka VAT jako `VARCHAR(5)` z wartościami: '23', '8', '5', '0', 'zw'
7. Przechowywanie obliczonych sum (`total_net`, `total_vat`, `total_gross`) w `invoices`
8. Format numeracji faktur w `user_profiles` (pole `invoice_number_format`)
9. Indeksy na: `user_id`, `created_at DESC`, `status`, `invoice_id`
10. RLS dla `invoice_items` przez subquery JOIN (bez denormalizacji `user_id`)

### Runda 2 (Pytania 11-20)

11. Soft delete (`deleted_at`) dla tabel `contractors` i `invoices`
12. Logo firmy jako URL do Supabase Storage (nie Base64)
13. Snapshot danych sprzedawcy (`seller_*`) w tabeli `invoices`
14. Unikalność numeru faktury per użytkownik: `UNIQUE (user_id, invoice_number)`
15. Kolumna `position INTEGER` w `invoice_items` dla kolejności pozycji
16. Kolumna `unit VARCHAR(20)` dla jednostki miary (szt., godz., usł., kg)
17. Numeracja faktur w `user_profiles` (bez osobnej tabeli `invoice_sequences`)
18. Precyzja kwot: `DECIMAL(12,2)` dla wszystkich wartości pieniężnych
19. Bez pełnego audit logu – wystarczy `updated_at`
20. Osobne polityki RLS dla każdej operacji (SELECT, INSERT, UPDATE, DELETE)

### Runda 3 (Pytania 21-30)

21. Trigger PostgreSQL automatycznie tworzy `user_profiles` po rejestracji w `auth.users`
22. Kaskadowy soft delete przy usuwaniu konta użytkownika
23. Pole `contractor_id` w `invoices` opcjonalne (NULL dozwolone)
24. Prefiks `buyer_` dla snapshot nabywcy, `seller_` dla sprzedawcy
25. `issue_date DEFAULT CURRENT_DATE`, `due_date` bez domyślnej wartości
26. `buyer_nip` opcjonalne (NULL) dla kontrahentów bez NIP
27. Dodanie pola `payment_method VARCHAR(20) DEFAULT 'transfer'`
28. Dodanie pola `bank_account VARCHAR(32)` do `user_profiles`
29. Dodanie pola `currency VARCHAR(3) DEFAULT 'PLN'` (przygotowanie pod przyszłość)
30. ENUM uproszczony do trzech statusów: `'draft'`, `'unpaid'`, `'paid'`

---

## Matched Recommendations

1. **UUID jako klucze główne** – wszystkie tabele używają `uuid_generate_v4()` zgodnie z wytycznymi z `.agent/rules/nest-bazy-danych.md`

2. **Timestamps na każdej tabeli** – `created_at` i `updated_at` na wszystkich tabelach

3. **Soft delete dla encji biznesowych** – `deleted_at` na `contractors` i `invoices` (wymóg prawny przechowywania faktur min. 5 lat)

4. **Snake_case dla nazw kolumn** – wszystkie kolumny używają konwencji `snake_case`

5. **Row Level Security (RLS)** – pełna izolacja danych użytkowników z osobnymi politykami per operacja

6. **Snapshot danych na fakturze** – dane sprzedawcy i nabywcy zamrożone w momencie wystawienia (wymóg prawny)

7. **Relacja 1:1 między `auth.users` a `user_profiles`** – rozdzielenie autentykacji (Supabase Auth) od danych biznesowych

8. **Indeksy na często odpytywane kolumny** – `user_id`, `created_at`, `status`, `deleted_at`

9. **DECIMAL(12,2) dla kwot** – precyzja finansowa z obsługą zaokrągleń

10. **Trigger automatyzujący tworzenie profilu** – spójność danych przy rejestracji

---

## Database Planning Summary

### Główne wymagania schematu

Schemat bazy danych PostgreSQL 17 dla aplikacji Fakturologia obsługuje:

- Rejestrację i autentykację użytkowników (Supabase Auth)
- Zarządzanie danymi firmy użytkownika (profil sprzedawcy)
- CRUD kontrahentów z soft delete
- CRUD faktur VAT z pozycjami
- Generowanie PDF po stronie klienta

### Kluczowe encje i relacje

```
auth.users (Supabase)
    │
    └──1:1──► user_profiles
                   │
                   └──1:N──► contractors
                   │              │
                   └──1:N──► invoices ◄──N:1──┘ (opcjonalna referencja)
                                  │
                                  └──1:N──► invoice_items
```

| Relacja                         | Typ              | Opis                                        |
| ------------------------------- | ---------------- | ------------------------------------------- |
| `auth.users` → `user_profiles`  | 1:1              | Trigger tworzy profil przy rejestracji      |
| `user_profiles` → `contractors` | 1:N              | Użytkownik ma wielu kontrahentów            |
| `user_profiles` → `invoices`    | 1:N              | Użytkownik ma wiele faktur                  |
| `contractors` → `invoices`      | 1:N (opcjonalna) | Faktura może mieć referencję do kontrahenta |
| `invoices` → `invoice_items`    | 1:N              | Faktura ma wiele pozycji (CASCADE DELETE)   |

### Bezpieczeństwo

1. **Row Level Security (RLS)** na wszystkich tabelach – użytkownik widzi tylko swoje dane
2. **Soft delete** z filtrowaniem `deleted_at IS NULL` w politykach SELECT
3. **Supabase Storage RLS** – użytkownik ma dostęp tylko do swojego folderu `logos/{user_id}/`
4. **Separacja auth/biznes** – dane logowania w `auth.users`, dane firmy w `user_profiles`

### Skalowalność

1. **Indeksy** na kolumnach filtrowania i sortowania
2. **Snapshot danych** na fakturze – brak JOIN przy odczycie historycznych faktur
3. **DECIMAL(12,2)** – obsługa faktur do miliardów PLN
4. **Przygotowanie pod przyszłość** – pole `currency` mimo obsługi tylko PLN w MVP

### Specyfika polska

1. **NIP** – walidacja formatu i sumy kontrolnej w aplikacji (VARCHAR(10))
2. **Stawki VAT** – '23', '8', '5', '0', 'zw' (zwolniony)
3. **Numeracja faktur** – konfigurowalny format np. `'FV/{YYYY}/{NNN}'`
4. **Wymogi prawne** – soft delete dla faktur (przechowywanie min. 5 lat)

---

## Unresolved Issues

1. **Brak walidacji NIP na poziomie bazy** – walidacja formatu i sumy kontrolnej realizowana w NestJS, nie jako CHECK constraint w PostgreSQL. Rozważyć dodanie funkcji PL/pgSQL dla dodatkowej warstwy bezpieczeństwa.

2. **Migracja danych przy zmianie formatu numeracji** – co się dzieje gdy użytkownik zmieni `invoice_number_format` w trakcie roku? Czy `invoice_number_counter` resetuje się na początku roku?

3. **Limit pozycji na fakturze** – dla MVP pdfmake może mieć problemy wydajnościowe przy dużej liczbie pozycji. Rozważyć soft limit (np. max 100 pozycji).

4. **Backup i retencja danych** – strategia backupu Supabase i przechowywania soft-deleted rekordów (czy kiedyś je czyścić?).

5. **Obsługa błędów przy kaskadowym soft delete** – implementacja w NestJS czy trigger PostgreSQL? Wymaga decyzji implementacyjnej.

---

## Następne kroki

1. Wygenerowanie migracji SQL na podstawie `db-schema-plan.md`
2. Konfiguracja bucketu Storage dla logo
3. Testowanie polityk RLS
4. Implementacja triggerów
