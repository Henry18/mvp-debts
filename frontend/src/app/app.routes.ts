import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'deudas',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/debts/debt-list/debt-list.component').then(
        (m) => m.DebtListComponent
      ),
  },
  {
    path: 'deudas/nueva',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/debts/debt-form/debt-form.component').then(
        (m) => m.DebtFormComponent
      ),
  },
  {
    path: 'deudas/pendings',
    canActivate: [authGuard],
    data: { debtStatus: 'PENDING' },
    loadComponent: () =>
      import('./features/debts/debt-list/debt-list.component').then(
        (m) => m.DebtListComponent
      ),
  },
  {
    path: 'deudas/paids',
    canActivate: [authGuard],
    data: { debtStatus: 'PAID' },
    loadComponent: () =>
      import('./features/debts/debt-list/debt-list.component').then(
        (m) => m.DebtListComponent
      ),
  },
  {
    path: 'deudas/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/debts/debt-detail/debt-detail.component').then(
        (m) => m.DebtDetailComponent
      ),
  },
  { path: '', pathMatch: 'full', redirectTo: 'deudas' },
  { path: '**', redirectTo: 'deudas' },
];
