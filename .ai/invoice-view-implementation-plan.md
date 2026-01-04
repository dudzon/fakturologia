# Plan implementacji widoku Faktur (Invoice Views)

## 1. Przegląd

Moduł widoku faktur stanowi główną część aplikacji Fakturologia. Obejmuje pełen cykl zarządzania fakturami: przeglądanie listy, szczegóły faktury, tworzenie, edycję, duplikowanie, zmianę statusu oraz generowanie PDF. Widok jest przeznaczony dla freelancerów i mikroprzedsiębiorców do wystawiania faktur VAT.

### Główne funkcjonalności:

- **Lista faktur** z paginacją, filtrowaniem i sortowaniem
- **Podgląd szczegółów** faktury w trybie read-only
- **Formularz tworzenia/edycji** z dynamicznymi pozycjami i automatycznymi obliczeniami
- **Zarządzanie statusem** (draft → unpaid → paid)
- **Duplikowanie faktur** z automatycznym numerowaniem
- **Generowanie PDF** po stronie klienta (pdfmake w Web Worker)

---

## 2. Routing widoku

| Ścieżka              | Komponent                | Guard                                                     | Cel                        |
| -------------------- | ------------------------ | --------------------------------------------------------- | -------------------------- |
| `/invoices`          | `InvoiceListComponent`   | `authGuard`                                               | Lista faktur (dashboard)   |
| `/invoices/new`      | `InvoiceFormComponent`   | `authGuard`, `profileCompleteGuard`, `canDeactivateGuard` | Tworzenie nowej faktury    |
| `/invoices/:id`      | `InvoiceDetailComponent` | `authGuard`                                               | Podgląd szczegółów faktury |
| `/invoices/:id/edit` | `InvoiceFormComponent`   | `authGuard`, `canDeactivateGuard`                         | Edycja istniejącej faktury |

```typescript
// Fragment app.routes.ts
{
  path: 'invoices',
  canActivate: [authGuard],
  children: [
    {
      path: '',
      loadComponent: () => import('./features/invoices/invoice-list.component')
    },
    {
      path: 'new',
      loadComponent: () => import('./features/invoices/invoice-form.component'),
      canActivate: [profileCompleteGuard],
      canDeactivate: [canDeactivateGuard]
    },
    {
      path: ':id',
      loadComponent: () => import('./features/invoices/invoice-detail.component')
    },
    {
      path: ':id/edit',
      loadComponent: () => import('./features/invoices/invoice-form.component'),
      canDeactivate: [canDeactivateGuard]
    }
  ]
}
```

---

## 3. Struktura komponentów

```
features/invoices/
├── invoice-list.component.ts          # Lista faktur
├── invoice-detail.component.ts        # Szczegóły faktury (read-only)
├── invoice-form.component.ts          # Formularz tworzenia/edycji
└── components/
    ├── invoice-filters.component.ts   # Panel filtrów
    ├── invoice-items-table.component.ts # Tabela pozycji (FormArray)
    ├── invoice-totals.component.ts    # Podsumowanie kwot
    ├── invoice-status-badge.component.ts # Badge statusu
    ├── invoice-status-dialog.component.ts # Dialog zmiany statusu
    └── invoice-print-preview.component.ts # Podgląd wydruku

shared/components/
├── contractor-select/
│   └── contractor-select.component.ts # Autocomplete kontrahenta
├── contractor-form-dialog/
│   └── contractor-form-dialog.component.ts # Dialog szybkiego dodania kontrahenta
├── empty-state/
│   └── empty-state.component.ts       # Stan pusty
├── loading-button/
│   └── loading-button.component.ts    # Przycisk z loaderem
└── confirm-dialog/
    └── confirm-dialog.component.ts    # Dialog potwierdzenia

stores/
└── invoice-form.store.ts              # Signal Store formularza

services/
├── invoice.service.ts                 # HTTP service dla API faktur
└── pdf-generator.service.ts           # Generowanie PDF (Web Worker)
```

### Hierarchia komponentów:

```
MainLayoutComponent
├── InvoiceListComponent
│   ├── InvoiceFiltersComponent
│   ├── mat-table (inline)
│   ├── InvoiceStatusBadgeComponent
│   ├── mat-paginator
│   └── EmptyStateComponent
│
├── InvoiceDetailComponent
│   ├── InvoiceStatusBadgeComponent
│   ├── InvoicePrintPreviewComponent
│   │   └── InvoiceTotalsComponent
│   └── InvoiceStatusDialogComponent (on demand)
│
└── InvoiceFormComponent
    ├── ContractorSelectComponent
    │   └── ContractorFormDialogComponent (on demand)
    ├── InvoiceItemsTableComponent
    ├── InvoiceTotalsComponent
    └── LoadingButtonComponent
```

---

## 4. Szczegóły komponentów

### 4.1 InvoiceListComponent

**Opis:** Główny widok listy faktur z tabelą, filtrami, sortowaniem i paginacją. Służy jako dashboard aplikacji.

**Główne elementy:**

- Nagłówek z tytułem "Faktury" i przyciskiem "Nowa faktura"
- `InvoiceFiltersComponent` - panel filtrów nad tabelą
- `mat-table` z kolumnami: numer, kontrahent, data wystawienia, termin płatności, kwota brutto, status
- `InvoiceStatusBadgeComponent` - kolorowy chip dla statusu
- `mat-paginator` - paginacja
- `EmptyStateComponent` - gdy brak faktur
- Menu kontekstowe (mat-menu) per wiersz: Podgląd, Edytuj, Duplikuj, Zmień status, Usuń

**Obsługiwane interakcje:**

- Kliknięcie "Nowa faktura" → nawigacja do `/invoices/new`
- Kliknięcie wiersza → nawigacja do `/invoices/:id`
- Zmiana filtrów → aktualizacja URL query params i przeładowanie danych
- Zmiana sortowania (kliknięcie nagłówka) → aktualizacja danych
- Zmiana strony/limitu w paginatorze → aktualizacja URL i danych
- Menu akcji: Podgląd, Edytuj (tylko draft), Duplikuj, Zmień status (dialog), Usuń (dialog potwierdzenia)

