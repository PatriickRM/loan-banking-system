import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, catchError, of } from 'rxjs';
import { SidebarComponent, NavItem } from '../../../shared/components/sidebar.component';
import { AuthService } from '../../../core/services/auth.service';
import { EvaluationService } from '../../../core/services/evaluation.service';
import { LoanService } from '../../../core/services/loan.service';
import { CustomerService, CustomerSummary } from '../../../core/services/customer.service';
import { LoanResponse, EvaluationResponse } from '../../../core/models/loan.models';

type DniSearchState = 'idle' | 'loading' | 'found' | 'error';

@Component({
  selector: 'app-analista-dashboard',
  standalone: true,
  imports: [SidebarComponent, DecimalPipe, DatePipe, FormsModule],
  template: `
    <div class="dashboard-layout">
      <app-sidebar [navItems]="navItems" roleLabel="ANALISTA" />

      <main class="dashboard-content">

        <!-- ── Header ── -->
        <div class="page-header anim-fade-up">
          <div>
            <div class="page-eyebrow mono">EVALUACIÓN CREDITICIA</div>
            <h1 class="page-title">Panel Analista</h1>
          </div>
          <div class="header-right">
            <span class="mono text-muted" style="font-size:12px;">{{ todayStr }}</span>
            <span class="badge badge-analista">ANALISTA</span>
          </div>
        </div>

        <!-- ── Stats reales ── -->
        <div class="stats-row anim-fade-up" style="animation-delay:60ms">
          <div class="mini-stat">
            <div class="mini-stat-label mono">Pendientes</div>
            <div class="mini-stat-value mono">{{ pendingLoans().length }}</div>
            <div class="mini-stat-indicator orange"></div>
          </div>
          <div class="mini-stat">
            <div class="mini-stat-label mono">Aprobados</div>
            <div class="mini-stat-value mono">{{ approvedLoans().length }}</div>
            <div class="mini-stat-indicator green"></div>
          </div>
          <div class="mini-stat">
            <div class="mini-stat-label mono">Rechazados</div>
            <div class="mini-stat-value mono">{{ rejectedLoans().length }}</div>
            <div class="mini-stat-indicator red"></div>
          </div>
          <div class="mini-stat">
            <div class="mini-stat-label mono">Activos</div>
            <div class="mini-stat-value mono">{{ activeLoans().length }}</div>
            <div class="mini-stat-indicator blue"></div>
          </div>
          <div class="mini-stat">
            <div class="mini-stat-label mono">Evals pendientes</div>
            <div class="mini-stat-value mono">{{ pendingEvals().length }}</div>
            <div class="mini-stat-indicator orange"></div>
          </div>
        </div>

        <!-- ── Préstamos PENDING ── -->
        <div class="card anim-fade-up" style="animation-delay:120ms">
          <div class="card-header">
            <h3 class="section-title">Préstamos pendientes de aprobación</h3>
            <button class="filter-btn active" (click)="router.navigate(['/loans'])">
              Ver todos →
            </button>
          </div>

          @if (loadingLoans()) {
            <div class="loading-row">
              <span class="spinner-sm"></span> Cargando préstamos…
            </div>
          } @else if (pendingLoans().length === 0) {
            <div class="empty-state">No hay préstamos pendientes.</div>
          } @else {
            <div class="eval-list">
              @for (loan of pendingLoans().slice(0, 6); track loan.id) {
                <div class="eval-item" (click)="router.navigate(['/loans'])">

                  <div class="eval-id mono">#{{ loan.id }}</div>

                  <div class="eval-client">
                    <div class="eval-name">{{ loan.customerName ?? 'Cliente #' + loan.customerId }}</div>
                    <div class="eval-dni mono text-muted">ID {{ loan.customerId }}</div>
                  </div>

                  <div class="eval-meta">
                    <div class="eval-amount mono">S/ {{ loan.amount | number:'1.2-2' }}</div>
                    <div class="text-muted" style="font-size:12px;">{{ loan.termMonths }} meses</div>
                  </div>

                  <div class="eval-meta">
                    <div class="mono" style="font-size:13px;">{{ loan.loanTypeName ?? loan.loanTypeId }}</div>
                    <div class="text-muted" style="font-size:12px;">{{ loan.interestRate }}% TEA</div>
                  </div>

                  <div>
                    <span class="risk-badge risk-pending mono">PENDING</span>
                  </div>

                  <div class="eval-actions" (click)="$event.stopPropagation()">
                    <button class="action-btn approve" (click)="router.navigate(['/loans'])">
                      ✓ Revisar
                    </button>
                  </div>

                </div>
              }
            </div>
          }
        </div>

        <!-- ── Two columns ── -->
        <div class="two-col anim-fade-up" style="animation-delay:200ms">

          <!-- ── Búsqueda DNI real ── -->
          <div class="card">
            <div class="card-header">
              <h3 class="section-title">Consultar cliente por DNI</h3>
            </div>

            <div class="search-bar">
              <input
                type="text"
                placeholder="Ej: 47382910"
                class="search-input mono"
                [(ngModel)]="searchDni"
                (keyup.enter)="searchCustomer()"
                maxlength="20"
              />
              <button
                class="btn btn-primary"
                style="padding:10px 16px;"
                (click)="searchCustomer()"
                [disabled]="dniState() === 'loading' || !searchDni.trim()"
              >
                @if (dniState() === 'loading') {
                  <span class="spinner-sm"></span>
                } @else {
                  Buscar
                }
              </button>
            </div>

            <!-- Resultado -->
            @if (dniState() === 'error') {
              <div class="search-result error">
                <span>✕</span> Cliente no encontrado para DNI <span class="mono">{{ searchDni }}</span>
              </div>
            }

            @if (dniState() === 'found' && foundCustomer()) {
              <div class="customer-card">
                <div class="customer-card-header">
                  <div class="customer-avatar mono">
                    {{ foundCustomer()!.firstName[0] }}{{ foundCustomer()!.lastName[0] }}
                  </div>
                  <div>
                    <div class="customer-fullname">
                      {{ foundCustomer()!.firstName }} {{ foundCustomer()!.lastName }}
                    </div>
                    <div class="mono text-muted" style="font-size:11px;">
                      DNI {{ foundCustomer()!.dni }}
                    </div>
                  </div>
                </div>

                <div class="customer-detail-grid">
                  <div class="detail-row">
                    <span class="detail-label mono">Email</span>
                    <span class="detail-val">{{ foundCustomer()!.email }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label mono">Teléfono</span>
                    <span class="detail-val mono">{{ foundCustomer()!.phone }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label mono">Ocupación</span>
                    <span class="detail-val">{{ foundCustomer()!.occupation ?? '—' }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label mono">Empleador</span>
                    <span class="detail-val">{{ foundCustomer()!.employerName ?? '—' }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label mono">Ingreso mensual</span>
                    <span class="detail-val mono">
                      S/ {{ foundCustomer()!.monthlyIncome | number:'1.2-2' }}
                    </span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label mono">Exp. laboral</span>
                    <span class="detail-val mono">{{ foundCustomer()!.workExperienceYears }} años</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label mono">Ciudad</span>
                    <span class="detail-val">{{ foundCustomer()!.city }}, {{ foundCustomer()!.country }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label mono">Registrado</span>
                    <span class="detail-val mono">
                      {{ foundCustomer()!.createdAt | date:'dd/MM/yyyy' }}
                    </span>
                  </div>
                </div>

                <!-- Préstamos de este cliente -->
                @if (customerLoansLoading()) {
                  <div class="loading-row" style="margin-top:12px;">
                    <span class="spinner-sm"></span> Cargando préstamos del cliente…
                  </div>
                } @else if (customerLoans().length > 0) {
                  <div class="customer-loans">
                    <div class="mono text-muted" style="font-size:11px;margin-bottom:8px;">
                      PRÉSTAMOS ({{ customerLoans().length }})
                    </div>
                    @for (loan of customerLoans(); track loan.id) {
                      <div class="customer-loan-row">
                        <span class="mono text-muted" style="font-size:11px;">#{{ loan.id }}</span>
                        <span style="font-size:13px;">S/ {{ loan.amount | number:'1.0-0' }}</span>
                        <span class="mono" style="font-size:12px;">{{ loan.termMonths }}m</span>
                        <span class="loan-status-badge" [class]="'status-' + loan.status.toLowerCase()">
                          {{ loan.status }}
                        </span>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="mono text-muted" style="font-size:11px;margin-top:12px;">
                    Sin préstamos registrados.
                  </div>
                }

              </div>
            }
          </div>

          <!-- ── Evaluaciones pendientes ── -->
          <div class="card">
            <div class="card-header">
              <h3 class="section-title">Evaluaciones manuales pendientes</h3>
              <button class="filter-btn active" (click)="router.navigate(['/evaluations'])">
                Ver todas →
              </button>
            </div>

            @if (loadingEvals()) {
              <div class="loading-row">
                <span class="spinner-sm"></span> Cargando evaluaciones…
              </div>
            } @else if (pendingEvals().length === 0) {
              <div class="empty-state">No hay evaluaciones pendientes.</div>
            } @else {
              <div class="eval-mini-list">
                @for (ev of pendingEvals().slice(0, 5); track ev.id) {
                  <div class="eval-mini-item" (click)="router.navigate(['/evaluations'])">
                    <div>
                      <div class="mono" style="font-size:12px;color:var(--text-muted);">#{{ ev.id }}</div>
                      <div style="font-size:13px;">Préstamo #{{ ev.loanId }}</div>
                    </div>
                    <div class="score-ring" [class]="scoreClass(ev.creditScore ?? 0)">
                      <span class="mono" style="font-size:12px;">{{ ev.creditScore ?? '—' }}</span>
                    </div>
                    <div>
                      <span class="risk-badge" [class]="'risk-' + (ev.riskLevel ?? 'medio').toLowerCase()">
                        {{ ev.riskLevel ?? 'MEDIO' }}
                      </span>
                    </div>
                    <button class="action-btn approve" (click)="$event.stopPropagation(); router.navigate(['/evaluations'])">
                      Evaluar
                    </button>
                  </div>
                }
              </div>
            }

            <!-- Actividad rápida -->
            <div class="today-grid" style="margin-top:16px;">
              <div class="today-item">
                <div class="today-num mono">{{ pendingLoans().length }}</div>
                <div class="today-label">Loans pending</div>
              </div>
              <div class="today-item">
                <div class="today-num mono">{{ activeLoans().length }}</div>
                <div class="today-label">Loans activos</div>
              </div>
              <div class="today-item">
                <div class="today-num mono">{{ approvedLoans().length }}</div>
                <div class="today-label">Aprobados</div>
              </div>
              <div class="today-item">
                <div class="today-num mono">{{ pendingEvals().length }}</div>
                <div class="today-label">Evals manual</div>
              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28px;
    }
    .header-right { display: flex; align-items: center; gap: 12px; }
    .page-eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--text-muted); margin-bottom: 6px; }
    .page-title   { font-size: 26px; font-weight: 800; }

    /* ── Stats ── */
    .stats-row {
      display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 24px;
    }
    .mini-stat {
      background: var(--bg-card); border: 1px solid var(--border-dim);
      border-radius: var(--radius-lg); padding: 16px; position: relative; overflow: hidden;
    }
    .mini-stat-label { font-family: var(--font-mono); font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); margin-bottom: 8px; }
    .mini-stat-value { font-family: var(--font-mono); font-size: 24px; color: var(--text-primary); }
    .mini-stat-indicator { position: absolute; bottom: 0; left: 0; right: 0; height: 2px; }
    .mini-stat-indicator.green  { background: var(--success); }
    .mini-stat-indicator.orange { background: var(--warning); }
    .mini-stat-indicator.blue   { background: var(--accent);  }
    .mini-stat-indicator.red    { background: var(--danger);  }

    /* ── Eval list ── */
    .eval-list { display: flex; flex-direction: column; gap: 2px; }
    .eval-item {
      display: grid;
      grid-template-columns: 60px 1fr 130px 110px 100px 120px;
      align-items: center; gap: 16px;
      padding: 14px 16px; border-radius: var(--radius-md);
      border: 1px solid transparent; transition: all var(--t-fast); cursor: pointer;
    }
    .eval-item:hover { background: var(--bg-elevated); border-color: var(--border-dim); }
    .eval-id     { font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); }
    .eval-name   { font-size: 14px; font-weight: 500; }
    .eval-dni    { font-family: var(--font-mono); font-size: 11px; }
    .eval-amount { font-family: var(--font-mono); font-size: 15px; }

    /* ── Risk badges ── */
    .risk-badge { padding: 3px 10px; border-radius: 100px; font-family: var(--font-mono); font-size: 11px; font-weight: 500; letter-spacing: 0.06em; }
    .risk-bajo    { background: var(--success-dim); color: var(--success); }
    .risk-medio   { background: var(--warning-dim); color: var(--warning); }
    .risk-alto    { background: var(--danger-dim);  color: var(--danger);  }
    .risk-pending { background: rgba(251,191,36,.12); color: #fbbf24; }

    .loan-status-badge { padding: 2px 8px; border-radius: 100px; font-family: var(--font-mono); font-size: 10px; }
    .status-pending  { background: rgba(251,191,36,.12); color: #fbbf24; }
    .status-approved { background: var(--success-dim); color: var(--success); }
    .status-active   { background: var(--accent-dim);  color: var(--accent-bright); }
    .status-rejected { background: var(--danger-dim);  color: var(--danger); }
    .status-completed{ background: rgba(156,163,175,.12); color: #9ca3af; }

    /* ── Actions ── */
    .eval-actions { display: flex; gap: 8px; }
    .action-btn { padding: 6px 12px; border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: 11px; cursor: pointer; border: 1px solid; transition: all var(--t-fast); }
    .action-btn.approve { background: var(--success-dim); border-color: rgba(34,197,94,0.3); color: var(--success); }
    .action-btn.approve:hover { background: rgba(34,197,94,0.25); }

    /* ── Filters ── */
    .card-header   { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .section-title { font-size: 14px; font-weight: 600; }
    .filter-btn { padding: 4px 12px; border-radius: 100px; background: transparent; border: 1px solid var(--border-dim); color: var(--text-muted); font-size: 12px; cursor: pointer; transition: all var(--t-fast); }
    .filter-btn:hover, .filter-btn.active { background: var(--accent-dim); border-color: rgba(59,130,246,0.3); color: var(--accent-bright); }

    /* ── Search ── */
    .search-bar   { display: flex; gap: 10px; align-items: center; }
    .search-input {
      flex: 1; padding: 10px 14px;
      background: var(--bg-elevated); border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md); color: var(--text-primary);
      font-size: 14px; font-family: var(--font-mono); outline: none;
      transition: border-color var(--t-fast);
    }
    .search-input:focus { border-color: var(--accent); }

    .search-result {
      margin-top: 12px; padding: 10px 14px;
      border-radius: var(--radius-md); font-size: 13px;
      display: flex; align-items: center; gap: 8px;
    }
    .search-result.error { background: var(--danger-dim); color: var(--danger); border: 1px solid rgba(239,68,68,.2); }

    /* ── Customer card ── */
    .customer-card {
      margin-top: 14px; padding: 16px;
      background: var(--bg-elevated); border: 1px solid var(--border-dim);
      border-radius: var(--radius-lg);
    }
    .customer-card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
    .customer-avatar {
      width: 42px; height: 42px; border-radius: 50%;
      background: var(--accent-dim); border: 1px solid rgba(59,130,246,.25);
      color: var(--accent-bright); font-size: 14px; font-weight: 700;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .customer-fullname { font-size: 15px; font-weight: 600; }

    .customer-detail-grid { display: flex; flex-direction: column; gap: 6px; }
    .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid var(--border-dim); }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-family: var(--font-mono); font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: var(--text-muted); }
    .detail-val   { font-size: 13px; color: var(--text-primary); text-align: right; }

    /* ── Customer loans ── */
    .customer-loans { margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--border-dim); }
    .customer-loan-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 7px 0; border-bottom: 1px solid var(--border-dim);
    }
    .customer-loan-row:last-child { border-bottom: none; }

    /* ── Score ring ── */
    .score-ring {
      width: 44px; height: 44px; border-radius: 50%; border: 2px solid;
      display: flex; align-items: center; justify-content: center;
    }
    .score-ring.good   { border-color: var(--success); color: var(--success); }
    .score-ring.medium { border-color: var(--warning); color: var(--warning); }
    .score-ring.low    { border-color: var(--danger);  color: var(--danger);  }

    /* ── Eval mini list ── */
    .eval-mini-list { display: flex; flex-direction: column; gap: 4px; }
    .eval-mini-item {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 12px; border-radius: var(--radius-md);
      border: 1px solid transparent; cursor: pointer; transition: all var(--t-fast);
    }
    .eval-mini-item:hover { background: var(--bg-elevated); border-color: var(--border-dim); }

    /* ── Today grid ── */
    .two-col    { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .today-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .today-item { padding: 14px; background: var(--bg-elevated); border-radius: var(--radius-md); border: 1px solid var(--border-dim); }
    .today-num  { font-family: var(--font-mono); font-size: 22px; color: var(--text-primary); }
    .today-label{ font-size: 12px; color: var(--text-muted); margin-top: 4px; }

    /* ── Misc ── */
    .loading-row { display: flex; align-items: center; gap: 10px; padding: 16px; color: var(--text-muted); font-size: 13px; }
    .empty-state { padding: 20px; text-align: center; color: var(--text-muted); font-size: 13px; }

    .spinner-sm {
      width: 14px; height: 14px;
      border: 2px solid var(--border-dim);
      border-top-color: var(--accent-bright);
      border-radius: 50%;
      animation: spin .6s linear infinite;
      display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 1300px) {
      .stats-row { grid-template-columns: repeat(3, 1fr); }
      .two-col   { grid-template-columns: 1fr; }
      .eval-item { grid-template-columns: 50px 1fr 120px 90px; }
      .eval-item > :nth-child(5),
      .eval-item > :nth-child(6) { display: none; }
    }
  `],
})
export class AnalistaDashboardComponent implements OnInit {
  readonly auth    = inject(AuthService);
  readonly router  = inject(Router);
  private readonly loanService     = inject(LoanService);
  private readonly evalService     = inject(EvaluationService);
  private readonly customerService = inject(CustomerService);

