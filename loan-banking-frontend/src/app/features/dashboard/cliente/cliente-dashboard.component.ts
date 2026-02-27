import { Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { SidebarComponent, NavItem } from '../../../shared/components/sidebar.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-cliente-dashboard',
  imports: [SidebarComponent, DecimalPipe],
  template: `
    <div class="dashboard-layout">
      <app-sidebar [navItems]="navItems" roleLabel="CLIENTE" />

      <main class="dashboard-content">

        <!-- Greeting header -->
        <div class="welcome-header anim-fade-up">
          <div class="welcome-text">
            <div class="page-eyebrow mono">MI CUENTA</div>
            <h1 class="page-title">
              Hola, <span class="accent-name">{{ auth.user()?.username }}</span>
            </h1>
            <p class="text-secondary" style="margin-top:6px;">
              Aquí podés ver y gestionar tus préstamos.
            </p>
          </div>
          <button class="btn btn-primary new-loan-btn">
            + Solicitar préstamo
          </button>
        </div>

        <!-- Credit score card -->
        <div class="credit-banner anim-fade-up" style="animation-delay:80ms">
          <div class="credit-info">
            <div class="credit-label mono">SCORE CREDITICIO</div>
            <div class="credit-score mono">648</div>
            <div class="credit-desc">Bueno — Podés acceder a préstamos de hasta S/ 30,000</div>
          </div>
          <div class="credit-meter">
            <div class="meter-track">
              <div class="meter-fill" style="width:54%"></div>
              <div class="meter-thumb" style="left:54%"></div>
            </div>
            <div class="meter-labels mono">
              <span>300</span>
              <span>600</span>
              <span>850</span>
            </div>
          </div>
        </div>

        <!-- Stats row -->
        <div class="stats-row anim-fade-up" style="animation-delay:120ms">
          @for (stat of stats; track stat.label) {
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
        <div class="card anim-fade-up" style="animation-delay:160ms">
          <div class="card-header">
            <h3 class="section-title">Mis préstamos</h3>
            <span class="badge badge-cliente">ACTIVOS</span>
          </div>

          @if (activeLoans.length === 0) {
            <div class="empty-state">
              <div class="empty-icon">◎</div>
              <p>No tenés préstamos activos.</p>
              <button class="btn btn-primary" style="margin-top:12px;">
                Solicitar mi primer préstamo
              </button>
            </div>
          } @else {
            <div class="loans-list">
              @for (loan of activeLoans; track loan.id) {
                <div class="loan-card">
                  <div class="loan-top">
                    <div>
                      <div class="loan-id mono">#{{ loan.id }}</div>
                      <div class="loan-amount mono">S/ {{ loan.amount | number }}</div>
                    </div>
                    <span class="status-chip" [class]="'chip-' + loan.status.toLowerCase()">
                      {{ loan.statusLabel }}
                    </span>
                  </div>

                  <div class="loan-progress-wrap">
                    <div class="loan-progress-track">
                      <div class="loan-progress-bar" [style.width.%]="loan.paidPct"></div>
                    </div>
                    <div class="loan-progress-label mono">
                      {{ loan.paidInstallments }}/{{ loan.totalInstallments }} cuotas
                      <span class="text-muted">({{ loan.paidPct }}%)</span>
                    </div>
                  </div>

                  <div class="loan-meta mono">
                    <span>Próx. cuota: <strong>{{ loan.nextDue }}</strong></span>
                    <span>Monto cuota: <strong>S/ {{ loan.installmentAmount | number }}</strong></span>
                    <span>Saldo: <strong>S/ {{ loan.balance | number }}</strong></span>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Payment history -->
        <div class="card anim-fade-up" style="animation-delay:220ms">
          <div class="card-header">
            <h3 class="section-title">Historial de pagos</h3>
            <span class="mono text-muted" style="font-size:11px;">Últimos 5</span>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Préstamo</th>
                <th>Monto</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              @for (pay of paymentHistory; track pay.id) {
                <tr>
                  <td class="mono" style="font-size:12px;">{{ pay.date }}</td>
                  <td class="mono text-muted" style="font-size:12px;">#{{ pay.loanId }}</td>
                  <td class="mono" style="color:var(--text-primary)">S/ {{ pay.amount | number }}</td>
                  <td>
                    <span class="status-chip chip-pagado">{{ pay.status }}</span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

      </main>
    </div>
  `,
  styles: [`
    .welcome-header {
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

    .accent-name { color: var(--accent-bright); }

    .new-loan-btn { margin-top: 6px; }

    /* Credit banner */
    .credit-banner {
      background: var(--bg-card);
      border: 1px solid var(--border-dim);
      border-radius: var(--radius-xl);
      padding: 24px 28px;
      margin-bottom: 20px;
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
      margin-bottom: 6px;
    }

    .credit-score {
      font-size: 52px;
      font-weight: 400;
      color: var(--success);
      line-height: 1;
      margin-bottom: 8px;
      letter-spacing: -0.03em;
    }

    .credit-desc {
      font-size: 13px;
      color: var(--text-secondary);
    }

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
      position: relative;
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

    /* Stats row */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
      margin-bottom: 24px;
    }

    .client-stat {
      background: var(--bg-card);
      border: 1px solid var(--border-dim);
      border-radius: var(--radius-xl);
      padding: 18px;
      display: flex;
      align-items: center;
      gap: 14px;
      transition: all var(--t-fast);
    }

    .client-stat:hover {
      border-color: var(--border-subtle);
      background: var(--bg-hover);
    }

    .cs-icon { font-size: 22px; }
    .cs-value { font-size: 22px; color: var(--text-primary); }
    .cs-label { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

    /* Loans */
    .loans-list { display: flex; flex-direction: column; gap: 14px; }

    .loan-card {
      background: var(--bg-elevated);
      border: 1px solid var(--border-dim);
      border-radius: var(--radius-lg);
      padding: 18px 20px;
      transition: all var(--t-fast);
    }

    .loan-card:hover {
      border-color: var(--border-subtle);
    }

    .loan-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 14px;
    }

    .loan-id    { font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); }
    .loan-amount { font-family: var(--font-mono); font-size: 22px; color: var(--text-primary); margin-top: 4px; }

    .status-chip {
      padding: 3px 10px;
      border-radius: 100px;
      font-family: var(--font-mono);
      font-size: 11px;
      letter-spacing: 0.06em;
    }

    .chip-activo   { background: var(--success-dim); color: var(--success); }
    .chip-pendiente { background: var(--warning-dim); color: var(--warning); }
    .chip-mora     { background: var(--danger-dim);  color: var(--danger);  }
    .chip-pagado   { background: var(--accent-dim);  color: var(--accent-bright); }

    .loan-progress-wrap { margin-bottom: 14px; }

    .loan-progress-track {
      height: 4px;
      background: var(--bg-card);
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 6px;
    }

    .loan-progress-bar {
      height: 100%;
      background: var(--accent);
      border-radius: 2px;
      transition: width 0.6s ease;
    }

    .loan-progress-label {
      font-size: 11px;
      color: var(--text-muted);
    }

    .loan-meta {
      display: flex;
      gap: 24px;
      font-size: 12px;
      color: var(--text-muted);
    }

    .loan-meta strong { color: var(--text-secondary); }

    .section-title { font-size: 14px; font-weight: 600; }

    /* Empty state */
    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: var(--text-muted);
    }

    .empty-icon {
      font-size: 36px;
      margin-bottom: 12px;
      opacity: 0.4;
    }

    @media (max-width: 1100px) {
      .credit-banner { flex-direction: column; gap: 20px; }
      .stats-row { grid-template-columns: repeat(2, 1fr); }
      .loan-meta { flex-direction: column; gap: 6px; }
    }
  `],
})
export class ClienteDashboardComponent {
  readonly auth = inject(AuthService);

