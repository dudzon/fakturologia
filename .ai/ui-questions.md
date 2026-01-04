# Pytania i rekomendacje UI - Część 1 (001-010)

## Pytanie 1

**Jak powinna wyglądać hierarchia nawigacji głównej aplikacji i gdzie umieścić poszczególne sekcje (faktury, kontrahenci, profil)?**

### Rekomendacja ✅

Zastosować płaską strukturę nawigacji z bocznym menu (sidenav) dla zalogowanych użytkowników, zawierającym: Dashboard/Lista faktur (domyślny widok), Kontrahenci, Profil firmy. Nawigacja górna powinna zawierać logo, nazwę użytkownika/firmy i przycisk wylogowania. Dla urządzeń mobilnych sidenav powinien być zwijany do hamburger menu.

---

## Pytanie 2

**Czy formularz tworzenia faktury powinien być osobnym widokiem pełnoekranowym, czy modalem/sliderem?**

### Rekomendacja ✅

Formularz faktury powinien być osobnym, dedykowanym widokiem (`/invoices/new`, `/invoices/:id/edit`) ze względu na jego złożoność (wiele pozycji, obliczenia, dane kontrahenta). Pozwoli to na lepsze wykorzystanie przestrzeni ekranu, łatwiejszą obsługę unsaved changes guard oraz lepsze UX na urządzeniach mobilnych. Modal może być użyty tylko dla prostych akcji jak zmiana statusu płatności.

---

## Pytanie 3

**Jak obsłużyć proces onboardingu nowego użytkownika, który musi uzupełnić dane firmy przed wystawieniem pierwszej faktury?**

### Rekomendacja ✅

Zaimplementować "wizard" onboardingowy lub przekierowanie z blokadą: po pierwszym zalogowaniu użytkownik bez wypełnionego profilu firmy (companyName, address, nip) powinien być automatycznie przekierowany do `/profile` z komunikatem informującym o konieczności uzupełnienia danych. Przycisk "Nowa faktura" powinien być nieaktywny lub wyświetlać tooltip z informacją o wymaganych danych profilu (zgodnie z błędem API `INCOMPLETE_PROFILE`).

---

## Pytanie 4

**Jak zorganizować stan formularza faktury z dynamicznymi pozycjami i automatycznymi obliczeniami (netto → VAT → brutto)?**

### Rekomendacja ✅

Wykorzystać Angular Reactive Forms z FormArray dla pozycji faktury w połączeniu z Angular Signals do reaktywnych obliczeń. Struktura: `InvoiceFormStore` (Signal Store) zarządzający stanem formularza, z computed signals dla `totalNet`, `totalVat`, `totalGross`. Każda zmiana w pozycji (quantity, unitPrice, vatRate) powinna triggerować przeliczenie przez effect/computed. Zaokrąglanie do 2 miejsc po przecinku na każdym etapie obliczeń.

---

## Pytanie 5

**Jak powinna działać funkcja autouzupełniania kontrahenta – autocomplete z listy czy modal wyboru?**

### Rekomendacja ✅

Zastosować `mat-autocomplete` z wyszukiwaniem po nazwie i NIP (wykorzystując parametr `search` endpointu `GET /api/v1/contractors`). Po wyborze kontrahenta automatycznie wypełnić pola buyer (name, address, nip). Dodać opcję "Dodaj nowego kontrahenta" na końcu listy autocomplete, która otwiera inline formularz lub przekierowuje do `/contractors/new` z parametrem returnUrl. Umożliwić też ręczne wpisanie danych bez zapisywania kontrahenta.

---

## Pytanie 6

**Jak obsłużyć różne stany faktur (draft, unpaid, paid) w interfejsie listy i szczegółów?**

### Rekomendacja ✅

Na liście faktur zastosować wizualne rozróżnienie statusów: kolorowe badge/chip (np. szary dla draft, pomarańczowy dla unpaid, zielony dla paid). Dodać filtry szybkie (quick filters) nad listą oraz dropdown do filtrowania po statusie. W widoku szczegółów faktury umieścić widoczny przycisk zmiany statusu (dropdown lub toggle). Dla faktur draft wyłączyć/ukryć przycisk "Generuj PDF" z tooltipem wyjaśniającym powód.

---

## Pytanie 7

**Jak zorganizować obsługę błędów API i walidacji w formularzach, aby zapewnić spójne UX?**

### Rekomendacja ✅

Stworzyć globalny serwis `ErrorHandlerService` interpretujący kody błędów API (np. `INVALID_NIP`, `INVOICE_NUMBER_EXISTS`). Błędy walidacji pól wyświetlać inline pod polami formularza (mat-error). Błędy biznesowe (409 Conflict, 400 Bad Request) wyświetlać jako snackbar lub inline alert. Błędy sieciowe/serwera (5xx) obsługiwać przez globalny interceptor z przyjaznym komunikatem i linkiem mailto: do supportu.

---

## Pytanie 8

**Czy lista faktur powinna obsługiwać paginację serwerową, infinite scroll czy ładować wszystkie dane?**

### Rekomendacja ✅

Zaimplementować paginację serwerową z `mat-paginator` (API wspiera parametry `page`, `limit`). Dla MVP wystarczy klasyczna paginacja z wyborem liczby elementów na stronę (10, 20, 50). Zachować parametry paginacji i filtrowania w URL (query params) dla możliwości bookmarkowania i nawigacji wstecz. Infinite scroll można rozważyć w przyszłości dla widoku mobilnego.

---

## Pytanie 9

**Jak zaimplementować generowanie PDF po stronie klienta z pdfmake, aby nie blokować UI?**

### Rekomendacja ✅

Generowanie PDF uruchomić w Web Worker, aby nie blokować głównego wątku UI. Wyświetlić loader/spinner podczas generowania z możliwością anulowania dla dużych dokumentów. Po wygenerowaniu automatycznie pobrać plik lub pokazać podgląd w nowym oknie. Przed generowaniem walidować kompletność danych (status !== 'draft') i wyświetlać komunikat z listą brakujących pól jeśli faktura jest niekompletna.

---

## Pytanie 10

**Jak zaprojektować Landing Page, aby skutecznie konwertować odwiedzających na zarejestrowanych użytkowników?**

### Rekomendacja ✅

Landing page (`/`) powinien być oddzielnym, publicznym widokiem bez nawigacji aplikacji. Struktura: Hero section z CTA "Zarejestruj się za darmo", sekcja korzyści (3-4 kluczowe funkcje z ikonami), opcjonalnie screenshot/mockup aplikacji, footer z linkami do regulaminu i polityki prywatności (otwierane w nowych kartach). Przyciski "Zaloguj się" i "Zarejestruj się" w prawym górnym rogu. Dla zalogowanych użytkowników wchodzących na `/` – przekierowanie do `/invoices`.

# Pytania i rekomendacje UI - Część 2 (011-020)

## Pytanie 11

**Jak zorganizować routing i strukturę lazy-loaded modułów w aplikacji Angular?**

### Rekomendacja ✅ (Zmodyfikowana)

Aplikacja Angular 21 ze standalone components, lazy loading przez `loadComponent` w routes, bez NgModules. Struktura tras:

- `/` - Landing Page (publiczny)
- `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/reset-password` (publiczne)
- `/invoices`, `/invoices/new`, `/invoices/:id`, `/invoices/:id/edit` (chronione)
- `/contractors`, `/contractors/new`, `/contractors/:id/edit` (chronione)
- `/profile` (chronione)

---

## Pytanie 12

**Jak obsłużyć tokeny JWT i automatyczne odświeżanie sesji w kontekście UI?**

### Rekomendacja ✅

Stworzyć `AuthService` przechowujący tokeny w pamięci (accessToken) i localStorage/sessionStorage (refreshToken). Zaimplementować HTTP Interceptor automatycznie dołączający token do żądań i obsługujący 401 – przy wygasłym accessToken automatycznie wywołać `/api/v1/auth/refresh`, a przy błędzie refresh tokena przekierować do `/auth/login` z komunikatem o wygaśnięciu sesji. Dodać idle timeout (np. 30 min nieaktywności) z modalem ostrzegającym przed wylogowaniem.

---

## Pytanie 13

**Jak zaprojektować widok szczegółów faktury – czy powinien być tylko do odczytu, czy umożliwiać inline edycję?**

### Rekomendacja ✅

Widok szczegółów faktury (`/invoices/:id`) powinien być read-only z wyraźnymi przyciskami akcji: "Edytuj" (→ `/invoices/:id/edit`), "Duplikuj", "Generuj PDF", "Zmień status" (dropdown). Wyświetlać wszystkie dane faktury w przejrzystym layoucie zbliżonym do wyglądu PDF. Dla drafts pokazywać ostrzeżenie o niekompletnych danych. Inline edycja wprowadza zbyt dużą złożoność dla MVP.

---

## Pytanie 14

**Jak zaimplementować funkcję duplikowania faktury z perspektywy UX?**

