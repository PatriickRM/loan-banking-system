import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AuthResponse,
  AuthUser,
  DecodedToken,
  LoginRequest,
  RegisterRequest,
  UserRole,
} from '../models/auth.models';

const TOKEN_KEY = 'lbs_access_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly baseUrl = `${environment.apiUrl}/api/auth`;

  private readonly _token = signal<string | null>(this.loadStoredToken());
  private readonly _user = signal<AuthUser | null>(this.loadStoredUser());

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token() && !this.isTokenExpired());
  readonly currentRoles = computed(() => this._user()?.roles ?? []);

  readonly isAdmin = computed(() => this.hasRole('ADMIN'));
  readonly isAnalista = computed(() => this.hasRole('ANALISTA'));
  readonly isCliente = computed(() => this.hasRole('CLIENTE'));

  // ── Login ───────────────────────────────────────────────────────────────
  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, request).pipe(
      tap((response) => this.handleAuthSuccess(response)),
      catchError((error) => {
        const message =
          error.error?.message ||
          error.error?.error ||
          'Credenciales inválidas';
        return throwError(() => new Error(message));
      })
    );
  }

  // ── Register ────────────────────────────────────────────────────────────
  register(request: RegisterRequest): Observable<string> {
    return this.http.post(`${this.baseUrl}/register`, request, { responseType: 'text' }).pipe(
      catchError((error) => {
        const message =
          error.error?.message ||
          error.error ||
          'Error en el registro';
        return throwError(() => new Error(message));
      })
    );
  }

  // ── Resend verification email ───────────────────────────────────────────
  resendVerification(email: string): Observable<string> {
    return this.http.post(
      `${this.baseUrl}/resend-verification`,
      null,
      { params: { email }, responseType: 'text' }
    );
  }

  // ── Verify email token ──────────────────────────────────────────────────
  verifyEmail(token: string): Observable<string> {
    return this.http.get(`${this.baseUrl}/verify`, {
      params: { token },
      responseType: 'text',
    });
  }

  // ── Logout ──────────────────────────────────────────────────────────────
  logout(): void {
    this.clearAuth();
    this.router.navigate(['/auth/login']);
  }
  
  handleOAuthToken(token: string): void {
  try {
    const decoded = this.decodeToken(token);

    const roles = (decoded.roles ?? []).map((r: string) =>
      r.startsWith('ROLE_') ? (r.replace('ROLE_', '') as UserRole) : (r as UserRole)
    );

    const user: AuthUser = {
      username: decoded.sub,
      email: decoded.email ?? '',
      roles,
      customerId: decoded.customerId ?? null,
      userId: decoded.userId ?? null,
    };

    this._token.set(token);
    this._user.set(user);

    localStorage.setItem('lbs_access_token', token);
    localStorage.setItem('lbs_user', JSON.stringify(user));
  } catch (e) {
    throw new Error('Token OAuth2 inválido');
  }
}

  // ── Role helpers ────────────────────────────────────────────────────────
  hasRole(role: UserRole): boolean {
    return this.currentRoles().includes(role);
  }

  hasAnyRole(...roles: UserRole[]): boolean {
    return roles.some((r) => this.hasRole(r));
  }

  // ── Token accessors ─────────────────────────────────────────────────────
  getToken(): string | null {
    return this._token();
  }

  isTokenExpired(): boolean {
    const token = this._token();
    if (!token) return true;
    try {
      const payload = this.decodeToken(token);
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }

  // ── Route redirect based on role ────────────────────────────────────────
  redirectToDashboard(): void {
    const roles = this.currentRoles();
    if (roles.includes('ADMIN')) {
      this.router.navigate(['/dashboard/admin']);
    } else if (roles.includes('ANALISTA')) {
      this.router.navigate(['/dashboard/analista']);
    } else if (roles.includes('CLIENTE')) {
      this.router.navigate(['/dashboard/cliente']);
    } else {
      this.router.navigate(['/auth/login']);
    }
  }

  // ── Private helpers ─────────────────────────────────────────────────────
  private handleAuthSuccess(response: AuthResponse): void {
    const decoded = this.decodeToken(response.token);

    // Normalize roles: backend may send "ROLE_CLIENTE" or "CLIENTE"
    const roles = (decoded.roles ?? response.roles ?? []).map((r) =>
      r.startsWith('ROLE_') ? (r.replace('ROLE_', '') as UserRole) : (r as UserRole)
    );

    const user: AuthUser = {
      username: response.username,
      email: response.email,
      roles,
      customerId: decoded.customerId ?? null,
      userId: decoded.userId ?? null,
    };

    this._token.set(response.token);
    this._user.set(user);

    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem('lbs_user', JSON.stringify(user));
  }

  private clearAuth(): void {
    this._token.set(null);
    this._user.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('lbs_user');
  }

  private loadStoredToken(): string | null {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    // Discard expired tokens on startup
    try {
      const payload = this.decodeToken(token);
      if (Date.now() >= payload.exp * 1000) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem('lbs_user');
        return null;
      }
    } catch {
      return null;
    }
    return token;
  }

  private loadStoredUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem('lbs_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  // Manual JWT decode — no external dependency needed for payload reading
  private decodeToken(token: string): DecodedToken {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid JWT');
    const payload = parts[1];
    // Base64url → Base64
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json) as DecodedToken;
  }
}