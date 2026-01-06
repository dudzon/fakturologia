import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { of, throwError } from 'rxjs';

import { LogoUploadComponent } from './logo-upload.component';
import { UserService } from '../../../services/user.service';
import type { UploadLogoResponse, MessageResponse } from '../../../../types';

describe('LogoUploadComponent', () => {
  let fixture: ComponentFixture<LogoUploadComponent>;
  let component: LogoUploadComponent;
  let mockUserService: {
    uploadLogo: ReturnType<typeof vi.fn>;
    deleteLogo: ReturnType<typeof vi.fn>;
  };

  beforeAll(() => {
    TestBed.initTestEnvironment(
      BrowserDynamicTestingModule,
      platformBrowserDynamicTesting()
    );
  });

  beforeEach(async () => {
    mockUserService = {
      uploadLogo: vi.fn(),
      deleteLogo: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [LogoUploadComponent],
      providers: [
        { provide: UserService, useValue: mockUserService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LogoUploadComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture?.destroy();
    TestBed.resetTestingModule();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have default null currentLogoUrl', () => {
      expect(component.currentLogoUrl()).toBeNull();
    });

    it('should have default false isLoading', () => {
      expect(component.isLoading()).toBe(false);
    });

    it('should initialize state signals with default values', () => {
      expect(component.isDragOver()).toBe(false);
      expect(component.isUploading()).toBe(false);
      expect(component.isDeleting()).toBe(false);
      expect(component.previewUrl()).toBeNull();
      expect(component.errorMessage()).toBeNull();
    });
  });

  describe('triggerFileInput', () => {
    it('should trigger file input click', () => {
      fixture.detectChanges();

      const fileInput = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = vi.spyOn(fileInput, 'click');

      component.triggerFileInput();

      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe('File Validation', () => {
    it('should accept PNG files', () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const response: UploadLogoResponse = { logoUrl: 'https://example.com/logo.png' };
      mockUserService.uploadLogo.mockReturnValue(of(response));

      const event = { target: { files: [file] } } as any;
      component.onFileSelected(event);

      expect(mockUserService.uploadLogo).toHaveBeenCalledWith(file);
    });

    it('should accept JPEG files', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const response: UploadLogoResponse = { logoUrl: 'https://example.com/logo.jpg' };
      mockUserService.uploadLogo.mockReturnValue(of(response));

      const event = { target: { files: [file] } } as any;
      component.onFileSelected(event);

      expect(mockUserService.uploadLogo).toHaveBeenCalledWith(file);
    });

    it('should reject non-image files', async () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

      const event = { target: { files: [file], value: '' } } as any;
      component.onFileSelected(event);

      expect(component.errorMessage()).toBe('Dozwolone są tylko pliki PNG i JPG');
      expect(mockUserService.uploadLogo).not.toHaveBeenCalled();
    });

    it('should reject files larger than 2MB', () => {
      const largeData = new Array(2 * 1024 * 1024 + 1).fill('a').join('');
      const file = new File([largeData], 'large.png', { type: 'image/png' });

      const event = { target: { files: [file], value: '' } } as any;
      component.onFileSelected(event);

      expect(component.errorMessage()).toBe('Plik jest zbyt duży. Maksymalny rozmiar to 2MB');
      expect(mockUserService.uploadLogo).not.toHaveBeenCalled();
    });

    it('should emit uploadError event when file type is invalid', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const errorSpy = vi.fn();
      component.uploadError.subscribe(errorSpy);

      const event = { target: { files: [file], value: '' } } as any;
      component.onFileSelected(event);

      expect(errorSpy).toHaveBeenCalledWith('Dozwolone są tylko pliki PNG i JPG');
    });

    it('should emit uploadError event when file is too large', () => {
      const largeData = new Array(3 * 1024 * 1024).fill('a').join('');
      const file = new File([largeData], 'large.png', { type: 'image/png' });
      const errorSpy = vi.fn();
      component.uploadError.subscribe(errorSpy);

      const event = { target: { files: [file], value: '' } } as any;
      component.onFileSelected(event);

      expect(errorSpy).toHaveBeenCalledWith('Plik jest zbyt duży. Maksymalny rozmiar to 2MB');
    });
  });

  describe('File Upload', () => {
    it('should upload file successfully', async () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const response: UploadLogoResponse = { logoUrl: 'https://example.com/logo.png' };
      mockUserService.uploadLogo.mockReturnValue(of(response));

      const logoUploadedSpy = vi.fn();
      component.logoUploaded.subscribe(logoUploadedSpy);

      const event = { target: { files: [file], value: '' } } as any;
      component.onFileSelected(event);

      await vi.waitFor(() => {
        expect(component.isUploading()).toBe(false);
        expect(logoUploadedSpy).toHaveBeenCalledWith('https://example.com/logo.png');
        expect(component.previewUrl()).toBeNull();
      });
    });

    it('should handle upload error with specific code', async () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const error = {
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'File is too large'
        }
      };
      mockUserService.uploadLogo.mockReturnValue(throwError(() => error));

      const errorSpy = vi.fn();
      component.uploadError.subscribe(errorSpy);

      const event = { target: { files: [file], value: '' } } as any;
      component.onFileSelected(event);

      await vi.waitFor(() => {
        expect(component.isUploading()).toBe(false);
        expect(component.errorMessage()).toBe('Plik jest zbyt duży. Maksymalny rozmiar to 2MB');
        expect(errorSpy).toHaveBeenCalledWith('Plik jest zbyt duży. Maksymalny rozmiar to 2MB');
        expect(component.previewUrl()).toBeNull();
      });
    });

    it('should handle upload error with invalid file type code', async () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const error = {
        error: {
          code: 'INVALID_FILE_TYPE',
          message: 'Invalid file type'
        }
      };
      mockUserService.uploadLogo.mockReturnValue(throwError(() => error));

      const event = { target: { files: [file], value: '' } } as any;
      component.onFileSelected(event);

      await vi.waitFor(() => {
        expect(component.errorMessage()).toBe('Dozwolone są tylko pliki PNG i JPG');
      });
    });

    it('should handle upload error with generic message', async () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const error = {
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'Unknown error'
        }
      };
      mockUserService.uploadLogo.mockReturnValue(throwError(() => error));

      const event = { target: { files: [file], value: '' } } as any;
      component.onFileSelected(event);

      await vi.waitFor(() => {
        expect(component.errorMessage()).toBe('Wystąpił błąd podczas operacji na logo');
      });
    });

    it('should reset file input value after selection', () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const response: UploadLogoResponse = { logoUrl: 'https://example.com/logo.png' };
      mockUserService.uploadLogo.mockReturnValue(of(response));

      const input = { files: [file], value: 'test.png' } as any;
      const event = { target: input } as any;

      component.onFileSelected(event);

      expect(input.value).toBe('');
    });
  });

  describe('File Delete', () => {
    it('should delete logo successfully', async () => {
      const response: MessageResponse = { message: 'Logo deleted' };
      mockUserService.deleteLogo.mockReturnValue(of(response));

      const logoDeletedSpy = vi.fn();
      component.logoDeleted.subscribe(logoDeletedSpy);

      component.deleteLogo();

      await vi.waitFor(() => {
        expect(component.isDeleting()).toBe(false);
        expect(logoDeletedSpy).toHaveBeenCalled();
        expect(component.previewUrl()).toBeNull();
      });
    });

    it('should handle delete error with specific code', async () => {
      const error = {
        error: {
          code: 'LOGO_NOT_FOUND',
          message: 'Logo not found'
        }
      };
      mockUserService.deleteLogo.mockReturnValue(throwError(() => error));

      const errorSpy = vi.fn();
      component.uploadError.subscribe(errorSpy);

      component.deleteLogo();

      await vi.waitFor(() => {
        expect(component.isDeleting()).toBe(false);
        expect(component.errorMessage()).toBe('Nie znaleziono logo do usunięcia');
        expect(errorSpy).toHaveBeenCalledWith('Nie znaleziono logo do usunięcia');
      });
    });

    it('should handle delete error with generic message', async () => {
      const error = { error: {} };
      mockUserService.deleteLogo.mockReturnValue(throwError(() => error));

      component.deleteLogo();

      await vi.waitFor(() => {
        expect(component.errorMessage()).toBe('Wystąpił błąd podczas operacji na logo');
      });
    });

    it('should clear errorMessage when deleting', () => {
      component.errorMessage.set('Previous error');
      const response: MessageResponse = { message: 'Logo deleted' };
      mockUserService.deleteLogo.mockReturnValue(of(response));

      component.deleteLogo();

      expect(component.errorMessage()).toBeNull();
    });
  });

  describe('Drag and Drop', () => {
    it('should set isDragOver to true on dragover', () => {
      const event = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn()
      } as unknown as DragEvent;

      component.onDragOver(event);

      expect(component.isDragOver()).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should not set isDragOver when uploading', () => {
      component.isUploading.set(true);

      const event = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn()
      } as unknown as DragEvent;

      component.onDragOver(event);

      expect(component.isDragOver()).toBe(false);
    });

    it('should not set isDragOver when loading', () => {
      fixture.componentRef.setInput('isLoading', true);
      fixture.detectChanges();

      const event = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn()
      } as unknown as DragEvent;

      component.onDragOver(event);

      expect(component.isDragOver()).toBe(false);
    });

    it('should set isDragOver to false on dragleave', () => {
      component.isDragOver.set(true);

      const event = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn()
      } as unknown as DragEvent;

      component.onDragLeave(event);

      expect(component.isDragOver()).toBe(false);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should process dropped file', () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const response: UploadLogoResponse = { logoUrl: 'https://example.com/logo.png' };
      mockUserService.uploadLogo.mockReturnValue(of(response));

      const event = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: {
          files: [file]
        }
      } as unknown as DragEvent;

      component.onDrop(event);

      expect(component.isDragOver()).toBe(false);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(mockUserService.uploadLogo).toHaveBeenCalledWith(file);
    });

    it('should not process drop when uploading', () => {
      component.isUploading.set(true);

      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const event = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: {
          files: [file]
        }
      } as unknown as DragEvent;

      component.onDrop(event);

      expect(mockUserService.uploadLogo).not.toHaveBeenCalled();
    });

    it('should not process drop when loading', () => {
      fixture.componentRef.setInput('isLoading', true);
      fixture.detectChanges();

      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const event = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: {
          files: [file]
        }
      } as unknown as DragEvent;

      component.onDrop(event);

      expect(mockUserService.uploadLogo).not.toHaveBeenCalled();
    });
  });

  describe('DOM Rendering - Drop Zone', () => {
    it('should render drop zone when no logo is present', () => {
      fixture.componentRef.setInput('currentLogoUrl', null);
      component.previewUrl.set(null);
      fixture.detectChanges();

      const dropZone = fixture.nativeElement.querySelector('.drop-zone');
      expect(dropZone).toBeTruthy();
    });

    it('should display upload icon in drop zone', () => {
      fixture.detectChanges();

      const icon = fixture.nativeElement.querySelector('.upload-icon');
      expect(icon?.textContent?.trim()).toBe('cloud_upload');
    });

    it('should display drop zone text', () => {
      fixture.detectChanges();

      const dropText = fixture.nativeElement.querySelector('.drop-text');
      expect(dropText?.textContent).toContain('Przeciągnij i upuść logo tutaj');
      expect(dropText?.textContent).toContain('lub kliknij, aby wybrać plik');
    });

    it('should display file requirements', () => {
      fixture.detectChanges();

      const requirements = fixture.nativeElement.querySelector('.file-requirements');
      expect(requirements?.textContent).toContain('PNG lub JPG, maksymalnie 2MB');
    });

    it('should apply drag-over class when dragging', () => {
      fixture.detectChanges();

      component.isDragOver.set(true);
      fixture.detectChanges();

      const dropZone = fixture.nativeElement.querySelector('.drop-zone');
      expect(dropZone?.classList.contains('drag-over')).toBe(true);
    });

    it('should apply disabled class when uploading', () => {
      fixture.detectChanges();

      component.isUploading.set(true);
      fixture.detectChanges();

      const dropZone = fixture.nativeElement.querySelector('.drop-zone');
      expect(dropZone?.classList.contains('disabled')).toBe(true);
    });

    it('should apply disabled class when loading', () => {
      fixture.componentRef.setInput('isLoading', true);
      fixture.detectChanges();

      const dropZone = fixture.nativeElement.querySelector('.drop-zone');
      expect(dropZone?.classList.contains('disabled')).toBe(true);
    });

    it('should trigger file input on drop zone click', () => {
      fixture.detectChanges();

      const dropZone = fixture.nativeElement.querySelector('.drop-zone') as HTMLElement;
      const fileInput = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = vi.spyOn(fileInput, 'click');

      dropZone.click();

      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe('DOM Rendering - Logo Preview', () => {
    it('should render logo preview when currentLogoUrl is provided', () => {
      fixture.componentRef.setInput('currentLogoUrl', 'https://example.com/logo.png');
      fixture.detectChanges();

      const preview = fixture.nativeElement.querySelector('.logo-preview');
      expect(preview).toBeTruthy();
    });

    it('should render logo preview when previewUrl is set', () => {
      component.previewUrl.set('data:image/png;base64,test');
      fixture.detectChanges();

      const preview = fixture.nativeElement.querySelector('.logo-preview');
      expect(preview).toBeTruthy();
    });

    it('should display logo image with correct src from currentLogoUrl', () => {
      fixture.componentRef.setInput('currentLogoUrl', 'https://example.com/logo.png');
      fixture.detectChanges();

      const img = fixture.nativeElement.querySelector('.logo-image') as HTMLImageElement;
      expect(img).toBeTruthy();
      expect(img?.src).toBe('https://example.com/logo.png');
    });

    it('should prefer previewUrl over currentLogoUrl', () => {
      fixture.componentRef.setInput('currentLogoUrl', 'https://example.com/logo.png');
      component.previewUrl.set('data:image/png;base64,preview');
      fixture.detectChanges();

      const img = fixture.nativeElement.querySelector('.logo-image') as HTMLImageElement;
      expect(img?.src).toBe('data:image/png;base64,preview');
    });

    it('should render edit button', () => {
      fixture.componentRef.setInput('currentLogoUrl', 'https://example.com/logo.png');
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('.logo-actions button');
      const editIcon = buttons[0]?.querySelector('mat-icon')?.textContent?.trim();
      expect(editIcon).toBe('edit');
    });

    it('should render delete button', () => {
      fixture.componentRef.setInput('currentLogoUrl', 'https://example.com/logo.png');
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('.logo-actions button');
      const deleteIcon = buttons[1]?.querySelector('mat-icon')?.textContent?.trim();
      expect(deleteIcon).toBe('delete');
    });

    it('should disable edit button when uploading', () => {
      fixture.componentRef.setInput('currentLogoUrl', 'https://example.com/logo.png');
      component.isUploading.set(true);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('.logo-actions button');
      expect(buttons[0]?.hasAttribute('disabled')).toBe(true);
    });

    it('should disable delete button when deleting', () => {
      fixture.componentRef.setInput('currentLogoUrl', 'https://example.com/logo.png');
      component.isDeleting.set(true);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('.logo-actions button');
      expect(buttons[1]?.hasAttribute('disabled')).toBe(true);
    });

    it('should not render drop zone when logo preview is shown', () => {
      fixture.componentRef.setInput('currentLogoUrl', 'https://example.com/logo.png');
      fixture.detectChanges();

      const dropZone = fixture.nativeElement.querySelector('.drop-zone');
      expect(dropZone).toBeNull();
    });
  });

  describe('DOM Rendering - Upload Progress', () => {
    it('should display progress bar when uploading', () => {
      component.isUploading.set(true);
      fixture.detectChanges();

      const progress = fixture.nativeElement.querySelector('.upload-progress');
      expect(progress).toBeTruthy();

      const progressBar = progress?.querySelector('mat-progress-bar');
      expect(progressBar).toBeTruthy();
    });

    it('should display uploading text', () => {
      component.isUploading.set(true);
      fixture.detectChanges();

      const progressText = fixture.nativeElement.querySelector('.progress-text');
      expect(progressText?.textContent).toContain('Przesyłanie logo...');
    });

    it('should not display progress bar when not uploading', () => {
      component.isUploading.set(false);
      fixture.detectChanges();

      const progress = fixture.nativeElement.querySelector('.upload-progress');
      expect(progress).toBeNull();
    });
  });

  describe('DOM Rendering - Error Message', () => {
    it('should display error message when present', () => {
      component.errorMessage.set('Test error message');
      fixture.detectChanges();

      const error = fixture.nativeElement.querySelector('.error-message');
      expect(error).toBeTruthy();
      expect(error?.textContent).toContain('Test error message');
    });

    it('should display error icon', () => {
      component.errorMessage.set('Test error');
      fixture.detectChanges();

      const icon = fixture.nativeElement.querySelector('.error-message mat-icon');
      expect(icon?.textContent?.trim()).toBe('error');
    });

    it('should not display error message when null', () => {
      component.errorMessage.set(null);
      fixture.detectChanges();

      const error = fixture.nativeElement.querySelector('.error-message');
      expect(error).toBeNull();
    });
  });

  describe('Hidden File Input', () => {
    it('should render hidden file input with correct attributes', () => {
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input).toBeTruthy();
      expect(input.accept).toBe('image/png,image/jpeg');
      expect(input.classList.contains('hidden-input')).toBe(true);
    });
  });
});