**Walidacja:**

- Brak walidacji formularza - widok read-only

**Typy:**

- `InvoiceListQuery` - parametry zapytania
- `InvoiceListResponse` - odpowiedź API
- `InvoiceListItem` - element listy
- `InvoiceStatus` - typ statusu
- `InvoiceFiltersViewModel` - model filtrów

**Propsy:** Brak (root component)

---

### 4.2 InvoiceFiltersComponent

**Opis:** Panel filtrów nad tabelą faktur z quick filters dla statusów, zakresem dat i wyszukiwaniem.

**Główne elementy:**

- Quick filter chips: Wszystkie, Szkice, Nieopłacone, Opłacone
- `mat-form-field` + `mat-date-range-input` dla zakresu dat
- `mat-form-field` + `input` dla wyszukiwania (numer faktury, nazwa nabywcy)
- Przycisk "Wyczyść filtry"

**Obsługiwane interakcje:**

- Kliknięcie quick filter → emisja zmiany statusu
- Zmiana zakresu dat → emisja zmiany dat (z debounce)
- Wpisanie w wyszukiwarkę → emisja zmiany search (z debounce 300ms)
- Kliknięcie "Wyczyść filtry" → reset wszystkich filtrów

**Walidacja:**

- `dateFrom` <= `dateTo` (walidacja zakresu dat)

**Typy:**

- `InvoiceFiltersViewModel` - model filtrów (input/output)
- `InvoiceStatus | null` - aktywny status

**Propsy:**

```typescript
@Input() filters: InvoiceFiltersViewModel;
@Output() filtersChange = new EventEmitter<InvoiceFiltersViewModel>();
```

---

### 4.3 InvoiceDetailComponent

**Opis:** Widok szczegółów faktury w trybie read-only z akcjami: Edytuj, Duplikuj, Generuj PDF, Zmień status. Wyświetla podgląd faktury zbliżony do formatu PDF.

**Główne elementy:**

- Toolbar z przyciskami akcji
- `InvoiceStatusBadgeComponent` z aktualnym statusem
- `InvoicePrintPreviewComponent` - podgląd w formacie A4
- Przycisk powrotu do listy
- `InvoiceStatusDialogComponent` - dialog zmiany statusu (mat-dialog)

**Obsługiwane interakcje:**

- Kliknięcie "Edytuj" → nawigacja do `/invoices/:id/edit` (tylko dla status=draft)
- Kliknięcie "Duplikuj" → wywołanie API duplicate + nawigacja do edycji nowej faktury
- Kliknięcie "Generuj PDF" → uruchomienie generowania PDF (loader)
- Kliknięcie "Zmień status" → otwarcie dialogu zmiany statusu
- Kliknięcie "Powrót" → nawigacja do `/invoices`

**Walidacja:**

- Przycisk "Edytuj" dostępny tylko dla `status === 'draft'`
- Przycisk "Generuj PDF" dostępny tylko dla `status !== 'draft'`
- Przy próbie generowania PDF dla draft → snackbar z informacją

**Typy:**

- `InvoiceResponse` - pełne dane faktury
- `InvoiceStatus` - typ statusu
- `UpdateInvoiceStatusCommand` - komenda zmiany statusu

**Propsy:** Brak (pobiera id z route params)

---

### 4.4 InvoicePrintPreviewComponent

**Opis:** Komponent prezentujący podgląd faktury w formacie zbliżonym do wydruku PDF. Wyświetla wszystkie dane faktury: sprzedawca, nabywca, pozycje, sumy, uwagi.

**Główne elementy:**

- Sekcja nagłówka: logo sprzedawcy, dane sprzedawcy
- Tytuł: "FAKTURA VAT nr [numer]"
- Daty: wystawienia, sprzedaży, płatności
- Sekcja nabywcy
- Tabela pozycji faktury
- `InvoiceTotalsComponent` - podsumowanie kwot
- Kwota słownie (używając `AmountToWordsService`)
- Sekcja uwag
- Dane bankowe (numer konta)

**Obsługiwane interakcje:** Brak (komponent prezentacyjny)

**Walidacja:** Brak

**Typy:**

- `InvoiceResponse` - dane faktury

**Propsy:**

```typescript
@Input({ required: true }) invoice: InvoiceResponse;
```

---

### 4.5 InvoiceFormComponent

**Opis:** Formularz tworzenia i edycji faktury. Reużywany dla obu trybów (new/edit). Zawiera sekcje: dane faktury, nabywca, pozycje, uwagi. Używa Angular Reactive Forms z FormArray dla pozycji.

**Główne elementy:**

- Nagłówek: "Nowa faktura" lub "Edycja faktury [numer]"
- Sekcja "Dane faktury":
  - `mat-form-field` + `input` - Numer faktury (z autouzupełnieniem)
  - `mat-form-field` + `mat-datepicker` - Data wystawienia
  - `mat-form-field` + `mat-datepicker` - Termin płatności
  - `mat-form-field` + `mat-select` - Metoda płatności
- Sekcja "Nabywca":
  - `ContractorSelectComponent` - autocomplete z opcją dodania nowego
  - Lub ręczne pola: nazwa, adres, NIP
- Sekcja "Pozycje faktury":
  - `InvoiceItemsTableComponent` - dynamiczna tabela pozycji
- Sekcja "Podsumowanie":
  - `InvoiceTotalsComponent` - sumy computed z Signal Store
- Sekcja "Uwagi":
  - `mat-form-field` + `textarea` - uwagi (max 1000 znaków)
- Przyciski akcji:
  - `LoadingButtonComponent` - "Zapisz jako szkic"
  - `LoadingButtonComponent` - "Wystaw fakturę"
  - `mat-button` - "Anuluj"

**Obsługiwane interakcje:**

