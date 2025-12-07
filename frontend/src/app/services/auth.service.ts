import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

interface AuthResponse {
    _id: string;
    name: string;
    email: string;
    token: string;
}

interface UserProfile {
    _id: string;
    name: string;
    email: string;
    createdAt: string;
    updatedAt: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = `${environment.apiUrl}/auth`;
    private currentUserSubject = new BehaviorSubject<any>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor(private http: HttpClient) {
        const user = this.getUserFromStorage();
        if (user) {
            this.currentUserSubject.next(user);
        }
    }

    private getAuthHeaders(): HttpHeaders {
        const token = this.getToken();
        return new HttpHeaders().set('Authorization', `Bearer ${token}`);
    }

    signup(name: string, email: string, password: string): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/signup`, { name, email, password })
            .pipe(
                tap(response => this.setUser(response))
            );
    }

    login(email: string, password: string): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password })
            .pipe(
                tap(response => this.setUser(response))
            );
    }

    checkAvailability(email: string): Observable<{ isAvailable: boolean }> {
        return this.http.post<{ isAvailable: boolean }>(`${this.apiUrl}/check`, { email });
    }

    getProfile(): Observable<UserProfile> {
        return this.http.get<UserProfile>(`${this.apiUrl}/profile`, { headers: this.getAuthHeaders() });
    }

    updateProfile(data: { name?: string; email?: string; currentPassword?: string; newPassword?: string }): Observable<AuthResponse> {
        return this.http.put<AuthResponse>(`${this.apiUrl}/profile`, data, { headers: this.getAuthHeaders() })
            .pipe(
                tap(response => this.setUser(response))
            );
    }

    deleteAccount(password: string): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.apiUrl}/account`, {
            headers: this.getAuthHeaders(),
            body: { password }
        });
    }

    logout(): void {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        this.currentUserSubject.next(null);
    }

    getToken(): string | null {
        return localStorage.getItem('token');
    }

    isAuthenticated(): boolean {
        return !!this.getToken();
    }

    private setUser(response: AuthResponse): void {
        localStorage.setItem('user', JSON.stringify(response));
        localStorage.setItem('token', response.token);
        this.currentUserSubject.next(response);
    }

    private getUserFromStorage(): any {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }
}
