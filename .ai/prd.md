# Dokument wymagań produktu (PRD) - Fakturologia

## 1. Przegląd produktu

Fakturologia to webowa aplikacja do wystawiania faktur VAT w formacie PDF, skierowana do freelancerów i mikroprzedsiębiorców działających na polskim rynku. Aplikacja umożliwia szybkie tworzenie, edycję i zarządzanie fakturami w prosty i intuicyjny sposób.

Główne założenia techniczne:

- Struktura kodu: Nx Monorepo (współdzielenie typów między frontendem a backendem)
- Frontend: Angular 21 + Signal Store (logika formularzy, Standalone Components), Angular Material
- Backend: NestJS (logika biznesowa API) + Supabase (Auth, PostgreSQL, Storage, RLS)
- Infrastruktura: Docker + Digital Ocean
- CI/CD: GitHub Actions
- Generowanie PDF: Client-side rendering przy użyciu biblioteki pdfmake (MVP)
- Waluta: wyłącznie PLN

Aplikacja jest darmowym narzędziem MVP, które ma być rozwijane w przyszłości w oparciu o feedback użytkowników.

## 2. Problem użytkownika

Freelancerzy i mikroprzedsiębiorcy często potrzebują prostego narzędzia do wystawiania faktur VAT. Istniejące rozwiązania na rynku są często:

- Zbyt rozbudowane i skomplikowane dla prostych potrzeb
- Płatne lub wymagające subskrypcji
- Wymagające instalacji oprogramowania

Użytkownicy potrzebują:

- Szybkiego sposobu na wystawienie profesjonalnie wyglądającej faktury
- Możliwości zapisania faktury jako PDF do wysłania klientowi
- Przechowywania historii faktur w chmurze
- Autouzupełniania danych stałych kontrahentów
- Prostego oznaczania statusu płatności faktur
- Możliwości personalizacji faktury poprzez własne logo

## 3. Wymagania funkcjonalne

### 3.1 Rejestracja i uwierzytelnianie

- Rejestracja użytkownika za pomocą adresu email i hasła
- Logowanie za pomocą adresu email i hasła
- Resetowanie hasła poprzez email
- Wylogowanie użytkownika

### 3.2 Profil użytkownika i dane firmy

- Uzupełnianie danych firmy użytkownika: nazwa firmy, adres, NIP
- Edycja danych firmy w profilu
- Wgrywanie logo firmy do wyświetlania na fakturach
- Walidacja formatu i sumy kontrolnej NIP

### 3.3 Zarządzanie kontrahentami

- Ręczne wprowadzanie danych kontrahenta: nazwa, adres, NIP
- Zapisywanie kontrahentów w bazie danych
- Autouzupełnianie danych kontrahenta podczas tworzenia faktury
- Edycja danych zapisanych kontrahentów
- Walidacja formatu i sumy kontrolnej NIP kontrahenta

### 3.4 Tworzenie i edycja faktur

- Formularz tworzenia faktury z polami:
  - Numer faktury (systemowa sugestia z możliwością edycji)
  - Data wystawienia
  - Termin płatności
  - Dane kontrahenta (wybór z listy lub nowy)
  - Pozycje faktury (wiele pozycji):
    - Nazwa usługi/towaru
    - Ilość jednostek
    - Cena netto za jednostkę
    - Stawka VAT (z predefiniowanej listy)
    - Automatyczne przeliczanie kwoty brutto
  - Uwagi dodatkowe
- Automatyczne sumowanie wartości netto, VAT i brutto
- Możliwość zapisania faktury jako szkic (bez pełnej walidacji)
- Blokada generowania PDF dla faktur z niekompletnymi danymi
- Edycja istniejących faktur
- Duplikowanie faktur

### 3.5 Lista faktur

- Wyświetlanie listy faktur według kolejności utworzenia
- Oznaczanie statusu płatności: Opłacona/Nieopłacona
- Filtrowanie i sortowanie faktur
- Podgląd szczegółów faktury

### 3.6 Generowanie PDF

- Generowanie faktury w formacie PDF po stronie klienta (pdfmake)
- Prosty, stały szablon z możliwością wyświetlenia logo
- Pobieranie wygenerowanego PDF na dysk

### 3.7 Landing Page