- Wprowadzenie numeru faktury → walidacja unikalności (przy blur/submit)
- Wybór kontrahenta z autocomplete → wypełnienie danych nabywcy
- Kliknięcie "Dodaj kontrahenta" w autocomplete → otwarcie dialogu
- Dodanie/usunięcie/edycja pozycji → przeliczenie sum (Signal Store)
- Zmiana dat → walidacja dueDate >= issueDate
- Kliknięcie "Zapisz jako szkic" → zapis ze statusem draft
- Kliknięcie "Wystaw fakturę" → walidacja kompletności → zapis ze statusem unpaid
- Kliknięcie "Anuluj" → dialog przy niezapisanych zmianach

**Walidacja:**

- `invoiceNumber`: wymagany, unikalny per użytkownik
- `issueDate`: wymagany
- `dueDate`: wymagany, >= issueDate
- `buyer.name`: wymagany
- `buyer.nip`: opcjonalny, jeśli podany musi być poprawny (nipValidator)
- `items`: minimum 1 pozycja
- `items[].name`: wymagany
- `items[].quantity`: wymagany, > 0
- `items[].unitPrice`: wymagany, >= 0
- `items[].vatRate`: wymagany, jedna z dozwolonych wartości
- `notes`: max 1000 znaków

**Dodatkowa walidacja dla "Wystaw fakturę":**

- Profil użytkownika musi być kompletny (companyName, address, nip)
- Wszystkie pola wymagane muszą być wypełnione

**Typy:**

- `CreateInvoiceCommand` - tworzenie
- `UpdateInvoiceCommand` - aktualizacja
- `InvoiceResponse` - dane do edycji
- `InvoiceFormViewModel` - model formularza
- `InvoiceItemFormViewModel` - model pozycji

**Propsy:** Brak (pobiera mode i id z route)

---

### 4.6 InvoiceItemsTableComponent

**Opis:** Dynamiczna tabela pozycji faktury z FormArray. Umożliwia dodawanie, usuwanie i edycję pozycji. Każda zmiana triggeruje przeliczenie kwot.

**Główne elementy:**

- `mat-table` z kolumnami: Lp., Nazwa, Ilość, J.m., Cena netto, VAT, Netto, Brutto, Akcje
- Wiersz edytowalny z inline `mat-form-field`:
  - `input` - nazwa pozycji
  - `input type="number"` - ilość
  - `mat-select` - jednostka (predefiniowane + własna)
  - `input type="number"` - cena jednostkowa netto
  - `mat-select` - stawka VAT (23%, 8%, 5%, 0%, zw.)
- Obliczone kolumny (readonly): kwota netto, kwota brutto
- Przycisk "Dodaj pozycję"
- Ikona kosza przy każdym wierszu

**Obsługiwane interakcje:**

- Kliknięcie "Dodaj pozycję" → nowy wiersz z focusem na nazwie
- Zmiana wartości → przeliczenie kwot pozycji → emisja do rodzica
- Kliknięcie ikony kosza → usunięcie pozycji (dialog potwierdzenia dla ostatniej)
- Tab navigation między polami

**Walidacja:**

- `name`: wymagany, max 200 znaków
- `quantity`: wymagany, > 0, max 2 miejsca po przecinku
- `unitPrice`: wymagany, >= 0, max 2 miejsca po przecinku
- `vatRate`: wymagany

**Typy:**

- `InvoiceItemFormViewModel` - model pozycji
- `FormArray<FormGroup<InvoiceItemForm>>` - Angular FormArray

**Propsy:**

```typescript
@Input({ required: true }) itemsFormArray: FormArray<FormGroup<InvoiceItemForm>>;
@Output() itemsChange = new EventEmitter<void>();
```

---

### 4.7 InvoiceTotalsComponent

**Opis:** Komponent prezentujący podsumowanie kwot faktury: suma netto, podział VAT według stawek, suma brutto. Używa computed signals z InvoiceFormStore.

**Główne elementy:**

- Tabela/lista z:
  - "Suma netto: X PLN"
  - "VAT 23%: X PLN" (dla każdej użytej stawki)
  - "VAT 8%: X PLN"
  - ... (dynamicznie)
  - "**Suma brutto: X PLN**"

**Obsługiwane interakcje:** Brak (komponent prezentacyjny)

**Walidacja:** Brak

**Typy:**

- `InvoiceTotalsViewModel` - sumy i podział VAT

**Propsy:**

```typescript
@Input({ required: true }) totals: InvoiceTotalsViewModel;
// Lub computed z InvoiceFormStore
```

---

### 4.8 InvoiceStatusBadgeComponent

**Opis:** Reużywalny komponent wyświetlający kolorowy badge ze statusem faktury.

**Główne elementy:**

- `mat-chip` z odpowiednim kolorem i etykietą:
  - `draft` → szary, "Szkic"
  - `unpaid` → pomarańczowy, "Nieopłacona"
  - `paid` → zielony, "Opłacona"
- Opcjonalna ikona ostrzeżenia dla przeterminowanych (unpaid + dueDate < today)

**Obsługiwane interakcje:** Brak (komponent prezentacyjny)

**Walidacja:** Brak

**Typy:**

- `InvoiceStatus`

**Propsy:**

```typescript
@Input({ required: true }) status: InvoiceStatus;
@Input() dueDate?: string; // dla sprawdzenia przeterminowania
```

---

### 4.9 InvoiceStatusDialogComponent

**Opis:** Dialog do zmiany statusu faktury z informacją o konsekwencjach.

**Główne elementy:**

- Tytuł: "Zmień status faktury"
- Opis konsekwencji zmiany statusu
- `mat-radio-group` z opcjami statusu (z wyłączeniem aktualnego)
- `mat-form-field` + `mat-datepicker` - data płatności (dla paid)
- Przyciski: "Anuluj", "Zmień status"

**Obsługiwane interakcje:**

- Wybór nowego statusu
- Potwierdzenie → wywołanie API
- Anulowanie → zamknięcie dialogu

**Walidacja:**

- Nie można zmienić na aktualny status
- Dla `paid` można podać datę płatności (opcjonalne)

**Typy:**

