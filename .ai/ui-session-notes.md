# Notatki z sesji planowania architektury UI - Fakturologia MVP

Data sesji: 4 stycznia 2026

---

## Decyzje podjęte podczas sesji

1. **Hierarchia nawigacji**: Płaska struktura z bocznym menu (sidenav) dla zalogowanych użytkowników, zawierająca: Lista faktur (domyślny widok), Kontrahenci, Profil firmy. Hamburger menu na mobile.

2. **Formularz faktury**: Osobny, dedykowany widok pełnoekranowy (`/invoices/new`, `/invoices/:id/edit`) zamiast modalu.

3. **Onboarding**: Przekierowanie z blokadą - użytkownik bez wypełnionego profilu firmy automatycznie przekierowywany do `/profile` z komunikatem.

4. **Stan formularza faktury**: Angular Reactive Forms z FormArray dla pozycji, Angular Signals dla reaktywnych obliczeń (totalNet, totalVat, totalGross).

5. **Autouzupełnianie kontrahenta**: `mat-autocomplete` z wyszukiwaniem po nazwie i NIP, opcja dodania nowego kontrahenta inline.

6. **Statusy faktur**: Wizualne rozróżnienie kolorowymi badge'ami (szary=draft, pomarańczowy=unpaid, zielony=paid), quick filters nad listą.

7. **Obsługa błędów**: Globalny serwis `ErrorHandlerService`, błędy inline pod polami, snackbar dla błędów biznesowych, interceptor dla błędów serwera.

8. **Paginacja**: Serwerowa paginacja z `mat-paginator`, parametry w URL dla bookmarkowania.

9. **Generowanie PDF**: Web Worker z pdfmake, loader podczas generowania, walidacja kompletności przed generowaniem.

10. **Landing Page**: Oddzielny publiczny widok z Hero section, sekcją korzyści, CTA "Zarejestruj się za darmo".

11. **Routing**: Standalone components z lazy loading przez `loadComponent`, bez NgModules.

12. **Autentykacja**: HTTP Interceptor dla tokenów JWT, automatyczny refresh, idle timeout 30 min.

13. **Widok szczegółów faktury**: Read-only z przyciskami akcji (Edytuj, Duplikuj, Generuj PDF, Zmień status).

14. **Offline/Auto-save**: ❌ POMINIĘTE - nie będzie implementowane w MVP.

15. **Dark mode**: ❌ POMINIĘTE - nie będzie implementowane w MVP.

16. **Breadcrumbs**: ❌ POMINIĘTE - prosta nawigacja nie wymaga breadcrumbsów.

17. **Input masking**: ❌ POMINIĘTE - normalizacja i formatowanie wystarczą.

18. **Testy**: Vitest zamiast Karma/Jasmine, minimum 70% coverage dla logiki biznesowej.

19. **Walidacja NIP/IBAN**: Niestandardowe walidatory Angular z pełną walidacją formatu i sumy kontrolnej.

20. **Formatowanie kwot**: Polska lokalizacja (`pl-PL`), format `1 234,56 PLN`.

21. **Formatowanie dat**: Format `dd.MM.yyyy`, tydzień od poniedziałku.

22. **Stawki VAT**: 23%, 8%, 5%, 0%, "zw" (zwolniony), "np" (nie podlega).

23. **Cache**: Profil w UserStore, kontrahenci w ContractorsStore z TTL 5 min, faktury zawsze świeże.

24. **Responsywność**: Mobile-first z breakpointami Angular Material (xs, sm, md, lg, xl).

25. **Zapis formularza**: Loading state na przycisku "Zapisywanie...", formularz readonly podczas operacji.

26. **Adresy**: Osobne pola (ulica+numer, kod pocztowy, miasto), tylko adresy polskie.

27. **Usuwanie faktur**: Tylko dla drafts, dialog potwierdzenia, soft delete dla issued/paid (anulowanie).

28. **Eksport danych RODO**: Podstawowe wsparcie - "Pobierz moje dane" i "Usuń konto" w profilu.

29. **Strefa czasowa**: Europe/Warsaw, daty bez czasu jako `YYYY-MM-DD`.