### Rekomendacja ✅

Przycisk "Duplikuj" w widoku szczegółów i jako akcja w menu kontekstowym na liście faktur. Po kliknięciu wywołać `POST /api/v1/invoices/:id/duplicate`, a następnie przekierować użytkownika do formularza edycji nowo utworzonej faktury (`/invoices/:newId/edit`). Wyświetlić snackbar "Faktura zduplikowana – możesz ją teraz edytować". Nowa faktura ma status draft, aktualną datę i nowy numer.

---

## Pytanie 15

**Jak obsłużyć walidację NIP w czasie rzeczywistym w formularzach?**

### Rekomendacja ✅

Stworzyć niestandardowy Angular Validator (`nipValidator`) sprawdzający format (10 cyfr) i sumę kontrolną zgodnie z algorytmem polskiego NIP. Walidacja powinna działać na blur i przy submit. Wyświetlać konkretne komunikaty błędów: "NIP musi zawierać 10 cyfr" lub "Nieprawidłowa suma kontrolna NIP". Dla pola NIP kontrahenta walidacja opcjonalna (pole może być puste). Dodatkowo obsłużyć błąd `NIP_EXISTS` z API przy zapisie.

---

## Pytanie 16

**Jak zaprojektować responsywny layout formularza faktury na urządzeniach mobilnych (768px+)?**

### Rekomendacja ✅

Zastosować podejście mobile-first z breakpointami Angular Material. Na desktop: dwukolumnowy layout (dane kontrahenta + metadane po lewej, pozycje faktury po prawej lub poniżej). Na tablet/mobile: jednokolumnowy layout ze zwijalnymi sekcjami (accordion). Tabela pozycji na mobile jako karty (każda pozycja osobna karta z polami). Sticky footer z podsumowaniem kwot i przyciskiem zapisz. Użyć `mat-stepper` jako alternatywy dla bardzo małych ekranów.

---

## Pytanie 17

**Jak zorganizować globalny state management dla danych użytkownika i cache'owanie danych?**

### Rekomendacja ✅

Utworzyć `UserStore` (Signal Store) przechowujący profil użytkownika, ładowany przy starcie aplikacji po zalogowaniu. Cache'ować listę kontrahentów w `ContractorsStore` z TTL (np. 5 min) i invalidacją przy CUD operacjach. Faktury nie cache'ować (zawsze świeże dane z API). Przy tworzeniu faktury sprawdzać czy profil jest kompletny z UserStore, nie odpytując API. Użyć `@ngrx/signals` lub własnej implementacji Signal Store.

---

## Pytanie 18

**Jak obsłużyć scenariusz utraty połączenia lub błędów sieciowych podczas pracy z formularzem?**

### ❌ POMINIĘTE

Funkcjonalność offline/auto-save nie będzie implementowana w MVP. To ma być prosta aplikacja.

---

## Pytanie 19

**Jak zaprojektować upload logo firmy z podglądem i walidacją?**

### Rekomendacja ✅

Komponent uploadu logo z: drag&drop zone + przycisk "Wybierz plik", walidacja typu (PNG, JPG) i rozmiaru (max 2MB) przed wysłaniem, podgląd wybranego obrazu przed uploadem, progress bar podczas uploadu, przycisk usunięcia istniejącego logo z potwierdzeniem. Po pomyślnym uploadzie aktualizować `UserStore` z nowym `logoUrl`. Wyświetlać aktualne logo w profilu i informować, że pojawi się na fakturach.

---

## Pytanie 20

**Jak zaimplementować guard'a sprawdzającego niezapisane zmiany (unsaved changes) przy opuszczaniu formularza?**

### Rekomendacja ✅

Stworzyć `CanDeactivateGuard` sprawdzający czy formularz ma niezapisane zmiany (`form.dirty && !saved`). Przy próbie nawigacji wyświetlić `mat-dialog` z pytaniem "Masz niezapisane zmiany. Czy na pewno chcesz opuścić stronę?". Opcje: "Zostań", "Opuść bez zapisywania", "Zapisz i opuść" (dla kompletnych danych). Zaimplementować również obsługę `beforeunload` event dla zamknięcia karty/okna przeglądarki.

# Pytania i rekomendacje UI - Część 3 (021-030)

## Pytanie 21

**Jak obsłużyć flow ponownego wysłania emaila weryfikacyjnego?**

### Rekomendacja ✅

Na stronie logowania wykrywać błąd "email_not_confirmed" i wyświetlać dedykowany komunikat z linkiem "Wyślij ponownie email weryfikacyjny". Po kliknięciu wywołać endpoint Supabase resend verification i pokazać snackbar "Email weryfikacyjny wysłany ponownie". Dodać cooldown (60s) na przycisk ponownego wysłania z widocznym odliczaniem. Na stronie "sprawdź email" po rejestracji również umieścić opcję ponownego wysłania.

---

## Pytanie 22

**Jak zaprojektować komponent tabeli pozycji faktury z dynamicznym dodawaniem/usuwaniem wierszy?**

### Rekomendacja ✅

Stworzyć dedykowany komponent `InvoiceItemsTableComponent` jako FormArray w reactive form. Każdy wiersz: nazwa, ilość (input number), jednostka (select), cena netto, stawka VAT (select), obliczane wartości (readonly). Przyciski: "Dodaj pozycję" pod tabelą, ikonka usunięcia per wiersz (z potwierdzeniem jeśli wypełniony). Drag&drop do zmiany kolejności (CDK DragDrop). Automatyczne przeliczanie sum przy każdej zmianie. Walidacja: min 1 pozycja, wszystkie pola wymagane.

---

## Pytanie 23

**Jak obsłużyć formatowanie i walidację numeru IBAN w formularzach?**

### Rekomendacja ✅

Stworzyć `ibanValidator` sprawdzający format polskiego IBAN (PL + 26 cyfr) z algorytmem mod97. Pole input powinno automatycznie dodawać spacje co 4 znaki dla czytelności (formatting pipe/directive), ale przechowywać wartość bez spacji. Akceptować wklejenie IBAN ze spacjami lub bez. Komunikaty błędów: "Nieprawidłowy format IBAN" lub "IBAN musi zaczynać się od PL". Pole opcjonalne w profilu.

---

## Pytanie 24

**Jak zaimplementować mechanizm wyboru stawki VAT z możliwością różnych stawek per pozycja?**

### Rekomendacja ✅

Stworzyć `VatRateSelectComponent` jako mat-select z predefiniowanymi stawkami: 23%, 8%, 5%, 0%, "zw" (zwolniony), "np" (nie podlega). Każda pozycja faktury ma własny select stawki VAT. Domyślna stawka: 23%. W podsumowaniu faktury grupować pozycje po stawce VAT z osobnymi sumami. Przechowywać w bazie jako string type (`"23"`, `"8"`, `"zw"` etc.) zgodnie z API.

---

## Pytanie 25

**Jak zaprojektować system notyfikacji i komunikatów dla użytkownika w aplikacji?**

### Rekomendacja ✅

Użyć `MatSnackBar` dla krótkich komunikatów sukcesu/błędu (auto-dismiss 3-5s). Dla błędów wymagających akcji użyć `MatDialog`. Typy snackbarów: success (zielony), error (czerwony), warning (żółty), info (niebieski). Centralna usługa `NotificationService` z metodami: `success()`, `error()`, `warning()`, `info()`. Pozycja: bottom-center na mobile, bottom-right na desktop. Dla błędów sieciowych pokazywać przycisk "Spróbuj ponownie".

---

## Pytanie 26

**Jak obsłużyć formatowanie dat zgodnie z polską lokalizacją w całej aplikacji?**

### Rekomendacja ✅

Skonfigurować Angular z polską lokalizacją (`pl-PL`). Daty wyświetlać w formacie `dd.MM.yyyy` (np. 31.12.2024). Użyć `DatePipe` z locale 'pl-PL'. Dla date pickerów skonfigurować `MAT_DATE_LOCALE` i `MAT_DATE_FORMATS`. Datepickery powinny zaczynać tydzień od poniedziałku. Przy wysyłaniu do API konwertować do formatu ISO (yyyy-MM-dd). Stworzyć helper `formatDateForApi()` i `formatDateForDisplay()`.

---

## Pytanie 27

**Jak zaprojektować widok "Ustawienia profilu" z wieloma sekcjami danych?**

### Rekomendacja ✅

Widok profilu (`/profile`) podzielić na sekcje w jednym formularzu lub tabbed interface: 1) Dane firmy (nazwa, NIP, adres), 2) Dane kontaktowe (email, telefon), 3) Dane bankowe (nazwa banku, IBAN), 4) Logo firmy (upload), 5) Domyślne ustawienia faktur (format numeru, termin płatności, uwagi). Każda sekcja jako `mat-expansion-panel` lub osobny tab. Jeden przycisk "Zapisz wszystko" na dole lub auto-save per sekcja.

