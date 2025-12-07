import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Clerk } from '@clerk/clerk-js';
import { from, Observable, BehaviorSubject, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class ClerkService {
    private clerk: Clerk | undefined;
    private clerkLoaded = new BehaviorSubject<boolean>(false);
    public user$ = new BehaviorSubject<any>(null);

    constructor(private http: HttpClient, private authService: AuthService) {
        this.initializeClerk();
    }

    private async initializeClerk() {
        const publishableKey = environment.clerkPublishableKey;
        if (!publishableKey || publishableKey.includes('REPLACE')) {
            console.error('Clerk Publishable Key is missing or invalid in environment.ts');
            return;
        }

        try {
            this.clerk = new Clerk(publishableKey);
            await this.clerk.load();
            this.clerkLoaded.next(true);

            if (this.clerk.user) {
                this.user$.next(this.clerk.user);
                this.syncUserWithBackend();
            }

            this.clerk.addListener((payload: any) => {
                this.user$.next(payload.user);
                if (payload.user) {
                    this.syncUserWithBackend();
                }
            });
        } catch (err) {
            console.error('Failed to load Clerk', err);
        }
    }

    mountSignIn(container: HTMLDivElement) {
        this.clerkLoaded.subscribe(loaded => {
            if (loaded && this.clerk) {
                this.clerk.mountSignIn(container, {
                    appearance: {
                        variables: { colorPrimary: '#000000' }
                    },
                    signUpUrl: '/sign-up',
                    routing: 'path',
                    path: '/login'
                });
            }
        });
    }

    mountSignUp(container: HTMLDivElement) {
        this.clerkLoaded.subscribe(loaded => {
            if (loaded && this.clerk) {
                this.clerk.mountSignUp(container, {
                    appearance: {
                        variables: { colorPrimary: '#000000' }
                    },
                    signInUrl: '/login',
                    routing: 'path',
                    path: '/sign-up'
                });
            }
        });
    }

    mountUserButton(container: HTMLDivElement) {
        this.clerkLoaded.subscribe(loaded => {
            if (loaded && this.clerk) {
                this.clerk.mountUserButton(container);
            }
        });
    }

    async signOut() {
        if (this.clerk) {
            await this.clerk.signOut();
        }
    }

    getToken(): Observable<string | null> {
        if (!this.clerk?.session) {
            return from(Promise.resolve(null));
        }
        return from(this.clerk.session.getToken());
    }

    private syncUserWithBackend() {
        if (!this.clerk || !this.clerk.user) return;

        const user = this.clerk.user;
        const email = user.primaryEmailAddress?.emailAddress;
        const name = user.fullName || user.firstName;

        this.getToken().pipe(
            switchMap(token => {
                if (!token) return from(Promise.resolve(null));
                return this.http.post(`${environment.apiUrl}/auth/sync`, {
                    email: email,
                    name: name
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            })
        ).subscribe({
            next: (res: any) => {
                if (res && res.token) {
                    localStorage.setItem('token', res.token);
                    localStorage.setItem('user', JSON.stringify(res));
                }
            },
            error: (err) => console.error('Backend Sync Failed', err)
        });
    }
}