- `UpdateInvoiceStatusCommand`
- `InvoiceStatus`

**Propsy (MAT_DIALOG_DATA):**

```typescript
{
  invoiceId: string;
  currentStatus: InvoiceStatus;
  invoiceNumber: string;
}
```

---

### 4.10 ContractorSelectComponent

**Opis:** Autocomplete do wyboru kontrahenta z bazy lub wprowadzenia danych ręcznie. Zawiera opcję szybkiego dodania nowego kontrahenta.

**Główne elementy:**

- `mat-form-field` + `input` z `matAutocomplete`
- Lista podpowiedzi z kontrahentami (nazwa, NIP)
- Opcja "Dodaj nowego kontrahenta" na końcu listy
- Toggle "Wprowadź dane ręcznie" → ukrycie autocomplete, pokazanie pól

**Obsługiwane interakcje:**

- Wpisywanie → wyszukiwanie kontrahentów (debounce 300ms)
- Wybór z listy → wypełnienie formularza danymi kontrahenta
- Kliknięcie "Dodaj nowego" → otwarcie `ContractorFormDialogComponent`
- Toggle "Ręcznie" → przełączenie trybu

**Walidacja:**

- `name`: wymagany (w trybie ręcznym)

**Typy:**

- `ContractorResponse` - dane kontrahenta
- `BuyerInfoRequest` - dane nabywcy do formularza

**Propsy:**

```typescript
@Input() selectedContractorId: string | null;
@Output() contractorSelected = new EventEmitter<ContractorResponse | null>();
@Output() buyerDataChanged = new EventEmitter<BuyerInfoRequest>();
```

---

## 5. Typy

### 5.1 Typy z API (istniejące w types.ts)

```typescript
// Status faktury
type InvoiceStatus = "draft" | "unpaid" | "paid";

// Stawka VAT
type VatRate = "23" | "8" | "5" | "0" | "zw";

// Metoda płatności
type PaymentMethod = "transfer" | "cash" | "card";

// Waluta
type Currency = "PLN" | "EUR" | "USD";

// Parametry listy faktur
interface InvoiceListQuery {
  page?: number;
  limit?: number;
  status?: InvoiceStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?:
    | "invoiceNumber"
    | "issueDate"
    | "dueDate"
    | "totalGross"
    | "createdAt";
  sortOrder?: "asc" | "desc";
}

// Odpowiedź listy
interface InvoiceListResponse {
  data: InvoiceListItem[];
  pagination: PaginationInfo;
}

// Element listy
interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  buyerName: string;
  buyerNip: string | null;
  totalNet: string;
  totalVat: string;
  totalGross: string;
  currency: Currency;
  createdAt: string;
  updatedAt: string;
}

// Pełne dane faktury
interface InvoiceResponse {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  paymentMethod: PaymentMethod;
  currency: Currency;
  notes: string | null;
  seller: SellerInfo;
  buyer: BuyerInfo;
  items: InvoiceItemResponse[];
  totalNet: string;
  totalVat: string;
  totalGross: string;
  contractorId: string | null;
  createdAt: string;
  updatedAt: string;
}

// Pozycja faktury (odpowiedź)
interface InvoiceItemResponse {
  id: string;
  position: number;
  name: string;
  unit: string | null;
  quantity: string;
  unitPrice: string;
  vatRate: VatRate;
  netAmount: string;
  vatAmount: string;
  grossAmount: string;
}

// Pozycja faktury (żądanie)
interface InvoiceItemRequest {
  id?: string;
  position: number;
  name: string;
  unit?: string;
  quantity: string;
  unitPrice: string;
  vatRate: VatRate;
}

// Dane nabywcy (żądanie)
interface BuyerInfoRequest {
  name: string;
  address?: string;
  nip?: string;
}

// Tworzenie faktury
interface CreateInvoiceCommand {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status?: InvoiceStatus;
  paymentMethod?: PaymentMethod;
  notes?: string;
  contractorId?: string;
  buyer: BuyerInfoRequest;
  items: InvoiceItemRequest[];
}

// Aktualizacja faktury
interface UpdateInvoiceCommand {
  invoiceNumber?: string;
  issueDate?: string;
  dueDate?: string;
  status?: InvoiceStatus;
  paymentMethod?: PaymentMethod;
  notes?: string;
  buyer?: BuyerInfoRequest;
  items?: InvoiceItemRequest[];
}

// Zmiana statusu
interface UpdateInvoiceStatusCommand {
  status: InvoiceStatus;
}

// Duplikacja
interface DuplicateInvoiceCommand {
  invoiceNumber?: string;
}

// Następny numer
interface NextInvoiceNumberResponse {
  nextNumber: string;
  format: string;
  counter: number;
}
```

### 5.2 Nowe typy ViewModel (do utworzenia)

```typescript
// models/invoice-view.model.ts

/** Model filtrów dla listy faktur */
interface InvoiceFiltersViewModel {
  status: InvoiceStatus | null;
  search: string;
  dateFrom: Date | null;
  dateTo: Date | null;
}

/** Model formularza faktury */
interface InvoiceFormViewModel {
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  paymentMethod: PaymentMethod;
  contractorId: string | null;
  buyer: BuyerFormViewModel;
  items: InvoiceItemFormViewModel[];
  notes: string;
  status: InvoiceStatus;
}

/** Model danych nabywcy w formularzu */
interface BuyerFormViewModel {
  name: string;
  address: string;
  nip: string;
}

/** Model pozycji faktury w formularzu */
interface InvoiceItemFormViewModel {
  id?: string;
  position: number;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  vatRate: VatRate;
  // Computed
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
}

/** Model sum faktury */
interface InvoiceTotalsViewModel {
  totalNet: number;
  totalVat: number;
  totalGross: number;
  vatBreakdown: VatBreakdownItem[];
}

/** Podział VAT według stawek */
interface VatBreakdownItem {
  rate: VatRate;
  label: string;
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
}

/** Typ formularza Angular (strongly typed) */
interface InvoiceForm {
  invoiceNumber: FormControl<string>;
  issueDate: FormControl<Date>;
  dueDate: FormControl<Date>;
  paymentMethod: FormControl<PaymentMethod>;
  contractorId: FormControl<string | null>;
  buyer: FormGroup<BuyerForm>;
  items: FormArray<FormGroup<InvoiceItemForm>>;
  notes: FormControl<string>;
  status: FormControl<InvoiceStatus>;
}

interface BuyerForm {
  name: FormControl<string>;
  address: FormControl<string>;
  nip: FormControl<string>;
}

interface InvoiceItemForm {
  id: FormControl<string | null>;
  position: FormControl<number>;
  name: FormControl<string>;
  unit: FormControl<string>;
  quantity: FormControl<number>;
  unitPrice: FormControl<number>;
  vatRate: FormControl<VatRate>;
}

/** Dane do dialogu zmiany statusu */
interface StatusDialogData {
  invoiceId: string;
  currentStatus: InvoiceStatus;
  invoiceNumber: string;
}

/** Wynik dialogu zmiany statusu */
interface StatusDialogResult {
  newStatus: InvoiceStatus;
  confirmed: boolean;
}
```

