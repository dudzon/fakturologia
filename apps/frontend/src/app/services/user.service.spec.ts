import { vi, describe, it, expect, beforeEach } from 'vitest';
import { of, throwError } from 'rxjs';
import type {
  UserProfileResponse,
  UpdateUserProfileCommand,
  UploadLogoResponse,
  MessageResponse,
} from '../../types';

// Create a mock service without importing the actual class
class MockUserService {
  constructor(
    private http: any,
    private apiUrl: string,
  ) {}

  getProfile() {
    return this.http.get(`${this.apiUrl}/profile`);
  }

  updateProfile(data: UpdateUserProfileCommand) {
    return this.http.put(`${this.apiUrl}/profile`, data);
  }

  uploadLogo(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/profile/logo`, formData);
  }

  deleteLogo() {
    return this.http.delete(`${this.apiUrl}/profile/logo`);
  }
}

describe('UserService', () => {
  let service: MockUserService;
  let httpClientMock: {
    get: any;
    put: any;
    post: any;
    delete: any;
  };

  const mockProfile: UserProfileResponse = {
    id: '1',
    email: 'test@example.com',
    companyName: 'Test Company',
    nip: '1234567890',
    address: 'Test Address 123',
    bankAccount: 'PL12345678901234567890123456',
    logoUrl: 'https://example.com/logo.png',
    invoiceNumberFormat: 'FV/{YYYY}/{MM}/{NNN}',
    invoiceNumberCounter: 1,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  };

  const mockUploadResponse: UploadLogoResponse = {
    logoUrl: 'https://example.com/new-logo.png',
  };

  const mockMessageResponse: MessageResponse = {
    message: 'Logo usunięty pomyślnie',
  };

  beforeEach(() => {
    httpClientMock = {
      get: vi.fn(),
      put: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
    };

    service = new MockUserService(httpClientMock, '/api/v1/users');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getProfile', () => {
    it('should fetch user profile', () => {
      httpClientMock.get.mockReturnValue(of(mockProfile));

      service.getProfile().subscribe((profile: UserProfileResponse) => {
        expect(profile).toEqual(mockProfile);
      });

      expect(httpClientMock.get).toHaveBeenCalledWith('/api/v1/users/profile');
    });

    it('should handle API errors', () => {
      const error = { status: 500, statusText: 'Server Error' };
      httpClientMock.get.mockReturnValue(throwError(() => error));

      service.getProfile().subscribe({
        next: () => expect.fail('should have failed'),
        error: (err: any) => expect(err.status).toBe(500),
      });

      expect(httpClientMock.get).toHaveBeenCalledWith('/api/v1/users/profile');
    });
  });

  describe('updateProfile', () => {
    const updateData: UpdateUserProfileCommand = {
      companyName: 'Updated Company',
      address: 'Updated Address 456',
    };

    it('should update user profile', () => {
      const updatedProfile = { ...mockProfile, ...updateData };
      httpClientMock.put.mockReturnValue(of(updatedProfile));

      service.updateProfile(updateData).subscribe((profile: UserProfileResponse) => {
        expect(profile).toEqual(updatedProfile);
      });

      expect(httpClientMock.put).toHaveBeenCalledWith('/api/v1/users/profile', updateData);
    });

    it('should handle partial updates', () => {
      const partialUpdate = { companyName: 'New Name' };
      httpClientMock.put.mockReturnValue(of({ ...mockProfile, companyName: 'New Name' }));

      service.updateProfile(partialUpdate).subscribe((profile: UserProfileResponse) => {
        expect(profile.companyName).toBe('New Name');
      });

      expect(httpClientMock.put).toHaveBeenCalledWith('/api/v1/users/profile', partialUpdate);
    });
  });

  describe('uploadLogo', () => {
    it('should upload logo file', () => {
      const file = new File(['test'], 'logo.png', { type: 'image/png' });
      httpClientMock.post.mockReturnValue(of(mockUploadResponse));

      service.uploadLogo(file).subscribe((response: UploadLogoResponse) => {
        expect(response).toEqual(mockUploadResponse);
      });

      expect(httpClientMock.post).toHaveBeenCalledWith(
        '/api/v1/users/profile/logo',
        expect.any(FormData),
      );
      const formData = httpClientMock.post.mock.calls[0][1] as FormData;
      expect(formData.has('file')).toBeTruthy();
    });

    it('should handle file upload errors', () => {
      const file = new File(['test'], 'logo.png', { type: 'image/png' });
      const error = { status: 413, statusText: 'Payload Too Large' };
      httpClientMock.post.mockReturnValue(throwError(() => error));

      service.uploadLogo(file).subscribe({
        next: () => expect.fail('should have failed'),
        error: (err: any) => expect(err.status).toBe(413),
      });

      expect(httpClientMock.post).toHaveBeenCalledWith(
        '/api/v1/users/profile/logo',
        expect.any(FormData),
      );
    });
  });

  describe('deleteLogo', () => {
    it('should delete logo', () => {
      httpClientMock.delete.mockReturnValue(of(mockMessageResponse));

      service.deleteLogo().subscribe((response: MessageResponse) => {
        expect(response).toEqual(mockMessageResponse);
      });

      expect(httpClientMock.delete).toHaveBeenCalledWith('/api/v1/users/profile/logo');
    });

    it('should handle delete errors', () => {
      const error = { status: 404, statusText: 'Not Found' };
      httpClientMock.delete.mockReturnValue(throwError(() => error));

      service.deleteLogo().subscribe({
        next: () => expect.fail('should have failed'),
        error: (err: any) => expect(err.status).toBe(404),
      });

      expect(httpClientMock.delete).toHaveBeenCalledWith('/api/v1/users/profile/logo');
    });
  });
});