- Prosta strona wizytówka prezentująca aplikację
- Linki do rejestracji i logowania
- Linki zewnętrzne do regulaminu i polityki prywatności

### 3.8 Obsługa błędów

- Obsługa błędów poprzez mailto: (kontakt z supportem)

### 3.9 Bezpieczeństwo

- Row Level Security (RLS) w bazie danych
- Separacja danych użytkowników
- Bezpieczne przechowywanie danych w chmurze

## 4. Granice produktu

### W zakresie MVP:

- Rejestracja i logowanie email/hasło
- Jedno konto = jedna firma użytkownika
- Obsługa wyłącznie waluty PLN
- Obsługa wyłącznie polskiego formatu faktur VAT
- Generowanie PDF po stronie klienta
- Prosty, stały szablon faktury
- Walidacja formatu NIP (bez integracji z GUS)
- Proste statusy płatności (Opłacona/Nieopłacona)
- Podstawowa analityka (GA4)

### Poza zakresem MVP:

- Integracja z API GUS do weryfikacji danych firm
- Obsługa wielu firm na jednym koncie
- Obsługa innych walut niż PLN
- Obsługa faktur zaliczkowych, korygujących, proforma
- Automatyczne wysyłanie faktur emailem
- Integracja z systemami księgowymi
- Panel administratora (wykorzystanie panelu Supabase)
- Zaawansowane raportowanie i statystyki
- Aplikacja mobilna
- Eksport danych do formatów innych niż PDF
- Obsługa płatności online
- Wielojęzyczność interfejsu

## 5. Historyjki użytkowników

### US-001: Rejestracja nowego użytkownika

Tytuł: Rejestracja konta w aplikacji

Opis: Jako nowy użytkownik chcę założyć konto w aplikacji, aby móc korzystać z funkcji wystawiania faktur.

Kryteria akceptacji:

- Użytkownik może wprowadzić adres email i hasło
- System waliduje poprawność formatu adresu email
- System wymaga hasła o minimalnej długości 8 znaków
- Po pomyślnej rejestracji użytkownik otrzymuje email weryfikacyjny
- Użytkownik nie może się zalogować bez weryfikacji adresu email
- System wyświetla komunikat o błędzie gdy email jest już zarejestrowany

### US-002: Logowanie użytkownika

Tytuł: Logowanie do aplikacji

Opis: Jako zarejestrowany użytkownik chcę się zalogować do aplikacji, aby uzyskać dostęp do moich faktur.

Kryteria akceptacji:

- Użytkownik może wprowadzić email i hasło
- Po poprawnym logowaniu użytkownik jest przekierowany do panelu głównego
- System wyświetla komunikat o błędzie przy niepoprawnych danych logowania
- System blokuje konto po 5 nieudanych próbach logowania na 15 minut

### US-003: Wylogowanie użytkownika

Tytuł: Wylogowanie z aplikacji

Opis: Jako zalogowany użytkownik chcę się wylogować z aplikacji, aby zabezpieczyć dostęp do moich danych.

Kryteria akceptacji:

- Użytkownik może kliknąć przycisk wylogowania
- Po wylogowaniu użytkownik jest przekierowany na stronę logowania
- Sesja użytkownika jest zakończona po wylogowaniu
- Użytkownik nie ma dostępu do chronionych zasobów po wylogowaniu

### US-004: Resetowanie hasła

Tytuł: Odzyskiwanie dostępu do konta

Opis: Jako użytkownik, który zapomniał hasła, chcę je zresetować, aby odzyskać dostęp do konta.

Kryteria akceptacji:

- Użytkownik może podać adres email na stronie resetowania hasła
- System wysyła email z linkiem do resetowania hasła
- Link do resetowania hasła jest ważny przez 24 godziny
- Użytkownik może ustawić nowe hasło po kliknięciu w link
- System potwierdza pomyślną zmianę hasła

### US-005: Uzupełnianie danych firmy

Tytuł: Konfiguracja danych firmy użytkownika

Opis: Jako nowy użytkownik chcę uzupełnić dane mojej firmy, aby pojawiały się na wystawianych fakturach.

Kryteria akceptacji:

- Użytkownik może wprowadzić nazwę firmy, adres i NIP
- System waliduje format i sumę kontrolną NIP
- System wyświetla komunikat o błędzie przy niepoprawnym NIP
- Dane firmy są zapisywane w profilu użytkownika
- Użytkownik jest informowany o konieczności uzupełnienia danych przed wystawieniem pierwszej faktury

