import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-shell">
      <!-- Left panel: branding -->
      <aside class="auth-brand">
        <div class="brand-inner">
          <div class="brand-mark">
            <span class="brand-icon">⬡</span>
            <span class="brand-name">LBS</span>
          </div>
          <div class="brand-tagline">
            <h1>Loan Banking<br>System</h1>
            <p class="text-secondary">Plataforma integral de gestión<br>de préstamos y créditos.</p>
          </div>
          <div class="brand-grid" aria-hidden="true">
            @for (item of gridItems; track $index) {
              <div class="grid-cell" [style.opacity]="item"></div>
            }
          </div>
        </div>
      </aside>

      <!-- Right panel: form -->
      <main class="auth-form-panel">
        <div class="auth-form-inner anim-fade-up">

          <header class="form-header">
            <div class="form-label mono">ACCESO AL SISTEMA</div>
            <h2>Iniciar sesión</h2>
            <p class="text-secondary">Ingresá tus credenciales para continuar.</p>
          </header>

          @if (errorMessage()) {
            <div class="alert alert-error" role="alert">{{ errorMessage() }}</div>
          }

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-body" novalidate>
            <div class="field">
              <label for="username">Usuario</label>
              <input
                id="username"
                type="text"
                formControlName="username"
                placeholder="tu_usuario"
                autocomplete="username"
              />
              @if (f['username'].invalid && f['username'].touched) {
                <span class="error-msg">Campo requerido</span>
              }
            </div>

            <div class="field">
              <label for="password">Contraseña</label>
              <div class="input-wrapper">
                <input
                  id="password"
                  [type]="showPass() ? 'text' : 'password'"
                  formControlName="password"
                  placeholder="••••••••"
                  autocomplete="current-password"
                />
                <button
                  type="button"
                  class="input-action"
                  (click)="showPass.set(!showPass())"
                  [attr.aria-label]="showPass() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                >
                  {{ showPass() ? '⊗' : '⊕' }}
                </button>
              </div>
              @if (f['password'].invalid && f['password'].touched) {
                <span class="error-msg">Campo requerido</span>
              }
            </div>

            <button
              type="submit"
              class="btn btn-primary btn-full"
              [disabled]="loading() || form.invalid"
            >
              @if (loading()) {
                <span class="spinner"></span> Verificando...
              } @else {
                Ingresar
              }
            </button>
          </form>

          <!-- Divider -->
          <div class="oauth-divider">
            <span class="divider-line"></span>
            <span class="divider-text mono">O CONTINUÁ CON</span>
            <span class="divider-line"></span>
          </div>

          <!-- OAuth buttons -->
          <div class="oauth-buttons">
            <a [href]="googleOAuthUrl" class="oauth-btn oauth-google">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Google
            </a>
            <a [href]="githubOAuthUrl" class="oauth-btn oauth-github">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </a>
          </div>

          <footer class="form-footer">
            <span class="text-muted">¿No tenés cuenta?</span>
            <a routerLink="/auth/register" class="link-accent">Registrarse</a>
          </footer>

        </div>
      </main>
    </div>
  `,
  styles: [`
    .auth-shell {
      display: grid;
      grid-template-columns: 1fr 1fr;
      min-height: 100vh;
    }

    .auth-brand {
      background: var(--bg-surface);
      border-right: 1px solid var(--border-dim);
      position: relative;
      overflow: hidden;
    }

    .brand-inner {
      position: relative;
      z-index: 1;
      padding: 48px;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .brand-mark {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-icon {
      font-size: 28px;
      color: var(--accent-bright);
      filter: drop-shadow(0 0 12px var(--accent-glow));
    }

    .brand-name {
      font-family: var(--font-mono);
      font-size: 18px;
      font-weight: 500;
      letter-spacing: 0.15em;
      color: var(--text-primary);
    }

    .brand-tagline h1 {
      font-size: clamp(32px, 3.5vw, 52px);
      font-weight: 800;
      margin-bottom: 16px;
      line-height: 1.1;
    }

    .brand-grid {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 6px;
      margin-top: auto;
    }

    .grid-cell {
      aspect-ratio: 1;
      background: var(--accent-bright);
      border-radius: 2px;
    }

    .auth-form-panel {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px 32px;
      background: var(--bg-void);
    }

    .auth-form-inner {
      width: 100%;
      max-width: 400px;
    }

    .form-header { margin-bottom: 32px; }

    .form-label {
      font-size: 11px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--accent-bright);
      margin-bottom: 10px;
    }

    .form-header h2 { font-size: 26px; margin-bottom: 8px; }

    .form-body {
      display: flex;
      flex-direction: column;
      gap: 20px;
      margin-top: 24px;
    }

    .input-wrapper { position: relative; }

    .input-wrapper input {
      width: 100%;
      padding: 10px 40px 10px 14px;
      background: var(--bg-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      color: var(--text-primary);
      font-family: var(--font-display);
      font-size: 14px;
      outline: none;
      transition: border-color var(--t-fast), box-shadow var(--t-fast);
    }

    .input-wrapper input:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-dim);
    }

    .input-action {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 16px;
      padding: 0;
      line-height: 1;
      transition: color var(--t-fast);
    }

    .input-action:hover { color: var(--text-secondary); }

    /* OAuth divider */
    .oauth-divider {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 24px 0 16px;
    }

    .divider-line {
      flex: 1;
      height: 1px;
      background: var(--border-dim);
    }

    .divider-text {
      font-size: 10px;
      letter-spacing: 0.12em;
      color: var(--text-muted);
      white-space: nowrap;
    }

    /* OAuth buttons */
    .oauth-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 8px;
    }

    .oauth-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: var(--radius-md);
      font-size: 13px;
      font-weight: 500;
      text-decoration: none;
      border: 1px solid var(--border-subtle);
      background: var(--bg-elevated);
      color: var(--text-secondary);
      transition: all var(--t-fast);
      cursor: pointer;
    }

    .oauth-btn:hover {
      background: var(--bg-hover);
      border-color: var(--border-subtle);
      color: var(--text-primary);
    }

    .oauth-google:hover { border-color: rgba(66,133,244,0.4); }
    .oauth-github:hover { border-color: rgba(255,255,255,0.2); }

    .form-footer {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 24px;
      font-size: 14px;
    }

    .link-accent {
      color: var(--accent-bright);
      text-decoration: none;
      font-weight: 600;
      transition: opacity var(--t-fast);
    }

    .link-accent:hover { opacity: 0.75; }

    .spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255,255,255,0.2);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
      display: inline-block;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 768px) {
      .auth-shell { grid-template-columns: 1fr; }
      .auth-brand { display: none; }
    }
  `],
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly showPass = signal(false);

  readonly gridItems = Array.from({ length: 40 }, () =>
    (Math.random() * 0.3 + 0.05).toFixed(2)
  );

  // OAuth URLs - apuntan al API Gateway que redirige al auth-service
  readonly googleOAuthUrl = `${environment.apiUrl}/oauth2/authorization/google`;
  readonly githubOAuthUrl = `${environment.apiUrl}/oauth2/authorization/github`;

  readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  get f() { return this.form.controls; }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.authService.redirectToDashboard();
      },
      error: (err: Error) => {
        this.loading.set(false);
        this.errorMessage.set(err.message);
      },
    });
  }
}