  // ── State ──────────────────────────────────────────────────────────────
  searchDni = '';

  readonly loadingLoans = signal(true);
  readonly loadingEvals = signal(true);

  private readonly _allLoans = signal<LoanResponse[]>([]);
  private readonly _allEvals = signal<EvaluationResponse[]>([]);

  readonly pendingLoans  = computed(() => this._allLoans().filter(l => l.status === 'PENDING'));
  readonly approvedLoans = computed(() => this._allLoans().filter(l => l.status === 'APPROVED'));
  readonly rejectedLoans = computed(() => this._allLoans().filter(l => l.status === 'REJECTED'));
  readonly activeLoans   = computed(() => this._allLoans().filter(l => l.status === 'ACTIVE'));
  readonly pendingEvals  = computed(() => this._allEvals().filter(e => e.status === 'PENDING'));

  // ── DNI search ─────────────────────────────────────────────────────────
  readonly dniState         = signal<DniSearchState>('idle');
  readonly foundCustomer    = signal<CustomerSummary | null>(null);
  readonly customerLoans    = signal<LoanResponse[]>([]);
  readonly customerLoansLoading = signal(false);

  // ── Static ─────────────────────────────────────────────────────────────
  readonly todayStr = new Date()
    .toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
    .toUpperCase();

  readonly navItems: NavItem[] = [
    { icon: '◈', label: 'Dashboard',    route: '/dashboard/analista' },
    { icon: '◉', label: 'Evaluaciones', route: '/evaluations' },
    { icon: '◇', label: 'Préstamos',    route: '/loans' },
    { icon: '○', label: 'Informes',     route: '/dashboard/analista' },
  ];

