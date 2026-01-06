import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

/**
 * Password requirement definition
 */
interface PasswordRequirement {
  label: string;
  validator: (password: string) => boolean;
}

/**
 * PasswordRequirementsComponent - Live checklist of password requirements.
 *
 * Shows each requirement with a check/cross icon indicating if it's met.
 * Updates in real-time as the user types.
 *
 * @example
 * ```html
 * <app-password-requirements [password]="passwordControl.value" />
 * ```
 */
@Component({
  selector: 'app-password-requirements',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="password-requirements">
      <p class="password-requirements__title">Hasło musi zawierać:</p>
      <ul class="password-requirements__list">
        @for (req of requirementsStatus(); track req.label) {
          <li
            class="password-requirements__item"
            [class.password-requirements__item--met]="req.met"
          >
            <mat-icon class="password-requirements__icon">
              {{ req.met ? 'check_circle' : 'cancel' }}
            </mat-icon>
            <span>{{ req.label }}</span>
          </li>
        }
      </ul>
    </div>
  `,
  styles: [`
    .password-requirements {
      margin-top: 12px;
      padding: 12px;
      background-color: rgba(0, 0, 0, 0.02);
      border-radius: 8px;
    }

    .password-requirements__title {
      margin: 0 0 8px 0;
      font-size: 13px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.7);
    }

    .password-requirements__list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .password-requirements__item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
      transition: color 0.2s ease;
    }

    .password-requirements__item--met {
      color: #4caf50;
    }

    .password-requirements__icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #f44336;
    }

    .password-requirements__item--met .password-requirements__icon {
      color: #4caf50;
    }
  `]
})
export class PasswordRequirementsComponent {
  /** The password to validate */
  readonly password = input<string | null | undefined>('');

  /** Password requirements definition */
  private readonly requirements: PasswordRequirement[] = [
    {
      label: 'Minimum 8 znaków',
      validator: (pwd) => pwd.length >= 8
    },
    {
      label: 'Przynajmniej jedną małą literę (a-z)',
      validator: (pwd) => /[a-z]/.test(pwd)
    },
    {
      label: 'Przynajmniej jedną wielką literę (A-Z)',
      validator: (pwd) => /[A-Z]/.test(pwd)
    },
    {
      label: 'Przynajmniej jedną cyfrę (0-9)',
      validator: (pwd) => /\d/.test(pwd)
    }
  ];

  /** Requirements with their current met status */
  readonly requirementsStatus = computed(() => {
    const pwd = this.password() ?? '';
    return this.requirements.map(req => ({
      label: req.label,
      met: req.validator(pwd)
    }));
  });

  /** Check if all requirements are met */
  readonly allMet = computed(() => {
    return this.requirementsStatus().every(req => req.met);
  });
}
