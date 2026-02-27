import { Component, OnInit, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-oauth-redirect',
  standalone: true,
  template: `
    <div class="redirect-shell">
      <div class="redirect-card anim-fade-up">
        <div class="redirect-icon">
          @if (error()) {
            <span class="error-mark">✕</span>
          } @else {
            <span class="spinner-lg"></span>
          }
        </div>
        <div class="redirect-label mono">
          {{ error() ? 'ERROR DE AUTENTICACIÓN' : 'PROCESANDO ACCESO' }}
        </div>
        <p class="redirect-msg text-secondary">
          {{ error() || 'Verificando credenciales...' }}
        </p>
        @if (error()) {
          <a routerLink="/auth/login" class="btn btn-primary" style="margin-top:20px;">
            Volver al login
          </a>
        }
      </div>
    </div>
  `,
  styles: [`
    .redirect-shell {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-void);
    }

    .redirect-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      text-align: center;
      padding: 48px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-xl);
      min-width: 320px;
    }

    .redirect-icon {
      width: 64px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .spinner-lg {
      width: 44px;
      height: 44px;
      border: 3px solid var(--border-subtle);
      border-top-color: var(--accent-bright);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: block;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .error-mark {
      font-size: 32px;
      color: var(--danger);
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--danger-dim);
      border: 2px solid rgba(239,68,68,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .redirect-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: var(--accent-bright);
    }

    .redirect-msg {
      font-size: 14px;
      max-width: 260px;
    }
  `],
  imports: [],
})
export class OAuthRedirectComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  error = () => this._error;
  private _error = '';

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    const errorParam = this.route.snapshot.queryParamMap.get('error');

    if (errorParam) {
      this._error = 'La autenticación con el proveedor falló. Intentá de nuevo.';
      return;
    }

    if (!token) {
      this._error = 'No se recibió token de autenticación.';
      return;
    }

    try {
      this.authService.handleOAuthToken(token);
      this.authService.redirectToDashboard();
    } catch {
      this._error = 'Token inválido recibido del proveedor OAuth.';
    }
  }
}