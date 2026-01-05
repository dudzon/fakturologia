import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  DestroyRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
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
import {
  nipValidator,
  normalizeNip,
  ibanValidator,
  normalizeIban,
  invoiceNumberFormatValidator
} from '../../shared/validators';
import type { CanDeactivateComponent } from '../../core/guards/can-deactivate.guard';
import type { UserProfileResponse, UpdateUserProfileCommand } from '../../../types';
import type { ProfileFormValue, ProfileCompletenessState, ProfileRequiredFieldMeta } from './models';
import { LogoUploadComponent } from './components/logo-upload.component';
import { InvoiceNumberPreviewComponent } from './components/invoice-number-preview.component';
import { ProfileCompletenessIndicatorComponent } from './components/profile-completeness-indicator.component';

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
    ProfileCompletenessIndicatorComponent
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
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
      return { isComplete: false, completionPercentage: 0, missingFields: ['companyName', 'nip', 'address'] };
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
      missingFields
    };
  });

  readonly requiredFieldsMeta = computed<ProfileRequiredFieldMeta[]>(() => {
    const p = this.profile();
    return [
      { key: 'companyName', label: 'Nazwa firmy', filled: !!p?.companyName },
      { key: 'nip', label: 'NIP', filled: !!p?.nip },
      { key: 'address', label: 'Adres', filled: !!p?.address }
    ];
  });

  constructor() {
    this.profileForm = this.fb.group({
      companyName: ['', [Validators.required]],
      nip: ['', [nipValidator()]],
      address: [''],
      bankAccount: ['', [ibanValidator(), Validators.maxLength(32)]],
      invoiceNumberFormat: ['FV/{YYYY}/{MM}/{NNN}', [invoiceNumberFormatValidator()]]
    });

    // Track form changes for unsaved changes warning
    this.profileForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
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

    this.userService.getProfile()
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
        }
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
      invoiceNumberFormat: formValue.invoiceNumberFormat || undefined
    };

    this.userService.updateProfile(command)
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
        }
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
    this.logoUrl.set(newLogoUrl);
    const currentProfile = this.profile();
    if (currentProfile) {
      this.profile.set({ ...currentProfile, logoUrl: newLogoUrl });
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
      invoiceNumberFormat: profile.invoiceNumberFormat ?? 'FV/{YYYY}/{MM}/{NNN}'
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
      'INVALID_NIP': 'Nieprawidłowy format lub suma kontrolna NIP',
      'INVALID_IBAN': 'Nieprawidłowy format konta bankowego',
      'INVALID_NUMBER_FORMAT': 'Format numeru faktury musi zawierać {NNN}'
    };

    const message = code ? errorMessages[code] : null;
    this.snackBar.open(message || 'Błąd podczas zapisywania profilu', 'Zamknij', { duration: 5000 });
  }
}
