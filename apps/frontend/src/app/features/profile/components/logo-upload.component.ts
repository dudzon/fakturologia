import { Component, input, output, signal, inject, ElementRef, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { UserService } from '../../../services/user.service';

/**
 * LogoUploadComponent - Reusable component for company logo upload.
 *
 * Features:
 * - Drag & drop zone for file upload
 * - Click to select file from disk
 * - Preview of current/uploading logo
 * - Progress bar during upload
 * - Validation: PNG/JPG only, max 2MB
 * - Delete current logo functionality
 */
@Component({
  selector: 'app-logo-upload',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressBarModule],
  template: `
    <div class="logo-upload-container">
      <!-- Current Logo Preview -->
      @if (currentLogoUrl() || previewUrl()) {
        <div class="logo-preview">
          <img [src]="previewUrl() || currentLogoUrl()" alt="Logo firmy" class="logo-image" />
          <div class="logo-actions">
            <button
              mat-icon-button
              type="button"
              (click)="triggerFileInput()"
              [disabled]="isUploading() || isLoading()"
              matTooltip="Zmień logo"
            >
              <mat-icon>edit</mat-icon>
            </button>
            <button
              mat-icon-button
              type="button"
              color="warn"
              (click)="deleteLogo()"
              [disabled]="isUploading() || isLoading() || isDeleting()"
              matTooltip="Usuń logo"
            >
              <mat-icon>delete</mat-icon>
            </button>
          </div>
        </div>
      } @else {
        <!-- Drop Zone -->
        <div
          class="drop-zone"
          [class.drag-over]="isDragOver()"
          [class.disabled]="isUploading() || isLoading()"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)"
          (click)="triggerFileInput()"
        >
          <mat-icon class="upload-icon">cloud_upload</mat-icon>
          <p class="drop-text">
            Przeciągnij i upuść logo tutaj
            <br />
            <span class="drop-hint">lub kliknij, aby wybrać plik</span>
          </p>
          <p class="file-requirements">PNG lub JPG, maksymalnie 2MB</p>
        </div>
      }

      <!-- Hidden File Input -->
      <input
        #fileInput
        type="file"
        accept="image/png,image/jpeg"
        (change)="onFileSelected($event)"
        class="hidden-input"
      />

      <!-- Upload Progress -->
      @if (isUploading()) {
        <div class="upload-progress">
          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
          <span class="progress-text">Przesyłanie logo...</span>
        </div>
      }

      <!-- Error Message -->
      @if (errorMessage()) {
        <div class="error-message">
          <mat-icon>error</mat-icon>
          {{ errorMessage() }}
        </div>
      }
    </div>
  `,
  styles: [
    `
      .logo-upload-container {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .drop-zone {
        border: 2px dashed var(--mat-sys-outline);
        border-radius: 12px;
        padding: 32px;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s ease;
        background-color: var(--mat-sys-surface-variant);

        &:hover:not(.disabled) {
          border-color: var(--mat-sys-primary);
          background-color: color-mix(in srgb, var(--mat-sys-primary) 8%, transparent);
        }

        &.drag-over {
          border-color: var(--mat-sys-primary);
          background-color: color-mix(in srgb, var(--mat-sys-primary) 12%, transparent);
          transform: scale(1.01);
        }

        &.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }

      .upload-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: var(--mat-sys-primary);
        margin-bottom: 8px;
      }

      .drop-text {
        margin: 0;
        font-size: 14px;
        color: var(--mat-sys-on-surface);
      }

      .drop-hint {
        font-size: 12px;
        color: var(--mat-sys-on-surface-variant);
      }

      .file-requirements {
        margin: 8px 0 0;
        font-size: 12px;
        color: var(--mat-sys-on-surface-variant);
      }

      .logo-preview {
        position: relative;
        display: inline-block;
        max-width: 200px;
      }

      .logo-image {
        max-width: 200px;
        max-height: 120px;
        border-radius: 8px;
        border: 1px solid var(--mat-sys-outline-variant);
        object-fit: contain;
        background-color: white;
      }

      .logo-actions {
        position: absolute;
        top: 4px;
        right: 4px;
        display: flex;
        gap: 4px;
        background-color: rgba(255, 255, 255, 0.9);
        border-radius: 8px;
        padding: 2px;
      }

      .hidden-input {
        display: none;
      }

      .upload-progress {
        display: flex;
        flex-direction: column;
        gap: 8px;

        mat-progress-bar {
          border-radius: 4px;
        }

        .progress-text {
          font-size: 12px;
          color: var(--mat-sys-on-surface-variant);
          text-align: center;
        }
      }

      .error-message {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background-color: color-mix(in srgb, var(--mat-sys-error) 12%, transparent);
        color: var(--mat-sys-error);
        border-radius: 8px;
        font-size: 13px;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }
    `,
  ],
})
export class LogoUploadComponent {
  private readonly userService = inject(UserService);
  private readonly fileInputRef = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  // Inputs
  readonly currentLogoUrl = input<string | null>(null);
  readonly isLoading = input<boolean>(false);