---

## Pytanie 28

**Jak obsłużyć błędy walidacji zwracane z API (400 Bad Request)?**

### Rekomendacja ✅

API zwraca błędy w formacie `{ message, code, details }`. HTTP Interceptor powinien przechwytywać 400 i mapować błędy na formularzu. Dla błędów pól (np. `details: { nip: "NIP already exists" }`) ustawiać błędy na konkretnych kontrolkach `form.get('nip').setErrors({serverError: message})`. Dla błędów ogólnych wyświetlać snackbar. Stworzyć reużywalną funkcję `applyServerErrors(form, errorResponse)`.

---

## Pytanie 29

**Jak zaimplementować formatowanie kwot pieniężnych z polską lokalizacją?**

### Rekomendacja ✅

Stworzyć `CurrencyPipe` lub użyć wbudowanego z locale `pl-PL` i walutą PLN. Format: `1 234,56 PLN` (spacja jako separator tysięcy, przecinek dziesiętny). Inputy kwot powinny akceptować zarówno przecinek jak i kropkę jako separator dziesiętny, normalizując do liczby. Wyświetlać zawsze 2 miejsca po przecinku. W formularzach użyć directive'a formatującego wartość przy blur. API przyjmuje i zwraca liczby (nie stringi).

---

## Pytanie 30

**Jak zaprojektować onboarding tooltip/tour dla nowych użytkowników?**

### Rekomendacja ✅

Dla MVP zrezygnować z pełnego product tour na rzecz kontekstowych wskazówek. Przy pierwszym wejściu na `/invoices` (pusta lista) wyświetlić wyraźny empty state z instrukcją "Zacznij od uzupełnienia profilu firmy, a następnie dodaj pierwszą fakturę". W profilu przy pierwszej wizycie pokazać `mat-tooltip` z zachętą przy kluczowych polach. Zapisać flagi `hasSeenInvoicesTour`, `hasSeenProfileTour` w localStorage.

# Pytania i rekomendacje UI - Część 4 (031-040)

## Pytanie 31

**Jak obsłużyć pole "uwagi" na fakturze – jako prosty textarea czy rich text editor?**

### Rekomendacja ✅

Prosty `textarea` bez formatowania rich text. Pole opcjonalne z limitem znaków (np. 1000) i licznikiem pozostałych znaków. Możliwość ustawienia domyślnych uwag w profilu (np. "Dziękujemy za terminową płatność"), które będą pre-fill przy tworzeniu nowej faktury. Placeholder z przykładem: "np. Proszę o płatność na podane konto...". Zachowywanie białych znaków i nowych linii przy wyświetlaniu i w PDF.

---

## Pytanie 32

**Jak zaprojektować mechanizm filtrów na liście faktur (status, data, kontrahent)?**

### Rekomendacja ✅

Panel filtrów nad tabelą (rozwijalny na mobile) z: status (multi-select checkboxy), zakres dat (date range picker), kontrahent (autocomplete), wyszukiwanie tekstowe (numer faktury, nazwa kontrahenta). Filtry zapisywane w URL query params dla bookmarkowania/share. Przycisk "Wyczyść filtry" gdy aktywne. Pokazywać badge z liczbą aktywnych filtrów. Filtrowanie wykonywać przez API (parametry query), nie lokalnie.

---

## Pytanie 33

**Jak obsłużyć podgląd faktury przed zapisaniem (preview)?**

### Rekomendacja ✅

Przycisk "Podgląd" w formularzu obok "Zapisz jako draft" i "Zapisz i wystaw". Podgląd otwiera `mat-dialog` lub panel boczny z renderowaniem faktury w układzie zbliżonym do PDF (HTML preview, nie generowanie PDF). Dane pobierane z aktualnego stanu formularza (bez zapisywania). Walidacja formularza przed pokazaniem podglądu z informacją o brakujących polach. Przycisk "Zamknij" i "Zapisz" w preview.

---

## Pytanie 34

**Jak zaimplementować obsługę wielu numerów faktur i ich formatów?**

### Rekomendacja ✅

W profilu pole "Format numeru faktury" z placeholderami: `{NR}` (numer kolejny), `{MM}` (miesiąc), `{RRRR}` (rok). Domyślny format: `FV/{NR}/{MM}/{RRRR}`. Podgląd przykładowego numeru przy edycji formatu. Przy tworzeniu faktury backend generuje numer wg formatu. Na UI wyświetlać wygenerowany numer (readonly) po zapisaniu. Walidacja unikalności numeru przy edycji (dla issued/paid faktur).

---

## Pytanie 35

**Jak zaprojektować komponenty shared/common dla spójności UI?**

### Rekomendacja ✅

Stworzyć bibliotekę komponentów shared: `PageHeaderComponent` (tytuł + breadcrumbs + akcje), `EmptyStateComponent` (ikona + tekst + CTA), `LoadingSpinnerComponent` (overlay lub inline), `ConfirmDialogComponent` (reużywalny dialog potwierdzenia), `FormFieldErrorComponent` (wyświetlanie błędów walidacji), `StatusBadgeComponent` (badge ze statusem faktury). Wszystkie komponenty standalone z odpowiednimi inputami i outputami. Dokumentacja w Storybook lub dedykowanym pliku.

---

## Pytanie 36

**Jak obsłużyć długie listy kontrahentów/faktur - czy virtualizacja jest potrzebna?**

### Rekomendacja ✅

Dla MVP przy założeniu <1000 faktur/kontrahentów virtualizacja nie jest konieczna. Standardowa paginacja (10/25/50 per strona) z API wystarcza. Przygotować infrastrukturę (CDK Virtual Scrolling) do łatwego dodania później. Dla autocomplete kontrahentów używać server-side search z debounce (300ms) zamiast ładowania wszystkich. Monitorować performance i dodać virtualizację gdy będzie potrzeba.

---

## Pytanie 37

**Jak zaprojektować responsywne menu nawigacji (sidebar vs top-nav)?**

### Rekomendacja ✅

Desktop (>1024px): stały sidebar po lewej (wąski, ikony + teksty), main content po prawej. Tablet (768-1024px): sidebar collapsible (domyślnie tylko ikony, hover/click rozwija). Mobile (<768px): top-bar z hamburger menu + slide-in drawer. W sidebarze: Dashboard (przyszłość), Faktury, Kontrahenci, Profil, Wyloguj. Logo aplikacji na górze sidebara. Aktywna pozycja podświetlona. Użyć `mat-sidenav` z responsive behavior.

---

## Pytanie 38

**Jak obsłużyć loading states na poziomie całej strony vs komponentów?**

### Rekomendacja ✅

Dwa poziomy loadingu: 1) Route-level: skeleton/placeholder dla całej strony przy pierwszym ładowaniu danych (np. lista faktur), 2) Component-level: lokalne spinnery dla akcji (np. zapisywanie faktury, ładowanie kontrahenta w autocomplete). Nigdy nie blokować całej aplikacji (bez full-page overlay). Dla tabel pokazywać skeleton rows. Dla formularzy dezaktywować przyciski submit z spinnerem. Użyć `loading` signal w komponentach.

---

## Pytanie 39

**Jak zaimplementować funkcjonalność zmiany statusu faktury?**

### Rekomendacja ✅

W widoku szczegółów faktury dropdown "Zmień status" z dostępnymi przejściami: draft→issued, issued→paid, issued→cancelled, paid→cancelled (z ostrzeżeniem). Dla statusu "paid" dodatkowe pole "data płatności" w dialogu. Każda zmiana wymaga potwierdzenia w `mat-dialog` z opisem konsekwencji. Po zmianie przekierować do widoku szczegółów z zaktualizowanym statusem i snackbar. Na liście: menu kontekstowe z tymi samymi opcjami.

---

## Pytanie 40

**Jak zaprojektować ekran "Zapomniałem hasła" i resetowanie hasła?**

### Rekomendacja ✅

`/auth/forgot-password`: formularz z jednym polem email, walidacja formatu, przycisk "Wyślij link resetujący". Po submit zawsze pokazywać "Jeśli konto istnieje, wysłaliśmy link" (security). `/auth/reset-password?token=xxx`: formularz nowego hasła (2x input z walidacją siły hasła i zgodności), obsługa wygasłego/invalid tokena z opcją ponownego wysłania linku. Hasło min 8 znaków, 1 cyfra, 1 wielka litera. Po resecie przekierować do logowania z komunikatem sukcesu.

# Pytania i rekomendacje UI - Część 5 (041-050)

## Pytanie 41

**Jak obsłużyć scenariusz gdy użytkownik próbuje wystawić fakturę bez kompletnego profilu?**

### Rekomendacja ✅

Przy próbie zmiany statusu faktury na "issued" sprawdzać kompletność profilu (nazwa firmy, adres, NIP, numer konta). Jeśli niekompletny: zablokować akcję i wyświetlić modal "Uzupełnij profil firmy" z listą brakujących pól i przyciskiem "Przejdź do profilu". Draft można zapisywać bez kompletnego profilu. Wizualna wskazówka w UI (np. warning badge przy "Profil" w menu) gdy profil niekompletny.

