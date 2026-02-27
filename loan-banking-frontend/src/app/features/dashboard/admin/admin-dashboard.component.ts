import { Component, inject, signal, OnInit } from '@angular/core';
import { SidebarComponent, NavItem } from '../../../shared/components/sidebar.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [SidebarComponent],
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
            <div class="status-dot"></div>
            <span class="mono text-muted" style="font-size:12px;">Sistema operativo</span>
          </div>
        </div>

        <!-- Stats grid -->
        <div class="stats-grid anim-fade-up" style="animation-delay:80ms">
          @for (stat of stats; track stat.label) {
            <div class="stat-card">
              <div class="stat-icon">{{ stat.icon }}</div>
              <div class="stat-label">{{ stat.label }}</div>
              <div class="stat-value mono">{{ stat.value }}</div>
              <div class="stat-sub">
                <span [class]="stat.trend > 0 ? 'text-success' : 'text-danger'">
                  {{ stat.trend > 0 ? '↑' : '↓' }} {{ Math.abs(stat.trend) }}%
                </span>
                <span class="text-muted"> este mes</span>
              </div>
            </div>
          }
        </div>

        <!-- Two column layout -->
        <div class="content-grid anim-fade-up" style="animation-delay:160ms">

          <!-- Recent users table -->
          <div class="card">
            <div class="card-header">
              <h3 class="section-title">Usuarios recientes</h3>
              <div class="badge badge-admin">ADMIN</div>
            </div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                @for (user of recentUsers; track user.id) {
                  <tr>
                    <td>
                      <div class="user-cell">
                        <div class="mini-avatar">{{ user.username[0].toUpperCase() }}</div>
                        <div>
                          <div style="color:var(--text-primary);font-size:13px;">{{ user.username }}</div>
                          <div class="mono" style="font-size:11px;color:var(--text-muted);">{{ user.email }}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="badge" [class]="'badge-' + user.role.toLowerCase()">
                        {{ user.role }}
                      </span>
                    </td>
                    <td>
                      <span class="status-pill" [class.active]="user.active">
                        {{ user.active ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <td class="mono" style="font-size:12px;">{{ user.date }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- System status panel -->
          <div class="card">
            <div class="card-header">
              <h3 class="section-title">Microservicios</h3>
              <div class="badge badge-admin">LIVE</div>
            </div>
            <div class="services-list">
              @for (svc of services; track svc.name) {
                <div class="service-row">
                  <div class="service-indicator" [class.up]="svc.up"></div>
                  <div class="service-info">
                    <div class="service-name">{{ svc.name }}</div>
                    <div class="mono service-url">{{ svc.route }}</div>
                  </div>
                  <div class="service-latency mono" [class.high]="svc.ms > 200">
                    {{ svc.up ? svc.ms + 'ms' : 'DOWN' }}
                  </div>
                </div>
              }
            </div>
          </div>

        </div>

        <!-- Loans overview -->
        <div class="card anim-fade-up" style="animation-delay:240ms">
          <div class="card-header">
            <h3 class="section-title">Resumen de préstamos</h3>
            <div class="tab-group">
              <button class="tab active">7 días</button>
              <button class="tab">30 días</button>
              <button class="tab">Año</button>
            </div>
          </div>
          <div class="loan-bars">
            @for (bar of loanData; track bar.label) {
              <div class="bar-item">
                <div class="bar-label mono">{{ bar.label }}</div>
                <div class="bar-track">
                  <div class="bar-fill" [style.width.%]="bar.pct" [class]="bar.type"></div>
                </div>
                <div class="bar-value mono">{{ bar.count }}</div>
              </div>
            }
          </div>
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

    .page-title {
      font-size: 26px;
      font-weight: 800;
    }

    .header-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 6px;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--success);
      animation: pulse-glow 2s infinite;
      box-shadow: 0 0 0 0 var(--success);
    }

    @keyframes pulse-glow {
      0%,100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
      50% { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
    }

    /* Stats */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: var(--bg-card);
      border: 1px solid var(--border-dim);
      border-radius: var(--radius-xl);
      padding: 20px;
      transition: all var(--t-fast);
    }

    .stat-card:hover {
      border-color: var(--border-subtle);
      background: var(--bg-hover);
      transform: translateY(-1px);
    }

    .stat-icon {
      font-size: 20px;
      margin-bottom: 12px;
      filter: grayscale(0.3);
    }

    .stat-label {
      font-family: var(--font-mono);
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-muted);
      margin-bottom: 6px;
    }

    .stat-value {
      font-size: 30px;
      font-weight: 400;
      color: var(--text-primary);
      letter-spacing: -0.02em;
      margin-bottom: 4px;
    }

    .stat-sub { font-size: 12px; }

    /* Content grid */
    .content-grid {
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }

    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
    }

    /* User cell */
    .user-cell {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .mini-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--bg-elevated);
      border: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: var(--text-secondary);
      flex-shrink: 0;
      font-family: var(--font-mono);
    }

    .status-pill {
      font-family: var(--font-mono);
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 100px;
      background: var(--danger-dim);
      color: var(--danger);
      border: 1px solid rgba(239,68,68,0.2);
    }

    .status-pill.active {
      background: var(--success-dim);
      color: var(--success);
      border-color: rgba(34,197,94,0.2);
    }

    /* Services */
    .services-list { display: flex; flex-direction: column; gap: 12px; }

    .service-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      background: var(--bg-elevated);
      border-radius: var(--radius-md);
      border: 1px solid var(--border-dim);
    }

    .service-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--danger);
      flex-shrink: 0;
    }

    .service-indicator.up { background: var(--success); }

    .service-info { flex: 1; min-width: 0; }
    .service-name { font-size: 13px; color: var(--text-primary); font-weight: 500; }
    .service-url  { font-size: 11px; color: var(--text-muted); letter-spacing: 0.04em; }

    .service-latency {
      font-size: 12px;
      color: var(--success);
    }

    .service-latency.high { color: var(--warning); }

    /* Tab group */
    .tab-group { display: flex; gap: 4px; }

    .tab {
      padding: 4px 12px;
      border-radius: var(--radius-sm);
      background: transparent;
      border: 1px solid var(--border-dim);
      color: var(--text-muted);
      font-family: var(--font-mono);
      font-size: 11px;
      cursor: pointer;
      transition: all var(--t-fast);
    }

    .tab.active, .tab:hover {
      background: var(--accent-dim);
      border-color: rgba(59,130,246,0.25);
      color: var(--accent-bright);
    }

    /* Loan bars */
    .loan-bars { display: flex; flex-direction: column; gap: 14px; padding-top: 8px; }

    .bar-item { display: flex; align-items: center; gap: 14px; }

    .bar-label {
      width: 90px;
      font-size: 12px;
      color: var(--text-muted);
      flex-shrink: 0;
      letter-spacing: 0.04em;
    }

    .bar-track {
      flex: 1;
      height: 6px;
      background: var(--bg-elevated);
      border-radius: 3px;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
      background: var(--accent);
    }

    .bar-fill.approved { background: var(--success); }
    .bar-fill.pending  { background: var(--warning); }
    .bar-fill.rejected { background: var(--danger); }

    .bar-value { font-size: 12px; color: var(--text-secondary); width: 36px; text-align: right; }

    @media (max-width: 1200px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .content-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class AdminDashboardComponent {
  readonly auth = inject(AuthService);
  readonly Math = Math;

  readonly navItems: NavItem[] = [
    { icon: '◈', label: 'Dashboard',     route: '/dashboard/admin'  },
    { icon: '◉', label: 'Usuarios',      route: '/dashboard/admin'  },
    { icon: '◇', label: 'Préstamos',     route: '/loans'            },
    { icon: '◎', label: 'Evaluaciones',  route: '/evaluations'      },
    { icon: '○', label: 'Clientes',      route: '/dashboard/admin'  },
    { icon: '◈', label: 'Pagos',         route: '/dashboard/admin'  },
    { icon: '◦', label: 'Configuración', route: '/dashboard/admin'  },
  ];

  readonly stats = [
    { icon: '👤', label: 'Total usuarios',    value: '1,284',  trend: 12 },
    { icon: '📋', label: 'Préstamos activos',  value: '347',    trend: 8  },
    { icon: '💰', label: 'Capital expuesto',   value: 'S/2.1M', trend: -3 },
    { icon: '⚠️', label: 'En mora',            value: '18',     trend: -22 },
  ];

  readonly recentUsers = [
    { id: 1, username: 'jperez',   email: 'juan@email.com',    role: 'CLIENTE',  active: true,  date: '26/02/2026' },
    { id: 2, username: 'mrodriguez', email: 'maria@email.com', role: 'ANALISTA', active: true,  date: '25/02/2026' },
    { id: 3, username: 'cgomez',   email: 'carlos@email.com',  role: 'CLIENTE',  active: false, date: '25/02/2026' },
    { id: 4, username: 'lflores',  email: 'lucia@email.com',   role: 'ANALISTA', active: true,  date: '24/02/2026' },
    { id: 5, username: 'rcastro',  email: 'roberto@email.com', role: 'CLIENTE',  active: true,  date: '24/02/2026' },
  ];

  readonly services = [
    { name: 'auth-service',              route: 'lb://auth-service',              up: true,  ms: 45  },
    { name: 'customer-service',          route: 'lb://customer-service',          up: true,  ms: 62  },
    { name: 'loan-service',              route: 'lb://loan-service',              up: true,  ms: 88  },
    { name: 'payment-service',           route: 'lb://payment-service',           up: true,  ms: 71  },
    { name: 'credit-evaluation-service', route: 'lb://credit-evaluation-service', up: false, ms: 0   },
    { name: 'notification-service',      route: 'lb://notification-service',      up: true,  ms: 120 },
  ];

  readonly loanData = [
    { label: 'Aprobados',  pct: 68, count: 236, type: 'approved' },
    { label: 'Pendientes', pct: 22, count: 76,  type: 'pending'  },
    { label: 'Rechazados', pct: 10, count: 35,  type: 'rejected' },
  ];
}