### US-006: Edycja danych firmy

Tytuł: Aktualizacja danych firmy

Opis: Jako użytkownik chcę edytować dane mojej firmy, aby faktury zawierały aktualne informacje.

Kryteria akceptacji:

- Użytkownik może edytować wszystkie pola danych firmy
- System waliduje zmienione dane (w tym NIP)
- Zmiany są zapisywane po zatwierdzeniu
- Nowe dane są używane na fakturach tworzonych po zapisaniu zmian

### US-007: Wgrywanie logo firmy

Tytuł: Dodanie logo do faktur

Opis: Jako użytkownik chcę wgrać logo mojej firmy, aby faktury wyglądały profesjonalnie.

Kryteria akceptacji:

- Użytkownik może wgrać plik graficzny (PNG, JPG) jako logo
- System akceptuje pliki o maksymalnym rozmiarze 2MB
- Logo jest wyświetlane w podglądzie po wgraniu
- Logo pojawia się na wszystkich generowanych fakturach PDF
- Użytkownik może usunąć lub zmienić wgrane logo

### US-008: Dodawanie nowego kontrahenta

Tytuł: Utworzenie kontrahenta w bazie

Opis: Jako użytkownik chcę dodać nowego kontrahenta do bazy, aby móc szybko wybierać go przy tworzeniu faktur.

Kryteria akceptacji:

- Użytkownik może wprowadzić nazwę, adres i NIP kontrahenta
- System waliduje format i sumę kontrolną NIP
- Kontrahent jest zapisywany w bazie użytkownika
- Zapisany kontrahent jest dostępny w liście wyboru podczas tworzenia faktury

### US-009: Autouzupełnianie danych kontrahenta

Tytuł: Szybki wybór kontrahenta z bazy

Opis: Jako użytkownik chcę szybko wybrać kontrahenta z listy, aby nie wpisywać jego danych ponownie.

Kryteria akceptacji:

- Podczas tworzenia faktury użytkownik widzi pole z autouzupełnianiem
- Po wpisaniu fragmentu nazwy system sugeruje pasujących kontrahentów
- Po wybraniu kontrahenta jego dane są automatycznie wypełniane w formularzu
- Użytkownik może edytować dane kontrahenta dla konkretnej faktury bez zmiany danych w bazie

### US-010: Edycja danych kontrahenta

Tytuł: Aktualizacja danych kontrahenta w bazie

Opis: Jako użytkownik chcę edytować dane zapisanego kontrahenta, aby mieć zawsze aktualne informacje.

Kryteria akceptacji:

- Użytkownik może wybrać kontrahenta z listy do edycji
- Użytkownik może zmienić wszystkie pola danych kontrahenta
- System waliduje zmieniony NIP
- Zmiany są zapisywane po zatwierdzeniu

### US-011: Tworzenie nowej faktury

Tytuł: Wystawienie nowej faktury

Opis: Jako użytkownik chcę utworzyć nową fakturę, aby udokumentować sprzedaż usługi lub towaru.

Kryteria akceptacji:

- Użytkownik może utworzyć nową fakturę z poziomu panelu głównego
- System sugeruje kolejny numer faktury
- Użytkownik może edytować sugerowany numer faktury
- Formularz zawiera wszystkie wymagane pola: data wystawienia, termin płatności, dane kontrahenta, pozycje faktury
- Użytkownik może dodać wiele pozycji do faktury
- System automatycznie przelicza kwoty brutto na podstawie netto i stawki VAT
- System automatycznie sumuje wartości wszystkich pozycji

### US-012: Dodawanie pozycji do faktury

Tytuł: Dodanie pozycji towarowej/usługowej

Opis: Jako użytkownik chcę dodać pozycje do faktury, aby określić co sprzedaję i za ile.

Kryteria akceptacji:

- Użytkownik może dodać pozycję z nazwą, ilością, ceną netto i stawką VAT
- Stawka VAT jest wybierana z predefiniowanej listy (23%, 8%, 5%, 0%, zw.)
- System automatycznie oblicza kwotę brutto pozycji
- Użytkownik może dodać wiele pozycji do jednej faktury
- Użytkownik może usunąć pozycję z faktury