  // Outputs
  readonly logoUploaded = output<string>();
  readonly logoDeleted = output<void>();
  readonly uploadError = output<string>();

  // State
  readonly isDragOver = signal(false);
  readonly isUploading = signal(false);
  readonly isDeleting = signal(false);
  readonly previewUrl = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  // File constraints
  private readonly MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
  private readonly ALLOWED_TYPES = ['image/png', 'image/jpeg'];

  /**
   * Opens the file selection dialog.
   */
  triggerFileInput(): void {
    this.fileInputRef()?.nativeElement.click();
  }

  /**
   * Handles file selection from input.
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      this.processFile(file);
    }

    // Reset input to allow selecting the same file again
    input.value = '';
  }

  /**
   * Handles dragover event.
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.isUploading() && !this.isLoading()) {
      this.isDragOver.set(true);
    }
  }

  /**
   * Handles dragleave event.
   */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  /**
   * Handles drop event.
   */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    if (this.isUploading() || this.isLoading()) {
      return;
    }

    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.processFile(file);
    }
  }

  /**
   * Deletes the current logo.
   */
  deleteLogo(): void {
    this.isDeleting.set(true);
    this.errorMessage.set(null);

    this.userService.deleteLogo().subscribe({
      next: () => {
        this.previewUrl.set(null);
        this.isDeleting.set(false);
        this.logoDeleted.emit();
      },
      error: (error) => {
        console.error('Error deleting logo:', error);
        this.isDeleting.set(false);
        const message = this.getErrorMessage(error);
        this.errorMessage.set(message);
        this.uploadError.emit(message);
      },
    });
  }

  /**
   * Processes the selected file: validates and uploads.
   */
  private processFile(file: File): void {
    this.errorMessage.set(null);

    // Validate file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      const message = 'Dozwolone są tylko pliki PNG i JPG';
      this.errorMessage.set(message);
      this.uploadError.emit(message);
      return;
    }

    // Validate file size
    if (file.size > this.MAX_FILE_SIZE) {
      const message = 'Plik jest zbyt duży. Maksymalny rozmiar to 2MB';
      this.errorMessage.set(message);
      this.uploadError.emit(message);
      return;
    }

    // Create preview
    this.createPreview(file);

    // Upload file
    this.uploadFile(file);
  }

  /**
   * Creates a local preview of the file.
   */
  private createPreview(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewUrl.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  /**
   * Uploads the file to the server.
   */
  private uploadFile(file: File): void {
    this.isUploading.set(true);
    // ...existing code...
    this.userService.uploadLogo(file).subscribe({
      next: (response) => {
        // ...existing code...
        this.isUploading.set(false);
        this.previewUrl.set(null); // Clear preview, use actual URL
        // ...existing code...
        this.logoUploaded.emit(response.logoUrl);
      },
      error: (error) => {
        console.error('[LogoUpload] Error uploading logo:', error);
        this.isUploading.set(false);
        this.previewUrl.set(null);
        const message = this.getErrorMessage(error);
        this.errorMessage.set(message);
        this.uploadError.emit(message);
      },
    });
  }

  /**
   * Extracts error message from API error response.
   */
  private getErrorMessage(error: unknown): string {
    const errorResponse = error as { error?: { code?: string; message?: string } };
    const code = errorResponse?.error?.code;

    const errorMessages: Record<string, string> = {
      INVALID_FILE_TYPE: 'Dozwolone są tylko pliki PNG i JPG',
      FILE_TOO_LARGE: 'Plik jest zbyt duży. Maksymalny rozmiar to 2MB',
      LOGO_NOT_FOUND: 'Nie znaleziono logo do usunięcia',
    };

    return code && errorMessages[code]
      ? errorMessages[code]
      : 'Wystąpił błąd podczas operacji na logo';
  }
}
