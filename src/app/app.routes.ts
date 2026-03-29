import { Routes } from '@angular/router';
import { LegalPrivacy } from './components/legal-privacy/legal-privacy';
import { LegalTerms } from './components/legal-terms/legal-terms';
import { Support } from './components/support/support';
import { LandingComponent } from './components/landing-component/landing-component';
import { Dashboard } from './pages/dashboard/dashboard';
import { Login } from './pages/login/login';
import { authGuard } from './auth-guard';
import { DashboardTest } from './pages/dashboard-test/dashboard-test';

export const routes: Routes = [
  { path: 'dashboard-test', component: DashboardTest },

  { path: '', component: LandingComponent },
  { path: 'login', component: Login, pathMatch: 'full' },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },

  { path: 'privacy', component: LegalPrivacy },
  { path: 'terms', component: LegalTerms },
  { path: 'support', component: Support },

  { path: '**', redirectTo: '' },
];