### US-013: Dodawanie uwag do faktury

Tytuł: Wprowadzenie dodatkowych uwag

Opis: Jako użytkownik chcę dodać uwagi do faktury, aby przekazać dodatkowe informacje kontrahentowi.

Kryteria akceptacji:

- Użytkownik może wprowadzić tekst w polu uwagi
- Pole uwagi jest opcjonalne
- Uwagi są wyświetlane na wygenerowanym PDF

### US-014: Zapisywanie faktury jako szkic

Tytuł: Zapisanie niekompletnej faktury

Opis: Jako użytkownik chcę zapisać niekompletną fakturę, aby dokończyć ją później.

Kryteria akceptacji:

- Użytkownik może zapisać fakturę bez wypełnienia wszystkich wymaganych pól
- Faktura ze statusem szkicu jest widoczna na liście faktur
- Szkic faktury może być edytowany
- Szkic faktury nie może być eksportowany do PDF

### US-015: Edycja istniejącej faktury

Tytuł: Modyfikacja zapisanej faktury

Opis: Jako użytkownik chcę edytować istniejącą fakturę, aby poprawić błędy lub zaktualizować dane.

Kryteria akceptacji:

- Użytkownik może wybrać fakturę do edycji z listy
- Wszystkie pola faktury są edytowalne
- Zmiany są zapisywane po zatwierdzeniu
- System informuje o niezapisanych zmianach przy próbie opuszczenia formularza

### US-016: Duplikowanie faktury

Tytuł: Utworzenie kopii istniejącej faktury

Opis: Jako użytkownik chcę zduplikować istniejącą fakturę, aby szybko wystawić podobną dla tego samego klienta.

Kryteria akceptacji:

- Użytkownik może zduplikować dowolną fakturę z listy
- Duplikat zawiera wszystkie dane oryginalnej faktury
- System automatycznie nadaje nowy numer duplikatowi
- Data wystawienia jest ustawiana na bieżącą datę
- Duplikat otwiera się w trybie edycji

### US-017: Wyświetlanie listy faktur

Tytuł: Przeglądanie historii faktur

Opis: Jako użytkownik chcę zobaczyć listę moich faktur, aby mieć przegląd wystawionych dokumentów.

Kryteria akceptacji:

- Użytkownik widzi listę wszystkich swoich faktur
- Lista jest domyślnie posortowana od najnowszej do najstarszej
- Każda pozycja zawiera: numer faktury, datę, kontrahenta, kwotę, status płatności
- Użytkownik może zmienić sortowanie listy

### US-018: Oznaczanie statusu płatności

Tytuł: Zmiana statusu opłacenia faktury

Opis: Jako użytkownik chcę oznaczyć fakturę jako opłaconą lub nieopłaconą, aby śledzić przepływy pieniężne.

Kryteria akceptacji:

- Użytkownik może zmienić status faktury na Opłacona lub Nieopłacona
- Status jest widoczny na liście faktur
- Zmiana statusu jest zapisywana natychmiast
- Status jest oznaczony wizualnie (np. kolorem)

### US-019: Generowanie PDF faktury

Tytuł: Eksport faktury do formatu PDF

Opis: Jako użytkownik chcę wygenerować fakturę jako PDF, aby wysłać ją klientowi.

Kryteria akceptacji:

- Użytkownik może wygenerować PDF dla kompletnej faktury
- PDF zawiera wszystkie dane faktury oraz logo (jeśli wgrane)
- PDF jest generowany w przeglądarce użytkownika
- System blokuje generowanie PDF dla faktur z niekompletnymi danymi
- System wyświetla komunikat informujący o brakujących danych

### US-020: Pobieranie PDF na dysk

Tytuł: Zapisanie faktury PDF na komputerze

Opis: Jako użytkownik chcę pobrać wygenerowany PDF na dysk, aby go przechować lub przesłać.

Kryteria akceptacji:

- Po wygenerowaniu PDF użytkownik może go pobrać
- Plik jest pobierany z nazwą zawierającą numer faktury
- Pobieranie działa w popularnych przeglądarkach (Chrome, Firefox, Safari, Edge)

### US-021: Podgląd szczegółów faktury

Tytuł: Wyświetlenie szczegółów faktury