---

## Dopasowane rekomendacje

1. **Struktura nawigacji (Q1)**: Płaski sidenav z Dashboard/Faktury, Kontrahenci, Profil firmy. Top bar z logo, nazwą użytkownika i menu wylogowania.

2. **Formularz faktury jako osobny widok (Q2)**: `/invoices/new` i `/invoices/:id/edit` jako dedykowane strony, nie modale.

3. **Onboarding z blokowaniem (Q3)**: Guard `profileCompleteGuard` sprawdzający kompletność profilu przed tworzeniem faktury.

4. **Signal Store dla formularza (Q4)**: `InvoiceFormStore` z computed signals dla obliczeń, FormArray dla pozycji.

5. **mat-autocomplete dla kontrahentów (Q5)**: Server-side search z debounce, opcja "Dodaj nowego kontrahenta".

6. **Wizualizacja statusów (Q6)**: Kolorowe badge/chip, quick filters, dropdown zmiany statusu.

7. **ErrorHandlerService (Q7)**: Mapowanie kodów błędów API, inline mat-error, snackbar dla błędów biznesowych.

8. **Serwerowa paginacja (Q8)**: `mat-paginator` z parametrami w URL, opcje 10/20/50 per strona.

9. **PDF w Web Worker (Q9)**: pdfmake w osobnym wątku, loader z możliwością anulowania.

10. **Standalone components z lazy loading (Q11)**: Brak NgModules, `loadComponent` w routes.

11. **AuthService z Interceptorem (Q12)**: Tokeny w pamięci/storage, automatyczny refresh, idle timeout.

12. **Read-only widok szczegółów (Q13)**: `/invoices/:id` jako podgląd z przyciskami akcji.

13. **Duplikowanie przez API (Q14)**: `POST /invoices/:id/duplicate`, przekierowanie do edycji nowej faktury.

14. **nipValidator i ibanValidator (Q15, Q23)**: Walidacja formatu i sumy kontrolnej, komunikaty po polsku.

15. **Mobile-first responsywny layout (Q16)**: Dwukolumnowy na desktop, jednokolumnowy na mobile, sticky footer z sumami.

16. **UserStore i ContractorsStore (Q17)**: Signal Stores z cache, invalidacja przy CUD operacjach.

17. **Upload logo (Q19)**: Drag&drop, walidacja typu/rozmiaru, progress bar, podgląd.

18. **CanDeactivateGuard (Q20)**: Dialog przy niezapisanych zmianach, obsługa beforeunload.

19. **InvoiceItemsTableComponent (Q22)**: FormArray, dynamiczne dodawanie/usuwanie, drag&drop dla kolejności.

20. **NotificationService z MatSnackBar (Q25)**: success(), error(), warning(), info(), pozycja responsywna.

21. **Polska lokalizacja dat (Q26)**: DatePipe z 'pl-PL', MAT_DATE_LOCALE, MAT_DATE_FORMATS.

22. **Profil w sekcjach (Q27)**: Dane firmy, kontaktowe, bankowe, logo, ustawienia faktur - expansion panels lub tabs.

23. **applyServerErrors (Q28)**: Mapowanie błędów API na kontrolki formularza.

24. **CurrencyPipe z PLN (Q29)**: Format `1 234,56 PLN`, normalizacja przecinka/kropki.

25. **Kontekstowe wskazówki (Q30)**: Empty states z instrukcjami, tooltips przy pierwszej wizycie.

26. **Textarea dla uwag (Q31)**: Limit 1000 znaków z licznikiem, domyślne uwagi z profilu.

27. **Panel filtrów nad tabelą (Q32)**: Status, daty, kontrahent, wyszukiwanie - zapisywane w URL.

28. **Podgląd przed zapisem (Q33)**: mat-dialog z HTML preview faktury.

29. **Format numeru faktury (Q34)**: Placeholdery {NR}, {MM}, {RRRR}, podgląd przykładu.

30. **Shared components (Q35)**: PageHeader, EmptyState, LoadingSpinner, ConfirmDialog, StatusBadge.

