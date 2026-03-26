import { Routes } from '@angular/router';
import { LegalPrivacy } from './components/legal-privacy/legal-privacy';
import { LegalTerms } from './components/legal-terms/legal-terms';
import { Support } from './components/support/support';
import { LandingComponent } from './components/landing-component/landing-component';
import { Dashboard } from './pages/dashboard/dashboard';
import { Login } from './pages/login/login';


export const routes: Routes = [
    { path: '', component: LandingComponent },
    { path: 'login', component: Login },
    { path: 'dashboard', component: Dashboard },
    { path: 'privacy', component: LegalPrivacy },
    { path: 'terms', component: LegalTerms },
    { path: 'support', component: Support },
    { path: '**', redirectTo: ''},
];
