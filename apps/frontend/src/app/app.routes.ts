import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { canDeactivateGuard } from './core/guards/can-deactivate.guard';
import { profileCompleteGuard } from './core/guards/profile-complete.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  // Landing Page (public)
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/landing/landing-page.component').then(
        (m) => m.LandingPageComponent
      ),
    canActivate: [guestGuard],
    title: 'Fakturologia - Proste fakturowanie dla freelancerów'
  },

  // Auth routes (public - guest only)
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login.component').then(
            (m) => m.LoginComponent
          ),
        title: 'Logowanie - Fakturologia'
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register.component').then(
            (m) => m.RegisterComponent
          ),
        title: 'Rejestracja - Fakturologia'
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./features/auth/forgot-password.component').then(
            (m) => m.ForgotPasswordComponent
          ),
        title: 'Zapomniałem hasła - Fakturologia'
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('./features/auth/reset-password.component').then(
            (m) => m.ResetPasswordComponent
          ),
        title: 'Resetuj hasło - Fakturologia'
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      }
    ]
  },

  // Invoices routes (protected) - Main dashboard
  {
    path: 'invoices',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/invoices/invoice-list.component').then(
            (m) => m.InvoiceListComponent
          ),
        title: 'Faktury - Fakturologia'
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./features/invoices/invoice-form.component').then(
            (m) => m.InvoiceFormComponent
          ),
        canActivate: [profileCompleteGuard],
        canDeactivate: [canDeactivateGuard],
        title: 'Nowa faktura - Fakturologia'
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./features/invoices/invoice-detail.component').then(
            (m) => m.InvoiceDetailComponent
          ),
        title: 'Szczegóły faktury - Fakturologia'
      },
      {
        path: ':id/edit',
        loadComponent: () =>
          import('./features/invoices/invoice-form.component').then(
            (m) => m.InvoiceFormComponent
          ),
        canDeactivate: [canDeactivateGuard],
        title: 'Edycja faktury - Fakturologia'
      }
    ]
  },

  // Contractors routes (protected)
  {
    path: 'contractors',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/contractors/contractor-list.component').then(
            (m) => m.ContractorListComponent
          ),
        title: 'Kontrahenci - Fakturologia'
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./features/contractors/contractor-form.component').then(
            (m) => m.ContractorFormComponent
          ),
        canDeactivate: [canDeactivateGuard],
        title: 'Nowy kontrahent - Fakturologia'
      },
      {
        path: ':id/edit',
        loadComponent: () =>
          import('./features/contractors/contractor-form.component').then(
            (m) => m.ContractorFormComponent
          ),
        canDeactivate: [canDeactivateGuard],
        title: 'Edycja kontrahenta - Fakturologia'
      }
    ]
  },

  // Profile route (protected)
  {
    path: 'profile',
    loadComponent: () =>
      import('./features/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard],
    canDeactivate: [canDeactivateGuard],
    title: 'Profil firmy - Fakturologia'
  },

  // 404 Not Found (catch-all, must be last)
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then(m => m.NotFoundComponent),
    title: '404 - Strona nie znaleziona - Fakturologia'
  }
];

