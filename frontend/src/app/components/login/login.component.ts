import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './login.component.html',
    animations: [
        trigger('fadeIn', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(10px)' }),
                animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
            ])
        ])
    ]
})
export class LoginComponent implements OnInit {
    isLogin = true;
    name = '';
    email = '';
    password = '';
    loading = false;
    error = '';
    errorType: 'error' | 'warning' = 'error';


    emailStatus: 'idle' | 'checking' | 'available' | 'taken' = 'idle';
    private emailSubject = new Subject<string>();

    constructor(private authService: AuthService, private router: Router) {

        this.emailSubject.pipe(
            debounceTime(500),
            distinctUntilChanged(),
            switchMap(email => {
                if (!email || this.isLogin) return [];
                this.emailStatus = 'checking';
                return this.authService.checkAvailability(email);
            })
        ).subscribe({
            next: (response: any) => {

                this.emailStatus = response.isAvailable ? 'available' : 'taken';
            },
            error: () => this.emailStatus = 'idle'
        });
    }

    ngOnInit() {
        if (this.authService.isAuthenticated()) {
            this.router.navigate(['/dashboard']);
        }
    }

    onEmailInput(email: string) {
        if (!this.isLogin) {
            this.emailSubject.next(email);
        }
    }

    toggleMode() {
        this.isLogin = !this.isLogin;
        this.error = '';
        this.emailStatus = 'idle';
    }

    onSubmit() {
        this.loading = true;
        this.error = '';

        if (this.isLogin) {
            this.authService.login(this.email, this.password).subscribe({
                next: () => {
                    this.router.navigate(['/dashboard']);
                },
                error: (err) => {
                    this.error = err.error.message || 'Login failed';
                    this.errorType = 'error';
                    this.loading = false;
                }
            });
        } else {

            if (this.emailStatus === 'taken') {
                this.error = 'Please use a different email address.';
                this.errorType = 'warning';
                this.loading = false;
                return;
            }

            this.authService.signup(this.name, this.email, this.password).subscribe({
                next: () => {
                    this.isLogin = true;
                    this.error = 'Account created successfully! Please login.';
                    this.errorType = 'warning';
                    this.loading = false;
                },
                error: (err) => {
                    this.error = err.error.message || 'Signup failed';
                    this.errorType = err.status === 409 ? 'warning' : 'error';
                    this.loading = false;
                }
            });
        }
    }
}
