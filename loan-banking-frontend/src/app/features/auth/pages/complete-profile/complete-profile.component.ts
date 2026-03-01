import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-complete-profile',
  imports: [ReactiveFormsModule],
  template: `
    <div class="auth-shell">
      <main class="auth-form-panel">
        <div class="auth-form-inner wide">

          <header class="form-header">
            <div class="form-eyebrow mono">ÚLTIMO PASO</div>
            <h2>Completá tu perfil</h2>
            <p class="text-secondary">
              Tu cuenta con <strong>{{ providerName }}</strong> fue creada exitosamente.
              Completá tus datos para activar el acceso completo.
            </p>
          </header>

          @if (errorMessage()) {
            <div class="alert alert-error">⚠ {{ errorMessage() }}</div>
          }

          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
            <div class="form-grid">

              <div class="field">
                <label>DNI *</label>
                <input type="text" formControlName="dni" placeholder="12345678" maxlength="20"/>
                @if (f['dni'].invalid && f['dni'].touched) {
                  <span class="error-msg">DNI requerido (mín. 8 caracteres)</span>
                }
              </div>

              <div class="field">
                <label>Nombre *</label>
                <input type="text" formControlName="firstName" placeholder="Juan"/>
                @if (f['firstName'].invalid && f['firstName'].touched) {
                  <span class="error-msg">Requerido</span>
                }
              </div>

              <div class="field">
                <label>Apellido *</label>
                <input type="text" formControlName="lastName" placeholder="Pérez"/>
                @if (f['lastName'].invalid && f['lastName'].touched) {
                  <span class="error-msg">Requerido</span>
                }
              </div>

              <div class="field">
                <label>Teléfono</label>
                <input type="text" formControlName="phone" placeholder="987654321" maxlength="20"/>
              </div>

              <div class="field">
                <label>Fecha de nacimiento *</label>
                <input type="date" formControlName="dateOfBirth"/>
                @if (f['dateOfBirth'].invalid && f['dateOfBirth'].touched) {
                  <span class="error-msg">Requerido</span>
                }
              </div>

              <div class="field">
                <label>Ocupación</label>
                <input type="text" formControlName="occupation" placeholder="Ingeniero de Software"/>
              </div>

              <div class="field">
                <label>Empleador</label>
                <input type="text" formControlName="employerName" placeholder="Empresa S.A."/>
              </div>

              <div class="field">
                <label>Ingreso mensual (S/)</label>
                <input type="number" formControlName="monthlyIncome" placeholder="3000" min="0"/>
              </div>

              <div class="field">
                <label>Años de experiencia laboral</label>
                <input type="number" formControlName="workExperienceYears" placeholder="2" min="0"/>
              </div>

              <div class="field">
                <label>Ciudad</label>
                <input type="text" formControlName="city" placeholder="Lima"/>
              </div>

              <div class="field span-2">
                <label>Dirección</label>
                <input type="text" formControlName="address" placeholder="Av. Lima 123"/>
              </div>

            </div>

            <button
              type="submit"
              class="btn btn-primary btn-full"
              [disabled]="loading() || form.invalid"
              style="margin-top:24px;"
            >
              @if (loading()) {
                <span class="spinner"></span> Guardando…
              } @else {
                Completar registro
              }
            </button>
          </form>

        </div>
      </main>
    </div>
  `,
  styles: [`
    .auth-shell {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-void);
      padding: 48px 24px;
    }
    .auth-form-inner.wide { max-width: 680px; width: 100%; }
    .form-header   { margin-bottom: 32px; }
    .form-eyebrow  { font-size: 11px; letter-spacing: 0.12em; color: var(--accent-bright); margin-bottom: 8px; }
    .form-header h2 { font-size: 26px; margin-bottom: 8px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
    .span-2 { grid-column: span 2; }
    .spinner {
      width: 14px; height: 14px;
      border: 2px solid rgba(255,255,255,.25);
      border-top-color: white;
      border-radius: 50%;
      animation: spin .6s linear infinite;
      display: inline-block; vertical-align: middle;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .btn-full { width: 100%; }
    @media (max-width: 600px) {
      .form-grid { grid-template-columns: 1fr; }
      .span-2    { grid-column: span 1; }
    }
  `],
})
export class CompleteProfileComponent implements OnInit {
  private readonly fb          = inject(FormBuilder);
  private readonly route       = inject(ActivatedRoute);
  private readonly router      = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly http        = inject(HttpClient);

  readonly loading      = signal(false);
  readonly errorMessage = signal('');
  providerName = 'Google/GitHub';

  readonly form = this.fb.nonNullable.group({
    dni:                 ['', [Validators.required, Validators.minLength(8)]],
    firstName:           ['', Validators.required],
    lastName:            ['', Validators.required],
    phone:               [''],
    dateOfBirth:         ['', Validators.required],
    occupation:          [''],
    employerName:        [''],
    monthlyIncome:       [0],
    workExperienceYears: [0],
    address:             [''],
    city:                ['Lima'],
  });

  get f() { return this.form.controls; }

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) { this.router.navigate(['/auth/login']); return; }

    // Guardar token para que getToken() lo devuelva en onSubmit
    this.authService.handleOAuthToken(token);

    const ref = document.referrer.toLowerCase();
    this.providerName = ref.includes('github') ? 'GitHub' : 'Google';
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading.set(true);
    this.errorMessage.set('');

    const user = this.authService.user();
    if (!user) { this.router.navigate(['/auth/login']); return; }

    // ── JWT explícito en el header ──────────────────────────────────────
    // El interceptor global debería agregarlo, pero lo mandamos explícito
    // para garantizar que el token recién guardado se use en ambas llamadas.
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.authService.getToken()}`
    });

    const customerBody = {
      ...this.form.getRawValue(),
      email:        user.email,
      country:      'Perú',
      documentType: 'DNI',
    };

    // 1. Crear customer
    this.http.post<{ id: number }>(
      `${environment.apiUrl}/api/customers`,
      customerBody,
      { headers }
    ).subscribe({
      next: (customer) => {

        // 2. Vincular customerId al user de auth-service
        this.http.put(
          `${environment.apiUrl}/api/auth/link-customer`,
          null,
          { headers, params: { customerId: customer.id }, responseType: 'text' as const }
        ).subscribe({
          next: () => {
            this.authService.updateCustomerId(customer.id);  
            this.loading.set(false);
            this.authService.redirectToDashboard();
          },
          error: () => {
            // Si link-customer falla el customer ya existe → ir al dashboard igual
            this.authService.updateCustomerId(customer.id);
            this.loading.set(false);
            this.authService.redirectToDashboard();
          },
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          err.error?.message ?? err.error ?? 'Error al guardar el perfil. Intentá de nuevo.'
        );
      },
    });
  }
}