31. **Server-side search dla autocomplete (Q36)**: Debounce 300ms, bez virtualizacji dla MVP.

32. **mat-sidenav responsywny (Q37)**: Stały na desktop, collapsible na tablet, drawer na mobile.

33. **Loading states dwupoziomowe (Q38)**: Route-level skeleton, component-level spinners.

34. **Zmiana statusu z dialogiem (Q39)**: Potwierdzenie z opisem konsekwencji, pole daty dla "paid".

35. **Flow resetowania hasła (Q40)**: Zawsze "jeśli konto istnieje", walidacja siły hasła.

36. **Kompletność profilu przed wystawieniem (Q41)**: Blokada z modalem i listą brakujących pól.

37. **Cache strategy (Q43)**: Profil przy logowaniu, kontrahenci TTL 5 min, faktury zawsze świeże.

38. **Termin płatności (Q44)**: Dni od daty lub konkretna data, highlight przeterminowanych.

39. **Idle timeout 30 min (Q46)**: Modal z odliczaniem, auto-wylogowanie.

40. **Tabela pozycji responsywna (Q47)**: mat-table na desktop, karty na mobile.

41. **Vitest dla testów (Q48)**: Angular testing utilities, 70% coverage dla logiki.

42. **Edycja tylko dla drafts (Q50)**: Issued wymaga anulowania lub korekty (korekty out of scope).

43. **Błędy inline z scroll (Q51)**: mat-error pod polami, scroll do pierwszego błędu.

44. **Strona 404 (Q52)**: NotFoundComponent z przyjazną grafiką i linkiem do strony głównej.

45. **Limity pól (Q53)**: Zgodne z bazą danych, licznik znaków dla dłuższych pól.

46. **Usuwanie z potwierdzeniem (Q54)**: Tylko dla drafts, dialog z ostrzeżeniem.

47. **Server-side search (Q55)**: Debounce, parametr `search` do API.

48. **Snapshot kontrahenta (Q56)**: Soft-delete, dane historyczne zachowane w fakturach.

49. **mat-select dla jednostek (Q57)**: Predefiniowane + możliwość własnej.

50. **Multi-session bez synchronizacji (Q58)**: Last-write-wins, każde urządzenie własny token.

51. **Loading na przycisku Zapisz (Q59)**: Disabled + spinner + "Zapisywanie...", formularz readonly.

52. **Osobne pola adresowe (Q61)**: Ulica, kod pocztowy, miasto - format XX-XXX.

53. **Timeout 30s z retry (Q62)**: Exponential backoff dla GET, manual retry dla mutacji.

54. **Computed signals dla sum (Q63)**: Przeliczanie przy każdej zmianie, zaokrąglanie do 2 miejsc.

55. **Rejestracja z checklistą hasła (Q64)**: Live feedback wymagań, checkbox regulaminu.

56. **mat-datepicker (Q65)**: Polska lokalizacja, format dd.MM.yyyy, od poniedziałku.

57. **Sticky header/footer formularza (Q67)**: Scrollowalny main, collapsible sekcje.

58. **Resource API + HttpClient (Q68)**: httpResource() dla GET, HttpClient dla mutacji.

59. **amountToWords (Q70)**: Pure function, odmiana złotych, biblioteka lub własna implementacja.

60. **Respektowanie back button (Q71)**: CanDeactivate, queryParams dla filtrów, replaceUrl po zapisie.

61. **Nullish coalescing dla pustych wartości (Q72)**: Puste pola jako "–" lub "Nie podano".

62. **mat-hint i matTooltip (Q73)**: Podpowiedzi formatu, help icons dla wyjaśnień.

63. **Duplikat NIP (Q74)**: Błąd pola z linkiem do istniejącego kontrahenta.

64. **Mobile jako karty (Q75)**: Swipe actions, FAB "+", pull-to-refresh.

65. **Normalizacja NIP/IBAN (Q76)**: Akceptacja różnych formatów, przechowywanie bez separatorów.

66. **Accessibility (Q77)**: Tab order, ARIA labels, focus management, shortcuts.

67. **Placeholdery (Q78)**: Wskazanie formatu, jasny kolor, przykłady.