---

## 6. Zarządzanie stanem

### 6.1 InvoiceFormStore (Signal Store)

Store zarządza stanem formularza faktury z reaktywnymi obliczeniami sum.

```typescript
// stores/invoice-form.store.ts
import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  patchState,
} from "@ngrx/signals";

interface InvoiceFormState {
  items: InvoiceItemFormViewModel[];
  isCalculating: boolean;
}

export const InvoiceFormStore = signalStore(
  withState<InvoiceFormState>({
    items: [],
    isCalculating: false,
  }),

  withComputed((store) => ({
    // Suma netto wszystkich pozycji
    totalNet: computed(() =>
      store.items().reduce((sum, item) => sum + item.netAmount, 0)
    ),

    // Suma VAT wszystkich pozycji
    totalVat: computed(() =>
      store.items().reduce((sum, item) => sum + item.vatAmount, 0)
    ),

    // Suma brutto
    totalGross: computed(() => store.totalNet() + store.totalVat()),

    // Podział VAT według stawek
    vatBreakdown: computed(() => {
      const breakdown = new Map<VatRate, VatBreakdownItem>();

      for (const item of store.items()) {
        const existing = breakdown.get(item.vatRate);
        if (existing) {
          existing.netAmount += item.netAmount;
          existing.vatAmount += item.vatAmount;
          existing.grossAmount += item.grossAmount;
        } else {
          breakdown.set(item.vatRate, {
            rate: item.vatRate,
            label: getVatLabel(item.vatRate),
            netAmount: item.netAmount,
            vatAmount: item.vatAmount,
            grossAmount: item.grossAmount,
          });
        }
      }

      return Array.from(breakdown.values());
    }),

    // Model sum do wyświetlenia
    totals: computed(
      (): InvoiceTotalsViewModel => ({
        totalNet: store.totalNet(),
        totalVat: store.totalVat(),
        totalGross: store.totalGross(),
        vatBreakdown: store.vatBreakdown(),
      })
    ),

    // Czy formularz ma pozycje
    hasItems: computed(() => store.items().length > 0),
  })),

  withMethods((store) => ({
    // Ustawienie pozycji (z przeliczeniem)
    setItems(items: InvoiceItemFormViewModel[]) {
      const calculated = items.map((item) => calculateItemAmounts(item));
      patchState(store, { items: calculated });
    },

    // Dodanie pozycji
    addItem() {
      const newItem = createEmptyItem(store.items().length + 1);
      patchState(store, { items: [...store.items(), newItem] });
    },

    // Aktualizacja pozycji
    updateItem(index: number, updates: Partial<InvoiceItemFormViewModel>) {
      const items = [...store.items()];
      items[index] = calculateItemAmounts({ ...items[index], ...updates });
      patchState(store, { items });
    },

    // Usunięcie pozycji
    removeItem(index: number) {
      const items = store.items().filter((_, i) => i !== index);
      // Przenumerowanie pozycji
      items.forEach((item, i) => (item.position = i + 1));
      patchState(store, { items });
    },

    // Reset store
    reset() {
      patchState(store, { items: [], isCalculating: false });
    },
  }))
);

// Funkcje pomocnicze
function calculateItemAmounts(
  item: InvoiceItemFormViewModel
): InvoiceItemFormViewModel {
  const netAmount = round2(item.quantity * item.unitPrice);
  const vatMultiplier = getVatMultiplier(item.vatRate);
  const vatAmount = round2(netAmount * vatMultiplier);
  const grossAmount = round2(netAmount + vatAmount);

  return { ...item, netAmount, vatAmount, grossAmount };
}

function getVatMultiplier(rate: VatRate): number {
  const map: Record<VatRate, number> = {
    "23": 0.23,
    "8": 0.08,
    "5": 0.05,
    "0": 0,
    zw: 0,
  };
  return map[rate];
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function createEmptyItem(position: number): InvoiceItemFormViewModel {
  return {
    position,
    name: "",
    unit: "szt.",
    quantity: 1,
    unitPrice: 0,
    vatRate: "23",
    netAmount: 0,
    vatAmount: 0,
    grossAmount: 0,
  };
}
```

### 6.2 Stan lokalny komponentów

**InvoiceListComponent:**

- `invoices: Resource<InvoiceListResponse>` - httpResource dla listy
- `filters: Signal<InvoiceFiltersViewModel>` - aktualne filtry (sync z URL)
- `selectedInvoiceId: Signal<string | null>` - dla menu kontekstowego

**InvoiceDetailComponent:**

- `invoice: Resource<InvoiceResponse>` - httpResource dla szczegółów
- `isGeneratingPdf: Signal<boolean>` - stan generowania PDF
- `isStatusDialogOpen: Signal<boolean>` - stan dialogu

**InvoiceFormComponent:**

