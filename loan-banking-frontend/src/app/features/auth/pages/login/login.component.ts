import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

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

    /* ── Brand panel ── */
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

    /* ── Form panel ── */
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

    .form-header {
      margin-bottom: 32px;
    }

    .form-label {
      font-size: 11px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--accent-bright);
      margin-bottom: 10px;
    }

    .form-header h2 {
      font-size: 26px;
      margin-bottom: 8px;
    }

    .form-body {
      display: flex;
      flex-direction: column;
      gap: 20px;
      margin-top: 24px;
    }

    .input-wrapper {
      position: relative;
    }

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

    /* ── Responsive ── */
    @media (max-width: 768px) {
      .auth-shell {
        grid-template-columns: 1fr;
      }
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

  // Decorative grid cells with varying opacity
  readonly gridItems = Array.from({ length: 40 }, () =>
    (Math.random() * 0.3 + 0.05).toFixed(2)
  );

  readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  get f() {
    return this.form.controls;
  }

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