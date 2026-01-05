import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import type { UserProfileResponse } from '../../../../types';
import type { ProfileCompletenessState, ProfileRequiredFieldMeta } from '../models';

/**
 * ProfileCompletenessIndicatorComponent - Visualizes profile completion status.
 *
 * Shows a progress bar and list of required fields for issuing invoices.
 * Especially important during onboarding to guide new users.
 */
@Component({
  selector: 'app-profile-completeness-indicator',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressBarModule],
  template: `
    @if (!completenessState().isComplete) {
      <div class="completeness-container" [class.warning]="completenessState().completionPercentage < 100">
        <div class="completeness-header">
          <mat-icon>info</mat-icon>
          <span class="completeness-title">
            @if (completenessState().completionPercentage === 0) {
              Uzupełnij profil, aby wystawiać faktury
            } @else {
              Dokończ uzupełnianie profilu
            }
          </span>
        </div>

        <mat-progress-bar
          mode="determinate"
          [value]="completenessState().completionPercentage"
          class="completeness-progress"
        ></mat-progress-bar>

        <div class="completeness-details">
          <span class="progress-text">
            {{ completenessState().completionPercentage }}% ukończone
          </span>
        </div>

        <div class="required-fields">
          @for (field of requiredFieldsMeta(); track field.key) {
            <div class="field-item" [class.filled]="field.filled">
              <mat-icon>{{ field.filled ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
              <span>{{ field.label }}</span>
            </div>
          }
        </div>
      </div>
    } @else {
      <div class="completeness-container complete">
        <div class="completeness-header">
          <mat-icon>check_circle</mat-icon>
          <span class="completeness-title">Profil jest kompletny</span>
        </div>
        <p class="complete-message">Możesz wystawiać faktury</p>
      </div>
    }
  `,
  styles: [`
    .completeness-container {
      background-color: var(--mat-sys-surface-variant);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 8px;

      &.warning {
        background-color: color-mix(in srgb, var(--mat-sys-tertiary) 12%, transparent);
        border: 1px solid var(--mat-sys-tertiary);
      }

      &.complete {
        background-color: color-mix(in srgb, var(--mat-sys-primary) 12%, transparent);
        border: 1px solid var(--mat-sys-primary);
      }
    }

    .completeness-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;

      mat-icon {
        color: var(--mat-sys-tertiary);
      }

      .complete & mat-icon {
        color: var(--mat-sys-primary);
      }
    }

    .completeness-title {
      font-weight: 500;
      font-size: 14px;
      color: var(--mat-sys-on-surface);
    }

    .completeness-progress {
      margin-bottom: 8px;
      border-radius: 4px;
      height: 8px;
    }

    .completeness-details {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 12px;
    }

    .progress-text {
      font-size: 12px;
      color: var(--mat-sys-on-surface-variant);
    }

    .required-fields {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .field-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--mat-sys-on-surface-variant);

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: var(--mat-sys-outline);
      }

      &.filled {
        color: var(--mat-sys-on-surface);

        mat-icon {
          color: var(--mat-sys-primary);
        }
      }
    }

    .complete-message {
      font-size: 13px;
      color: var(--mat-sys-on-surface-variant);
      margin: 0;
    }
  `]
})
export class ProfileCompletenessIndicatorComponent {
  /**
   * The user profile data to analyze for completeness.
   */
  readonly profile = input<UserProfileResponse | null>(null);

  /**
   * Computed completeness state based on profile data.
   */
  readonly completenessState = computed<ProfileCompletenessState>(() => {
    const p = this.profile();

    if (!p) {
      return {
        isComplete: false,
        completionPercentage: 0,
        missingFields: ['companyName', 'nip', 'address']
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
      missingFields
    };
  });

  /**
   * Computed metadata for required fields display.
   */
  readonly requiredFieldsMeta = computed<ProfileRequiredFieldMeta[]>(() => {
    const p = this.profile();
    return [
      { key: 'companyName', label: 'Nazwa firmy', filled: !!p?.companyName },
      { key: 'nip', label: 'NIP', filled: !!p?.nip },
      { key: 'address', label: 'Adres', filled: !!p?.address }
    ];
  });
}