  // ── Lifecycle ───────────────────────────────────────────────────────────
  ngOnInit(): void {
    // Cargar loans y evals en paralelo
    forkJoin({
      loans: this.loanService.getAllLoans().pipe(catchError(() => of([]))),
      evals: this.evalService.getEvaluationsByStatus('PENDING').pipe(catchError(() => of([]))),
    }).subscribe(({ loans, evals }) => {
      this._allLoans.set(loans);
      this._allEvals.set(evals);
      this.loadingLoans.set(false);
      this.loadingEvals.set(false);
    });
  }

  // ── DNI Search ──────────────────────────────────────────────────────────
  searchCustomer(): void {
    const dni = this.searchDni.trim();
    if (!dni) return;

    this.dniState.set('loading');
    this.foundCustomer.set(null);
    this.customerLoans.set([]);

    this.customerService.getByDni(dni).subscribe({
      next: (customer) => {
        this.dniState.set('found');
        this.foundCustomer.set(customer);
        this.loadCustomerLoans(customer.id);
      },
      error: () => {
        this.dniState.set('error');
      },
    });
  }

  private loadCustomerLoans(customerId: number): void {
    this.customerLoansLoading.set(true);
    this.loanService.getLoansByCustomer(customerId)
      .pipe(catchError(() => of([])))
      .subscribe(loans => {
        this.customerLoans.set(loans);
        this.customerLoansLoading.set(false);
      });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────
  scoreClass(score: number): string {
    if (score >= 650) return 'good';
    if (score >= 550) return 'medium';
    return 'low';
  }
}