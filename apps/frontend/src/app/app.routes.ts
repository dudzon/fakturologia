import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { canDeactivateGuard } from './core/guards/can-deactivate.guard';
import { profileCompleteGuard } from './core/guards/profile-complete.guard';

export const routes: Routes = [
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

