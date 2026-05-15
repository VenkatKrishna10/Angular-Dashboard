import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./user-dashboard/user-dashboard.routes').then(m => m.USER_DASHBOARD_ROUTES)
  }
];