---

## Pytanie 42

**Jak zaimplementować dark mode / theme switching?**

### ❌ POMINIĘTE

Dark mode nie będzie implementowany w MVP. Skupiamy się na funkcjonalności core. Temat do rozważenia w przyszłości.

---

## Pytanie 43

**Jak zaprojektować politykę cache i odświeżania danych w aplikacji?**

### Rekomendacja ✅

Strategia cache: 1) Profil użytkownika – cache w UserStore, odświeżanie przy logowaniu i po edycji, 2) Lista kontrahentów – cache w ContractorsStore z TTL 5 min, invalidacja przy CUD, 3) Faktury – zawsze świeże (no cache), fetch przy każdym wejściu na listę/szczegóły, 4) Pojedynczy kontrahent – fetch z API (może być nieaktualny w cache). Pull-to-refresh na mobile. Przycisk "Odśwież" na listach.

---

## Pytanie 44

**Jak obsłużyć walidację i prezentację pola "termin płatności" na fakturze?**

### Rekomendacja ✅

Dwa tryby ustawienia terminu: 1) "Dni od daty wystawienia" (select: 7, 14, 30, 60, 90 dni) – automatycznie oblicza datę, 2) "Konkretna data" (date picker). Domyślna wartość z profilu (np. 14 dni). Walidacja: termin nie może być przed datą wystawienia. Wyświetlanie: "Termin płatności: 15.01.2025 (14 dni)". Przechowywanie w bazie jako data (payment_due_date). Na liście faktur highlight dla przeterminowanych (issued z terminem < dziś).

---

## Pytanie 45

**Jak zaprojektować mechanizm powiadomień w aplikacji (przyszły rozwój)?**

### Rekomendacja ✅

Dla MVP nie implementować systemu powiadomień in-app. Przygotować jedynie: 1) miejsce na ikonkę powiadomień w headerze (ukryte), 2) strukturę `NotificationService` gotową na rozszerzenie. W przyszłości: powiadomienia o zbliżających się terminach płatności, o przeterminowanych fakturach. Na teraz użytkownik sam sprawdza statusy na liście faktur z wizualnymi wskaźnikami.

---

## Pytanie 46

**Jak obsłużyć timeout sesji i automatyczne wylogowanie?**

### Rekomendacja ✅

Zaimplementować idle timeout: po 30 min nieaktywności (brak kliknięć, ruchu myszy, keypressów) wyświetlić modal "Twoja sesja wkrótce wygaśnie" z odliczaniem (60s) i przyciskami "Przedłuż sesję" / "Wyloguj teraz". Brak reakcji = automatyczne wylogowanie z przekierowaniem do `/auth/login?reason=timeout`. Przy refresh tokena resetować timer. Użyć biblioteki typu `angular-user-idle` lub własnej implementacji.

---

## Pytanie 47

**Jak zaprojektować wyświetlanie listy pozycji faktury na widoku szczegółów (read-only)?**

### Rekomendacja ✅

Tabela responsywna z kolumnami: Lp., Nazwa, Ilość, Jednostka, Cena netto, Stawka VAT, Wartość netto, Wartość VAT, Wartość brutto. Pod tabelą podsumowanie: suma netto, kwoty VAT pogrupowane wg stawek, suma brutto, słownie kwota brutto. Na mobile: widok kartowy (każda pozycja jako karta) zamiast tabeli. Użyć `mat-table` z responsive styles lub dedykowanego komponentu mobile.

---

## Pytanie 48

**Jak zaimplementować testy jednostkowe dla komponentów formularzy?**

### Rekomendacja ✅ (Zmodyfikowana)

Użyć Vitest (nie Karma/Jasmine) z Angular testing utilities. Testować: 1) Walidatory (nipValidator, ibanValidator) – unit tests, 2) Komponenty formularzy – sprawdzać czy walidacje działają, czy submit jest disabled gdy invalid, czy błędy się wyświetlają, 3) Services – mockować HttpClient, testować transformacje danych, 4) Stores – testować state changes. Coverage minimum 70% dla logiki biznesowej. Dla komponentów UI testować integracyjnie z Playwright.

---

## Pytanie 49

**Jak obsłużyć import/export danych dla faktur (przyszły rozwój)?**

### Rekomendacja ✅

Dla MVP nie implementować importu. Eksport przygotować jako: 1) PDF (już jest), 2) Przyszłość: eksport listy faktur do CSV/Excel. Przygotować w UI miejsce na przycisk "Eksportuj" na liście faktur (ukryty/disabled). Struktura serwisu `ExportService` gotowa na rozszerzenie. W przyszłości: integracja z systemami księgowymi, import kontrahentów z CSV.

---

## Pytanie 50

**Jak zaprojektować flow edycji istniejącej faktury?**

### Rekomendacja ✅

Przycisk "Edytuj" widoczny tylko dla faktur ze statusem `draft`. Dla `issued` pokazywać "Edytuj" ale z ostrzeżeniem "Edycja wystawionej faktury wymaga jej anulowania lub wystawienia korekty" (korekty out of scope dla MVP – ukryć opcję). Route `/invoices/:id/edit` ładuje dane faktury do formularza. Ten sam komponent formularza co dla new, ale w trybie edit (pre-fill danych). Zapisanie nadpisuje istniejący dokument.

# Pytania i rekomendacje UI - Część 6 (051-060)

## Pytanie 51

**Jak obsłużyć wyświetlanie błędów formularza - inline vs podsumowanie?**

### Rekomendacja ✅

Podejście hybrydowe: 1) Błędy inline pod każdym polem (mat-error w mat-form-field) dla kontekstu, 2) Przy próbie submit z błędami: scroll do pierwszego błędu + focus na pole. Bez zbiorczego podsumowania błędów na górze (zbyt złożone dla MVP). Błędy pokazywać po touched/blur, nie w trakcie pisania. Komunikaty błędów po polsku, konkretne (nie "pole wymagane" ale "Podaj nazwę firmy").

---

## Pytanie 52

**Jak zaprojektować stronę 404 i obsługę nieistniejących zasobów?**

### Rekomendacja ✅

Globalna strona 404 dla nieistniejących route'ów: przyjazna grafika, tekst "Strona nie istnieje", przycisk "Wróć do strony głównej". Dla nieistniejących zasobów (np. `/invoices/9999`): API zwraca 404, UI przekierowuje do listy z snackbar "Faktura nie została znaleziona". Analogicznie dla kontrahentów. Route wildcard `**` na końcu routingu kieruje do `NotFoundComponent`.

---

## Pytanie 53

**Jak obsłużyć limity i walidację długości pól tekstowych?**

### Rekomendacja ✅

Limity zgodne z API/bazą danych: nazwa firmy (255), adres (500), NIP (10), IBAN (28), nazwa pozycji faktury (255), uwagi (1000). Dla dłuższych pól (uwagi, adres) pokazywać licznik znaków "450/1000". Walidacja maxlength na inputach. Przy przekroczeniu pokazywać błąd, nie obcinać tekstu. W bazie używać odpowiednich typów VARCHAR.

---

## Pytanie 54

**Jak zaprojektować interakcję usuwania faktur?**

### Rekomendacja ✅

Przycisk "Usuń" w menu kontekstowym na liście i w widoku szczegółów. Usuwanie możliwe tylko dla drafts (soft restriction w UI). Dialog potwierdzenia: "Czy na pewno chcesz usunąć fakturę [numer]? Tej operacji nie można cofnąć." Opcje: "Anuluj", "Usuń". Po usunięciu: przekierowanie do listy z snackbar "Faktura usunięta". Dla issued/paid: "Usuń" ukryte, dostępne tylko "Anuluj" (zmiana statusu na cancelled).

---

## Pytanie 55

**Jak zaimplementować wyszukiwanie full-text na liście faktur?**

### Rekomendacja ✅

Input wyszukiwania nad tabelą z ikoną lupy. Debounce 300ms przed wysłaniem query. Wyszukiwanie server-side przez API (parametr `search`). Przeszukiwane pola: numer faktury, nazwa kontrahenta. Wyniki podświetlać w tabeli (highlight matching text) – opcjonalnie, może być w v2. Przy braku wyników: "Brak faktur pasujących do wyszukiwania" z przyciskiem "Wyczyść". Wyszukiwanie kombinowane z filtrami.

---

## Pytanie 56

**Jak obsłużyć scenariusz gdy kontrahent przypisany do faktury zostanie usunięty?**

### Rekomendacja ✅

Backend powinien: 1) Soft-delete kontrahenta (flaga deleted), 2) Zachować dane kontrahenta w fakturach (snapshot przy tworzeniu faktury). UI: Przy próbie usunięcia kontrahenta z fakturami pokazać ostrzeżenie "Ten kontrahent ma X faktur. Czy na pewno usunąć?". Usunięty kontrahent znika z listy i autocomplete, ale faktury zachowują jego dane. Na fakturze wyświetlać dane historyczne.