68. **Minimalistyczne animacje (Q79)**: Fade transitions, prefers-reduced-motion.

69. **PDF timeout 30s (Q80)**: Web Worker, manual retry, cache blob.

70. **Semantic HTML (Q81)**: Landmarks, heading hierarchy, ARIA, Lighthouse >90.

71. **Wylogowanie czyści state (Q82)**: Stores, tokeny, redirect do login.

72. **SCSS struktura (Q83)**: \_variables, \_mixins, \_reset, BEM naming, scoped styles.

73. **Komunikaty potwierdzające (Q85)**: Dialog dla destrukcyjnych, snackbar dla pozytywnych.

74. **Welcome flow (Q86)**: Pierwsza wizyta → profil, potem faktury z empty state.

75. **Breakpoints Angular CDK (Q87)**: xs/sm/md/lg/xl, mixins SCSS.

76. **Focus management (Q92)**: Focus na nowym wierszu, powrót po modalu.

77. **Paginacja info (Q93)**: "Wyświetlanie X-Y z Z", total count z API.

78. **Sesja wygasła podczas edycji (Q94)**: Zachowanie stanu w localStorage, przywrócenie po login.

79. **Retry logic (Q113)**: Auto retry dla GET, manual dla mutacji, exponential backoff.

80. **Struktura folderów (Q115)**: core/, shared/, features/, layout/ - standalone components, lazy loading.

---

## Podsumowanie planowania architektury UI

### Główne wymagania dotyczące architektury UI

#### Stack technologiczny

- **Angular 21** ze Standalone Components (bez NgModules)
- **Angular Material 21** jako biblioteka UI
- **Angular Signals** i Signal Stores do zarządzania stanem
- **Resource API / httpResource()** dla GET requests, HttpClient dla mutacji
- **pdfmake** w Web Worker do generowania PDF client-side
- **Vitest** do testów jednostkowych, Playwright do E2E

#### Architektura komponentów

Struktura folderów oparta na feature modules:

- `core/` - singleton services, guards, interceptors, stores
- `shared/` - reusable components, pipes, directives, validators
- `features/` - feature-specific components (auth, invoices, contractors, profile, landing)
- `layout/` - app shell (sidebar, header, main-layout)

### Kluczowe widoki, ekrany i przepływy użytkownika

#### Struktura routingu

```
/                           # Landing Page (publiczny)
├── /auth
│   ├── /login              # Logowanie
│   ├── /register           # Rejestracja
│   ├── /forgot-password    # Reset hasła
│   └── /reset-password     # Ustawienie nowego hasła
├── /invoices               # Lista faktur (chroniony)
│   ├── /new                # Nowa faktura
│   ├── /:id                # Szczegóły faktury (read-only)
│   └── /:id/edit           # Edycja faktury
├── /contractors            # Lista kontrahentów (chroniony)
│   ├── /new                # Nowy kontrahent
│   └── /:id/edit           # Edycja kontrahenta
├── /profile                # Profil firmy (chroniony)
└── /**                     # 404 Not Found
```

#### Guards

- `authGuard` - sprawdza zalogowanie, redirect do `/auth/login`
- `guestGuard` - dla stron auth, redirect do `/invoices` jeśli zalogowany
- `profileCompleteGuard` - blokuje tworzenie faktury bez kompletnego profilu
- `canDeactivateGuard` - ostrzeżenie przy niezapisanych zmianach

#### Główne przepływy

1. **Onboarding**: Rejestracja → weryfikacja email → login → uzupełnienie profilu → pierwsza faktura
2. **Tworzenie faktury**: Lista faktur → Nowa faktura → wybór kontrahenta → pozycje → zapisz/wystaw
3. **Zmiana statusu**: Draft → Issued → Paid (lub Cancelled)
4. **Duplikowanie**: Szczegóły → Duplikuj → Edycja nowej faktury

### Strategia integracji z API i zarządzania stanem

#### Signal Stores

- **UserStore**: profil użytkownika, ładowany przy starcie po zalogowaniu
- **ContractorsStore**: cache listy kontrahentów z TTL 5 min
- **InvoiceFormStore**: stan formularza z computed signals dla obliczeń

