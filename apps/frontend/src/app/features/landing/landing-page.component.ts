import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

/**
 * Feature item for the features section
 */
interface Feature {
  icon: string;
  title: string;
  description: string;
}

/**
 * LandingPageComponent - Public homepage for Fakturologia.
 *
 * Displays:
 * - Hero section with main CTA
 * - Features/benefits section
 * - Footer with legal links
 */
@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  template: `
    <div class="landing">
      <!-- Header -->
      <header class="landing__header">
        <div class="landing__header-content">
          <a routerLink="/" class="landing__logo">
            <span class="landing__logo-icon">📄</span>
            <span class="landing__logo-text">Fakturologia</span>
          </a>
          <nav class="landing__nav">
            <a routerLink="/auth/login" mat-button class="landing__nav-link">
              Zaloguj się
            </a>
            <a routerLink="/auth/register" mat-raised-button color="primary" class="landing__nav-cta">
              Zarejestruj się
            </a>
          </nav>
        </div>
      </header>

      <!-- Hero Section -->
      <section class="landing__hero">
        <div class="landing__hero-content">
          <h1 class="landing__hero-title">
            Proste fakturowanie<br>dla freelancerów
          </h1>
          <p class="landing__hero-subtitle">
            Wystawiaj profesjonalne faktury VAT w kilka sekund.
            Bez zbędnych funkcji, bez komplikacji.
          </p>
          <div class="landing__hero-actions">
            <a routerLink="/auth/register" mat-raised-button color="primary" class="landing__hero-cta">
              Zarejestruj się za darmo
              <mat-icon>arrow_forward</mat-icon>
            </a>
            <span class="landing__hero-note">Bez karty kredytowej • Zawsze za darmo</span>
          </div>
        </div>
        <div class="landing__hero-visual">
          <div class="landing__hero-mockup">
            <mat-card class="landing__invoice-preview">
              <div class="landing__invoice-header">
                <span class="landing__invoice-number">Faktura FV/2026/01/001</span>
                <span class="landing__invoice-badge">Wystawiona</span>
              </div>
              <div class="landing__invoice-parties">
                <div class="landing__invoice-party">
                  <span class="landing__invoice-label">Sprzedawca</span>
                  <span class="landing__invoice-value">Twoja Firma Sp. z o.o.</span>
                </div>
                <div class="landing__invoice-party">
                  <span class="landing__invoice-label">Nabywca</span>
                  <span class="landing__invoice-value">Klient ABC</span>
                </div>
              </div>
              <div class="landing__invoice-total">
                <span class="landing__invoice-label">Do zapłaty</span>
                <span class="landing__invoice-amount">12 300,00 PLN</span>
              </div>
            </mat-card>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="landing__features">
        <div class="landing__features-content">
          <h2 class="landing__features-title">Wszystko czego potrzebujesz</h2>
          <p class="landing__features-subtitle">
            Fakturologia to minimalistyczne narzędzie stworzone z myślą o freelancerach
          </p>
          <div class="landing__features-grid">
            @for (feature of features; track feature.title) {
              <div class="landing__feature">
                <div class="landing__feature-icon">
                  <mat-icon>{{ feature.icon }}</mat-icon>
                </div>
                <h3 class="landing__feature-title">{{ feature.title }}</h3>
                <p class="landing__feature-description">{{ feature.description }}</p>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="landing__cta-section">
        <div class="landing__cta-content">
          <h2 class="landing__cta-title">Zacznij wystawiać faktury już dziś</h2>
          <p class="landing__cta-subtitle">
            Dołącz do tysięcy freelancerów, którzy wybrali prostotę
          </p>
          <a routerLink="/auth/register" mat-raised-button color="accent" class="landing__cta-button">
            Załóż bezpłatne konto
          </a>
        </div>
      </section>

      <!-- Footer -->
      <footer class="landing__footer">
        <div class="landing__footer-content">
          <div class="landing__footer-brand">
            <span class="landing__logo-icon">📄</span>
            <span class="landing__footer-name">Fakturologia</span>
            <span class="landing__footer-tagline">Proste fakturowanie</span>
          </div>
          <nav class="landing__footer-links">
            <a href="/regulamin" target="_blank" rel="noopener" class="landing__footer-link">
              Regulamin
            </a>
            <a href="/polityka-prywatnosci" target="_blank" rel="noopener" class="landing__footer-link">
              Polityka prywatności
            </a>
          </nav>
          <div class="landing__footer-copyright">
            © {{ currentYear }} Fakturologia. Wszelkie prawa zastrzeżone.
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .landing {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* Header */
    .landing__header {
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    }

    .landing__header-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .landing__logo {
      display: flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
    }

    .landing__logo-icon {
      font-size: 28px;
    }

    .landing__logo-text {
      font-size: 20px;
      font-weight: 700;
      color: #667eea;
    }

    .landing__nav {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .landing__nav-link {
      color: rgba(0, 0, 0, 0.7);
    }

    /* Hero */
    .landing__hero {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 80px 24px;
      display: flex;
      justify-content: center;
    }

    .landing__hero-content {
      max-width: 600px;
      text-align: center;
      color: white;
    }

    .landing__hero-title {
      font-size: 48px;
      font-weight: 700;
      line-height: 1.2;
      margin: 0 0 24px 0;
    }

    .landing__hero-subtitle {
      font-size: 20px;
      line-height: 1.6;
      margin: 0 0 32px 0;
      opacity: 0.9;
    }

    .landing__hero-actions {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .landing__hero-cta {
      font-size: 18px;
      padding: 12px 32px;
      height: auto;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .landing__hero-note {
      font-size: 14px;
      opacity: 0.8;
    }

    .landing__hero-visual {
      display: none;
    }

    .landing__hero-mockup {
      perspective: 1000px;
    }

    .landing__invoice-preview {
      width: 320px;
      padding: 24px;
      transform: rotateY(-5deg) rotateX(5deg);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .landing__invoice-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .landing__invoice-number {
      font-weight: 600;
      font-size: 14px;
    }

    .landing__invoice-badge {
      background: #e8f5e9;
      color: #2e7d32;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .landing__invoice-parties {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
      padding-bottom: 24px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    }

    .landing__invoice-party {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .landing__invoice-label {
      font-size: 11px;
      color: rgba(0, 0, 0, 0.5);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .landing__invoice-value {
      font-size: 13px;
      font-weight: 500;
    }

    .landing__invoice-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .landing__invoice-amount {
      font-size: 24px;
      font-weight: 700;
      color: #667eea;
    }

    /* Features */
    .landing__features {
      padding: 80px 24px;
      background: #fafafa;
    }

    .landing__features-content {
      max-width: 1200px;
      margin: 0 auto;
      text-align: center;
    }

    .landing__features-title {
      font-size: 36px;
      font-weight: 700;
      margin: 0 0 16px 0;
      color: rgba(0, 0, 0, 0.87);
    }

    .landing__features-subtitle {
      font-size: 18px;
      color: rgba(0, 0, 0, 0.6);
      margin: 0 0 48px 0;
    }

    .landing__features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 32px;
    }

    .landing__feature {
      background: white;
      padding: 32px 24px;
      border-radius: 16px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .landing__feature:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    }

    .landing__feature-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
    }

    .landing__feature-icon mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: white;
    }

    .landing__feature-title {
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 12px 0;
      color: rgba(0, 0, 0, 0.87);
    }

    .landing__feature-description {
      font-size: 14px;
      line-height: 1.6;
      color: rgba(0, 0, 0, 0.6);
      margin: 0;
    }

    /* CTA Section */
    .landing__cta-section {
      padding: 80px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      text-align: center;
    }

    .landing__cta-content {
      max-width: 600px;
      margin: 0 auto;
    }

    .landing__cta-title {
      font-size: 32px;
      font-weight: 700;
      color: white;
      margin: 0 0 16px 0;
    }

    .landing__cta-subtitle {
      font-size: 18px;
      color: rgba(255, 255, 255, 0.9);
      margin: 0 0 32px 0;
    }

    .landing__cta-button {
      font-size: 18px;
      padding: 12px 40px;
      height: auto;
    }

    /* Footer */
    .landing__footer {
      background: #1a1a2e;
      padding: 48px 24px;
      margin-top: auto;
    }

    .landing__footer-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
    }

    .landing__footer-brand {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .landing__footer-name {
      font-size: 18px;
      font-weight: 600;
      color: white;
    }

    .landing__footer-tagline {
      color: rgba(255, 255, 255, 0.5);
      font-size: 14px;
      margin-left: 8px;
      padding-left: 8px;
      border-left: 1px solid rgba(255, 255, 255, 0.2);
    }

    .landing__footer-links {
      display: flex;
      gap: 24px;
    }

    .landing__footer-link {
      color: rgba(255, 255, 255, 0.7);
      text-decoration: none;
      font-size: 14px;
      transition: color 0.2s ease;
    }

    .landing__footer-link:hover {
      color: white;
    }

    .landing__footer-copyright {
      color: rgba(255, 255, 255, 0.4);
      font-size: 13px;
    }

    /* Responsive */
    @media (min-width: 960px) {
      .landing__hero {
        padding: 100px 48px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 48px;
        align-items: center;
      }

      .landing__hero-content {
        text-align: left;
        max-width: none;
      }

      .landing__hero-actions {
        align-items: flex-start;
      }

      .landing__hero-visual {
        display: block;
      }
    }

    @media (max-width: 600px) {
      .landing__hero-title {
        font-size: 32px;
      }

      .landing__hero-subtitle {
        font-size: 16px;
      }

      .landing__features-title {
        font-size: 28px;
      }

      .landing__cta-title {
        font-size: 24px;
      }

      .landing__footer-content {
        text-align: center;
      }

      .landing__footer-brand {
        flex-wrap: wrap;
        justify-content: center;
      }

      .landing__footer-tagline {
        width: 100%;
        border-left: none;
        margin-left: 0;
        padding-left: 0;
        margin-top: 4px;
      }
    }
  `]
})
export class LandingPageComponent {
  /** Current year for copyright */
  readonly currentYear = new Date().getFullYear();

  /** Features list */
  readonly features: Feature[] = [
    {
      icon: 'bolt',
      title: 'Błyskawiczne wystawianie',
      description: 'Wystaw fakturę w mniej niż minutę. Intuicyjny formularz z autouzupełnianiem danych kontrahentów.'
    },
    {
      icon: 'picture_as_pdf',
      title: 'Eksport do PDF',
      description: 'Generuj profesjonalne faktury PDF jednym kliknięciem. Gotowe do wysłania lub wydruku.'
    },
    {
      icon: 'people',
      title: 'Baza kontrahentów',
      description: 'Zapisuj dane kontrahentów i używaj ich przy kolejnych fakturach. Zero przepisywania.'
    },
    {
      icon: 'shield',
      title: 'Bezpieczeństwo danych',
      description: 'Twoje dane są bezpieczne. Szyfrowanie SSL i regularne kopie zapasowe.'
    }
  ];
}
