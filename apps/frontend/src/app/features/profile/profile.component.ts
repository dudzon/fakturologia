import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';

import { UserService } from '../../services/user.service';
import { nipValidator, normalizeNip } from '../../shared/validators/nip.validator';
import { ibanValidator, normalizeIban } from '../../shared/validators/iban.validator';
import { invoiceNumberFormatValidator } from '../../shared/validators/invoice-number-format.validator';
import type { CanDeactivateComponent } from '../../core/guards/can-deactivate.guard';
import type { UserProfileResponse, UpdateUserProfileCommand } from '../../../types';
import type {
  ProfileFormValue,
  ProfileCompletenessState,
  ProfileRequiredFieldMeta,
} from './models/profile-form.model';
import { LogoUploadComponent } from './components/logo-upload.component';
import { InvoiceNumberPreviewComponent } from './components/invoice-number-preview.component';
import { ProfileCompletenessIndicatorComponent } from './components/profile-completeness-indicator.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

/**
 * ProfileComponent - Main container for company profile management.
 *
 * Features:
 * - Company data form (name, NIP, address)
 * - Bank account (IBAN) management
 * - Logo upload/delete
 * - Invoice number format configuration
 * - Profile completeness indicator for onboarding
 * - Unsaved changes warning (via canDeactivate guard)
 */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    LogoUploadComponent,
    InvoiceNumberPreviewComponent,
    ProfileCompletenessIndicatorComponent,
    PageHeaderComponent,
  ],
  template: `<div class="profile-container">
    <!-- Header -->
    <app-page-header title="Profil firmy"></app-page-header>

    @if (isLoading()) {
      <div class="loading-overlay">
        <mat-spinner diameter="48"></mat-spinner>
        <p>Ładowanie profilu...</p>
      </div>
    } @else {
      <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" class="profile-form">
        <!-- Profile Completeness Indicator -->
        <app-profile-completeness-indicator [profile]="profile()" />

        <!-- Company Data Section -->
        <mat-card class="profile-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>business</mat-icon>
            <mat-card-title>Dane firmy</mat-card-title>
            <mat-card-subtitle
              >Informacje wyświetlane na fakturach jako sprzedawca</mat-card-subtitle
            >
          </mat-card-header>

          <mat-card-content>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nazwa firmy</mat-label>
              <input
                matInput
                formControlName="companyName"
                placeholder="np. Firma ABC Sp. z o.o."
              />
              @if (
                profileForm.get('companyName')?.hasError('required') &&
                profileForm.get('companyName')?.touched
              ) {
                <mat-error>Nazwa firmy jest wymagana</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>NIP</mat-label>
              <input matInput formControlName="nip" placeholder="np. 1234567890" />
              <mat-hint>10 cyfr, bez myślników</mat-hint>
              @if (profileForm.get('nip')?.hasError('nip')) {
                <mat-error>{{ profileForm.get('nip')?.getError('nip').message }}</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Adres</mat-label>
              <textarea
                matInput
                formControlName="address"
                rows="3"
                placeholder="ul. Przykładowa 1&#10;00-001 Warszawa"
              ></textarea>
            </mat-form-field>
          </mat-card-content>
        </mat-card>

        <!-- Bank Account Section -->
        <mat-card class="profile-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>account_balance</mat-icon>
            <mat-card-title>Dane bankowe</mat-card-title>
            <mat-card-subtitle>Numer konta do przelewów</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Numer konta (IBAN)</mat-label>
              <input
                matInput
                formControlName="bankAccount"
                placeholder="PL00 0000 0000 0000 0000 0000 0000"
              />
              <mat-hint>Format IBAN, np. PL61 1090 1014 0000 0712 1981 2874</mat-hint>
              @if (profileForm.get('bankAccount')?.hasError('iban')) {
                <mat-error>{{
                  profileForm.get('bankAccount')?.getError('iban').message
                }}</mat-error>
              }
              @if (profileForm.get('bankAccount')?.hasError('maxlength')) {
                <mat-error>Maksymalnie 36 znaków</mat-error>
              }
            </mat-form-field>
          </mat-card-content>
        </mat-card>

        <!-- Logo Section -->
        <mat-card class="profile-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>image</mat-icon>
            <mat-card-title>Logo firmy</mat-card-title>
            <mat-card-subtitle
              >Logo wyświetlane na fakturach (PNG lub JPG, max 2MB)</mat-card-subtitle
            >
          </mat-card-header>

          <mat-card-content>
            <app-logo-upload
              [currentLogoUrl]="logoUrl()"
              [isLoading]="isSaving()"
              (logoUploaded)="onLogoUploaded($event)"
              (logoDeleted)="onLogoDeleted()"
              (uploadError)="onLogoError($event)"
            />
          </mat-card-content>
        </mat-card>

        <!-- Invoice Settings Section -->
        <mat-card class="profile-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>receipt_long</mat-icon>
            <mat-card-title>Ustawienia faktur</mat-card-title>
            <mat-card-subtitle>Format numeracji faktur</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Format numeru faktury</mat-label>
              <input
                matInput
                formControlName="invoiceNumberFormat"
                placeholder="FV/{YYYY}/{MM}/{NNN}"
              />
              <mat-hint>
                Dostępne placeholdery: &#123;NNN&#125; (numer), &#123;YYYY&#125; (rok),
                &#123;MM&#125; (miesiąc), &#123;DD&#125; (dzień)
              </mat-hint>
              @if (profileForm.get('invoiceNumberFormat')?.hasError('invoiceNumberFormat')) {
                <mat-error>{{
                  profileForm.get('invoiceNumberFormat')?.getError('invoiceNumberFormat').message
                }}</mat-error>
              }
            </mat-form-field>

            <app-invoice-number-preview [format]="currentFormat" [counter]="invoiceCounter()" />
          </mat-card-content>
        </mat-card>

        <!-- Sticky Footer with Actions -->
        <div class="form-actions" [class.has-changes]="hasUnsavedChanges()">
          <div class="actions-content">
            @if (hasUnsavedChanges()) {
              <span class="unsaved-indicator">
                <mat-icon>warning</mat-icon>
                Masz niezapisane zmiany
              </span>
            }
            <div class="action-buttons">
              <button
                mat-button
                type="button"
                (click)="onCancel()"
                [disabled]="isSaving() || !hasUnsavedChanges()"
              >
                Anuluj
              </button>
              <button
                mat-raised-button
                color="primary"
                type="submit"
                [disabled]="isSaving()"
              >
                @if (isSaving()) {
                  <mat-spinner diameter="20" class="button-spinner"></mat-spinner>
                  Zapisywanie...
                } @else {
                  Zapisz zmiany
                }
              </button>
            </div>
          </div>
        </div>
      </form>
    }
  </div>`,
  styles: [
    `
      .profile-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 24px 16px;
        padding-bottom: 100px; // Space for sticky footer
      }

      .loading-overlay {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 400px;
        gap: 16px;

        p {
          color: var(--mat-sys-on-surface-variant);
        }
      }

      .profile-form {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .profile-card {
        mat-card-header {
          margin-bottom: 16px;

          mat-icon[mat-card-avatar] {
            width: 40px;
            height: 40px;
            font-size: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: var(--mat-sys-primary-container);
            color: var(--mat-sys-on-primary-container);
            border-radius: 50%;
          }
        }

        mat-card-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
      }

      .full-width {
        width: 100%;
      }

      // Privacy section
      .privacy-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;

        button {
          mat-icon {
            margin-right: 8px;
          }
        }
      }

      .privacy-note {
        font-size: 12px;
        color: var(--mat-sys-on-surface-variant);
        margin: 8px 0 0;
      }

      // Sticky footer
      .form-actions {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background-color: #fff;
        border-top: 1px solid var(--mat-sys-outline-variant);
        padding: 12px 16px;
        z-index: 1000;
        transition: box-shadow 0.2s ease;

        // Ensure footer completely covers content beneath
        box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);

        &.has-changes {
          box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
        }
      }

      .actions-content {
        margin: 0 auto;
        display: flex;
        justify-content: end;
        align-items: center;
        gap: 16px;
      }

      .unsaved-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--mat-sys-tertiary);
        font-size: 14px;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }

      .action-buttons {
        display: flex;
        gap: 12px;
        align-items: center;
      }

      .button-spinner {
        display: inline-block;
        margin-right: 8px;
      }

      // Responsive adjustments
      @media (max-width: 599px) {
        .profile-container {
          padding: 16px 12px;
          padding-bottom: 120px;
        }

        .actions-content {
          flex-direction: column;
          gap: 12px;
        }

        .unsaved-indicator {
          font-size: 12px;
        }

        .action-buttons {
          width: 100%;
          justify-content: flex-end;
        }

        .privacy-actions {
          flex-direction: column;

          button {
            width: 100%;
          }
        }
      }
    `,
  ],
})
export class ProfileComponent implements OnInit, CanDeactivateComponent {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  // State signals
  readonly profile = signal<UserProfileResponse | null>(null);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly logoUrl = signal<string | null>(null);

