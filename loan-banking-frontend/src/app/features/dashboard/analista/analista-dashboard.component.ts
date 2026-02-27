import { Component, inject, signal, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SidebarComponent, NavItem } from '../../../shared/components/sidebar.component';
import { AuthService } from '../../../core/services/auth.service';
import { EvaluationService } from '../../../core/services/evaluation.service';
import { LoanService } from '../../../core/services/loan.service';

@Component({
  selector: 'app-analista-dashboard',
  standalone: true,
  imports: [SidebarComponent, DecimalPipe, FormsModule],
  template: `
    <div class="dashboard-layout">
      <app-sidebar [navItems]="navItems" roleLabel="ANALISTA" />

      <main class="dashboard-content">

        <!-- Header -->
        <div class="page-header anim-fade-up">
          <div>
            <div class="page-eyebrow mono">EVALUACIÓN CREDITICIA</div>
            <h1 class="page-title">Panel Analista</h1>
          </div>
          <span class="badge badge-analista">ANALISTA</span>
        </div>

        <!-- Quick stats -->
        <div class="stats-row anim-fade-up" style="animation-delay:80ms">
          @for (stat of stats; track stat.label) {
            <div class="mini-stat">
              <div class="mini-stat-label mono">{{ stat.label }}</div>
              <div class="mini-stat-value mono">{{ stat.value }}</div>
              <div class="mini-stat-indicator" [class]="stat.cls"></div>
            </div>
          }
        </div>

        <!-- Pending evaluations preview -->
        <div class="card anim-fade-up" style="animation-delay:120ms">
          <div class="card-header">
            <h3 class="section-title">Solicitudes pendientes de evaluación</h3>
            <div class="filter-row">
              <button class="filter-btn active" (click)="goToEvals()">Ver todas →</button>
            </div>
          </div>

          <div class="eval-list">
            @for (item of pendingEvals; track item.id) {
              <div class="eval-item" (click)="goToEvals()">
                <div class="eval-id mono">#{{ item.id }}</div>
                <div class="eval-client">
                  <div class="eval-name">{{ item.client }}</div>
                  <div class="eval-dni mono text-muted">DNI {{ item.dni }}</div>
                </div>
                <div class="eval-meta">
                  <div class="eval-amount mono">S/ {{ item.amount | number }}</div>
                  <div class="text-muted" style="font-size:12px;">{{ item.term }} meses</div>
                </div>
                <div class="eval-score">
                  <div class="score-ring" [class]="scoreClass(item.score)">
                    <span class="mono">{{ item.score }}</span>
                  </div>
                  <div class="text-muted" style="font-size:11px;">Score</div>
                </div>
                <div class="eval-risk">
                  <span class="risk-badge" [class]="'risk-' + item.risk.toLowerCase()">{{ item.risk }}</span>
                </div>
                <div class="eval-actions" (click)="$event.stopPropagation()">
                  <button class="action-btn approve" (click)="goToEvals()">✓ Evaluar</button>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Two columns -->
        <div class="two-col anim-fade-up" style="animation-delay:200ms">

          <!-- DNI search -->
          <div class="card">
            <div class="card-header">
              <h3 class="section-title">Consultar cliente por DNI</h3>
            </div>
            <div class="search-bar">
              <input
                type="text"
                placeholder="Ingresá el DNI..."
                class="search-input mono"
                [(ngModel)]="searchDni"
              />
              <button class="btn btn-primary" style="padding:10px 16px;">Buscar</button>
            </div>
            <div class="search-note mono text-muted" style="font-size:11px;margin-top:12px;">
              Ruta: GET /api/customers/dni/[dni] — requiere rol ANALISTA o ADMIN
            </div>
          </div>

          <!-- Today's stats -->
          <div class="card">
            <div class="card-header">
              <h3 class="section-title">Actividad hoy</h3>
              <span class="mono text-muted" style="font-size:11px;">{{ todayStr }}</span>
            </div>
            <div class="today-grid">
              @for (t of todayActivity; track t.label) {
                <div class="today-item">
                  <div class="today-num mono">{{ t.value }}</div>
                  <div class="today-label">{{ t.label }}</div>
                </div>
              }
            </div>
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

    .page-title { font-size: 26px; font-weight: 800; }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }

    .mini-stat {
      background: var(--bg-card);
      border: 1px solid var(--border-dim);
      border-radius: var(--radius-lg);
      padding: 16px;
      position: relative;
      overflow: hidden;
    }

    .mini-stat-label { font-family: var(--font-mono); font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); margin-bottom: 8px; }
    .mini-stat-value { font-family: var(--font-mono); font-size: 24px; color: var(--text-primary); }

    .mini-stat-indicator { position: absolute; bottom: 0; left: 0; right: 0; height: 2px; }
    .mini-stat-indicator.green  { background: var(--success); }
    .mini-stat-indicator.orange { background: var(--warning); }
    .mini-stat-indicator.blue   { background: var(--accent);  }
    .mini-stat-indicator.red    { background: var(--danger);  }

    .eval-list { display: flex; flex-direction: column; gap: 2px; }

    .eval-item {
      display: grid;
      grid-template-columns: 60px 1fr 110px 80px 90px 140px;
      align-items: center;
      gap: 16px;
      padding: 14px 16px;
      border-radius: var(--radius-md);
      border: 1px solid transparent;
      transition: all var(--t-fast);
      cursor: pointer;
    }

    .eval-item:hover { background: var(--bg-elevated); border-color: var(--border-dim); }

    .eval-id { font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); letter-spacing: 0.06em; }
    .eval-name { font-size: 14px; color: var(--text-primary); font-weight: 500; }
    .eval-dni  { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.06em; }
    .eval-amount { font-family: var(--font-mono); font-size: 15px; color: var(--text-primary); }

    .score-ring {
      width: 44px; height: 44px;
      border-radius: 50%;
      border: 2px solid;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px;
    }

    .score-ring.good   { border-color: var(--success); color: var(--success); }
    .score-ring.medium { border-color: var(--warning); color: var(--warning); }
    .score-ring.low    { border-color: var(--danger);  color: var(--danger);  }

    .risk-badge { padding: 3px 10px; border-radius: 100px; font-family: var(--font-mono); font-size: 11px; font-weight: 500; letter-spacing: 0.06em; }
    .risk-bajo  { background: var(--success-dim); color: var(--success); }
    .risk-medio { background: var(--warning-dim); color: var(--warning); }
    .risk-alto  { background: var(--danger-dim);  color: var(--danger);  }

    .eval-actions { display: flex; gap: 8px; }

    .action-btn { padding: 6px 12px; border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: 11px; cursor: pointer; border: 1px solid; transition: all var(--t-fast); }
    .action-btn.approve { background: var(--success-dim); border-color: rgba(34,197,94,0.3); color: var(--success); }
    .action-btn.approve:hover { background: rgba(34,197,94,0.25); }

    .filter-row { display: flex; gap: 6px; }
    .filter-btn { padding: 4px 12px; border-radius: 100px; background: transparent; border: 1px solid var(--border-dim); color: var(--text-muted); font-size: 12px; cursor: pointer; transition: all var(--t-fast); }
    .filter-btn.active, .filter-btn:hover { background: var(--accent-dim); border-color: rgba(59,130,246,0.3); color: var(--accent-bright); }

    .search-bar { display: flex; gap: 10px; align-items: center; }
    .search-input { flex: 1; padding: 10px 14px; background: var(--bg-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); color: var(--text-primary); font-size: 14px; font-family: var(--font-mono); outline: none; transition: border-color var(--t-fast); }
    .search-input:focus { border-color: var(--accent); }

    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .section-title { font-size: 14px; font-weight: 600; }

    .today-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .today-item { padding: 14px; background: var(--bg-elevated); border-radius: var(--radius-md); border: 1px solid var(--border-dim); }
    .today-num   { font-family: var(--font-mono); font-size: 22px; color: var(--text-primary); }
    .today-label { font-size: 12px; color: var(--text-muted); margin-top: 4px; }

    @media (max-width: 1300px) {
      .stats-row { grid-template-columns: repeat(3, 1fr); }
      .two-col   { grid-template-columns: 1fr; }
    }
  `],
})
export class AnalistaDashboardComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  searchDni = '';

  readonly todayStr = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

  readonly navItems: NavItem[] = [
    { icon: '◈', label: 'Dashboard',    route: '/dashboard/analista' },
    { icon: '◉', label: 'Evaluaciones', route: '/evaluations' },
    { icon: '◇', label: 'Préstamos',    route: '/loans' },
    { icon: '◎', label: 'Clientes',     route: '/dashboard/analista' },
    { icon: '○', label: 'Informes',     route: '/dashboard/analista' },
  ];

  readonly stats = [
    { label: 'Pendientes',     value: '24',  cls: 'orange' },
    { label: 'Aprobados hoy',  value: '8',   cls: 'green'  },
    { label: 'Rechazados hoy', value: '3',   cls: 'red'    },
    { label: 'En revisión',    value: '11',  cls: 'blue'   },
    { label: 'Score promedio', value: '648', cls: 'green'  },
  ];

  readonly pendingEvals = [
    { id: '2241', client: 'Ana García',   dni: '47382910', amount: 15000, term: 24, score: 720, risk: 'BAJO'  },
    { id: '2240', client: 'Pedro Lima',   dni: '52910384', amount: 8500,  term: 12, score: 580, risk: 'MEDIO' },
    { id: '2239', client: 'Rosa Mendoza', dni: '61029384', amount: 25000, term: 36, score: 440, risk: 'ALTO'  },
    { id: '2238', client: 'Luis Torres',  dni: '38192047', amount: 5000,  term: 6,  score: 690, risk: 'BAJO'  },
  ];

  readonly todayActivity = [
    { value: '8',  label: 'Evaluadas'  },
    { value: '5',  label: 'Aprobadas'  },
    { value: '3',  label: 'Rechazadas' },
    { value: '11', label: 'En cola'    },
  ];

  goToEvals(): void {
    this.router.navigate(['/evaluations']);
  }

  scoreClass(score: number): string {
    if (score >= 650) return 'good';
    if (score >= 550) return 'medium';
    return 'low';
  }
}