Opis: Jako użytkownik chcę zobaczyć szczegóły faktury, aby sprawdzić jej zawartość bez edycji.

Kryteria akceptacji:

- Użytkownik może otworzyć podgląd dowolnej faktury z listy
- Podgląd wyświetla wszystkie dane faktury w trybie tylko do odczytu
- Z podglądu użytkownik może przejść do edycji lub generowania PDF

### US-022: Przeglądanie Landing Page

Tytuł: Zapoznanie się z aplikacją przed rejestracją

Opis: Jako potencjalny użytkownik chcę zobaczyć stronę prezentującą aplikację, aby zdecydować czy się zarejestrować.

Kryteria akceptacji:

- Strona główna prezentuje główne funkcje aplikacji
- Strona zawiera przyciski do rejestracji i logowania
- Strona zawiera linki do regulaminu i polityki prywatności
- Strona jest responsywna i działa na urządzeniach mobilnych

### US-023: Dostęp do regulaminu

Tytuł: Zapoznanie się z regulaminem usługi

Opis: Jako użytkownik chcę przeczytać regulamin, aby znać warunki korzystania z usługi.

Kryteria akceptacji:

- Link do regulaminu jest dostępny na landing page i przy rejestracji
- Regulamin otwiera się w nowym oknie/zakładce
- Treść regulaminu jest czytelna

### US-024: Dostęp do polityki prywatności

Tytuł: Zapoznanie się z polityką prywatności

Opis: Jako użytkownik chcę przeczytać politykę prywatności, aby wiedzieć jak przetwarzane są moje dane.

Kryteria akceptacji:

- Link do polityki prywatności jest dostępny na landing page i przy rejestracji
- Polityka prywatności otwiera się w nowym oknie/zakładce
- Treść polityki prywatności jest czytelna

### US-025: Zgłaszanie błędów

Tytuł: Kontakt z supportem w przypadku problemów

Opis: Jako użytkownik chcę zgłosić napotkany błąd, aby uzyskać pomoc w rozwiązaniu problemu.

Kryteria akceptacji:

- Użytkownik może kliknąć link kontaktowy w przypadku błędu
- Kliknięcie otwiera klienta pocztowego z predefiniowanym adresem email
- Temat wiadomości zawiera informację o zgłoszeniu błędu

### US-026: Ochrona danych użytkownika

Tytuł: Separacja danych między użytkownikami

Opis: Jako użytkownik chcę mieć pewność, że moje dane są bezpieczne i niedostępne dla innych użytkowników.

Kryteria akceptacji:

- Użytkownik widzi tylko swoje faktury i kontrahentów
- Brak możliwości dostępu do danych innych użytkowników przez manipulację URL lub API
- Row Level Security (RLS) jest aktywne dla wszystkich tabel z danymi użytkowników

### US-027: Walidacja NIP podczas wprowadzania

Tytuł: Sprawdzenie poprawności numeru NIP

Opis: Jako użytkownik chcę otrzymać informację o błędnym NIP, aby uniknąć pomyłek na fakturze.

Kryteria akceptacji:

- System sprawdza format NIP (10 cyfr)
- System weryfikuje sumę kontrolną NIP
- System wyświetla komunikat o błędzie przy niepoprawnym NIP
- Walidacja działa dla NIP firmy użytkownika i kontrahentów

### US-028: Automatyczna numeracja faktur

Tytuł: Sugestia kolejnego numeru faktury

Opis: Jako użytkownik chcę otrzymać sugestię numeru faktury, aby zachować ciągłość numeracji.

Kryteria akceptacji:

- System automatycznie sugeruje kolejny numer faktury
- Numer bazuje na ostatniej wystawionej fakturze
- Użytkownik może edytować sugerowany numer
- System pozwala na konfigurację formatu serii numeracji

### US-029: Automatyczne obliczanie kwot

Tytuł: Przeliczanie wartości brutto

Opis: Jako użytkownik chcę aby system automatycznie obliczał kwoty, aby uniknąć błędów rachunkowych.

Kryteria akceptacji:

- System automatycznie oblicza kwotę brutto z netto i stawki VAT
- System automatycznie sumuje wartości wszystkich pozycji
- Obliczenia są aktualizowane w czasie rzeczywistym podczas edycji
- System wyświetla podsumowanie: suma netto, suma VAT, suma brutto

