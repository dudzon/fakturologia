import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';

/**
 * Password strength levels
 */
export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

/**
 * PasswordStrengthComponent - Visual indicator of password strength.
 *
 * Shows a progress bar with color coding based on password complexity.
 * Evaluates: length, lowercase, uppercase, numbers, special characters.
 *
 * @example
 * ```html
 * <app-password-strength [password]="passwordControl.value" />
 * ```
 */
@Component({
  selector: 'app-password-strength',
  standalone: true,
  imports: [CommonModule, MatProgressBarModule],
  template: `
    <div class="password-strength">
      <mat-progress-bar
        [value]="strengthPercent()"
        [color]="strengthColor()"
        mode="determinate"
      ></mat-progress-bar>
      <span class="password-strength__label" [class]="'password-strength__label--' + strength()">
        {{ strengthLabel() }}
      </span>
    </div>
  `,
  styles: [`
    .password-strength {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 8px;
    }

    mat-progress-bar {
      flex: 1;
      height: 6px;
      border-radius: 3px;
    }

    .password-strength__label {
      font-size: 12px;
      font-weight: 500;
      min-width: 60px;
      text-align: right;
    }

    .password-strength__label--weak {
      color: #f44336;
    }

    .password-strength__label--fair {
      color: #ff9800;
    }

    .password-strength__label--good {
      color: #2196f3;
    }

    .password-strength__label--strong {
      color: #4caf50;
    }
  `]
})
export class PasswordStrengthComponent {
  /** The password to evaluate */
  readonly password = input<string | null | undefined>('');

  /** Calculated password strength */
  readonly strength = computed<PasswordStrength>(() => {
    const score = this.calculateScore(this.password() ?? '');
    if (score <= 1) return 'weak';
    if (score <= 2) return 'fair';
    if (score <= 3) return 'good';
    return 'strong';
  });

  /** Progress bar percentage */
  readonly strengthPercent = computed(() => {
    const score = this.calculateScore(this.password() ?? '');
    return Math.min(score * 25, 100);
  });

  /** Progress bar color */
  readonly strengthColor = computed<'warn' | 'accent' | 'primary'>(() => {
    const strength = this.strength();
    if (strength === 'weak') return 'warn';
    if (strength === 'fair') return 'accent';
    return 'primary';
  });

  /** Human-readable strength label */
  readonly strengthLabel = computed(() => {
    const labels: Record<PasswordStrength, string> = {
      weak: 'Słabe',
      fair: 'Średnie',
      good: 'Dobre',
      strong: 'Silne'
    };
    return labels[this.strength()];
  });

  /**
   * Calculate password score (0-4) based on complexity criteria.
   */
  private calculateScore(password: string): number {
    if (!password) return 0;

    let score = 0;

    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;

    // Character variety checks
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

    return Math.min(score, 4);
  }
}