- `form: FormGroup<InvoiceForm>` - Reactive Form
- `invoiceFormStore: InvoiceFormStore` - stan pozycji i obliczeń
- `isSubmitting: Signal<boolean>` - stan zapisywania
- `mode: Signal<'create' | 'edit'>` - tryb formularza
- `nextNumber: Signal<string>` - sugerowany numer (dla create)

---

## 7. Integracja API

### 7.1 InvoiceService

```typescript
// services/invoice.service.ts
@Injectable({ providedIn: "root" })
export class InvoiceService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/invoices`;

  // GET /api/v1/invoices
  getInvoices(query: InvoiceListQuery): Observable<InvoiceListResponse> {
    const params = this.buildQueryParams(query);
    return this.http.get<InvoiceListResponse>(this.apiUrl, { params });
  }

  // GET /api/v1/invoices/:id
  getInvoice(id: string): Observable<InvoiceResponse> {
    return this.http.get<InvoiceResponse>(`${this.apiUrl}/${id}`);
  }

  // GET /api/v1/invoices/next-number
  getNextNumber(): Observable<NextInvoiceNumberResponse> {
    return this.http.get<NextInvoiceNumberResponse>(
      `${this.apiUrl}/next-number`
    );
  }

  // POST /api/v1/invoices
  createInvoice(command: CreateInvoiceCommand): Observable<InvoiceResponse> {
    return this.http.post<InvoiceResponse>(this.apiUrl, command);
  }

  // PUT /api/v1/invoices/:id
  updateInvoice(
    id: string,
    command: UpdateInvoiceCommand
  ): Observable<InvoiceResponse> {
    return this.http.put<InvoiceResponse>(`${this.apiUrl}/${id}`, command);
  }

  // PATCH /api/v1/invoices/:id/status
  updateStatus(
    id: string,
    command: UpdateInvoiceStatusCommand
  ): Observable<UpdateInvoiceStatusResponse> {
    return this.http.patch<UpdateInvoiceStatusResponse>(
      `${this.apiUrl}/${id}/status`,
      command
    );
  }

  // POST /api/v1/invoices/:id/duplicate
  duplicateInvoice(
    id: string,
    command?: DuplicateInvoiceCommand
  ): Observable<InvoiceResponse> {
    return this.http.post<InvoiceResponse>(
      `${this.apiUrl}/${id}/duplicate`,
      command ?? {}
    );
  }

  // DELETE /api/v1/invoices/:id
  deleteInvoice(id: string): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.apiUrl}/${id}`);
  }

  private buildQueryParams(query: InvoiceListQuery): HttpParams {
    let params = new HttpParams();

    if (query.page) params = params.set("page", query.page.toString());
    if (query.limit) params = params.set("limit", query.limit.toString());
    if (query.status) params = params.set("status", query.status);
    if (query.search) params = params.set("search", query.search);
    if (query.dateFrom) params = params.set("dateFrom", query.dateFrom);
    if (query.dateTo) params = params.set("dateTo", query.dateTo);
    if (query.sortBy) params = params.set("sortBy", query.sortBy);
    if (query.sortOrder) params = params.set("sortOrder", query.sortOrder);

    return params;
  }
}
```

### 7.2 Użycie httpResource w komponentach

```typescript
// invoice-list.component.ts
export class InvoiceListComponent {
  private readonly invoiceService = inject(InvoiceService);
  private readonly route = inject(ActivatedRoute);

  // Query params jako signal
  private readonly queryParams = toSignal(this.route.queryParams);

  // Mapowanie query params na InvoiceListQuery
  private readonly query = computed(() =>
    this.parseQueryParams(this.queryParams())
  );

  // httpResource dla listy
  invoices = httpResource<InvoiceListResponse, InvoiceListQuery>({
    request: this.query,
    loader: ({ request }) => this.invoiceService.getInvoices(request),
  });
}
```

---

## 8. Interakcje użytkownika

### 8.1 Lista faktur

| Interakcja                  | Akcja                                        | Rezultat                       |
| --------------------------- | -------------------------------------------- | ------------------------------ |
| Kliknięcie "Nowa faktura"   | `router.navigate(['/invoices/new'])`         | Przejście do formularza        |
| Kliknięcie wiersza          | `router.navigate(['/invoices', id])`         | Przejście do szczegółów        |
| Zmiana filtra statusu       | Aktualizacja URL query params                | Przeładowanie listy            |
| Wpisanie w wyszukiwarkę     | Debounce 300ms → aktualizacja URL            | Przeładowanie listy            |
| Zmiana zakresu dat          | Aktualizacja URL query params                | Przeładowanie listy            |
| Kliknięcie nagłówka kolumny | Toggle sortOrder / zmiana sortBy             | Przeładowanie listy            |
| Zmiana strony/limitu        | Aktualizacja URL query params                | Przeładowanie listy            |
| Menu > Edytuj               | `router.navigate(['/invoices', id, 'edit'])` | Przejście do edycji            |
| Menu > Duplikuj             | `invoiceService.duplicateInvoice(id)`        | Snackbar + nawigacja do edycji |
| Menu > Zmień status         | Otwarcie `InvoiceStatusDialogComponent`      | Dialog                         |
| Menu > Usuń                 | Otwarcie `ConfirmDialogComponent`            | Dialog potwierdzenia           |

### 8.2 Szczegóły faktury

| Interakcja                | Akcja                                        | Rezultat                             |
| ------------------------- | -------------------------------------------- | ------------------------------------ |
| Kliknięcie "Edytuj"       | `router.navigate(['/invoices', id, 'edit'])` | Przejście do edycji (tylko draft)    |
| Kliknięcie "Duplikuj"     | `invoiceService.duplicateInvoice(id)`        | Snackbar + nawigacja do edycji nowej |
| Kliknięcie "Generuj PDF"  | `pdfGeneratorService.generate(invoice)`      | Loader → pobranie PDF                |
| Kliknięcie "Zmień status" | Otwarcie dialogu                             | Dialog zmiany statusu                |
| Kliknięcie "Powrót"       | `router.navigate(['/invoices'])`             | Powrót do listy                      |

