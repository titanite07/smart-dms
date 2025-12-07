import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LandingComponent } from './components/landing/landing.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { ActivityLogComponent } from './components/activity-log/activity-log.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { PublicViewComponent } from './components/public-view/public-view.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: '', component: LandingComponent, data: { animation: 'LandingPage' } },
    { path: 'login', component: LoginComponent, data: { animation: 'LoginPage' } },
    { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard], data: { animation: 'DashboardPage' } },
    { path: 'profile', component: UserProfileComponent, canActivate: [authGuard], data: { animation: 'ProfilePage' } },
    { path: 'activity', component: ActivityLogComponent, canActivate: [authGuard], data: { animation: 'ActivityPage' } },
    { path: 'admin', component: AdminDashboardComponent, canActivate: [authGuard], data: { animation: 'AdminPage' } },
    { path: 'public/:token', component: PublicViewComponent },
    { path: '**', redirectTo: '' }
];
