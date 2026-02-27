import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { RegisterRequest } from '../../../../core/models/auth.models';

type Step = 1 | 2 | 3;

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-shell">
      <!-- Left brand panel -->
      <aside class="auth-brand">
        <div class="brand-inner">
          <div class="brand-mark">
            <span class="brand-icon">⬡</span>
            <span class="brand-name">LBS</span>
          </div>
          <div class="step-progress">
            @for (s of [1,2,3]; track s) {
              <div class="step-item" [class.active]="currentStep() === s" [class.done]="currentStep() > s">
                <div class="step-dot">
                  @if (currentStep() > s) { ✓ } @else { {{ s }} }
                </div>
                <span>{{ stepLabels[s - 1] }}</span>
              </div>
            }
          </div>
          <p class="text-muted mono" style="font-size:12px;">
            Paso {{ currentStep() }} de 3
          </p>
        </div>
      </aside>

      <!-- Form panel -->
      <main class="auth-form-panel">
        <div class="auth-form-inner anim-fade-up">

          @if (success()) {
            <div class="success-screen">
              <div class="success-icon">✓</div>
              <h2>¡Registro exitoso!</h2>
              <p class="text-secondary">Revisá tu email para verificar tu cuenta antes de iniciar sesión.</p>
              <a routerLink="/auth/login" class="btn btn-primary" style="margin-top:24px;">
                Ir al login
              </a>
            </div>
          } @else {

            <header class="form-header">
              <div class="form-label mono">NUEVO USUARIO</div>
              <h2>{{ stepTitles[currentStep() - 1] }}</h2>
            </header>

            @if (errorMessage()) {
              <div class="alert alert-error" style="margin-bottom:20px;" role="alert">
                {{ errorMessage() }}
              </div>
            }

            <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>

              <!-- STEP 1: Account credentials -->
              @if (currentStep() === 1) {
                <div class="form-body">
                  <div class="field">
                    <label>Usuario</label>
                    <input formControlName="username" type="text" placeholder="mi_usuario" />
                    @if (fc['username'].invalid && fc['username'].touched) {
                      <span class="error-msg">Mínimo 3 caracteres</span>
                    }
                  </div>
                  <div class="field">
                    <label>Email</label>
                    <input formControlName="email" type="email" placeholder="correo@ejemplo.com" />
                    @if (fc['email'].invalid && fc['email'].touched) {
                      <span class="error-msg">Email inválido</span>
                    }
                  </div>
                  <div class="field">
                    <label>Contraseña</label>
                    <input formControlName="password" type="password" placeholder="Mínimo 8 caracteres" />
                    @if (fc['password'].invalid && fc['password'].touched) {
                      <span class="error-msg">Mínimo 8 caracteres</span>
                    }
                  </div>
                </div>
              }

              <!-- STEP 2: Personal data (Customer entity) -->
              @if (currentStep() === 2) {
                <div class="form-body">
                  <div class="form-row">
                    <div class="field">
                      <label>Nombre</label>
                      <input formControlName="firstName" type="text" placeholder="Juan" />
                      @if (fc['firstName'].invalid && fc['firstName'].touched) {
                        <span class="error-msg">Requerido</span>
                      }
                    </div>
                    <div class="field">
                      <label>Apellido</label>
                      <input formControlName="lastName" type="text" placeholder="Pérez" />
                      @if (fc['lastName'].invalid && fc['lastName'].touched) {
                        <span class="error-msg">Requerido</span>
                      }
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="field">
                      <label>DNI</label>
                      <input formControlName="dni" type="text" placeholder="12345678" />
                      @if (fc['dni'].invalid && fc['dni'].touched) {
                        <span class="error-msg">8-20 caracteres</span>
                      }
                    </div>
                    <div class="field">
                      <label>Teléfono</label>
                      <input formControlName="phone" type="tel" placeholder="987654321" />
                      @if (fc['phone'].invalid && fc['phone'].touched) {
                        <span class="error-msg">9-20 dígitos</span>
                      }
                    </div>
                  </div>
                  <div class="field">
                    <label>Fecha de nacimiento</label>
                    <input formControlName="dateOfBirth" type="date" />
                    @if (fc['dateOfBirth'].invalid && fc['dateOfBirth'].touched) {
                      <span class="error-msg">Requerido</span>
                    }
                  </div>
                  <div class="field">
                    <label>Tipo de documento</label>
                    <select formControlName="documentType">
                      <option value="">Seleccionar...</option>
                      <option value="DNI">DNI</option>
                      <option value="PASSPORT">Pasaporte</option>
                      <option value="INCOME_PROOF">Constancia de ingresos</option>
                      <option value="ADDRESS_PROOF">Constancia de domicilio</option>
                    </select>
                  </div>
                </div>
              }

              <!-- STEP 3: Employment data -->
              @if (currentStep() === 3) {
                <div class="form-body">
                  <div class="form-row">
                    <div class="field">
                      <label>Ciudad</label>
                      <input formControlName="city" type="text" placeholder="Lima" />
                    </div>
                    <div class="field">
                      <label>País</label>
                      <input formControlName="country" type="text" placeholder="Perú" />
                    </div>
                  </div>
                  <div class="field">
                    <label>Dirección</label>
                    <input formControlName="address" type="text" placeholder="Av. Ejemplo 123" />
                  </div>
                  <div class="field">
                    <label>Ocupación</label>
                    <input formControlName="occupation" type="text" placeholder="Ingeniero de software" />
                  </div>
                  <div class="field">
                    <label>Empleador</label>
                    <input formControlName="employerName" type="text" placeholder="Empresa S.A." />
                  </div>
                  <div class="form-row">
                    <div class="field">
                      <label>Ingresos mensuales (S/)</label>
                      <input formControlName="monthlyIncome" type="number" min="0" placeholder="3500" />
                    </div>
                    <div class="field">
                      <label>Años de experiencia</label>
                      <input formControlName="workExperienceYears" type="number" min="0" placeholder="3" />
                    </div>
                  </div>
                </div>
              }

              <!-- Navigation -->
              <div class="form-nav">
                @if (currentStep() > 1) {
                  <button type="button" class="btn btn-ghost" (click)="prevStep()">
                    ← Anterior
                  </button>
                } @else {
                  <span></span>
                }

                @if (currentStep() < 3) {
                  <button type="button" class="btn btn-primary" (click)="nextStep()">
                    Siguiente →
                  </button>
                } @else {
                  <button
                    type="submit"
                    class="btn btn-primary"
                    [disabled]="loading()"
                  >
                    @if (loading()) {
                      <span class="spinner"></span> Registrando...
                    } @else {
                      Crear cuenta
                    }
                  </button>
                }
              </div>

            </form>

            <div class="form-footer">
              <span class="text-muted">¿Ya tenés cuenta?</span>
              <a routerLink="/auth/login" class="link-accent">Iniciar sesión</a>
            </div>
          }

        </div>
      </main>
    </div>
  `,
  styles: [`
    .auth-shell {
      display: grid;
      grid-template-columns: 280px 1fr;
      min-height: 100vh;
    }

    .auth-brand {
      background: var(--bg-surface);
      border-right: 1px solid var(--border-dim);
    }

    .brand-inner {
      padding: 48px 32px;
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 48px;
    }

    .brand-mark {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-icon {
      font-size: 26px;
      color: var(--accent-bright);
      filter: drop-shadow(0 0 10px var(--accent-glow));
    }

    .brand-name {
      font-family: var(--font-mono);
      font-size: 16px;
      font-weight: 500;
      letter-spacing: 0.15em;
    }

    .step-progress {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .step-item {
      display: flex;
      align-items: center;
      gap: 14px;
      color: var(--text-muted);
      font-size: 13px;
      transition: color var(--t-normal);
    }

    .step-item.active { color: var(--text-primary); }
    .step-item.done   { color: var(--success); }

    .step-dot {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-mono);
      font-size: 12px;
      flex-shrink: 0;
      transition: all var(--t-normal);
    }

    .step-item.active .step-dot {
      border-color: var(--accent);
      background: var(--accent-dim);
      color: var(--accent-bright);
    }

    .step-item.done .step-dot {
      border-color: var(--success);
      background: var(--success-dim);
      color: var(--success);
    }

    /* Form panel */
    .auth-form-panel {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px 32px;
      background: var(--bg-void);
    }

    .auth-form-inner {
      width: 100%;
      max-width: 520px;
    }

    .form-header {
      margin-bottom: 28px;
    }

    .form-label {
      font-size: 11px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--accent-bright);
      margin-bottom: 10px;
    }

    .form-header h2 { font-size: 24px; }

    .form-body {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .form-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 28px;
      padding-top: 20px;
      border-top: 1px solid var(--border-dim);
    }

    .form-footer {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 20px;
      font-size: 14px;
    }

    .link-accent {
      color: var(--accent-bright);
      text-decoration: none;
      font-weight: 600;
      transition: opacity var(--t-fast);
    }

    .link-accent:hover { opacity: 0.75; }

    /* Success */
    .success-screen {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 12px;
      padding: 48px 0;
    }

    .success-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: var(--success-dim);
      border: 1px solid rgba(34,197,94,0.3);
      color: var(--success);
      font-size: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .success-screen h2 { font-size: 22px; }

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
      .form-row { grid-template-columns: 1fr; }
    }
  `],
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly success = signal(false);
  readonly currentStep = signal<Step>(1);

  readonly stepLabels = ['Cuenta', 'Datos personales', 'Empleo'];
  readonly stepTitles = ['Crear cuenta', 'Datos personales', 'Información laboral'];

  readonly form = this.fb.nonNullable.group({
    // Step 1
    username:          ['', [Validators.required, Validators.minLength(3)]],
    email:             ['', [Validators.required, Validators.email]],
    password:          ['', [Validators.required, Validators.minLength(8)]],
    // Step 2
    firstName:         ['', Validators.required],
    lastName:          ['', Validators.required],
    dni:               ['', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]],
    phone:             ['', Validators.pattern('^[0-9]{9,20}$')],
    dateOfBirth:       ['', Validators.required],
    documentType:      ['DNI'],
    // Step 3
    address:           [''],
    city:              [''],
    country:           ['Perú'],
    occupation:        [''],
    employerName:      [''],
    monthlyIncome:     [0],
    workExperienceYears: [0],
  });

  get fc() { return this.form.controls; }

  private readonly stepFields: Record<number, string[]> = {
    1: ['username', 'email', 'password'],
    2: ['firstName', 'lastName', 'dni', 'phone', 'dateOfBirth'],
    3: [],
  };

  nextStep(): void {
    const fields = this.stepFields[this.currentStep()];
    fields.forEach((f) => this.fc[f as keyof typeof this.fc].markAsTouched());
    const invalid = fields.some((f) => this.fc[f as keyof typeof this.fc].invalid);
    if (invalid) return;
    this.currentStep.set((this.currentStep() + 1) as Step);
  }

  prevStep(): void {
    this.currentStep.set((this.currentStep() - 1) as Step);
  }

  onSubmit(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.errorMessage.set('');

    const raw = this.form.getRawValue();
    const request: RegisterRequest = {
      ...raw,
      monthlyIncome: Number(raw.monthlyIncome) || undefined,
      workExperienceYears: Number(raw.workExperienceYears) || 0,
      documentType: (raw.documentType as RegisterRequest['documentType']) || undefined,
    };

    this.authService.register(request).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
      },
      error: (err: Error) => {
        this.loading.set(false);
        this.errorMessage.set(err.message);
      },
    });
  }
}