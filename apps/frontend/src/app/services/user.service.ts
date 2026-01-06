import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  UserProfileResponse,
  UpdateUserProfileCommand,
  UploadLogoResponse,
  MessageResponse
} from '../../types';
import { environment } from '../../environments/environment';

/**
 * Service for user profile HTTP operations.
 * Handles all profile-related API calls including logo management.
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/v1/users`;

  /**
   * GET /api/v1/users/profile
   * Fetches the current user's profile data.
   */
  getProfile(): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(`${this.apiUrl}/profile`);
  }

  /**
   * PUT /api/v1/users/profile
   * Updates the user's profile with partial data.
   */
  updateProfile(data: UpdateUserProfileCommand): Observable<UserProfileResponse> {
    return this.http.put<UserProfileResponse>(`${this.apiUrl}/profile`, data);
  }

  /**
   * POST /api/v1/users/profile/logo
   * Uploads a new company logo (PNG/JPG, max 2MB).
   */
  uploadLogo(file: File): Observable<UploadLogoResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UploadLogoResponse>(`${this.apiUrl}/profile/logo`, formData);
  }

  /**
   * DELETE /api/v1/users/profile/logo
   * Removes the current company logo.
   */
  deleteLogo(): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.apiUrl}/profile/logo`);
  }
}
