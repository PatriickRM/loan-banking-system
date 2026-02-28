import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

/**
 * Ruta: /oauth2/redirect
 *
 * OAuth2SuccessHandler (backend) redirige aquí con:
 *   ?token=JWT&expiresIn=86400
 *
 * Este componente guarda el token y redirige al dashboard según el rol.
 */
@Component({
  selector: 'app-oauth2-redirect',
  imports: [],
  template: `
    <div class="oauth-redirect-shell">
      <div class="oauth-redirect-card">
        @if (error) {
          <div class="oauth-error">
            <span class="oauth-error-icon">✕</span>
            <h2>Error de autenticación</h2>
            <p>{{ error }}</p>
            <a href="/auth/login" class="btn btn-primary">Volver al login</a>
          </div>
        } @else {
          <div class="oauth-loading">
            <div class="oauth-spinner"></div>
            <p>Autenticando con {{ provider }}…</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .oauth-redirect-shell {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-void);
    }
    .oauth-redirect-card {
      text-align: center;
      padding: 48px;
    }
    .oauth-spinner {
      width: 40px; height: 40px;
      border: 3px solid var(--border-dim);
      border-top-color: var(--accent-bright);
      border-radius: 50%;
      animation: spin .8s linear infinite;
      margin: 0 auto 16px;
    }
    .oauth-redirect-card p { color: var(--text-secondary); }
    .oauth-error { display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .oauth-error-icon {
      width: 48px; height: 48px;
      background: rgba(239,68,68,.15);
      color: #ef4444;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 20px;
      margin: 0 auto;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class OAuth2RedirectComponent implements OnInit {
  private readonly route       = inject(ActivatedRoute);
  private readonly router      = inject(Router);
  private readonly authService = inject(AuthService);

  error    = '';
  provider = '';

  ngOnInit(): void {
    const params     = this.route.snapshot.queryParamMap;
    const token      = params.get('token');
    const expiresIn  = params.get('expiresIn');
    const errorParam = params.get('error');

    // ── Error desde el backend ──────────────────────────────────────
    if (errorParam || !token) {
      this.error = errorParam === 'oauth2_failed'
        ? 'El proveedor rechazó la autenticación. Intentá de nuevo.'
        : 'No se recibió un token válido.';
      return;
    }

    // ── Detectar proveedor para el mensaje visual ───────────────────
    this.provider = this.detectProvider();

    // ── Guardar token y redirigir ───────────────────────────────────
    try {
      this.authService.saveOAuth2Token(token, Number(expiresIn ?? 86400));
      this.authService.redirectToDashboard();
    } catch {
      this.error = 'Error al procesar el token. Intentá iniciar sesión nuevamente.';
    }
  }

  private detectProvider(): string {
    // El referrer del browser suele indicar el proveedor
    const ref = document.referrer.toLowerCase();
    if (ref.includes('google')) return 'Google';
    if (ref.includes('github')) return 'GitHub';
    return 'tu cuenta';
  }
}