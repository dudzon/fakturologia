import { inject, Injectable } from '@angular/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@fakturologia/shared';
import { SUPABASE_CLIENT } from './supabase.provider';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private readonly supabase: SupabaseClient<Database> = inject(SUPABASE_CLIENT);

  get client(): SupabaseClient<Database> {
    return this.supabase;
  }

  from<T extends keyof Database['public']['Tables']>(table: T) {
    return this.supabase.from(table as any);
  }
}
