import { ApplicationConfig, provideBrowserGlobalErrorListeners, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { registerLocaleData } from '@angular/common';
import localePl from '@angular/common/locales/pl';

registerLocaleData(localePl);

import { MatPaginatorIntl } from '@angular/material/paginator';
import { routes } from './app.routes';
import { provideSupabase } from './core/supabase.provider';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';
import { PolishMatPaginatorIntl } from './core/i18n/mat-paginator-intl';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    provideSupabase(),
    { provide: LOCALE_ID, useValue: 'pl' },
    { provide: MatPaginatorIntl, useClass: PolishMatPaginatorIntl },
    { provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: { verticalPosition: 'top', duration: 300000000 } },
  ],
};
