import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SidebarComponent, NavItem } from '../../../shared/components/sidebar.component';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../environments/environment';

interface CustomerResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  dni: string;
  city: string;
  createdAt: string;
  monthlyIncome: number;
}

interface LoanResponse {
  id: number;
  customerId: number;
  amount: number;
  termMonths: number;
  status: string;
  loanType: string;
  interestRate: number;
  requestDate: string;
  approvedAmount?: number;
}

interface PaymentScheduleResponse {
  id: number;
  loanId: number;
  dueDate: string;
  amount: number;
  status: string;
}

@Component({
  selector: 'app-admin-dashboard',
  imports: [SidebarComponent, CommonModule, RouterModule],
  template: `
    <div class="dashboard-layout">
      <app-sidebar [navItems]="navItems" roleLabel="ADMINISTRADOR" />

      <main class="dashboard-content">

        <!-- Header -->
        <div class="page-header anim-fade-up">
          <div>
            <div class="page-eyebrow mono">PANEL DE CONTROL</div>
            <h1 class="page-title">Administración</h1>
          </div>
          <div class="header-meta">
            @if (loading()) {
              <div class="loading-dots">
                <span></span><span></span><span></span>
              </div>
            } @else {
              <div class="status-dot"></div>
              <span class="mono text-muted" style="font-size:12px;">Datos actualizados</span>
            }
          </div>
        </div>

        @if (error()) {
          <div class="alert alert-error anim-fade-up" style="margin-bottom:20px;">
            ⚠ {{ error() }}
          </div>
        }

        <!-- Stats grid -->
        <div class="stats-grid anim-fade-up" style="animation-delay:80ms">
          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-label">Total clientes</div>
            <div class="stat-value mono">{{ customers().length }}</div>
            <div class="stat-sub text-muted">registrados en el sistema</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📋</div>
            <div class="stat-label">Préstamos activos</div>
            <div class="stat-value mono">{{ activeLoans() }}</div>
            <div class="stat-sub text-muted">de {{ loans().length }} totales</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">💰</div>
            <div class="stat-label">Capital expuesto</div>
            <div class="stat-value mono">S/ {{ totalCapital() | number:'1.0-0' }}</div>
            <div class="stat-sub text-muted">en préstamos aprobados</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">⏳</div>
            <div class="stat-label">Pendientes aprob.</div>
            <div class="stat-value mono">{{ pendingLoans() }}</div>
            <div class="stat-sub" [class.text-warning]="pendingLoans() > 0" [class.text-muted]="pendingLoans() === 0">
              {{ pendingLoans() > 0 ? 'requieren revisión' : 'sin pendientes' }}
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">⚠️</div>
            <div class="stat-label">Cuotas vencidas</div>
            <div class="stat-value mono" [class.text-danger]="overduePayments().length > 0">
              {{ overduePayments().length }}
            </div>
            <div class="stat-sub" [class.text-danger]="overduePayments().length > 0" [class.text-muted]="overduePayments().length === 0">
              {{ overduePayments().length > 0 ? 'en mora' : 'al día' }}
            </div>
          </div>
        </div>

        <!-- Two column layout -->
        <div class="content-grid anim-fade-up" style="animation-delay:160ms">

          <!-- Clientes recientes -->
          <div class="card">
            <div class="card-header">
              <h3 class="section-title">Clientes recientes</h3>
              <div class="badge badge-admin">{{ customers().length }} total</div>
            </div>
            @if (loading()) {
              <div class="skeleton-list">
                @for (i of [1,2,3,4,5]; track i) {
                  <div class="skeleton-row"></div>
                }
              </div>
            } @else if (customers().length === 0) {
              <div class="empty-state">Sin clientes registrados</div>
            } @else {
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>DNI</th>
                    <th>Ciudad</th>
                    <th>Ingreso</th>
                  </tr>
                </thead>
                <tbody>
                  @for (c of customers().slice(0, 6); track c.id) {
                    <tr>
                      <td>
                        <div class="user-cell">
                          <div class="mini-avatar">{{ c.firstName[0] }}{{ c.lastName[0] }}</div>
                          <div>
                            <div style="color:var(--text-primary);font-size:13px;">
                              {{ c.firstName }} {{ c.lastName }}
                            </div>
                            <div class="mono" style="font-size:11px;color:var(--text-muted);">
                              {{ c.email }}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td class="mono" style="font-size:12px;">{{ c.dni }}</td>
                      <td style="font-size:12px;color:var(--text-secondary);">{{ c.city }}</td>
                      <td class="mono" style="font-size:12px;">
                        S/ {{ c.monthlyIncome | number:'1.0-0' }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>

          <!-- Estado de préstamos -->
          <div class="card">
            <div class="card-header">
              <h3 class="section-title">Estado de préstamos</h3>
              <div class="badge badge-admin">LIVE</div>
            </div>
            @if (loading()) {
              <div class="skeleton-list">
                @for (i of [1,2,3,4]; track i) {
                  <div class="skeleton-row"></div>
                }
              </div>
            } @else {
              <div class="loan-bars" style="padding-top:8px;">
                @for (stat of loanStats(); track stat.label) {
                  <div class="bar-item">
                    <div class="bar-label mono">{{ stat.label }}</div>
                    <div class="bar-track">
                      <div class="bar-fill {{ stat.type }}"
                           [style.width.%]="stat.pct"></div>
                    </div>
                    <div class="bar-value mono">{{ stat.count }}</div>
                  </div>
                }
              </div>

              <!-- Próximos vencimientos -->
              @if (upcomingPayments().length > 0) {
                <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border-dim);">
                  <div class="mono" style="font-size:10px;color:var(--text-muted);letter-spacing:0.1em;margin-bottom:10px;">
                    PRÓXIMAS CUOTAS (7 DÍAS)
                  </div>
                  @for (p of upcomingPayments().slice(0, 3); track p.id) {
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border-dim);">
                      <span style="font-size:12px;color:var(--text-secondary);">Préstamo #{{ p.loanId }}</span>
                      <span class="mono" style="font-size:12px;">S/ {{ p.amount | number:'1.2-2' }}</span>
                      <span class="mono" style="font-size:11px;color:var(--warning);">{{ p.dueDate | date:'dd/MM' }}</span>
                    </div>
                  }
                </div>
              }
            }
          </div>

        </div>

        <!-- Préstamos recientes tabla -->
        <div class="card anim-fade-up" style="animation-delay:240ms">
          <div class="card-header">
            <h3 class="section-title">Préstamos recientes</h3>
            <div class="badge badge-admin">{{ loans().length }} total</div>
          </div>
          @if (loading()) {
            <div class="skeleton-list">
              @for (i of [1,2,3,4,5]; track i) {
                <div class="skeleton-row"></div>
              }
            </div>
          } @else if (loans().length === 0) {
            <div class="empty-state">Sin préstamos registrados</div>
          } @else {
            <table class="data-table">
              <thead>
                <tr>
                  <th>#ID</th>
                  <th>Cliente ID</th>
                  <th>Monto</th>
                  <th>Plazo</th>
                  <th>Tipo</th>
                  <th>TEA</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                @for (loan of loans().slice(0, 10); track loan.id) {
                  <tr>
                    <td class="mono" style="font-size:12px;color:var(--text-muted);">#{{ loan.id }}</td>
                    <td class="mono" style="font-size:12px;">{{ loan.customerId }}</td>
                    <td class="mono" style="font-size:13px;">S/ {{ loan.amount | number:'1.0-0' }}</td>
                    <td style="font-size:12px;color:var(--text-secondary);">{{ loan.termMonths }}m</td>
                    <td style="font-size:12px;">{{ loan.loanType }}</td>
                    <td class="mono" style="font-size:12px;">{{ loan.interestRate }}%</td>
                    <td>
                      <span class="loan-badge" [class]="'loan-' + loan.status.toLowerCase()">
                        {{ loan.status }}
                      </span>
                    </td>
                    <td class="mono" style="font-size:11px;color:var(--text-muted);">
                      {{ loan.requestDate | date:'dd/MM/yy' }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>

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
    .header-meta { display: flex; align-items: center; gap: 8px; margin-top: 6px; }

    .status-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: var(--success);
      animation: pulse-glow 2s infinite;
    }
    @keyframes pulse-glow {
      0%,100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
      50% { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
    }

    .loading-dots { display: flex; gap: 4px; align-items: center; }
    .loading-dots span {
      width: 6px; height: 6px; border-radius: 50%;
      background: var(--accent);
      animation: bounce 1.2s infinite;
    }
    .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
    .loading-dots span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bounce {
      0%,80%,100% { transform: scale(0.6); opacity: 0.4; }
      40% { transform: scale(1); opacity: 1; }
    }

    /* Stats */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 14px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: var(--bg-card);
      border: 1px solid var(--border-dim);
      border-radius: var(--radius-xl);
      padding: 18px;
      transition: all var(--t-fast);
    }
    .stat-card:hover {
      border-color: var(--border-subtle);
      background: var(--bg-hover);
      transform: translateY(-1px);
    }
    .stat-icon { font-size: 18px; margin-bottom: 10px; }
    .stat-label {
      font-family: var(--font-mono);
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-muted);
      margin-bottom: 4px;
    }
    .stat-value {
      font-size: 26px;
      font-weight: 400;
      color: var(--text-primary);
      letter-spacing: -0.02em;
      margin-bottom: 4px;
    }
    .stat-sub { font-size: 11px; }

    /* Content grid */
    .content-grid {
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    .section-title { font-size: 14px; font-weight: 600; color: var(--text-primary); }

    /* User cell */
    .user-cell { display: flex; align-items: center; gap: 10px; }
    .mini-avatar {
      width: 28px; height: 28px;
      border-radius: 50%;
      background: var(--bg-elevated);
      border: 1px solid var(--border-subtle);
      display: flex; align-items: center; justify-content: center;
      font-size: 10px; color: var(--text-secondary);
      flex-shrink: 0;
      font-family: var(--font-mono);
      font-weight: 600;
    }

    /* Loan badge */
    .loan-badge {
      font-family: var(--font-mono);
      font-size: 10px;
      padding: 2px 7px;
      border-radius: 100px;
      font-weight: 600;
      letter-spacing: 0.04em;
    }
    .loan-pending   { background: rgba(234,179,8,0.15);  color: #eab308; border: 1px solid rgba(234,179,8,0.2); }
    .loan-approved  { background: rgba(34,197,94,0.12);  color: var(--success); border: 1px solid rgba(34,197,94,0.2); }
    .loan-active    { background: rgba(59,130,246,0.12); color: var(--accent-bright); border: 1px solid rgba(59,130,246,0.2); }
    .loan-rejected  { background: rgba(239,68,68,0.12);  color: var(--danger); border: 1px solid rgba(239,68,68,0.2); }
    .loan-completed { background: rgba(148,163,184,0.1); color: var(--text-muted); border: 1px solid var(--border-dim); }
    .loan-disbursed { background: rgba(168,85,247,0.12); color: #a855f7; border: 1px solid rgba(168,85,247,0.2); }

    /* Loan bars */
    .loan-bars { display: flex; flex-direction: column; gap: 14px; }
    .bar-item { display: flex; align-items: center; gap: 14px; }
    .bar-label { width: 90px; font-size: 11px; color: var(--text-muted); flex-shrink: 0; letter-spacing: 0.04em; }
    .bar-track { flex: 1; height: 6px; background: var(--bg-elevated); border-radius: 3px; overflow: hidden; }
    .bar-fill {
      height: 100%; border-radius: 3px;
      transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
      background: var(--accent);
    }
    .bar-fill.approved  { background: var(--success); }
    .bar-fill.pending   { background: #eab308; }
    .bar-fill.rejected  { background: var(--danger); }
    .bar-fill.active    { background: var(--accent-bright); }
    .bar-fill.completed { background: var(--text-muted); }
    .bar-value { font-size: 12px; color: var(--text-secondary); width: 30px; text-align: right; }

    /* Skeleton */
    .skeleton-list { display: flex; flex-direction: column; gap: 8px; padding: 8px 0; }
    .skeleton-row {
      height: 36px;
      background: linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-hover) 50%, var(--bg-elevated) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: var(--radius-md);
    }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    .empty-state {
      padding: 32px;
      text-align: center;
      color: var(--text-muted);
      font-size: 13px;
      font-family: var(--font-mono);
    }

    .text-warning { color: #eab308; }
    .text-danger  { color: var(--danger); }

    @media (max-width: 1400px) {
      .stats-grid { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 1100px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .content-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class AdminDashboardComponent implements OnInit {
  private readonly http        = inject(HttpClient);
  private readonly authService = inject(AuthService);

  readonly loading           = signal(true);
  readonly error             = signal('');
  readonly customers         = signal<CustomerResponse[]>([]);
  readonly loans             = signal<LoanResponse[]>([]);
  readonly overduePayments   = signal<PaymentScheduleResponse[]>([]);
  readonly upcomingPayments  = signal<PaymentScheduleResponse[]>([]);

  // Computed stats
  readonly activeLoans  = computed(() => this.loans().filter(l => l.status === 'ACTIVE').length);
  readonly pendingLoans = computed(() => this.loans().filter(l => l.status === 'PENDING').length);
  readonly totalCapital = computed(() =>
    this.loans()
      .filter(l => ['ACTIVE', 'APPROVED', 'DISBURSED'].includes(l.status))
      .reduce((sum, l) => sum + (l.approvedAmount ?? l.amount), 0)
  );

  readonly loanStats = computed(() => {
    const total = this.loans().length || 1;
    const groups: Record<string, number> = {};
    this.loans().forEach(l => {
      groups[l.status] = (groups[l.status] || 0) + 1;
    });
    return Object.entries(groups).map(([status, count]) => ({
      label: status,
      count,
      pct: Math.round((count / total) * 100),
      type: status.toLowerCase(),
    }));
  });

  readonly navItems: NavItem[] = [
  { icon: '◈', label: 'Dashboard',     route: '/dashboard/admin'  },
  { icon: '○', label: 'Clientes',      route: '/admin/customers'  },
  { icon: '◇', label: 'Préstamos',     route: '/admin/loans'      },
  { icon: '◦', label: 'Configuración', route: '/dashboard/admin'  },
];

  ngOnInit(): void {
    const token   = this.authService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const api     = environment.apiUrl;

    forkJoin({
      customers:        this.http.get<CustomerResponse[]>(`${api}/api/customers`, { headers })
                            .pipe(catchError(() => of([]))),
      loans:            this.http.get<LoanResponse[]>(`${api}/api/loans`, { headers })
                            .pipe(catchError(() => of([]))),
      overdue:          this.http.get<PaymentScheduleResponse[]>(`${api}/api/payments/schedule/overdue`, { headers })
                            .pipe(catchError(() => of([]))),
      upcoming:         this.http.get<PaymentScheduleResponse[]>(`${api}/api/payments/schedule/upcoming?daysAhead=7`, { headers })
                            .pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ customers, loans, overdue, upcoming }) => {
        this.customers.set(customers as CustomerResponse[]);
        this.loans.set(loans as LoanResponse[]);
        this.overduePayments.set(overdue as PaymentScheduleResponse[]);
        this.upcomingPayments.set(upcoming as PaymentScheduleResponse[]);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error cargando datos. Verificá la conexión con los servicios.');
        this.loading.set(false);
      },
    });
  }
}
