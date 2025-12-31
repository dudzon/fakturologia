import { inject, Injectable, signal } from "@angular/core";
import type { User, Session } from "@supabase/supabase-js";
import { SUPABASE_CLIENT } from "./supabase.provider";

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly supabase = inject(SUPABASE_CLIENT);

  currentUser = signal<User | null>(null);
  currentSession = signal<Session | null>(null);

  constructor() {
    this.supabase.auth.onAuthStateChange((event, session) => {
      this.currentSession.set(session);
      this.currentUser.set(session?.user ?? null);
    });
  }

  async signInWithEmail(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  async signUp(email: string, password: string) {
    return this.supabase.auth.signUp({ email, password });
  }

  async signOut() {
    return this.supabase.auth.signOut();
  }

  async getSession() {
    return this.supabase.auth.getSession();
  }
}
