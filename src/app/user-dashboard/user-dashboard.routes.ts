
import { Route } from '@angular/router';
import { UserDashboardComponent } from './user-dashboard';

export const USER_DASHBOARD_ROUTES: Route[] = [
  { path: '', component: UserDashboardComponent },
  {
    path: 'add-user',
    loadComponent: () => import('../user-form/user-form').then(m => m.UserFormComponent)
  }
];