### 8.3 Formularz faktury

| Interakcja                     | Akcja                                    | Rezultat                                   |
| ------------------------------ | ---------------------------------------- | ------------------------------------------ |
| Focus na numerze (create)      | Pobranie `getNextNumber()`               | Autouzupełnienie numeru                    |
| Wybór kontrahenta              | Wypełnienie buyer z danych kontrahenta   | Aktualizacja formularza                    |
| Kliknięcie "Dodaj kontrahenta" | Otwarcie `ContractorFormDialogComponent` | Dialog → wybór nowego                      |
| Toggle "Wprowadź ręcznie"      | Zmiana trybu ContractorSelect            | Pokazanie pól ręcznych                     |
| Zmiana daty wystawienia        | Aktualizacja `issueDate`                 | Walidacja dueDate                          |
| Kliknięcie "Dodaj pozycję"     | `invoiceFormStore.addItem()`             | Nowy wiersz                                |
| Zmiana wartości pozycji        | `invoiceFormStore.updateItem()`          | Przeliczenie kwot                          |
| Kliknięcie kosza przy pozycji  | `invoiceFormStore.removeItem()`          | Usunięcie (z potwierdzeniem dla ostatniej) |
| Kliknięcie "Zapisz jako szkic" | Submit z `status: 'draft'`               | Zapis → nawigacja do szczegółów            |
| Kliknięcie "Wystaw fakturę"    | Walidacja → submit z `status: 'unpaid'`  | Zapis → nawigacja do szczegółów            |
| Kliknięcie "Anuluj"            | `canDeactivateGuard` sprawdzenie         | Dialog przy zmianach / nawigacja           |
| Zamknięcie karty/nawigacja     | `beforeunload` + guard                   | Ostrzeżenie przy niezapisanych zmianach    |

---

## 9. Warunki i walidacja

### 9.1 Walidacja formularza faktury

| Pole                | Warunek                     | Komunikat błędu                                                    |
| ------------------- | --------------------------- | ------------------------------------------------------------------ |
| `invoiceNumber`     | required                    | "Numer faktury jest wymagany"                                      |
| `invoiceNumber`     | unique (API)                | "Numer faktury już istnieje"                                       |
| `issueDate`         | required                    | "Data wystawienia jest wymagana"                                   |
| `dueDate`           | required                    | "Termin płatności jest wymagany"                                   |
| `dueDate`           | >= issueDate                | "Termin płatności musi być późniejszy lub równy dacie wystawienia" |
| `buyer.name`        | required                    | "Nazwa nabywcy jest wymagana"                                      |
| `buyer.nip`         | nipValidator (jeśli podany) | "Nieprawidłowy numer NIP"                                          |
| `items`             | min 1                       | "Dodaj przynajmniej jedną pozycję"                                 |
| `items[].name`      | required                    | "Nazwa pozycji jest wymagana"                                      |
| `items[].name`      | maxLength(200)              | "Nazwa pozycji może mieć maksymalnie 200 znaków"                   |
| `items[].quantity`  | required, > 0               | "Ilość musi być większa od 0"                                      |
| `items[].unitPrice` | required, >= 0              | "Cena nie może być ujemna"                                         |
| `items[].vatRate`   | required                    | "Wybierz stawkę VAT"                                               |
| `notes`             | maxLength(1000)             | "Uwagi mogą mieć maksymalnie 1000 znaków"                          |

### 9.2 Walidacja biznesowa (dla "Wystaw fakturę")

| Warunek                      | Sprawdzenie                     | Reakcja UI                                            |
| ---------------------------- | ------------------------------- | ----------------------------------------------------- |
| Kompletny profil użytkownika | `UserStore.isProfileComplete()` | Guard `profileCompleteGuard` → redirect do `/profile` |
| Wszystkie wymagane pola      | Walidacja formularza            | Scroll do pierwszego błędu                            |
| Min 1 pozycja                | `items.length > 0`              | Komunikat przy sekcji pozycji                         |

### 9.3 Warunki dostępności akcji

| Akcja             | Warunek              | Gdy niespełniony                                                |
| ----------------- | -------------------- | --------------------------------------------------------------- |
| Edycja faktury    | `status === 'draft'` | Przycisk ukryty/disabled, tooltip z informacją                  |
| Generowanie PDF   | `status !== 'draft'` | Przycisk disabled, tooltip "Wystaw fakturę aby wygenerować PDF" |
| Usunięcie faktury | `status === 'draft'` | Dla innych statusów: soft delete (anulowanie)                   |

### 9.4 Implementacja walidatorów

```typescript
// shared/validators/nip.validator.ts
export function nipValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value?.replace(/[\s-]/g, "");

    if (!value) return null; // Opcjonalne pole

    // Format: 10 cyfr
    if (!/^\d{10}$/.test(value)) {
      return { invalidNip: { message: "NIP musi składać się z 10 cyfr" } };
    }

    // Suma kontrolna
    const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
    const digits = value.split("").map(Number);
    const sum = weights.reduce((acc, w, i) => acc + w * digits[i], 0);

    if (sum % 11 !== digits[9]) {
      return { invalidNip: { message: "Nieprawidłowa suma kontrolna NIP" } };
    }

    return null;
  };
}

// shared/validators/date-range.validator.ts
export function dueDateValidator(
  issueDateControl: AbstractControl
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const issueDate = issueDateControl.value;
    const dueDate = control.value;

    if (!issueDate || !dueDate) return null;

    if (new Date(dueDate) < new Date(issueDate)) {
      return {
        invalidDueDate: {
          message:
            "Termin płatności musi być późniejszy lub równy dacie wystawienia",
        },
      };
    }

    return null;
  };
}
```

---

## 10. Obsługa błędów

### 10.1 Błędy API