---

## Pytanie 57

**Jak zaprojektować komponent wyboru jednostki miary dla pozycji faktury?**

### Rekomendacja ✅

`mat-select` z predefiniowaną listą jednostek: szt. (sztuki), godz. (godziny), dni, kg, m, m², m³, km, l, kpl. (komplet), usł. (usługa). Możliwość wpisania własnej jednostki (mat-select z opcją custom input lub combobox). Domyślna jednostka: "szt.". Jednostka przechowywana jako string w bazie. W przyszłości: zarządzanie własnymi jednostkami w ustawieniach.

---

## Pytanie 58

**Jak obsłużyć równoległe sesje użytkownika na wielu urządzeniach?**

### Rekomendacja ✅

Dla MVP: pozwolić na równoległe sesje bez synchronizacji. Każde urządzenie ma własny token. Przy wylogowaniu invalidować tylko bieżący token (nie wszystkie). Konflikt danych: last-write-wins (brak optimistic locking). W przyszłości: opcja "Wyloguj ze wszystkich urządzeń" w profilu, notyfikacja o aktywnych sesjach. Supabase obsługuje multi-session out of the box.

---

## Pytanie 59

**Jak zaprojektować loading state dla operacji zapisywania?**

### Rekomendacja ✅

Przycisk "Zapisz": przy kliknięciu zmienia się na disabled z spinnerem i tekstem "Zapisywanie...". Formularz readonly podczas zapisywania (wszystkie inputy disabled). Przy błędzie: przywrócenie stanu edycji z komunikatem błędu. Przy sukcesie: snackbar + przekierowanie lub aktualizacja UI. Dla długich operacji (>3s) pokazać progress indicator. Zapobiegać double-submit przez disabled state.

---

## Pytanie 60

**Jak zaimplementować breadcrumbs dla nawigacji głębokiej?**

### ❌ POMINIĘTE

Prosta nawigacja aplikacji MVP nie wymaga breadcrumbsów. Struktura jest płaska: Lista → Szczegóły/Edycja. Przycisk "Wstecz" wystarczy do nawigacji.

# Pytania i rekomendacje UI - Część 7 (061-070)

## Pytanie 61

**Jak obsłużyć pola adresowe – jedno pole textarea czy osobne pola?**

### Rekomendacja ✅

Osobne pola dla lepszej walidacji i formatowania: ulica + numer, kod pocztowy, miasto. Dla MVP tylko adresy polskie (bez wyboru kraju). Kod pocztowy z walidacją formatu XX-XXX. Pola połączone w jedną linię adresu przy wyświetlaniu: "ul. Przykładowa 1, 00-001 Warszawa". W formularzu sekcja "Adres" z trzema polami. Dla kontrahentów: ta sama struktura.

---

## Pytanie 62

**Jak zaprojektować zachowanie aplikacji przy bardzo wolnym połączeniu?**

### Rekomendacja ✅

Timeout dla żądań API: 30s, po czym pokazać błąd "Przekroczono czas oczekiwania". Dla kluczowych operacji (zapis faktury): retry z exponential backoff (1s, 2s, 4s) – max 3 próby. Pokazywać progress indicator dla operacji >1s. Nie pokazywać timeout warning przedwcześnie. Dla pobrania listy: skeleton loading bez timeout warning. Użyć HTTP Interceptor dla globalnej obsługi timeout.

---

## Pytanie 63

**Jak obsłużyć przeliczanie sum faktury (netto, VAT, brutto) w czasie rzeczywistym?**

### Rekomendacja ✅

Przeliczanie przy każdej zmianie wartości w pozycjach (ilość, cena, stawka VAT). Użyć computed signals dla sum. Logika: wartość_netto = ilość × cena_netto, wartość_VAT = wartość_netto × stawka%, wartość_brutto = netto + VAT. Suma faktury: agregacja per stawka VAT + totale. Zaokrąglanie: do 2 miejsc po przecinku, matematyczne. Wyświetlać sumy w sticky footer formularza.

---

## Pytanie 64

**Jak zaprojektować ekran rejestracji z walidacją w czasie rzeczywistym?**

### Rekomendacja ✅

Pola: email (walidacja formatu), hasło (min 8 znaków, 1 cyfra, 1 wielka litera, 1 mała – pokazywać checklistę wymagań live), potwierdzenie hasła (walidacja zgodności), checkbox akceptacji regulaminu. Przycisk "Zarejestruj się" aktywny gdy wszystko valid. Po submit: loading state, obsługa błędu "email już istnieje". Sukces: przekierowanie do strony "Sprawdź swoją skrzynkę email".

---

## Pytanie 65

**Jak obsłużyć wybór daty w formularzach – native input vs custom datepicker?**

### Rekomendacja ✅

Użyć `mat-datepicker` z Angular Material dla spójności UI. Konfiguracja: polska lokalizacja, format `dd.MM.yyyy`, tydzień zaczyna się od poniedziałku, min/max daty gdzie potrzebne (np. data wystawienia nie z przyszłości dla issued). Dla urządzeń mobilnych mat-datepicker automatycznie używa natywnego pickera systemu. Możliwość ręcznego wpisania daty z walidacją formatu.

---

## Pytanie 66

**Jak zaprojektować historię zmian faktury (audit log) - na przyszłość?**

### Rekomendacja ✅

Dla MVP nie implementować audit log w UI. Backend może logować zmiany, ale bez wyświetlania użytkownikowi. Przygotować miejsce w widoku szczegółów faktury na przyszły panel "Historia zmian" (ukryty). W przyszłości: timeline pokazujący kto, kiedy i co zmienił. Na teraz wystarczy pole `updated_at` pokazujące "Ostatnia modyfikacja: [data]".

---

## Pytanie 67

**Jak obsłużyć scrollowanie w długich formularzach?**

### Rekomendacja ✅

Sticky header z tytułem strony i przyciskami akcji (Zapisz, Anuluj). Formularz scrollowalny w main area. Sticky footer z podsumowaniem faktury (sumy). Przy błędach walidacji: auto-scroll do pierwszego błędnego pola z smooth behavior. Na mobile: floating action button (FAB) dla głównej akcji (Zapisz). Sekcje formularza collapsible (mat-expansion-panel) dla lepszej organizacji.

---

## Pytanie 68

**Jak zaimplementować obsługę concurrent updates (optimistic locking)?**

### Rekomendacja ✅ (Zmodyfikowana)

Dla MVP: używać Resource API / `httpResource()` do pobierania danych (GET requests), tradycyjny HttpClient dla mutacji (POST/PUT/DELETE). Przy konflikcie wersji (409 Conflict) pokazywać dialog "Faktura została zmodyfikowana przez innego użytkownika. Odśwież dane przed zapisaniem." z opcjami "Odśwież" (pobiera nową wersję) lub "Nadpisz" (force save). Przechowywać `updated_at` i wysyłać w żądaniach update.

---

## Pytanie 69

**Jak zaprojektować akcje masowe na liście faktur (bulk actions)?**

### Rekomendacja ✅

Dla MVP: bez bulk actions. Pojedyncze akcje per faktura w menu kontekstowym. Checkboxy selekcji do dodania w przyszłości. Przygotować UI: checkbox w headerze tabeli (ukryty), toolbar z bulk actions (ukryty). W przyszłości: "Eksportuj zaznaczone do PDF", "Zmień status zaznaczonych", "Usuń zaznaczone drafty". Priorytet: funkcjonalność pojedynczych operacji.

---

## Pytanie 70

**Jak obsłużyć wyświetlanie kwoty słownie na fakturze?**

### Rekomendacja ✅

Stworzyć pure function `amountToWords(amount: number, currency: 'PLN'): string` konwertującą kwotę na słowa po polsku. Przykład: 1234.56 → "jeden tysiąc dwieście trzydzieści cztery złote 56/100". Uwzględnić odmianę (złoty/złote/złotych). Użyć biblioteki (np. `n2words` z polskim locale) lub własnej implementacji. Wyświetlać pod sumą brutto w widoku szczegółów i na PDF.

# Pytania i rekomendacje UI - Część 8 (071-080)

## Pytanie 71

**Jak zaprojektować obsługę przycisku "Wstecz" przeglądarki?**

### Rekomendacja ✅

Respektować natywną nawigację przeglądarki. Przy unsaved changes: CanDeactivate guard pokazuje dialog również przy back button. History state: każda zmiana widoku to osobny wpis w historii (standard Angular Router). Filtry na listach zapisywać w URL (queryParams) – back przywraca poprzednie filtry. Nie używać `replaceUrl` bez powodu. Po zapisie faktury: redirect z `replaceUrl: true` żeby back nie wracał do formularza.

---

## Pytanie 72