### US-030: Responsywność interfejsu

Tytuł: Korzystanie z aplikacji na różnych urządzeniach

Opis: Jako użytkownik chcę korzystać z aplikacji na komputerze i tablecie, aby mieć elastyczny dostęp.

Kryteria akceptacji:

- Interfejs dostosowuje się do szerokości ekranu
- Wszystkie funkcje są dostępne na ekranach od 768px szerokości
- Nawigacja jest intuicyjna na urządzeniach dotykowych
- Formularze są użyteczne na mniejszych ekranach

## 6. Metryki sukcesu

### Metryki techniczne

- Ukończone wdrożenie CI/CD z GitHub Actions
- Stabilne działanie aplikacji na Digital Ocean (uptime > 99%)
- Czas ładowania strony głównej < 3 sekundy
- Czas generowania PDF < 5 sekund

### Metryki użytkowe

- Skuteczne przejście procesu "Rejestracja -> Uzupełnienie danych firmy -> Utworzenie pierwszej faktury -> Pobranie PDF" bez błędów krytycznych
- Współczynnik ukończenia rejestracji > 70%
- Współczynnik ukończenia pierwszej faktury po rejestracji > 50%

### Metryki analityczne (GA4)

- Liczba zarejestrowanych użytkowników
- Liczba aktywnych użytkowników miesięcznie (MAU)
- Liczba wygenerowanych dokumentów PDF
- Średnia liczba faktur na użytkownika
- Współczynnik retencji użytkowników (powroty do aplikacji)

### Metryki jakościowe

- Brak krytycznych błędów blokujących wystawianie faktur
- Pozytywny feedback użytkowników w zgłoszeniach mailowych
- Czas odpowiedzi na zgłoszenia błędów < 48 godzin

## 7. Wymagania Techniczne i Architektura

### 7.1 Szczegółowy Stack Technologiczny

- **Repozytorium:** Nx Monorepo
  - Umożliwia trzymanie kodu Frontend (Angular) i Backend (NestJS) w jednym miejscu.
  - Ułatwia współdzielenie interfejsów (DTO) i typów, co zapewnia spójność danych.
- **Frontend:** Angular 21 + Signal Store
  - **Signal Store:** Idealny do obsługi złożonych zależności w formularzu faktury (automatyczne przeliczanie: zmiana netto -> aktualizacja VAT -> aktualizacja brutto). Sygnały zapewniają wydajność i czytelność logiki matematycznej.
  - **Komponenty:** Standalone Components dla uproszczenia architektury.
- **Backend:** NestJS + Supabase
  - **NestJS:** Pełni rolę warstwy logiki biznesowej API. Odpowiada za walidację, przetwarzanie danych przed zapisem i logikę, której nie chcemy trzymać na froncie (bezpieczeństwo, spójność).
  - **Supabase:** Wykorzystywane jako baza danych (PostgreSQL) oraz system uwierzytelniania (Auth). NestJS komunikuje się z Supabase, a klient (Frontend) w autoryzowanych przypadkach może korzystać z dobrodziejstw RLS (Row Level Security).
- **Infrastruktura:**
  - Docker: Konteneryzacja aplikacji (Backend NestJS + serwowanie Frontendu).
  - Digital Ocean: Platforma hostingowa (standard przemysłowy).

### 7.2 Główne Trudności (Critical Path)

- **Generowanie PDF:**
  - Jest to potencjalnie czasochłonny element ("czarna dziura").
  - **Decyzja:** W MVP zaczynamy od prostego rozwiązania: `pdfmake` (generowanie po stronie klienta z definicji JSON).
  - Unikamy generowania z HTML przez "headless chrome" na tym etapie, aby nie komplikować obrazów Dockera i nie zwiększać zasobożerności.
- **Matematyka finansowa:**
  - Kluczowe jest poprawne zaokrąglanie kwot (do 2 miejsc po przecinku) na każdym etapie obliczeń.
  - Konieczność obsługi problemów "groszowych" przy sumowaniu pozycji (czy sumujemy netto i liczymy VAT od sumy, czy sumujemy VAT z pozycji). Przyjęto standardowe podejście zgodne z przepisami (zazwyczaj suma VAT z pozycji lub od sumy netto - do doprecyzowania w implementacji, ale spójnie w całym systemie).
