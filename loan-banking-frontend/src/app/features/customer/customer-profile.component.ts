import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { SlicePipe, DecimalPipe } from '@angular/common';
import { SidebarComponent, NavItem } from '../../shared/components/sidebar.component';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../environments/environment';
import { LoanRequestComponent } from '../loan/loan-request.component';

interface CustomerProfile {
  id: number;
  dni: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  country?: string;
  monthlyIncome?: number;
  workExperienceYears?: number;
  occupation?: string;
  employerName?: string;
  createdAt?: string;
}

@Component({
  selector: 'app-customer-profile',
  standalone: true,
  imports: [SidebarComponent, ReactiveFormsModule, SlicePipe, DecimalPipe],
  template: `
    <div class="dashboard-layout">
      <app-sidebar [navItems]="navItems" roleLabel="CLIENTE" />

      <main class="dashboard-content">

        <div class="page-header anim-fade-up">
          <div>
            <div class="page-eyebrow mono">MI CUENTA</div>
            <h1 class="page-title">Perfil</h1>
          </div>
          <div class="header-actions">
            @if (!editMode()) {
              <button class="btn btn-ghost" (click)="enableEdit()">✎ Editar perfil</button>
            } @else {
              <button class="btn btn-ghost" (click)="cancelEdit()">Cancelar</button>
              <button class="btn btn-primary" [disabled]="saving()" (click)="saveProfile()">
                @if (saving()) { <span class="spinner-sm"></span> } Guardar cambios
              </button>
            }
          </div>
        </div>

        @if (loading()) {
          <div class="loading-state anim-fade-up">
            @for (i of [1,2,3]; track i) {
              <div class="sk-block"></div>
            }
          </div>
        } @else if (profile()) {

          @if (successMsg()) {
            <div class="alert alert-success anim-fade-up">{{ successMsg() }}</div>
          }

          @if (errorMsg()) {
            <div class="alert alert-error anim-fade-up">{{ errorMsg() }}</div>
          }

          <div class="profile-layout anim-fade-up" style="animation-delay:60ms">

            <!-- Avatar card -->
            <div class="avatar-card">
              <div class="big-avatar mono">
                {{ initials() }}
              </div>
              <div class="avatar-name">{{ profile()!.firstName }} {{ profile()!.lastName }}</div>
              <div class="avatar-role mono">CLIENTE</div>
              <div class="avatar-dni mono text-muted">DNI {{ profile()!.dni }}</div>
              <div class="avatar-since mono text-muted">
                @if (profile()!.createdAt) {
                  Desde {{ profile()!.createdAt! | slice:0:10 }}
                }
              </div>

              <div class="avatar-divider"></div>

              <div class="quick-stats">
                <div class="qs-item">
                  <div class="qs-val mono">{{ profile()!.city ?? '—' }}</div>
                  <div class="qs-lbl">Ciudad</div>
                </div>
                <div class="qs-item">
                  <div class="qs-val mono">{{ profile()!.workExperienceYears ?? 0 }}a</div>
                  <div class="qs-lbl">Experiencia</div>
                </div>
              </div>
            </div>

            <!-- Info / Form -->
            <div class="info-column">

              @if (!editMode()) {
                <!-- View mode -->
                <div class="info-section card">
                  <div class="section-title">Información personal</div>
                  <div class="info-grid">
                    <div class="info-item">
                      <div class="ii-label">Nombre completo</div>
                      <div class="ii-val">{{ profile()!.firstName }} {{ profile()!.lastName }}</div>
                    </div>
                    <div class="info-item">
                      <div class="ii-label">Email</div>
                      <div class="ii-val">{{ profile()!.email }}</div>
                    </div>
                    <div class="info-item">
                      <div class="ii-label">Teléfono</div>
                      <div class="ii-val mono">{{ profile()!.phone ?? '—' }}</div>
                    </div>
                    <div class="info-item">
                      <div class="ii-label">DNI</div>
                      <div class="ii-val mono">{{ profile()!.dni }}</div>
                    </div>
                    <div class="info-item">
                      <div class="ii-label">Dirección</div>
                      <div class="ii-val">{{ profile()!.address ?? '—' }}</div>
                    </div>
                    <div class="info-item">
                      <div class="ii-label">Ciudad / País</div>
                      <div class="ii-val">{{ profile()!.city ?? '—' }} · {{ profile()!.country ?? 'Perú' }}</div>
                    </div>
                  </div>
                </div>

                <div class="info-section card">
                  <div class="section-title">Información laboral</div>
                  <div class="info-grid">
                    <div class="info-item">
                      <div class="ii-label">Ocupación</div>
                      <div class="ii-val">{{ profile()!.occupation ?? '—' }}</div>
                    </div>
                    <div class="info-item">
                      <div class="ii-label">Empleador</div>
                      <div class="ii-val">{{ profile()!.employerName ?? '—' }}</div>
                    </div>
                    <div class="info-item">
                      <div class="ii-label">Ingresos mensuales</div>
                      <div class="ii-val mono">
                        @if (profile()!.monthlyIncome) {
                          S/ {{ profile()!.monthlyIncome | number:'1.2-2' }}
                        } @else { — }
                      </div>
                    </div>
                    <div class="info-item">
                      <div class="ii-label">Experiencia laboral</div>
                      <div class="ii-val mono">{{ profile()!.workExperienceYears ?? 0 }} años</div>
                    </div>
                  </div>
                </div>

              } @else {
                <!-- Edit mode -->
                <form [formGroup]="editForm" novalidate>

                  <div class="info-section card">
                    <div class="section-title">Información personal</div>
                    <div class="form-grid">
                      <div class="field">
                        <label>Nombre</label>
                        <input formControlName="firstName" type="text" />
                        @if (ef['firstName'].invalid && ef['firstName'].touched) {
                          <span class="error-msg">Requerido</span>
                        }
                      </div>
                      <div class="field">
                        <label>Apellido</label>
                        <input formControlName="lastName" type="text" />
                      </div>
                      <div class="field">
                        <label>Email</label>
                        <input formControlName="email" type="email" />
                      </div>
                      <div class="field">
                        <label>Teléfono</label>
                        <input formControlName="phone" type="tel" placeholder="987654321" />
                      </div>
                      <div class="field" style="grid-column:1/-1">
                        <label>Dirección</label>
                        <input formControlName="address" type="text" />
                      </div>
                      <div class="field">
                        <label>Ciudad</label>
                        <input formControlName="city" type="text" />
                      </div>
                      <div class="field">
                        <label>País</label>
                        <input formControlName="country" type="text" />
                      </div>
                    </div>
                  </div>

                  <div class="info-section card">
                    <div class="section-title">Información laboral</div>
                    <div class="form-grid">
                      <div class="field">
                        <label>Ocupación</label>
                        <input formControlName="occupation" type="text" />
                      </div>
                      <div class="field">
                        <label>Empleador</label>
                        <input formControlName="employerName" type="text" />
                      </div>
                      <div class="field">
                        <label>Ingresos mensuales (S/)</label>
                        <input formControlName="monthlyIncome" type="number" min="0" />
                      </div>
                      <div class="field">
                        <label>Años de experiencia</label>
                        <input formControlName="workExperienceYears" type="number" min="0" />
                      </div>
                    </div>
                  </div>

                </form>
              }

            </div>
          </div>
        } @else if (!loading()) {
          <div class="empty-state">
            <div class="empty-icon">◎</div>
            <p class="text-muted">No se encontró información del perfil</p>
            <button class="btn btn-primary" style="margin-top:14px;" (click)="loadProfile()">
              Reintentar
            </button>
          </div>
        }

      </main>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 28px;
    }

    .page-eyebrow {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--text-muted);
      margin-bottom: 6px;
    }

    .page-title { font-size: 26px; font-weight: 800; }

    .header-actions { display: flex; gap: 10px; align-items: center; margin-top: 6px; }

    /* Profile layout */
    .profile-layout {
      display: grid;
      grid-template-columns: 220px 1fr;
      gap: 20px;
      align-items: start;
    }

    /* Avatar card */
    .avatar-card {
      background: var(--bg-card);
      border: 1px solid var(--border-dim);
      border-radius: var(--radius-xl);
      padding: 28px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 8px;
      position: sticky;
      top: 24px;
    }

    .big-avatar {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: var(--accent-dim);
      border: 2px solid rgba(59,130,246,0.3);
      color: var(--accent-bright);
      font-size: 26px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 4px;
    }

    .avatar-name { font-size: 15px; font-weight: 700; color: var(--text-primary); }
    .avatar-role { font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent-bright); }
    .avatar-dni  { font-size: 12px; }
    .avatar-since { font-size: 11px; }

    .avatar-divider {
      width: 100%;
      height: 1px;
      background: var(--border-dim);
      margin: 12px 0;
    }

    .quick-stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      width: 100%;
    }

    .qs-item {
      background: var(--bg-elevated);
      border: 1px solid var(--border-dim);
      border-radius: var(--radius-md);
      padding: 10px 8px;
    }

    .qs-val { font-size: 16px; color: var(--text-primary); margin-bottom: 2px; }
    .qs-lbl { font-size: 10px; color: var(--text-muted); }

    /* Info column */
    .info-column { display: flex; flex-direction: column; gap: 16px; }

    .info-section { }

    .section-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 16px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--border-dim);
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .info-item { }

    .ii-label {
      font-size: 11px;
      color: var(--text-muted);
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .ii-val {
      font-size: 14px;
      color: var(--text-primary);
    }

    /* Form */
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    /* Loading */
    .loading-state { display: flex; flex-direction: column; gap: 16px; }
    .sk-block {
      height: 120px;
      border-radius: var(--radius-xl);
      background: var(--bg-card);
      animation: shimmer 1.2s infinite;
    }

    @keyframes shimmer { 0%,100% { opacity:.4; } 50% { opacity:.8; } }

    /* Alerts */
    .alert {
      padding: 12px 16px;
      border-radius: var(--radius-md);
      font-size: 13px;
      margin-bottom: 16px;
    }

    .alert-success {
      background: var(--success-dim);
      border: 1px solid rgba(34,197,94,0.25);
      color: var(--success);
    }

    .alert-error {
      background: var(--danger-dim);
      border: 1px solid rgba(239,68,68,0.25);
      color: #fca5a5;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 60px 20px;
    }

    .empty-icon { font-size: 32px; opacity: 0.25; }

    .spinner-sm {
      width: 14px; height: 14px;
      border: 2px solid rgba(255,255,255,0.2);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: inline-block;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 900px) {
      .profile-layout { grid-template-columns: 1fr; }
      .avatar-card { position: static; }
    }
  `],
})
export class CustomerProfileComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly editMode = signal(false);
  readonly profile = signal<CustomerProfile | null>(null);
  readonly successMsg = signal('');
  readonly errorMsg = signal('');

  readonly navItems: NavItem[] = [
    { icon: '◈', label: 'Mi cuenta',     route: '/dashboard/cliente' },
    { icon: '◎', label: 'Mis préstamos', route: '/dashboard/cliente' },
    { icon: '◇', label: 'Pagos',         route: '/dashboard/cliente' },
    { icon: '◦', label: 'Perfil',        route: '/profile' },
  ];

  readonly editForm = this.fb.nonNullable.group({
    firstName:           ['', Validators.required],
    lastName:            ['', Validators.required],
    email:               ['', [Validators.required, Validators.email]],
    phone:               [''],
    address:             [''],
    city:                [''],
    country:             ['Perú'],
    occupation:          [''],
    employerName:        [''],
    monthlyIncome:       [0],
    workExperienceYears: [0],
  });

  get ef() { return this.editForm.controls; }

  initials() {
    const p = this.profile();
    if (!p) return '?';
    return (p.firstName?.[0] ?? '') + (p.lastName?.[0] ?? '');
  }

  ngOnInit(): void { this.loadProfile(); }

  loadProfile(): void {
    const customerId = this.auth.user()?.customerId;
    if (!customerId) return;

    this.loading.set(true);
    this.http.get<CustomerProfile>(`${environment.apiUrl}/api/customers/${customerId}`).subscribe({
      next: (p) => {
        this.profile.set(p);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  enableEdit(): void {
    const p = this.profile();
    if (!p) return;
    this.editForm.patchValue({
      firstName:           p.firstName,
      lastName:            p.lastName,
      email:               p.email,
      phone:               p.phone ?? '',
      address:             p.address ?? '',
      city:                p.city ?? '',
      country:             p.country ?? 'Perú',
      occupation:          p.occupation ?? '',
      employerName:        p.employerName ?? '',
      monthlyIncome:       p.monthlyIncome ?? 0,
      workExperienceYears: p.workExperienceYears ?? 0,
    });
    this.editMode.set(true);
  }

  cancelEdit(): void {
    this.editMode.set(false);
    this.errorMsg.set('');
  }

  saveProfile(): void {
    this.editForm.markAllAsTouched();
    if (this.editForm.invalid) return;

    const customerId = this.auth.user()?.customerId;
    if (!customerId) return;

    this.saving.set(true);
    this.errorMsg.set('');

    const body = {
      ...this.editForm.getRawValue(),
      dni: this.profile()!.dni,
      dateOfBirth: this.profile()!.dateOfBirth ?? '1990-01-01',
      documentType: 'DNI',
    };

    this.http.put<CustomerProfile>(`${environment.apiUrl}/api/customers/${customerId}`, body).subscribe({
      next: (updated) => {
        this.profile.set(updated);
        this.saving.set(false);
        this.editMode.set(false);
        this.successMsg.set('Perfil actualizado correctamente.');
        setTimeout(() => this.successMsg.set(''), 3000);
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMsg.set(err.error?.message || 'Error al guardar los cambios.');
      },
    });
  }
}