| Kod HTTP | Kod błędu                 | Obsługa                                            |
| -------- | ------------------------- | -------------------------------------------------- |
| 400      | `INVOICE_NUMBER_REQUIRED` | mat-error przy polu numeru                         |
| 400      | `INVALID_DATES`           | mat-error przy polu dueDate                        |
| 400      | `ITEMS_REQUIRED`          | Alert nad sekcją pozycji                           |
| 400      | `INVALID_VAT_RATE`        | mat-error przy polu vatRate                        |
| 400      | `INVALID_BUYER_NIP`       | mat-error przy polu NIP nabywcy                    |
| 400      | `INCOMPLETE_PROFILE`      | Dialog z przyciskiem "Uzupełnij profil" → redirect |
| 400      | `INVALID_STATUS`          | Snackbar z błędem                                  |
| 400      | `INCOMPLETE_INVOICE`      | Dialog z listą brakujących pól                     |
| 401      | `UNAUTHORIZED`            | Interceptor → refresh token lub logout             |
| 404      | `INVOICE_NOT_FOUND`       | Redirect do `/invoices` + snackbar                 |
| 409      | `INVOICE_NUMBER_EXISTS`   | mat-error przy polu numeru                         |
| 5xx      | -                         | Globalny error banner + retry button               |

### 10.2 Mapowanie błędów na formularz

```typescript
// core/services/form-error.service.ts
@Injectable({ providedIn: "root" })
export class FormErrorService {
  applyServerErrors(form: FormGroup, errors: FieldError[]): void {
    errors.forEach((error) => {
      const control = form.get(error.field);
      if (control) {
        control.setErrors({ serverError: error.message });
        control.markAsTouched();
      }
    });
  }

  scrollToFirstError(): void {
    const firstError = document.querySelector(".mat-mdc-form-field-error");
    firstError?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}
```

### 10.3 Error Interceptor

```typescript
// core/interceptors/error.interceptor.ts
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const notificationService = inject(NotificationService);

      if (error.status === 401) {
        // Handled by auth interceptor
        return throwError(() => error);
      }

      if (error.status >= 500) {
        notificationService.error(
          "Wystąpił błąd serwera. Spróbuj ponownie później."
        );
      }

      // Błędy 4xx przekazywane do komponentów
      return throwError(() => error);
    })
  );
};
```

---

## 11. Kroki implementacji

### Faza 1: Infrastruktura (1-2 dni)

1. **Utworzenie struktury katalogów**

   - `features/invoices/` z plikami komponentów
   - `features/invoices/components/` dla podkomponentów
   - `stores/invoice-form.store.ts`
   - `services/invoice.service.ts`

2. **Implementacja InvoiceService**

   - Wszystkie metody HTTP
   - Testy jednostkowe

3. **Implementacja InvoiceFormStore**

   - State, computed, methods
   - Funkcje pomocnicze (obliczenia)
   - Testy jednostkowe

4. **Implementacja walidatorów**
   - `nipValidator`
   - `dueDateValidator`
   - Testy jednostkowe

### Faza 2: Lista faktur (2-3 dni)

5. **InvoiceFiltersComponent**

   - Quick filters (status)
   - Date range picker
   - Search input z debounce
   - Synchronizacja z URL query params

6. **InvoiceStatusBadgeComponent**

   - Kolorowe chipy
   - Obsługa przeterminowania

7. **InvoiceListComponent**
   - Tabela z mat-table
   - Sortowanie
   - Paginacja z mat-paginator
   - Menu kontekstowe
   - Empty state
   - Responsywność (karty na mobile)

### Faza 3: Szczegóły faktury (2-3 dni)

8. **InvoicePrintPreviewComponent**

   - Layout zbliżony do PDF
   - Sekcje: sprzedawca, nabywca, pozycje, sumy
   - Kwota słownie (AmountToWordsService)

9. **InvoiceStatusDialogComponent**

   - Radio group dla statusów
   - Opcjonalna data płatności
   - Potwierdzenie

10. **InvoiceDetailComponent**
    - Toolbar z akcjami
    - Integracja z InvoicePrintPreview
    - Obsługa generowania PDF
    - Logika dostępności akcji (edit tylko dla draft)

### Faza 4: Formularz faktury (3-4 dni)

11. **ContractorSelectComponent**

    - mat-autocomplete
    - Wyszukiwanie kontrahentów
    - Toggle trybu ręcznego
    - Integracja z ContractorFormDialogComponent

12. **InvoiceItemsTableComponent**

    - FormArray z dynamicznymi wierszami
    - Inline edycja
    - Przeliczanie kwot przy zmianach
    - Dodawanie/usuwanie pozycji
    - Responsywność

13. **InvoiceTotalsComponent**

    - Wyświetlanie sum z InvoiceFormStore
    - Podział VAT według stawek

14. **InvoiceFormComponent**
    - Integracja wszystkich podkomponentów
    - Reactive Form z walidacją
    - Tryb create/edit
    - Auto-fetch next number
    - Zapisz jako szkic / Wystaw fakturę
    - canDeactivateGuard

### Faza 5: PDF i finalizacja (1-2 dni)

15. **PdfGeneratorService**

    - Web Worker setup
    - pdfmake integration
    - Template faktury

16. **Testy integracyjne**

    - Scenariusze użytkownika
    - Error handling

17. **Responsywność i UX**
    - Mobile adaptations
    - Keyboard navigation
    - Focus management
    - Loading states

### Faza 6: Testy E2E (1-2 dni)

18. **Playwright tests**
    - Flow tworzenia faktury
    - Flow edycji
    - Flow duplikowania
    - Flow zmiany statusu
    - Flow generowania PDF

---

## Podsumowanie

Plan implementacji obejmuje kompletny moduł faktur z:

- 4 widokami głównymi (lista, szczegóły, nowa, edycja)
- 10+ komponentami specjalizowanymi
- Signal Store dla reaktywnych obliczeń
- Pełną integracją z 8 endpointami API
- Kompleksową walidacją (frontend + backend)
- Obsługą błędów na poziomie formularza i globalnym
- Generowaniem PDF po stronie klienta
- Responsywnym UI (mobile-first)

Szacowany czas implementacji: **10-16 dni roboczych** dla jednego developera.