**Jak obsłużyć puste wartości i null w formularzach i wyświetlaniu?**

### Rekomendacja ✅

Formularze: puste stringi dla opcjonalnych pól tekstowych, null dla dat i selectów. Przy wyświetlaniu: puste pola pokazywać jako "–" lub "Nie podano". Dla NIP/IBAN kontrahenta: opcjonalne, wyświetlać gdy wypełnione. Przy wysyłaniu do API: normalizować puste stringi do null gdzie API tego oczekuje. Używać nullish coalescing (`??`) do fallbacków w templates.

---

## Pytanie 73

**Jak zaprojektować tooltip'y i help text'y dla skomplikowanych pól?**

### Rekomendacja ✅

Użyć `mat-hint` pod polami dla stałych podpowiedzi (np. format NIP: "10 cyfr bez kresek"). Użyć `matTooltip` na ikonkach `help_outline` obok labeli dla dłuższych wyjaśnień. Tooltips: delay 300ms, pozycja above/below zależnie od miejsca. Dla formatu numeru faktury: rozbudowany tooltip z opisem placeholderów. Help text'y po polsku, zwięzłe, pomocne. Nie przesadzać z ilością – tylko gdzie naprawdę potrzebne.

---

## Pytanie 74

**Jak obsłużyć przypadek duplikatu NIP kontrahenta?**

### Rekomendacja ✅

Przy zapisie kontrahenta backend sprawdza unikalność NIP (jeśli podany). Błąd 400 z kodem `NIP_EXISTS`. Frontend mapuje na błąd pola NIP: "Kontrahent z tym NIP już istnieje". Link do istniejącego kontrahenta: "Zobacz istniejącego kontrahenta" (opcjonalnie). Przy tworzeniu faktury z nowym kontrahentem: ten sam flow. Pozwolić na pustego NIP (dla kontrahentów zagranicznych/osób fizycznych).

---

## Pytanie 75

**Jak zaprojektować widok mobilny listy faktur?**

### Rekomendacja ✅

Mobile (<768px): lista jako karty zamiast tabeli. Każda karta: numer faktury (bold), nazwa kontrahenta, kwota brutto, status (badge kolorowy), data wystawienia. Swipe actions: swipe left → menu akcji (Edytuj, Usuń, PDF). Sortowanie: select na górze. Filtrowanie: rozwijany panel. Infinite scroll lub pagination z przyciskiem "Załaduj więcej". FAB "+" do tworzenia nowej faktury. Pull-to-refresh.

---

## Pytanie 76

**Jak obsłużyć różne formaty wklejanych danych (NIP, IBAN)?**

### Rekomendacja ✅

Akceptować różne formaty wejściowe i normalizować: NIP: "123-456-78-90", "123 456 78 90", "1234567890" → przechowywać jako "1234567890". IBAN: "PL12 3456 7890..." lub "PL12345678901234567890123456" → przechowywać bez spacji. Normalizacja przy paste i blur. Wyświetlanie sformatowane (NIP: XXX-XXX-XX-XX, IBAN: co 4 znaki spacja). Directive `normalizeInput` dla tych pól.

---

## Pytanie 77

**Jak zaprojektować obsługę klawiatury i accessibility dla formularzy?**

### Rekomendacja ✅

Tab order logiczny (top-to-bottom, left-to-right). Enter w inputach przechodzi do następnego pola (nie submituje formularza przedwcześnie). Enter/Space na przyciskach aktywuje akcję. Escape zamyka modale/dropdowny. Shortcut Ctrl+S dla zapisania (preventDefault default browser action). ARIA labels dla wszystkich interaktywnych elementów. Focus visible styles. Screen reader friendly error messages.

---

## Pytanie 78

**Jak obsłużyć placeholder'y i przykładowe wartości w formularzach?**

### Rekomendacja ✅

Używać placeholderów dla wskazania formatu: NIP: "0000000000", IBAN: "PL00 0000 0000 0000 0000 0000 0000", email: "jan@firma.pl", telefon: "+48 123 456 789". Dla pól bez wyraźnego formatu: nie używać placeholderów (label wystarczy). Placeholder w kolorze jasnym (mat-form-field default). Uwagi na fakturze: placeholder z przykładem "np. Dziękujemy za współpracę".

---

## Pytanie 79

**Jak zaprojektować przejścia i animacje między widokami?**

### Rekomendacja ✅

Minimalistyczne animacje dla lepszego UX bez przesady. Route transitions: subtle fade (150ms). List item enter: staggered fade-in. Modal open/close: scale + fade (Angular Material default). Skeleton loading: pulse animation. Button loading: spinner rotation. Używać Angular animations (`@angular/animations`) lub CSS transitions. Respektować `prefers-reduced-motion` media query. Nie animować dużych list (performance).

---

## Pytanie 80

**Jak obsłużyć timeout przy generowaniu PDF?**

### Rekomendacja ✅

Generowanie PDF w Web Worker (pdfmake) – nie blokuje UI. Progress indicator "Generowanie PDF..." podczas pracy workera. Timeout: 30s, po czym error "Nie udało się wygenerować PDF. Spróbuj ponownie." Przy błędzie: możliwość retry. Dla bardzo dużych faktur (>100 pozycji – unlikely w MVP): chunking lub uproszczenie. Cache wygenerowanego PDF blob na czas sesji widoku szczegółów (opcjonalnie).

# Pytania i rekomendacje UI - Część 9 (081-090)

## Pytanie 81

**Jak zaprojektować semantyczną strukturę HTML dla SEO i accessibility?**

### Rekomendacja ✅

Landing page (publiczna): semantic HTML (header, main, footer, nav, article, section), meta tags (title, description), Open Graph tags. Aplikacja (po zalogowaniu): głównie accessibility focus – proper heading hierarchy (h1-h6), landmarks (main, nav, aside), ARIA gdzie potrzebne, alt text dla obrazów, proper form labels. SPA nie wymaga SSR dla MVP. Lighthouse accessibility score target: >90.

---

## Pytanie 82

**Jak obsłużyć wylogowanie i czyszczenie stanu aplikacji?**

### Rekomendacja ✅

Przy wylogowaniu: 1) Wywołać Supabase signOut, 2) Wyczyścić wszystkie Stores (UserStore, ContractorsStore, InvoiceFormStore), 3) Usunąć tokeny z storage, 4) Przekierować do `/auth/login`, 5) Wyczyścić sensitive data z pamięci. Przycisk "Wyloguj" w sidebar menu z potwierdzeniem tylko jeśli są niezapisane zmiany. Po wylogowaniu: snackbar "Zostałeś wylogowany".

---

## Pytanie 83

**Jak zaprojektować strukturę SCSS/CSS dla aplikacji?**

### Rekomendacja ✅

Struktura: `styles/` folder z: `_variables.scss` (kolory, spacing, breakpoints), `_mixins.scss` (responsive, typography), `_reset.scss` (normalize), `_typography.scss`, `_utilities.scss` (helper classes). Angular Material theming w `theme.scss`. Komponenty: scoped styles (ViewEncapsulation.Emulated default). BEM naming dla custom classes. CSS custom properties dla runtime theming. Unikać deep nesting (max 3 levels).

---

## Pytanie 84

**Jak obsłużyć przypadek edycji faktury w trakcie gdy inna osoba ją edytuje?**

### Rekomendacja ✅

Dla MVP (single user): problem nie występuje. Dla wieloosobowego dostępu (future): optimistic locking z `updated_at`. Przy otwarciu edycji: zapisać timestamp. Przy zapisie: porównać z bieżącym `updated_at` w bazie. Konflikt: dialog "Faktura została zmodyfikowana. Odśwież i wprowadź zmiany ponownie." Brak real-time lockingu (zbyt złożone dla MVP). Dokumentacja scenariusza na przyszłość.

---

## Pytanie 85

**Jak zaprojektować komunikaty potwierdzające akcje użytkownika?**

### Rekomendacja ✅

Destrukcyjne akcje (usuń, anuluj fakturę): zawsze dialog potwierdzenia z jasnym opisem konsekwencji. Nieodwracalne akcje: czerwony przycisk "Usuń", tekst "Tej operacji nie można cofnąć". Pozytywne akcje (zapisz, wystaw): bez potwierdzenia, ale feedback po wykonaniu (snackbar). Zmiana statusu faktury: potwierdzenie z opisem co się zmieni. Przyciski: "Anuluj" (secondary), "Potwierdź/Usuń" (primary/danger).

---

## Pytanie 86

**Jak obsłużyć pierwszą wizytę użytkownika po zalogowaniu?**

### Rekomendacja ✅

Przy pierwszym logowaniu (profil pusty): przekierować do `/profile` z welcome message "Witaj! Zanim wystawisz pierwszą fakturę, uzupełnij dane swojej firmy." Highlight wymaganych pól. Po zapisaniu profilu: przekierować do `/invoices` z empty state i CTA "Dodaj pierwszą fakturę". Zapisać `isFirstLogin` flag w Supabase user metadata lub localStorage.

