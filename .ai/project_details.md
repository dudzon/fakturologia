<conversation_summary>
<decisions>

1. **Model obliczeń:** Automatyczne przeliczanie kwot brutto na podstawie ceny netto i wybranej stawki VAT.
2. **Numeracja:** Systemowa sugestia kolejnego numeru z możliwością edycji formatu serii.
3. **Baza kontrahentów:** Ręczne wprowadzanie danych bez integracji z GUS, z mechanizmem zapamiętywania i autouzupełniania klientów.
4. **Struktura faktury:** Obsługa wielu pozycji na fakturze; sztywna lista stawek VAT; dodatkowe pole na uwagi.
5. **Obsługa firm:** Jedno konto = jedna firma użytkownika. Dane firmy edytowalne w profilu, brak obsługi wielu firm na jednym koncie w MVP.
6. **Technologia:** Angular 21 (z wykorzystaniem Signals i Standalone Components), Angular Material.
7. **Backend i Baza:** Supabase (Auth, Database, Storage, RLS).
8. **Infrastruktura:** Docker + Digital Ocean; CI/CD oparte o GitHub Actions.
9. **Generowanie PDF:** Rendering po stronie klienta (Client-side) przy użyciu biblioteki `pdfmake`; prosty, stały szablon z możliwością wgrania logo.
10. **Walidacja:** Weryfikacja formatu i sumy kontrolnej NIP; brak blokady zapisu "szkiców", ale blokada generowania PDF dla niekompletnych danych.
11. **Funkcje dodatkowe:** Proste oznaczanie statusu płatności (Opłacona/Nieopłacona), duplikowanie faktur, waluta tylko PLN.
12. **Start projektu:** Prosty Landing Page (wizytówka), regulaminy w formie linków zewnętrznych, obsługa błędów przez `mailto:`.
    </decisions>

<matched_recommendations>

1. **Rezygnacja z integracji GUS:** Skupienie się na walidacji formatu NIP zamiast kosztownej integracji z zewnętrznym API w fazie MVP.
2. **Uproszczenie modelu podatkowego:** Obsługa wyłącznie PLN i liczenie od kwot netto w celu uniknięcia komplikacji zaokrągleń i różnic kursowych.
3. **Architektura Frontend:** Wybór lekkiej architektury opartej na Serwisach i Sygnałach zamiast wdrażania pełnego wzorca Redux (NgRx).
4. **Brak Backoffice:** Wykorzystanie wbudowanego panelu Supabase do zarządzania użytkownikami zamiast budowania dedykowanego panelu administratora.
5. **Generowanie PDF Client-side:** Przeniesienie ciężaru generowania dokumentów na przeglądarkę użytkownika w celu odciążenia serwera i uproszczenia infrastruktury.
6. **Zarządzanie bezpieczeństwem danych:** Wdrożenie Row Level Security (RLS) w bazie danych jako głównego mechanizmu separacji danych użytkowników.
7. **Strategia wdrożenia:** Wykorzystanie prostych narzędzi analitycznych (GA4) i domyślnych mechanizmów mailowych Supabase w pierwszej fazie projektu.
   </matched_recommendations>

<prd_planning_summary>
Opracowano kompletny plan dla MVP aplikacji "Fakturologia", która ma służyć jako proste, darmowe narzędzie dla freelancerów i mikroprzedsiębiorców do wystawiania faktur VAT.

**a. Główne wymagania funkcjonalne:**
Aplikacja umożliwi rejestrację i logowanie (Email/Hasło). Użytkownik po zalogowaniu uzupełni dane swojej firmy i będzie mógł tworzyć faktury, dodając kontrahentów (z autouzupełnianiem) oraz pozycje towarowe/usługowe. System automatycznie przeliczy podatki VAT i sumy. Użytkownik będzie mógł zarządzać listą faktur (sortowanie, statusy płatności, duplikowanie) oraz generować pliki PDF do pobrania. Całość danych będzie bezpiecznie przechowywana w chmurze.

**b. Kluczowe historie użytkownika (User Stories):**

- _Jako freelancer chcę szybko wystawić fakturę dla stałego klienta, aby nie wpisywać jego danych ponownie (wykorzystanie autouzupełniania i duplikowania)._
- _Jako nowy użytkownik chcę łatwo skonfigurować swoje dane i wgrać logo, aby moje faktury wyglądały profesjonalnie._
- _Jako przedsiębiorca chcę mieć dostęp do historii moich faktur z oznaczeniem, które zostały już opłacone, aby panować nad przepływami pieniężnymi._

**c. Kryteria sukcesu i miary:**

- **Techniczne:** Poprawne wdrożenie CI/CD i stabilne działanie na Digital Ocean.
- **Użytkowe:** Skuteczne przejście procesu "Rejestracja -> Pierwsza Faktura -> Pobranie PDF" bez błędów krytycznych.
- **Analityczne:** Liczba aktywnych użytkowników (Active Users) i liczba wygenerowanych dokumentów PDF (śledzone przez GA4).

**d. Obszary do dalszego wyjaśnienia:**
Proces deweloperski jest jasno zdefiniowany. Jedyne kwestie operacyjne to przygotowanie treści prawnych (Regulamin, Polityka Prywatności) przed publicznym uruchomieniem.
</prd_planning_summary>

<unresolved_issues>
Brak istotnych nierozwiązanych kwestii technicznych lub produktowych na tym etapie. Wszystkie kluczowe decyzje dla MVP zostały podjęte. Jedynym zadaniem "pozatechnicznym" pozostaje przygotowanie treści dokumentów prawnych (Regulamin/RODO) do podlinkowania w procesie rejestracji.
</unresolved_issues>
</conversation_summary>