#### Komunikacja z API

- **GET requests**: `httpResource()` / Resource API - deklaratywne pobieranie
- **Mutacje (POST/PUT/DELETE)**: tradycyjny `HttpClient`
- **Interceptory**: AuthInterceptor (token), ErrorInterceptor (obsługa błędów), LoadingInterceptor

#### Cache strategy

- Profil: cache w UserStore, refresh przy logowaniu i edycji
- Kontrahenci: cache z TTL 5 min, invalidacja przy CUD
- Faktury: zawsze świeże dane z API

### Kwestie responsywności, dostępności i bezpieczeństwa

#### Responsywność

- **Mobile-first** z breakpointami Angular CDK
- Desktop (>1024px): sidenav stały, dwukolumnowy layout formularzy
- Tablet (768-1024px): sidenav collapsible, jednokolumnowy layout
- Mobile (<768px): hamburger menu, karty zamiast tabel, FAB dla akcji

#### Dostępność (a11y)

- Semantic HTML z landmarks (main, nav, aside)
- ARIA labels dla interaktywnych elementów
- Tab order logiczny, focus management
- Focus visible styles
- Screen reader friendly error messages
- Lighthouse accessibility target: >90

#### Bezpieczeństwo

- JWT tokeny: accessToken w pamięci, refreshToken w localStorage
- Automatyczny refresh tokena przy 401
- Idle timeout 30 min z ostrzeżeniem
- Czyszczenie stanu przy wylogowaniu
- UUID jako ID faktur dla bezpieczeństwa URL
- Row Level Security po stronie Supabase

### Komponenty UI

#### Shared Components

- `EmptyStateComponent` - puste listy z CTA
- `LoadingSpinnerComponent` - loading states
- `ConfirmDialogComponent` - dialog potwierdzenia
- `StatusBadgeComponent` - badge statusu faktury
- `ContractorSelectComponent` - autocomplete kontrahenta
- `InvoicePrintPreviewComponent` - podgląd faktury

#### Walidatory

- `nipValidator` - format 10 cyfr + suma kontrolna
- `ibanValidator` - format IBAN + MOD-97
- `invoiceNumberFormatValidator` - wymaga {NNN} placeholder

#### Serwisy

- `NotificationService` - success/error/warning/info via MatSnackBar
- `ConfirmDialogService` - dialogi potwierdzenia
- `PdfGeneratorService` - pdfmake w Web Worker
- `AmountToWordsService` - kwota słownie po polsku

### Decyzje pominięte w MVP

- ❌ Offline mode / auto-save
- ❌ Dark mode
- ❌ Breadcrumbs (płaska nawigacja wystarczy)
- ❌ Input masking (normalizacja wystarczy)
- ❌ Bulk actions na listach
- ❌ Import danych
- ❌ Powiadomienia in-app
- ❌ Audit log w UI
- ❌ Obsługa zablokowanych cookies

---

## Nierozwiązane kwestie

1. **Dokładna implementacja Web Worker dla PDF**: Szczegóły komunikacji między głównym wątkiem a workerem, handling bardzo dużych faktur.

2. **Optimistic locking**: Podstawowa implementacja z `updated_at` zaplanowana, ale szczegóły conflict resolution przy równoczesnej edycji wymagają doprecyzowania.

3. **Limity znaków**: Dokładne wartości limitów dla wszystkich pól powinny być zsynchronizowane z schematem bazy danych.

4. **Export RODO**: Format i zakres eksportowanych danych wymaga doprecyzowania zgodnie z RODO.

5. **Korekty faktur**: Oznaczone jako "out of scope" dla MVP, ale edycja issued faktur jest ograniczona - wymaga przemyślenia flow anulowania.

6. **Storybook**: Wspomniana dokumentacja komponentów w Storybook - do ustalenia czy będzie implementowana w MVP.

7. **Retry strategy**: Konkretne wartości timeout i ilość prób dla różnych operacji wymagają testów.

8. **Przechowywanie stanu formularza przy wygaśnięciu sesji**: Mechanizm serializacji/deserializacji wymaga implementacji.