  // Form
  readonly profileForm: FormGroup;

  // Computed values
  readonly hasUnsavedChanges = signal(false);
  readonly invoiceCounter = computed(() => this.profile()?.invoiceNumberCounter ?? 1);

  readonly completenessState = computed<ProfileCompletenessState>(() => {
    const p = this.profile();
    if (!p) {
      return {
        isComplete: false,
        completionPercentage: 0,
        missingFields: ['companyName', 'nip', 'address'],
      };
    }

    const missingFields: ('companyName' | 'nip' | 'address')[] = [];
    if (!p.companyName) missingFields.push('companyName');
    if (!p.nip) missingFields.push('nip');
    if (!p.address) missingFields.push('address');

    const totalRequired = 3;
    const filled = totalRequired - missingFields.length;
    const completionPercentage = Math.round((filled / totalRequired) * 100);

    return {
      isComplete: missingFields.length === 0,
      completionPercentage,
      missingFields,
    };
  });

  readonly requiredFieldsMeta = computed<ProfileRequiredFieldMeta[]>(() => {
    const p = this.profile();
    return [
      { key: 'companyName', label: 'Nazwa firmy', filled: !!p?.companyName },
      { key: 'nip', label: 'NIP', filled: !!p?.nip },
      { key: 'address', label: 'Adres', filled: !!p?.address },
    ];
  });