---

## Pytanie 87

**Jak zaprojektować responsywne breakpointy spójne z Angular Material?**

### Rekomendacja ✅

Użyć breakpointów Angular CDK Layout: xs (<600px), sm (600-959px), md (960-1279px), lg (1280-1919px), xl (≥1920px). Dla prostoty MVP: mobile (<768px), tablet (768-1024px), desktop (>1024px). Użyć `BreakpointObserver` do reaktywnego wykrywania w komponentach. SCSS mixins: `@include media-mobile {}`, `@include media-tablet {}`, `@include media-desktop {}`. Grid system: CSS Grid lub Flexbox, nie dedykowanego frameworka.

---

## Pytanie 88

**Jak obsłużyć input masking dla NIP i IBAN?**

### ❌ POMINIĘTE

Input masking nie jest wymagany dla MVP. Normalizacja przy paste i formatowanie przy wyświetlaniu wystarczy. Maski mogą być frustrujące dla użytkowników przy edycji.

---

## Pytanie 89

**Jak zaprojektować obsługę wielu walut (przyszły rozwój)?**

### Rekomendacja ✅

MVP: tylko PLN, hardcoded. Przygotować strukturę na przyszłość: pole `currency` w fakturze (default 'PLN'), formatowanie przez pipe z parametrem waluty, osobna konfiguracja dla kwoty słownie per waluta. Nie implementować teraz. Na UI: brak wyboru waluty. Wszystkie kwoty wyświetlane jako "X PLN". W przyszłości: EUR, USD, wybór waluty per faktura.

---

## Pytanie 90

**Jak obsłużyć duplikację pozycji w obrębie faktury?**

### Rekomendacja ✅

Przycisk "Duplikuj" (ikona copy) obok każdej pozycji w tabeli. Kliknięcie: dodaje nowy wiersz bezpośrednio pod bieżącym z tymi samymi danymi. Użytkownik może edytować zduplikowaną pozycję. Alternatywnie: dodawanie wielu identycznych pozycji przez zwiększenie ilości (ale to inna semantyka). Focus na nowo dodanym wierszu. Przyda się dla powtarzalnych usług z różnymi cenami/datami.

# Pytania i rekomendacje UI - Część 10 (091-100)

## Pytanie 91

**Jak zaprojektować wyświetlanie dat względnych vs absolutnych?**

### Rekomendacja ✅

Na listach (faktury, kontrahenci): daty absolutne w formacie `dd.MM.yyyy` dla jednoznaczności. Dla "ostatnio modyfikowane": można użyć względnych ("2 godziny temu", "wczoraj") z tooltip pokazującym pełną datę przy hover. Terminy płatności: zawsze absolutne + informacja o dniach do/po terminie ("za 5 dni" / "3 dni po terminie"). Użyć biblioteki date-fns lub własnego pipe dla formatowania.

---

## Pytanie 92

**Jak obsłużyć focus management po akcjach (dodanie, usunięcie)?**

### Rekomendacja ✅

Po dodaniu pozycji faktury: focus na pierwszym polu nowego wiersza (nazwa). Po usunięciu pozycji: focus na wierszu powyżej lub poniżej. Po zamknięciu modalu: focus wraca na element który otworzył modal. Po błędzie walidacji: focus na pierwszym błędnym polu. Po zapisaniu: jeśli pozostajemy na stronie – focus na pierwszym polu lub neutral state. Używać `#elementRef` i `ViewChild` dla programowego focusu.

---

## Pytanie 93

**Jak zaprojektować wyświetlanie liczby wyników i informacji o paginacji?**

### Rekomendacja ✅

Nad lub pod tabelą: "Wyświetlanie X-Y z Z faktur". Paginator Angular Material z opcjami: 10, 25, 50 per strona. Pokazywać total count z API (`x-total-count` header lub w response body). Przy filtrowaniu: aktualizować count. Przy pustej liście: "Brak faktur" (nie "Wyświetlanie 0-0 z 0"). Na mobile: uproszczona paginacja (tylko prev/next) lub infinite scroll.

---

## Pytanie 94

**Jak obsłużyć scenariusz gdy sesja wygaśnie podczas wypełniania formularza?**

### Rekomendacja ✅

HTTP Interceptor przechwytuje 401. Najpierw próba refresh tokena. Jeśli refresh się nie powiedzie: modal "Twoja sesja wygasła. Zaloguj się ponownie." z informacją że dane formularza zostaną zachowane w pamięci podręcznej (localStorage). Po ponownym zalogowaniu: przekierować do tego samego URL z zachowanym stanem formularza. Implementacja: serialize form state przed przekierowaniem, deserialize po powrocie.

---

## Pytanie 95

**Jak zaprojektować obsługę błędów serwera (500, 502, 503)?**

### ❌ POMINIĘTE

Błędy 5xx obsługiwane globalnie przez HTTP interceptor z prostym snackbar "Wystąpił błąd serwera. Spróbuj ponownie później." Bez dedykowanych ekranów maintenance dla MVP.

---

## Pytanie 96

**Jak obsłużyć long press / right click dla menu kontekstowego na mobile?**

### Rekomendacja ✅

Desktop: right-click otwiera `mat-menu` z akcjami (Edytuj, Duplikuj, Usuń, PDF). Mobile: 3-kropki icon button na każdej karcie/wierszu otwiera ten sam menu. Long-press: nie implementować (nieintuicyjne, problemy z scrollem). Alternatywnie na mobile: swipe actions dla głównych akcji (iOS style) – ale mat-menu simpler dla MVP. Akcje w menu dostosowane do statusu faktury.

---

## Pytanie 97

**Jak zaprojektować empty states dla różnych scenariuszy?**

### Rekomendacja ✅

Dedykowane empty states: 1) Pusta lista faktur (nowy user): ilustracja + "Nie masz jeszcze faktur" + CTA "Dodaj pierwszą fakturę", 2) Pusta lista po filtrowaniu: "Brak wyników dla wybranych filtrów" + "Wyczyść filtry", 3) Puści kontrahenci: "Dodaj kontrahentów lub utwórz ich podczas wystawiania faktury", 4) Brak wyników wyszukiwania: "Nie znaleziono faktur dla [query]". Każdy z odpowiednią grafiką/ikoną.

---

## Pytanie 98

**Jak obsłużyć kopiowanie do schowka (np. numer konta, NIP)?**

### Rekomendacja ✅

Ikona "copy" obok NIP, IBAN w profilu i widoku szczegółów. Kliknięcie kopiuje do schowka (Clipboard API). Feedback: snackbar "Skopiowano do schowka" lub zmiana ikony na checkmark na 2s. Fallback dla starych przeglądarek: select tekst + prompt "Ctrl+C aby skopiować". Na widoku faktury: kopiowanie numeru faktury jednym kliknięciem.

---

## Pytanie 99

**Jak zaprojektować podsumowanie akcji w snackbarach?**

### Rekomendacja ✅

Snackbar content: krótki, konkretny, z opcją akcji gdzie sensowne. Przykłady: "Faktura zapisana" (prosta info), "Faktura usunięta" + akcja "Cofnij" (jeśli soft delete – nie dla MVP), "Błąd zapisywania – Spróbuj ponownie" + akcja "Retry", "Profil zaktualizowany". Czas wyświetlania: 3s dla sukcesu, 5s dla błędów z akcją. Jeden snackbar na raz (Material default). Kolor tła zależny od typu.

---

## Pytanie 100

**Jak obsłużyć drukowanie faktury bezpośrednio z przeglądarki?**

### Rekomendacja ✅

Główna ścieżka: "Pobierz PDF" → użytkownik drukuje z PDF readera (lepsza kontrola, standard). Alternatywnie: przycisk "Drukuj" otwierający PDF w nowej karcie z auto-print dialog (`window.print()`). Nie implementować osobnego widoku print-friendly HTML (duplikacja logiki layoutu). CSS `@media print` dla podstawowego formatowania jeśli user próbuje drukować stronę szczegółów bezpośrednio.

# Pytania i rekomendacje UI - Część 11 (101-110)

## Pytanie 101

**Jak zaprojektować porządek tabulacji w skomplikowanych formularzach?**

### Rekomendacja ✅

Logiczny flow top-to-bottom, left-to-right. Sekcja danych nabywcy → sekcja pozycji → podsumowanie → akcje. W tabeli pozycji: tab przechodzi przez wszystkie pola wiersza, potem do następnego wiersza. Skip dla elementów readonly/computed (wartości VAT, brutto). Explicit `tabindex` tylko gdzie potrzebne. Testować z klawiaturą. Przycisk "Dodaj pozycję" dostępny z klawiatury. Focus trap w modalach.

---

## Pytanie 102

**Jak obsłużyć wyświetlanie długich nazw (kontrahent, pozycja faktury)?**

### Rekomendacja ✅

