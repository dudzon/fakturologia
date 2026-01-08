import { InjectionToken, Provider } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@fakturologia/shared';
import { environment } from '../../environments/environment';

export const SUPABASE_CLIENT = new InjectionToken<SupabaseClient<Database>>('SupabaseClient');

export function provideSupabase(): Provider {
  return {
    provide: SUPABASE_CLIENT,
    useFactory: () => createClient<Database>(environment.supabaseUrl, environment.supabaseKey),
  };
}
