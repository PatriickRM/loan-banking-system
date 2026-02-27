import { Component, inject, signal, OnInit } from '@angular/core';
import { DecimalPipe, DatePipe, SlicePipe } from '@angular/common';
import { SidebarComponent, NavItem } from '../../../shared/components/sidebar.component';
import { AuthService } from '../../../core/services/auth.service';
import { LoanService } from '../../../core/services/loan.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LoanResponse, LoanStatus } from '../../../core/models/loan.models';
import { LoanRequestComponent } from '../../../features/loan/loan-request.component';
import { LoanDetailComponent } from '../../../features/loan/loan-detail.component';
import { NotificationPanelComponent } from '../../../features/notification/notification-panel.component';

@Component({
  selector: 'app-cliente-dashboard',
  imports: [
    SidebarComponent,
    DecimalPipe,
    DatePipe,
    SlicePipe,
    LoanRequestComponent,
    LoanDetailComponent,
    NotificationPanelComponent,
  ],
  template: `
    <div class="dashboard-layout">
      <app-sidebar [navItems]="navItems" roleLabel="CLIENTE" />

      <main class="dashboard-content">

        <!-- Top bar with notification bell -->
        <div class="top-bar anim-fade-up">
          <div>
            <div class="page-eyebrow mono">MI CUENTA</div>
            <h1 class="page-title">
              Hola, <span class="accent-name">{{ auth.user()?.username }}</span>
            </h1>
          </div>
          <div class="top-actions">
            <!-- Notification bell -->
            <button
              class="bell-btn"
              (click)="showNotifs.set(!showNotifs())"
              [class.active]="showNotifs()"
            >
              <span class="bell-icon">🔔</span>
              @if (notifService.unreadCount() > 0) {
                <span class="bell-badge mono">{{ notifService.unreadCount() }}</span>
              }
            </button>
            <button class="btn btn-primary" (click)="showLoanRequest.set(true)">
              + Solicitar préstamo
            </button>
          </div>
        </div>

        <!-- Credit score banner -->
        <div class="credit-banner anim-fade-up" style="animation-delay:60ms">
          <div class="credit-info">
            <div class="credit-label mono">SCORE CREDITICIO</div>
            <div class="credit-score mono">{{ creditScore() }}</div>
            <div class="credit-desc">{{ creditLabel() }}</div>
          </div>
          <div class="credit-meter">
            <div class="meter-track">
              <div class="meter-fill" [style.width.%]="creditPct()"></div>
              <div class="meter-thumb" [style.left.%]="creditPct()"></div>
            </div>
            <div class="meter-labels mono">
              <span>300</span><span>600</span><span>850</span>
            </div>
          </div>
        </div>

        <!-- Stats row -->
        <div class="stats-row anim-fade-up" style="animation-delay:100ms">
          @for (stat of computedStats(); track stat.label) {
            <div class="client-stat">
              <div class="cs-icon">{{ stat.icon }}</div>
              <div>
                <div class="cs-value mono">{{ stat.value }}</div>
                <div class="cs-label">{{ stat.label }}</div>
              </div>
            </div>
          }
        </div>

        <!-- Active loans -->
        <div class="card anim-fade-up" style="animation-delay:140ms">
          <div class="card-header">
            <h3 class="section-title">Mis préstamos</h3>
            <div class="header-right">
              @if (loadingLoans()) {
                <div class="spinner-sm"></div>
              }
              <span class="badge badge-cliente">{{ loans().length }} total</span>
            </div>
          </div>

          @if (loans().length === 0 && !loadingLoans()) {
            <div class="empty-state">
              <div class="empty-icon">◎</div>
              <p class="text-muted">No tenés préstamos aún</p>
              <button class="btn btn-primary" style="margin-top:14px;" (click)="showLoanRequest.set(true)">
                Solicitar mi primer préstamo
              </button>
            </div>
          } @else {
            <div class="loans-list">
              @for (loan of loans(); track loan.id) {
                <div class="loan-card" (click)="openDetail(loan)">

                  <div class="loan-left">
                    <div class="loan-id mono">#{{ loan.id }}</div>
                    <div class="loan-type">{{ loan.loanTypeName }}</div>
                    <div class="loan-amount mono">S/ {{ loan.amount | number:'1.0-0' }}</div>
                  </div>

                  <div class="loan-center">
                    @if (isActive(loan.status)) {
                      <div class="progress-wrap">
                        <div class="progress-track">
                          <div class="progress-bar" [style.width.%]="paidPct(loan)"></div>
                        </div>
                        <div class="progress-text mono">{{ paidPct(loan) }}% pagado</div>
                      </div>
                    } @else {
                      <div class="loan-purpose text-muted">{{ loan.purpose | slice:0:50 }}{{ loan.purpose.length > 50 ? '...' : '' }}</div>
                    }
                    <div class="loan-date mono text-muted">
                      {{ loan.applicationDate | date:'dd MMM yyyy' }}
                    </div>
                  </div>

                  <div class="loan-right">
                    @if (loan.monthlyPayment) {
                      <div class="loan-installment">
                        <div class="inst-label mono">/ mes</div>
                        <div class="inst-amount mono">S/ {{ loan.monthlyPayment | number:'1.0-0' }}</div>
                      </div>
                    }
                    <span class="loan-status-chip" [class]="statusClass(loan.status)">
                      {{ statusLabel(loan.status) }}
                    </span>
                    <div class="detail-arrow">→</div>
                  </div>

                </div>
              }
            </div>
          }
        </div>

      </main>
    </div>

    <!-- Modals -->
    @if (showLoanRequest()) {
      <app-loan-request
        (closed)="showLoanRequest.set(false)"
        (loanCreated)="onLoanCreated()"
      />
    }

    @if (selectedLoan()) {
      <app-loan-detail
        [loan]="selectedLoan()!"
        (onClose)="selectedLoan.set(null)"
      />
    }

    @if (showNotifs()) {
      <app-notification-panel (closed)="showNotifs.set(false)" />
    }
  `,
  styles: [`
    .top-bar {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    .page-eyebrow {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--text-muted);
      margin-bottom: 6px;
    }

    .page-title { font-size: 26px; font-weight: 800; }
    .accent-name { color: var(--accent-bright); }

    .top-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 4px;
    }

    /* Bell */
    .bell-btn {
      position: relative;
      width: 40px;
      height: 40px;
      background: var(--bg-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      transition: all var(--t-fast);
    }

    .bell-btn:hover, .bell-btn.active {
      background: var(--bg-hover);
      border-color: var(--accent);
    }

    .bell-badge {
      position: absolute;
      top: -5px;
      right: -5px;
      background: var(--danger);
      color: #fff;
      font-size: 10px;
      padding: 1px 5px;
      border-radius: 100px;
      min-width: 18px;
      text-align: center;
    }

    /* Credit banner */
    .credit-banner {
      background: var(--bg-card);
      border: 1px solid var(--border-dim);
      border-radius: var(--radius-xl);
      padding: 22px 26px;
      margin-bottom: 18px;
      display: flex;
      align-items: center;
      gap: 40px;
    }

    .credit-info { flex-shrink: 0; }

    .credit-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--text-muted);
      margin-bottom: 4px;
    }

    .credit-score {
      font-size: 48px;
      font-weight: 400;
      color: var(--success);
      line-height: 1;
      margin-bottom: 6px;
      letter-spacing: -0.03em;
    }

    .credit-desc { font-size: 12px; color: var(--text-secondary); }

    .credit-meter { flex: 1; }

    .meter-track {
      position: relative;
      height: 8px;
      background: var(--bg-elevated);
      border-radius: 4px;
      margin-bottom: 8px;
      overflow: visible;
    }

    .meter-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--danger), var(--warning), var(--success));
      border-radius: 4px;
    }

    .meter-thumb {
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: var(--success);
      border: 2px solid var(--bg-card);
      box-shadow: 0 0 8px var(--success);
    }

    .meter-labels {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: var(--text-muted);
    }

    /* Stats */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }

    .client-stat {
      background: var(--bg-card);
      border: 1px solid var(--border-dim);
      border-radius: var(--radius-xl);
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      transition: all var(--t-fast);
    }

    .client-stat:hover { border-color: var(--border-subtle); }

    .cs-icon { font-size: 20px; }
    .cs-value { font-family: var(--font-mono); font-size: 20px; color: var(--text-primary); }
    .cs-label { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

    /* Loans list */
    .loans-list { display: flex; flex-direction: column; gap: 2px; }

    .loan-card {
      display: grid;
      grid-template-columns: 130px 1fr auto;
      align-items: center;
      gap: 20px;
      padding: 16px;
      border-radius: var(--radius-md);
      border: 1px solid transparent;
      cursor: pointer;
      transition: all var(--t-fast);
    }

    .loan-card:hover {
      background: var(--bg-elevated);
      border-color: var(--border-dim);
    }

    .loan-id    { font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); margin-bottom: 4px; }
    .loan-type  { font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; }
    .loan-amount { font-family: var(--font-mono); font-size: 18px; color: var(--text-primary); }

    .progress-wrap { margin-bottom: 6px; }

    .progress-track {
      height: 4px;
      background: var(--bg-card);
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 4px;
    }

    .progress-bar {
      height: 100%;
      background: var(--accent);
      border-radius: 2px;
      transition: width 0.6s ease;
    }

    .progress-text { font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); }

    .loan-purpose { font-size: 12px; margin-bottom: 4px; }
    .loan-date    { font-size: 11px; }

    .loan-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
    }

    .loan-installment { text-align: right; }
    .inst-label  { font-size: 10px; color: var(--text-muted); letter-spacing: 0.06em; }
    .inst-amount { font-size: 16px; color: var(--text-primary); }

    .loan-status-chip {
      padding: 3px 10px;
      border-radius: 100px;
      font-family: var(--font-mono);
      font-size: 10px;
      letter-spacing: 0.06em;
      white-space: nowrap;
    }

    .chip-pending   { background: var(--warning-dim); color: var(--warning); }
    .chip-approved  { background: var(--success-dim); color: var(--success); }
    .chip-active    { background: var(--accent-dim);  color: var(--accent-bright); }
    .chip-rejected  { background: var(--danger-dim);  color: var(--danger); }
    .chip-completed { background: rgba(148,163,184,0.1); color: #94a3b8; }
    .chip-defaulted { background: var(--danger-dim);  color: var(--danger); }
    .chip-cancelled { background: var(--border-dim);  color: var(--text-muted); }

    .detail-arrow { color: var(--text-muted); font-size: 14px; }

    /* Section title */
    .section-title { font-size: 14px; font-weight: 600; }

    .header-right {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    /* Empty */
    .empty-state {
      text-align: center;
      padding: 48px 20px;
      color: var(--text-muted);
    }

    .empty-icon { font-size: 32px; margin-bottom: 10px; opacity: 0.3; }

    .spinner-sm {
      width: 14px;
      height: 14px;
      border: 2px solid var(--border-subtle);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 1100px) {
      .credit-banner { flex-direction: column; gap: 16px; }
      .stats-row { grid-template-columns: repeat(2, 1fr); }
      .loan-card { grid-template-columns: 1fr auto; }
      .loan-center { display: none; }
    }
  `],
})
export class ClienteDashboardComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly loanService = inject(LoanService);
  readonly notifService = inject(NotificationService);

  readonly loans = signal<LoanResponse[]>([]);
  readonly loadingLoans = signal(false);
  readonly showLoanRequest = signal(false);
  readonly showNotifs = signal(false);
  readonly selectedLoan = signal<LoanResponse | null>(null);

  readonly navItems: NavItem[] = [
    { icon: '◈', label: 'Mi cuenta',     route: '/dashboard/cliente' },
    { icon: '◎', label: 'Mis préstamos', route: '/dashboard/cliente' },
    { icon: '◇', label: 'Pagos',         route: '/dashboard/cliente' },
    { icon: '○', label: 'Documentos',    route: '/dashboard/cliente' },
    { icon: '◦', label: 'Perfil',        route: '/dashboard/cliente' },
  ];

  ngOnInit(): void {
    const user = this.auth.user();
    if (!user?.customerId) return;

    this.loadingLoans.set(true);
    this.loanService.getLoansByCustomer(user.customerId).subscribe({
      next: (loans) => {
        this.loans.set(loans);
        this.loadingLoans.set(false);
      },
      error: () => this.loadingLoans.set(false),
    });

    // Load notifications count
    this.notifService.getNotificationsByUser(user.customerId).subscribe();
  }

  onLoanCreated(): void {
    this.showLoanRequest.set(false);
    const user = this.auth.user();
    if (!user?.customerId) return;
    this.loanService.getLoansByCustomer(user.customerId).subscribe({
      next: (loans) => this.loans.set(loans),
    });
  }

  openDetail(loan: LoanResponse): void {
    this.selectedLoan.set(loan);
  }

  // ── Derived computed values ─────────────────────────────────────────────

  creditScore() {
    const active = this.loans().filter((l) => isActive(l.status));
    if (active.length === 0) return 650;
    const hasDefault = this.loans().some((l) => l.status === 'DEFAULTED');
    return hasDefault ? 450 : 720;
  }

  creditPct() {
    return ((this.creditScore() - 300) / 550) * 100;
  }

  creditLabel() {
    const score = this.creditScore();
    if (score >= 750) return 'Excelente — Acceso a las mejores tasas';
    if (score >= 650) return 'Bueno — Podés acceder a préstamos de hasta S/ 50,000';
    if (score >= 550) return 'Regular — Acceso limitado a créditos';
    return 'Bajo — Se requiere mejorar el historial crediticio';
  }

  computedStats() {
    const loans = this.loans();
    const active = loans.filter((l) => isActive(l.status));
    const debt = active.reduce((acc, l) => acc + (l.outstandingBalance ?? 0), 0);
    const monthly = active.reduce((acc, l) => acc + (l.monthlyPayment ?? 0), 0);

    return [
      { icon: '📋', label: 'Préstamos activos', value: String(active.length) },
      { icon: '💳', label: 'Deuda total', value: debt > 0 ? `S/${(debt / 1000).toFixed(0)}K` : 'S/0' },
      { icon: '📅', label: 'Cuota mensual', value: monthly > 0 ? `S/${monthly.toFixed(0)}` : 'S/0' },
      { icon: '✓', label: 'Historial', value: `${loans.filter((l) => l.status === 'COMPLETED').length} completados` },
    ];
  }

  isActive(status: LoanStatus): boolean {
    return isActive(status);
  }

  paidPct(loan: LoanResponse): number {
    if (!loan.totalAmount || !loan.outstandingBalance) return 0;
    return Math.round(((loan.totalAmount - loan.outstandingBalance) / loan.totalAmount) * 100);
  }

  statusLabel(status: LoanStatus): string {
    const labels: Record<LoanStatus, string> = {
      PENDING: 'EVALUANDO', APPROVED: 'APROBADO', REJECTED: 'RECHAZADO',
      ACTIVE: 'ACTIVO', COMPLETED: 'COMPLETADO', DEFAULTED: 'EN MORA', CANCELLED: 'CANCELADO',
    };
    return labels[status] ?? status;
  }

  statusClass(status: LoanStatus): string {
    return `loan-status-chip chip-${status.toLowerCase()}`;
  }
}

function isActive(status: LoanStatus): boolean {
  return status === 'ACTIVE';
}