W tabelach: text truncation z `text-overflow: ellipsis` po N znakach (np. 50), pełna nazwa w tooltip przy hover. W widoku szczegółów: pełna nazwa, word-wrap. W selectach/autocomplete: truncation z tooltip. Minimum width dla kolumn żeby zawsze coś było widoczne. Na mobile: większe limity znaków (cała szerokość). CSS class `.truncate` dla reużywalności.

---

## Pytanie 103

**Jak zaprojektować feedback wizualny dla akcji hover/active?**

### Rekomendacja ✅

Hover states: podświetlenie wierszy tabeli (subtle background), zmiana koloru/cienia przycisków (Material defaults), kursor pointer na clickable elements. Active/pressed: darker shade, scale down subtle (0.98). Focus visible: outline dla accessibility (nie usuwać!). Disabled: opacity 0.5, cursor not-allowed. Transitions: 150-200ms dla smooth feel. Konsystencja z Angular Material.

---

## Pytanie 104

**Jak obsłużyć przypadki graniczne kalkulacji (bardzo duże liczby, precyzja)?**

### Rekomendacja ✅

Używać JavaScript Number (IEEE 754 double) – wystarczające dla kwot faktur. Zaokrąglanie: do 2 miejsc po przecinku przy każdej operacji, metoda half-up (matematyczna). Max wartość pozycji: nie ograniczać sztucznie (Number.MAX_SAFE_INTEGER wystarczy). Dla bardzo dużych kwot: formatowanie z separatorami tysięcy. Walidacja po stronie API jako ostateczna weryfikacja. Testy dla edge cases: 0.01, 999999.99, grosze.

---

## Pytanie 105

**Jak zaprojektować widok szczegółów kontrahenta?**

### Rekomendacja ✅

Strona `/contractors/:id` (lub modal – prostsze): Dane kontrahenta (nazwa, NIP, adres, email, telefon) + sekcja "Faktury tego kontrahenta" (lista ostatnich faktur z linkami). Przyciski: "Edytuj", "Usuń" (jeśli brak faktur), "Dodaj fakturę dla tego kontrahenta" (pre-fill). Dla MVP: może być prosty modal zamiast osobnej strony. Statystyki (łączna wartość faktur) w przyszłości.

---

## Pytanie 106

**Jak obsłużyć autofill przeglądarki w formularzach?**

### Rekomendacja ✅

Pozwolić na autofill gdzie sensowne: email, telefon w profilu. Dla pól specyficznych (NIP, IBAN): `autocomplete="off"` aby uniknąć niepoprawnych wartości. Dla nowej faktury: nie używać autofill (dane różne per faktura). Style autofill: dostosować background-color jeśli przeglądarka zmienia (Chrome yellow). Testować z różnymi przeglądarkami. Dla hasła: `autocomplete="current-password"` / `"new-password"`.

---

## Pytanie 107

**Jak zaprojektować obsługę różnych statusów kontrahenta?**

### Rekomendacja ✅

Dla MVP: kontrahent aktywny lub usunięty (soft delete). Brak statusów typu "archived", "inactive". Usunięty kontrahent: nie pojawia się w autocomplete przy tworzeniu faktury, historyczne faktury zachowują dane. W przyszłości: statusy "aktywny/nieaktywny" bez usuwania, filtrowanie po statusie na liście. Na teraz: simple is better.

---

## Pytanie 108

**Jak obsłużyć współdzielenie URL do konkretnej faktury?**

### Rekomendacja ✅

URL `/invoices/:id` powinien działać jako deep link. Wymagana autentykacja – niezalogowany user przekierowany do `/auth/login?returnUrl=/invoices/123`. Po zalogowaniu: przekierowanie do oryginalnego URL. Sharing URL: kopiowanie z paska adresu lub dedykowany przycisk "Kopiuj link" w widoku szczegółów. Brak publicznych linków do faktur (zawsze wymaga auth). UUID jako ID dla bezpieczeństwa.

---

## Pytanie 109

**Jak zaprojektować mechanizm auto-save dla formularzy (przyszły rozwój)?**

### Rekomendacja ✅

Dla MVP: brak auto-save (explicit save tylko). W przyszłości: debounced auto-save co 30s dla drafts, wskaźnik "Zapisano automatycznie o [czas]", conflict detection przy manualnym save. LocalStorage backup form state przy browser crash (już zaplanowane dla session timeout). Dla issued faktur: brak auto-save (wymaga świadomej akcji). Kompleksowa funkcjonalność na post-MVP.

---

## Pytanie 110

**Jak obsłużyć różne timezone'y użytkowników?**

### Rekomendacja ✅

MVP dla polskiego rynku: assume timezone Europe/Warsaw. Daty w bazie: UTC (ISO 8601). Wyświetlanie: konwersja do lokalnego timezone (browser). Dla dat bez czasu (data wystawienia, termin płatności): przechowywać jako date string `YYYY-MM-DD`, nie datetime – unikając problemów z timezone. JavaScript Date operations: używać date-fns z timezone support lub Intl API. Serwer: UTC always.

# Pytania i rekomendacje UI - Część 12 (111-115)

## Pytanie 111

**Jak zaprojektować obsługę preferencji użytkownika (per-user settings)?**

### Rekomendacja ✅

Przechowywać w profilu użytkownika (tabela user_profiles): domyślny termin płatności, format numeru faktury, domyślne uwagi na fakturze. Ładować przy starcie aplikacji do UserStore. W formularzu faktury: pre-fill z defaults. W ustawieniach profilu: sekcja "Domyślne ustawienia faktur". Brak per-device settings (wszystko w bazie). W przyszłości: więcej preferencji (sortowanie list, widok tabeli/karty).

---

## Pytanie 112

**Jak obsłużyć przypadek zablokowanych cookies/localStorage?**

### ❌ POMINIĘTE

Edge case który nie będzie obsługiwany w MVP. Aplikacja wymaga cookies/localStorage do działania. Jeśli zablokowane – basic auth nie zadziała (Supabase wymaga). Nie implementować fallbacków.

---

## Pytanie 113

**Jak zaprojektować mechanizm retry dla nieudanych operacji?**

### Rekomendacja ✅

Automatyczny retry: tylko dla GET requests (idempotent), max 3 próby z exponential backoff, silent retry bez informowania użytkownika. Manual retry: dla mutacji (POST/PUT/DELETE) – przy błędzie pokazać snackbar z przyciskiem "Spróbuj ponownie". Nie retry'ować przy 400/401/403/404 (błędy klienta). Retry dla 500/502/503/timeout. HTTP Interceptor implementuje logikę. Dla PDF generation: manual retry button.

---

## Pytanie 114

**Jak obsłużyć export danych użytkownika (RODO)?**

### Rekomendacja ✅

Dla MVP: podstawowe wsparcie RODO. W profilu sekcja "Twoje dane" z opcjami: "Pobierz moje dane" (eksport JSON wszystkich danych użytkownika), "Usuń konto" (z potwierdzeniem i informacją o konsekwencjach). Eksport generowany na żądanie przez API. Usunięcie konta: soft delete z 30-dniowym okresem grace. Link do polityki prywatności w footer/profilu.

---

## Pytanie 115

**Jak zaprojektować końcową architekturę folderów dla aplikacji Angular?**

### Rekomendacja ✅

```
src/app/
├── core/                    # Singleton services, guards, interceptors
│   ├── auth/
│   │   ├── auth.guard.ts
│   │   ├── auth.service.ts
│   │   └── auth.interceptor.ts
│   ├── services/
│   │   ├── notification.service.ts
│   │   └── pdf.service.ts
│   └── stores/
│       ├── user.store.ts
│       └── contractors.store.ts
├── shared/                  # Reusable components, pipes, directives
│   ├── components/
│   │   ├── page-header/
│   │   ├── empty-state/
│   │   ├── confirm-dialog/
│   │   └── status-badge/
│   ├── pipes/
│   │   ├── currency-pl.pipe.ts
│   │   └── amount-words.pipe.ts
│   ├── directives/
│   │   └── normalize-input.directive.ts
│   └── validators/
│       ├── nip.validator.ts
│       └── iban.validator.ts
├── features/                # Feature modules (lazy loaded)
│   ├── auth/
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── invoices/
│   │   ├── invoice-list/
│   │   ├── invoice-details/
│   │   ├── invoice-form/
│   │   └── services/
│   │       └── invoices.service.ts
│   ├── contractors/
│   │   ├── contractor-list/
│   │   ├── contractor-form/
│   │   └── services/
│   │       └── contractors.service.ts
│   ├── profile/
│   │   └── profile-form/
│   └── landing/
│       └── landing-page/
├── layout/                  # App shell components
│   ├── sidebar/
│   ├── header/
│   └── main-layout/
└── app.routes.ts
```

Każdy komponent jako standalone. Lazy loading per feature. Core importowany raz w app.config. Shared importowany gdzie potrzebny.