  constructor() {
    this.profileForm = this.fb.group({
      companyName: ['', [Validators.required]],
      nip: ['', [nipValidator()]],
      address: [''],
      bankAccount: ['', [ibanValidator(), Validators.maxLength(36)]],
      invoiceNumberFormat: ['FV/{YYYY}/{MM}/{NNN}', [invoiceNumberFormatValidator()]],
    });

    // Track form changes for unsaved changes warning
    this.profileForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.hasUnsavedChanges.set(this.profileForm.dirty);
    });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  /**
   * Loads the user profile from the API.
   */
  loadProfile(): void {
    this.isLoading.set(true);

    this.userService
      .getProfile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
          this.logoUrl.set(profile.logoUrl ?? null);
          this.patchFormWithProfile(profile);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading profile:', error);
          this.snackBar.open('Błąd podczas ładowania profilu', 'Zamknij', { duration: 5000 });
          this.isLoading.set(false);
        },
      });
  }

  /**
   * Submits the profile form to save changes.
   */
  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);

    const formValue = this.profileForm.value as ProfileFormValue;
    const command: UpdateUserProfileCommand = {
      companyName: formValue.companyName || undefined,
      nip: normalizeNip(formValue.nip) || undefined,
      address: formValue.address || undefined,
      bankAccount: normalizeIban(formValue.bankAccount) || undefined,
      invoiceNumberFormat: formValue.invoiceNumberFormat || undefined,
    };

    this.userService
      .updateProfile(command)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedProfile) => {
          this.profile.set(updatedProfile);
          this.patchFormWithProfile(updatedProfile);
          this.hasUnsavedChanges.set(false);
          this.isSaving.set(false);
          this.snackBar.open('Profil został zapisany', 'OK', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error saving profile:', error);
          this.handleSaveError(error);
          this.isSaving.set(false);
        },
      });
  }

  /**
   * Resets the form to the last saved profile state.
   */
  onCancel(): void {
    const currentProfile = this.profile();
    if (currentProfile) {
      this.patchFormWithProfile(currentProfile);
      this.hasUnsavedChanges.set(false);
    }
  }

  /**
   * Handles logo upload success.
   */
  onLogoUploaded(newLogoUrl: string): void {
    // Ensure logoUrl is absolute and cache-busted
    let url = newLogoUrl;
    if (url && !/^https?:\/\//.test(url)) {
      // Prepend API base URL if relative
      url = `${window.location.origin}${url}`;
    }
    const cacheBustedUrl = url ? `${url}?t=${Date.now()}` : null;
    this.logoUrl.set(cacheBustedUrl);
    const currentProfile = this.profile();
    if (currentProfile) {
      this.profile.set({ ...currentProfile, logoUrl: cacheBustedUrl });
    }
    this.snackBar.open('Logo zostało zaktualizowane', 'OK', { duration: 3000 });
  }

  /**
   * Handles logo deletion success.
   */
  onLogoDeleted(): void {
    this.logoUrl.set(null);
    const currentProfile = this.profile();
    if (currentProfile) {
      this.profile.set({ ...currentProfile, logoUrl: null });
    }
    this.snackBar.open('Logo zostało usunięte', 'OK', { duration: 3000 });
  }

  /**
   * Handles logo upload error.
   */
  onLogoError(message: string): void {
    this.snackBar.open(message, 'Zamknij', { duration: 5000 });
  }

  /**
   * Gets the current invoice number format from the form.
   */
  get currentFormat(): string {
    return this.profileForm.get('invoiceNumberFormat')?.value || '';
  }

  /**
   * Checks if the form has unsaved changes (for canDeactivate guard).
   */
  canDeactivate(): boolean {
    return !this.hasUnsavedChanges();
  }

  /**
   * Patches the form with profile data.
   */
  private patchFormWithProfile(profile: UserProfileResponse): void {
    this.profileForm.patchValue({
      companyName: profile.companyName ?? '',
      nip: profile.nip ?? '',
      address: profile.address ?? '',
      bankAccount: profile.bankAccount ?? '',
      invoiceNumberFormat: profile.invoiceNumberFormat ?? 'FV/{YYYY}/{MM}/{NNN}',
    });
    this.profileForm.markAsPristine();
  }

  /**
   * Handles save errors with appropriate messages.
   */
  private handleSaveError(error: unknown): void {
    const errorResponse = error as { error?: { code?: string } };
    const code = errorResponse?.error?.code;

    const errorMessages: Record<string, string> = {
      INVALID_NIP: 'Nieprawidłowy format lub suma kontrolna NIP',
      INVALID_IBAN: 'Nieprawidłowy format konta bankowego',
      INVALID_NUMBER_FORMAT: 'Format numeru faktury musi zawierać {NNN}',
    };

    const message = code ? errorMessages[code] : null;
    this.snackBar.open(message || 'Błąd podczas zapisywania profilu', 'Zamknij', {
      duration: 5000,
    });
  }
}
