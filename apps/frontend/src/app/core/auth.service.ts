import { inject, Injectable, signal } from '@angular/core';
import type { User, Session } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from './supabase.provider';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SUPABASE_CLIENT);

  currentUser = signal<User | null>(null);
  currentSession = signal<Session | null>(null);
  isLoading = signal(true);

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    // Get initial session
    const { data } = await this.supabase.auth.getSession();
    this.currentSession.set(data.session);
    this.currentUser.set(data.session?.user ?? null);
    this.isLoading.set(false);

    // Listen for auth state changes
    this.supabase.auth.onAuthStateChange((event, session) => {
      this.currentSession.set(session);
      this.currentUser.set(session?.user ?? null);
    });
  }

  /**
   * Sign in with email and password
   */
  async signInWithEmail(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string) {
    return this.supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/login`,
      },
    });
  }

  /**
   * Sign out current user
   */
  async signOut() {
    return this.supabase.auth.signOut();
  }

  /**
   * Get current session
   */
  async getSession() {
    return this.supabase.auth.getSession();
  }

  /**
   * Send password reset email
   */
  async forgotPassword(email: string) {
    return this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
  }

  /**
   * Update user password (used after reset password link click)
   */
  async resetPassword(newPassword: string) {
    return this.supabase.auth.updateUser({ password: newPassword });
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string) {
    return this.supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/login`,
      },
    });
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentSession() !== null;
  }

  /**
   * Get user email
   */
  getUserEmail(): string | undefined {
    return this.currentUser()?.email;
  }
}