  readonly navItems: NavItem[] = [
    { icon: '◈', label: 'Mi cuenta',      route: '/dashboard/cliente' },
    { icon: '◎', label: 'Mis préstamos',  route: '/dashboard/cliente' },
    { icon: '◇', label: 'Pagos',          route: '/dashboard/cliente' },
    { icon: '○', label: 'Documentos',     route: '/dashboard/cliente' },
    { icon: '◦', label: 'Perfil',         route: '/dashboard/cliente' },
  ];

  readonly stats = [
    { icon: '📋', label: 'Préstamos activos', value: '2' },
    { icon: '💳', label: 'Deuda total',        value: 'S/18,400' },
    { icon: '📅', label: 'Próx. vencimiento',  value: '05 Mar' },
    { icon: '✓',  label: 'Cuotas al día',      value: '14' },
  ];

  readonly activeLoans = [
    {
      id: '1042',
      amount: 15000,
      status: 'activo',
      statusLabel: 'AL DÍA',
      paidInstallments: 8,
      totalInstallments: 24,
      paidPct: 33,
      nextDue: '05 Mar 2026',
      installmentAmount: 720,
      balance: 10080,
    },
    {
      id: '1035',
      amount: 5000,
      status: 'activo',
      statusLabel: 'AL DÍA',
      paidInstallments: 9,
      totalInstallments: 12,
      paidPct: 75,
      nextDue: '10 Mar 2026',
      installmentAmount: 455,
      balance: 1365,
    },
  ];

  readonly paymentHistory = [
    { id: 1, loanId: '1042', date: '05 Feb 2026', amount: 720,  status: 'Pagado' },
    { id: 2, loanId: '1035', date: '10 Feb 2026', amount: 455,  status: 'Pagado' },
    { id: 3, loanId: '1042', date: '05 Ene 2026', amount: 720,  status: 'Pagado' },
    { id: 4, loanId: '1035', date: '10 Ene 2026', amount: 455,  status: 'Pagado' },
    { id: 5, loanId: '1042', date: '05 Dic 2025', amount: 720,  status: 'Pagado' },
  ];
}