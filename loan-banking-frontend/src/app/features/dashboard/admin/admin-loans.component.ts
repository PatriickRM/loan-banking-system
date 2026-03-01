import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent, NavItem } from '../../../shared/components/sidebar.component';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../environments/environment';

interface LoanResponse {
  id: number;
  customerId: number;
  amount: number;
  approvedAmount?: number;
  termMonths: number;
  status: string;
  loanType: string;
  interestRate: number;
  monthlyPayment?: number;
  requestDate: string;
  approvalDate?: string;
  purpose?: string;
  rejectionReason?: string;
}

@Component({
  selector: 'app-admin-loans',
  standalone: true,
  imports: [SidebarComponent, CommonModule, FormsModule],
  template: `
    <div class="dashboard-layout">
      <app-sidebar [navItems]="navItems" roleLabel="ADMIN" />

      <main class="dashboard-content">

        <!-- Header -->
        <div class="page-header anim-fade-up">
          <div>
            <div class="page-eyebrow mono">ADMINISTRACIÓN</div>
            <h1 class="page-title">Préstamos</h1>
          </div>
          <div class="header-actions">
            <button class="btn-report" (click)="exportCSV()" [disabled]="loading()">
              <span>↓</span> CSV
            </button>
            <button class="btn-report btn-excel" (click)="exportExcel()" [disabled]="loading()">
              <span>⊞</span> Excel
            </button>
            <button class="btn-report btn-pdf" (click)="exportPDF()" [disabled]="loading()">
              <span>⎙</span> PDF
            </button>
          </div>
        </div>

        <!-- Stats -->
        <div class="quick-stats anim-fade-up" style="animation-delay:60ms">
          <div class="qs-card">
            <div class="qs-label mono">Total préstamos</div>
            <div class="qs-value mono">{{ loans().length }}</div>
          </div>
          <div class="qs-card">
            <div class="qs-label mono">Capital total</div>
            <div class="qs-value mono">S/ {{ totalAmount() | number:'1.0-0' }}</div>
          </div>
          <div class="qs-card qs-warning">
            <div class="qs-label mono">Pendientes</div>
            <div class="qs-value mono">{{ countByStatus('PENDING') }}</div>
          </div>
          <div class="qs-card qs-success">
            <div class="qs-label mono">Activos</div>
            <div class="qs-value mono">{{ countByStatus('ACTIVE') }}</div>
          </div>
          <div class="qs-card qs-danger">
            <div class="qs-label mono">Rechazados</div>
            <div class="qs-value mono">{{ countByStatus('REJECTED') }}</div>
          </div>
        </div>

        <!-- Filtros -->
        <div class="filters-bar card anim-fade-up" style="animation-delay:100ms">
          <div class="filter-group">
            <label class="filter-label mono">Buscar</label>
            <input
              class="filter-input"
              [ngModel]="searchTerm()"
              (ngModelChange)="searchTerm.set($event)"
              placeholder="ID o cliente ID..."
            />
          </div>
          <div class="filter-group">
            <label class="filter-label mono">Estado</label>
            <select
              class="filter-input"
              [ngModel]="statusFilter()"
              (ngModelChange)="statusFilter.set($event)"
            >
              <option value="">Todos</option>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="REJECTED">REJECTED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="DISBURSED">DISBURSED</option>
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label mono">Tipo</label>
            <select
              class="filter-input"
              [ngModel]="typeFilter()"
              (ngModelChange)="typeFilter.set($event)"
            >
              <option value="">Todos</option>
              @for (t of loanTypes(); track t) {
                <option [value]="t">{{ t }}</option>
              }
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label mono">Monto mín.</label>
            <input
              class="filter-input"
              type="number"
              [ngModel]="minAmount()"
              (ngModelChange)="minAmount.set(+$event)"
              placeholder="S/ 0"
            />
          </div>
          <button class="btn-clear" (click)="clearFilters()">✕ Limpiar</button>
        </div>

        <!-- Tabla -->
        <div class="card anim-fade-up" style="animation-delay:160ms">
          <div class="card-header">
            <h3 class="section-title">Lista de préstamos</h3>
            <div class="badge badge-admin">{{ filtered().length }} resultados</div>
          </div>

          @if (loading()) {
            <div class="skeleton-list">
              @for (i of [1,2,3,4,5,6]; track i) { <div class="skeleton-row"></div> }
            </div>
          } @else if (filtered().length === 0) {
            <div class="empty-state">
              <div style="font-size:32px;margin-bottom:12px;">◇</div>
              Sin préstamos que coincidan
            </div>
          } @else {
            <div class="table-wrapper">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>#ID</th>
                    <th>Cliente ID</th>
                    <th>Monto solicitado</th>
                    <th>Monto aprobado</th>
                    <th>Plazo</th>
                    <th>Tipo</th>
                    <th>TEA</th>
                    <th>Cuota</th>
                    <th>Estado</th>
                    <th>Solicitud</th>
                    <th>Aprobación</th>
                  </tr>
                </thead>
                <tbody>
                  @for (loan of paginated(); track loan.id) {
                    <tr (click)="selectedLoan.set(loan)" [class.selected]="selectedLoan()?.id === loan.id">
                      <td class="mono" style="font-size:11px;color:var(--text-muted);">#{{ loan.id }}</td>
                      <td class="mono" style="font-size:12px;">{{ loan.customerId }}</td>
                      <td class="mono" style="font-size:13px;">S/ {{ loan.amount | number:'1.0-0' }}</td>
                      <td class="mono" style="font-size:12px;color:var(--success);">
                        {{ loan.approvedAmount ? ('S/ ' + (loan.approvedAmount | number:'1.0-0')) : '—' }}
                      </td>
                      <td style="font-size:12px;color:var(--text-secondary);">{{ loan.termMonths }}m</td>
                      <td style="font-size:12px;">{{ loan.loanType }}</td>
                      <td class="mono" style="font-size:12px;">{{ loan.interestRate }}%</td>
                      <td class="mono" style="font-size:12px;">
                        {{ loan.monthlyPayment ? ('S/ ' + (loan.monthlyPayment | number:'1.0-0')) : '—' }}
                      </td>
                      <td>
                        <span class="loan-badge" [class]="'loan-' + loan.status.toLowerCase()">
                          {{ loan.status }}
                        </span>
                      </td>
                      <td class="mono" style="font-size:11px;color:var(--text-muted);">
                        {{ loan.requestDate | date:'dd/MM/yy' }}
                      </td>
                      <td class="mono" style="font-size:11px;color:var(--text-muted);">
                        {{ loan.approvalDate ? (loan.approvalDate | date:'dd/MM/yy') : '—' }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Paginación -->
            <div class="pagination">
              <button class="page-btn" (click)="prevPage()" [disabled]="page() === 1">←</button>
              <span class="mono" style="font-size:12px;color:var(--text-muted);">
                Página {{ page() }} de {{ totalPages() }}
              </span>
              <button class="page-btn" (click)="nextPage()" [disabled]="page() === totalPages()">→</button>
            </div>
          }
        </div>

        <!-- Modal detalle préstamo -->
        @if (selectedLoan()) {
          <div class="modal-overlay" (click)="selectedLoan.set(null)">
            <div class="modal-card" (click)="$event.stopPropagation()">
              <div class="modal-header">
                <div class="modal-loan-id mono">#{{ selectedLoan()!.id }}</div>
                <div>
                  <div class="modal-name">Préstamo {{ selectedLoan()!.loanType }}</div>
                  <span class="loan-badge" [class]="'loan-' + selectedLoan()!.status.toLowerCase()">
                    {{ selectedLoan()!.status }}
                  </span>
                </div>
                <button class="modal-close" (click)="selectedLoan.set(null)">✕</button>
              </div>
              <div class="modal-grid">
                <div class="modal-field"><span class="mono">Cliente ID</span><span>{{ selectedLoan()!.customerId }}</span></div>
                <div class="modal-field"><span class="mono">Tipo</span><span>{{ selectedLoan()!.loanType }}</span></div>
                <div class="modal-field"><span class="mono">Monto solicitado</span><span>S/ {{ selectedLoan()!.amount | number:'1.2-2' }}</span></div>
                <div class="modal-field"><span class="mono">Monto aprobado</span><span style="color:var(--success);">{{ selectedLoan()!.approvedAmount ? ('S/ ' + (selectedLoan()!.approvedAmount! | number:'1.2-2')) : '—' }}</span></div>
                <div class="modal-field"><span class="mono">Plazo</span><span>{{ selectedLoan()!.termMonths }} meses</span></div>
                <div class="modal-field"><span class="mono">TEA</span><span>{{ selectedLoan()!.interestRate }}%</span></div>
                <div class="modal-field"><span class="mono">Cuota mensual</span><span>{{ selectedLoan()!.monthlyPayment ? ('S/ ' + (selectedLoan()!.monthlyPayment! | number:'1.2-2')) : '—' }}</span></div>
                <div class="modal-field"><span class="mono">Fecha solicitud</span><span>{{ selectedLoan()!.requestDate | date:'dd/MM/yyyy' }}</span></div>
                @if (selectedLoan()!.approvalDate) {
                  <div class="modal-field"><span class="mono">Fecha aprobación</span><span>{{ selectedLoan()!.approvalDate | date:'dd/MM/yyyy' }}</span></div>
                }
                @if (selectedLoan()!.purpose) {
                  <div class="modal-field" style="grid-column:span 2"><span class="mono">Propósito</span><span>{{ selectedLoan()!.purpose }}</span></div>
                }
                @if (selectedLoan()!.rejectionReason) {
                  <div class="modal-field" style="grid-column:span 2"><span class="mono">Motivo rechazo</span><span style="color:var(--danger);">{{ selectedLoan()!.rejectionReason }}</span></div>
                }
              </div>
            </div>
          </div>
        }

      </main>
    </div>
  `,
  styles: [`
    .page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
    .page-eyebrow { font-size:11px; text-transform:uppercase; letter-spacing:0.12em; color:var(--text-muted); margin-bottom:6px; }
    .page-title   { font-size:26px; font-weight:800; }
    .header-actions { display:flex; gap:10px; }

    .btn-report {
      display:flex; align-items:center; gap:6px;
      padding:8px 16px; border-radius:var(--radius-md);
      background:var(--bg-elevated); border:1px solid var(--border-subtle);
      color:var(--text-secondary); font-size:12px; font-family:var(--font-mono);
      cursor:pointer; transition:all var(--t-fast);
    }
    .btn-report:hover { background:var(--accent-dim); border-color:rgba(59,130,246,0.3); color:var(--accent-bright); }
    .btn-report:disabled { opacity:0.4; cursor:not-allowed; }
    .btn-excel:hover { background:rgba(34,197,94,0.1); border-color:rgba(34,197,94,0.3); color:#22c55e; }
    .btn-pdf:hover { background:rgba(239,68,68,0.1); border-color:rgba(239,68,68,0.3); color:var(--danger); }

    .quick-stats { display:grid; grid-template-columns:repeat(5,1fr); gap:12px; margin-bottom:16px; }
    .qs-card { background:var(--bg-card); border:1px solid var(--border-dim); border-radius:var(--radius-xl); padding:14px 18px; }
    .qs-warning { border-color:rgba(234,179,8,0.2); }
    .qs-success { border-color:rgba(34,197,94,0.2); }
    .qs-danger  { border-color:rgba(239,68,68,0.2); }
    .qs-label { font-size:10px; text-transform:uppercase; letter-spacing:0.1em; color:var(--text-muted); margin-bottom:4px; }
    .qs-value { font-size:22px; color:var(--text-primary); }

    .filters-bar { display:flex; align-items:flex-end; gap:16px; margin-bottom:20px; padding:16px 20px; flex-wrap:wrap; }
    .filter-group { display:flex; flex-direction:column; gap:4px; }
    .filter-label { font-size:10px; text-transform:uppercase; letter-spacing:0.08em; color:var(--text-muted); }
    .filter-input {
      background:var(--bg-elevated); border:1px solid var(--border-dim);
      border-radius:var(--radius-md); padding:7px 12px;
      color:var(--text-primary); font-size:13px;
      outline:none; transition:border-color var(--t-fast); min-width:140px;
    }
    .filter-input:focus { border-color:var(--accent-bright); }
    .btn-clear { padding:7px 14px; border-radius:var(--radius-md); background:transparent; border:1px solid var(--border-dim); color:var(--text-muted); font-size:12px; font-family:var(--font-mono); cursor:pointer; transition:all var(--t-fast); align-self:flex-end; }
    .btn-clear:hover { border-color:var(--danger); color:var(--danger); }

    .table-wrapper { overflow-x:auto; }
    tr.selected td { background:var(--accent-dim) !important; }
    tr:hover { cursor:pointer; }

    .loan-badge { font-family:var(--font-mono); font-size:10px; padding:2px 7px; border-radius:100px; font-weight:600; letter-spacing:0.04em; }
    .loan-pending   { background:rgba(234,179,8,0.15);  color:#eab308; border:1px solid rgba(234,179,8,0.2); }
    .loan-approved  { background:rgba(34,197,94,0.12);  color:var(--success); border:1px solid rgba(34,197,94,0.2); }
    .loan-active    { background:rgba(59,130,246,0.12); color:var(--accent-bright); border:1px solid rgba(59,130,246,0.2); }
    .loan-rejected  { background:rgba(239,68,68,0.12);  color:var(--danger); border:1px solid rgba(239,68,68,0.2); }
    .loan-completed { background:rgba(148,163,184,0.1); color:var(--text-muted); border:1px solid var(--border-dim); }
    .loan-disbursed { background:rgba(168,85,247,0.12); color:#a855f7; border:1px solid rgba(168,85,247,0.2); }

    .pagination { display:flex; align-items:center; justify-content:center; gap:16px; padding:16px 0 4px; }
    .page-btn { width:32px; height:32px; border-radius:var(--radius-md); background:var(--bg-elevated); border:1px solid var(--border-dim); color:var(--text-secondary); cursor:pointer; font-size:14px; transition:all var(--t-fast); }
    .page-btn:hover:not(:disabled) { background:var(--accent-dim); color:var(--accent-bright); }
    .page-btn:disabled { opacity:0.3; cursor:not-allowed; }

    .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.6); backdrop-filter:blur(4px); z-index:1000; display:flex; align-items:center; justify-content:center; }
    .modal-card { background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:var(--radius-xl); padding:28px; width:540px; max-width:90vw; box-shadow:0 24px 64px rgba(0,0,0,0.4); }
    .modal-header { display:flex; align-items:center; gap:16px; margin-bottom:24px; position:relative; }
    .modal-loan-id { font-size:28px; color:var(--text-muted); font-weight:300; }
    .modal-name { font-size:18px; font-weight:700; color:var(--text-primary); margin-bottom:4px; }
    .modal-close { position:absolute; right:0; top:0; background:transparent; border:none; color:var(--text-muted); font-size:16px; cursor:pointer; padding:4px; transition:color var(--t-fast); }
    .modal-close:hover { color:var(--danger); }
    .modal-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .modal-field { display:flex; flex-direction:column; gap:2px; padding:10px 12px; background:var(--bg-elevated); border-radius:var(--radius-md); border:1px solid var(--border-dim); }
    .modal-field span:first-child { font-family:var(--font-mono); font-size:10px; text-transform:uppercase; letter-spacing:0.08em; color:var(--text-muted); }
    .modal-field span:last-child  { font-size:13px; color:var(--text-primary); }

    .skeleton-list { display:flex; flex-direction:column; gap:8px; padding:8px 0; }
    .skeleton-row { height:44px; background:linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-hover) 50%, var(--bg-elevated) 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:var(--radius-md); }
    @keyframes shimmer { 0% { background-position:200% 0; } 100% { background-position:-200% 0; } }
    .empty-state { padding:48px; text-align:center; color:var(--text-muted); font-family:var(--font-mono); font-size:13px; }
  `],
})
export class AdminLoansComponent implements OnInit {
  private readonly http        = inject(HttpClient);
  private readonly authService = inject(AuthService);

  readonly loading      = signal(true);
  readonly loans        = signal<LoanResponse[]>([]);
  readonly selectedLoan = signal<LoanResponse | null>(null);

  // ── Filtros como signals ──────────────────────────────────────────────────
  readonly searchTerm   = signal('');
  readonly statusFilter = signal('');
  readonly typeFilter   = signal('');
  readonly minAmount    = signal(0);
  readonly page         = signal(1);
  readonly pageSize     = 10;

  // ── Reset página al cambiar cualquier filtro ──────────────────────────────
  constructor() {
    effect(() => {
      this.searchTerm();
      this.statusFilter();
      this.typeFilter();
      this.minAmount();
      this.page.set(1);
    }, { allowSignalWrites: true });
  }

  // ── Computeds ─────────────────────────────────────────────────────────────
  readonly filtered = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.loans().filter(l => {
      const matchSearch = !term
        || String(l.id).includes(term)
        || String(l.customerId).includes(term);
      const matchStatus = !this.statusFilter() || l.status === this.statusFilter();
      const matchType   = !this.typeFilter()   || l.loanType === this.typeFilter();
      const matchAmount = !this.minAmount()    || l.amount >= this.minAmount();
      return matchSearch && matchStatus && matchType && matchAmount;
    });
  });

  readonly totalPages  = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));
  readonly paginated   = computed(() => {
    const s = (this.page() - 1) * this.pageSize;
    return this.filtered().slice(s, s + this.pageSize);
  });
  readonly loanTypes   = computed(() => [...new Set(this.loans().map(l => l.loanType))].sort());
  readonly totalAmount = computed(() => this.loans().reduce((s, l) => s + l.amount, 0));

  countByStatus(st: string) { return this.loans().filter(l => l.status === st).length; }

  readonly navItems: NavItem[] = [
    { icon: '◈', label: 'Dashboard',    route: '/dashboard/admin'  },
    { icon: '○', label: 'Clientes',     route: '/admin/customers'  },
    { icon: '◇', label: 'Préstamos',    route: '/admin/loans'      },
    { icon: '◎', label: 'Evaluaciones', route: '/evaluations'      },
    { icon: '◦', label: 'Config',       route: '/dashboard/admin'  },
  ];

  ngOnInit(): void {
    const headers = new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
    this.http.get<LoanResponse[]>(`${environment.apiUrl}/api/loans`, { headers })
      .subscribe({
        next:  d  => { this.loans.set(d); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
  }

  prevPage()     { if (this.page() > 1) this.page.update(p => p - 1); }
  nextPage()     { if (this.page() < this.totalPages()) this.page.update(p => p + 1); }
  clearFilters() {
    this.searchTerm.set('');
    this.statusFilter.set('');
    this.typeFilter.set('');
    this.minAmount.set(0);
    this.page.set(1);
  }

  // ── Exportar CSV ──────────────────────────────────────────────────────────
  exportCSV(): void {
    const hdrs = ['ID','Cliente ID','Monto','Monto Aprobado','Plazo','Tipo','TEA','Cuota','Estado','Fecha Solicitud','Fecha Aprobacion'];
    const rows = this.filtered().map(l => [
      l.id, l.customerId, l.amount, l.approvedAmount ?? '',
      l.termMonths, l.loanType, l.interestRate, l.monthlyPayment ?? '',
      l.status, l.requestDate, l.approvalDate ?? ''
    ]);
    const csv = [hdrs, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'reporte-prestamos.csv' });
    a.click();
  }

  // ── Exportar Excel (.xlsx) ────────────────────────────────────────────────
  exportExcel(): void {
    import('xlsx').then(XLSX => {
      const date = new Date().toLocaleDateString('es-PE');

      // ── Hoja 1: Datos ─────────────────────────────────────────────────────
      const dataRows = this.filtered().map(l => ({
        'ID':               l.id,
        'Cliente ID':       l.customerId,
        'Tipo':             l.loanType,
        'Monto Solicitado': l.amount,
        'Monto Aprobado':   l.approvedAmount ?? '',
        'Plazo (meses)':    l.termMonths,
        'TEA (%)':          l.interestRate,
        'Cuota Mensual':    l.monthlyPayment ?? '',
        'Estado':           l.status,
        'Propósito':        l.purpose ?? '',
        'Fecha Solicitud':  l.requestDate,
        'Fecha Aprobación': l.approvalDate ?? '',
        'Motivo Rechazo':   l.rejectionReason ?? '',
      }));

      const wsData = XLSX.utils.json_to_sheet(dataRows);
      wsData['!cols'] = [
        { wch: 6  }, // ID
        { wch: 12 }, // Cliente ID
        { wch: 16 }, // Tipo
        { wch: 18 }, // Monto Solicitado
        { wch: 16 }, // Monto Aprobado
        { wch: 14 }, // Plazo
        { wch: 10 }, // TEA
        { wch: 16 }, // Cuota
        { wch: 12 }, // Estado
        { wch: 28 }, // Propósito
        { wch: 16 }, // Fecha Solicitud
        { wch: 18 }, // Fecha Aprobación
        { wch: 28 }, // Motivo Rechazo
      ];

      // ── Hoja 2: Resumen ───────────────────────────────────────────────────
      const totalMonto    = this.filtered().reduce((s, l) => s + l.amount, 0);
      const totalAprobado = this.filtered().reduce((s, l) => s + (l.approvedAmount ?? 0), 0);
      const avgMonto      = this.filtered().length ? totalMonto / this.filtered().length : 0;

      const summaryData = [
        { 'Métrica': 'Total préstamos (filtrados)',  'Valor': this.filtered().length },
        { 'Métrica': 'Total préstamos (general)',    'Valor': this.loans().length },
        { 'Métrica': 'Capital total solicitado (S/)', 'Valor': totalMonto },
        { 'Métrica': 'Capital total aprobado (S/)',   'Valor': totalAprobado },
        { 'Métrica': 'Monto promedio (S/)',           'Valor': Math.round(avgMonto) },
        { 'Métrica': 'Pendientes',    'Valor': this.countByStatus('PENDING') },
        { 'Métrica': 'Aprobados',     'Valor': this.countByStatus('APPROVED') },
        { 'Métrica': 'Activos',       'Valor': this.countByStatus('ACTIVE') },
        { 'Métrica': 'Rechazados',    'Valor': this.countByStatus('REJECTED') },
        { 'Métrica': 'Completados',   'Valor': this.countByStatus('COMPLETED') },
        { 'Métrica': 'Desembolsados', 'Valor': this.countByStatus('DISBURSED') },
        { 'Métrica': 'Fecha de reporte', 'Valor': date },
      ];

      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      wsSummary['!cols'] = [{ wch: 32 }, { wch: 20 }];

      // ── Hoja 3: Por tipo de préstamo ──────────────────────────────────────
      const byTypeMap = new Map<string, { count: number; totalMonto: number; totalAprobado: number }>();
      this.filtered().forEach(l => {
        const entry = byTypeMap.get(l.loanType) ?? { count: 0, totalMonto: 0, totalAprobado: 0 };
        entry.count++;
        entry.totalMonto    += l.amount;
        entry.totalAprobado += l.approvedAmount ?? 0;
        byTypeMap.set(l.loanType, entry);
      });

      const typeData = [...byTypeMap.entries()]
        .sort((a, b) => b[1].count - a[1].count)
        .map(([type, { count, totalMonto, totalAprobado }]) => ({
          'Tipo':                    type,
          'N° Préstamos':            count,
          'Monto Total (S/)':        totalMonto,
          'Monto Aprobado Total (S/)': totalAprobado,
          'Monto Promedio (S/)':     Math.round(totalMonto / count),
        }));

      const wsType = XLSX.utils.json_to_sheet(typeData);
      wsType['!cols'] = [{ wch: 20 }, { wch: 14 }, { wch: 20 }, { wch: 24 }, { wch: 22 }];

      // ── Hoja 4: Por estado ────────────────────────────────────────────────
      const statuses = ['PENDING', 'APPROVED', 'ACTIVE', 'REJECTED', 'COMPLETED', 'DISBURSED'];
      const statusData = statuses.map(st => {
        const group = this.filtered().filter(l => l.status === st);
        const total = group.reduce((s, l) => s + l.amount, 0);
        return {
          'Estado':           st,
          'N° Préstamos':     group.length,
          'Monto Total (S/)': total,
          'Promedio (S/)':    group.length ? Math.round(total / group.length) : 0,
        };
      }).filter(r => r['N° Préstamos'] > 0);

      const wsStatus = XLSX.utils.json_to_sheet(statusData);
      wsStatus['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 20 }, { wch: 16 }];

      // ── Armar libro ───────────────────────────────────────────────────────
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsData,   'Préstamos');
      XLSX.utils.book_append_sheet(wb, wsSummary,'Resumen');
      XLSX.utils.book_append_sheet(wb, wsType,   'Por Tipo');
      XLSX.utils.book_append_sheet(wb, wsStatus, 'Por Estado');

      XLSX.writeFile(wb, `reporte-prestamos-${date.replace(/\//g, '-')}.xlsx`);
    });
  }

  // ── Exportar PDF ──────────────────────────────────────────────────────────
  exportPDF(): void {
    const date = new Date().toLocaleDateString('es-PE');
    const statusColor: Record<string, string> = {
      PENDING:'#eab308', APPROVED:'#22c55e', ACTIVE:'#3b82f6',
      REJECTED:'#ef4444', COMPLETED:'#94a3b8', DISBURSED:'#a855f7'
    };
    const rows = this.filtered().map(l => `
      <tr>
        <td>#${l.id}</td>
        <td>${l.customerId}</td>
        <td>S/ ${l.amount.toLocaleString()}</td>
        <td>${l.approvedAmount ? 'S/ ' + l.approvedAmount.toLocaleString() : '—'}</td>
        <td>${l.termMonths}m</td>
        <td>${l.loanType}</td>
        <td>${l.interestRate}%</td>
        <td><span style="background:${statusColor[l.status] ?? '#94a3b8'}22;color:${statusColor[l.status] ?? '#94a3b8'};padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;">${l.status}</span></td>
        <td>${new Date(l.requestDate).toLocaleDateString('es-PE')}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reporte de Préstamos — ${date}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Segoe UI',sans-serif;color:#1a1a2e;padding:40px;background:#fff;}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:20px;border-bottom:2px solid #1e40af;}
    .logo{font-size:28px;font-weight:900;color:#1e40af;letter-spacing:-0.02em;}
    .logo span{color:#64748b;font-weight:300;}
    .meta{text-align:right;font-size:12px;color:#64748b;line-height:1.8;}
    .title{font-size:22px;font-weight:700;color:#0f172a;margin-bottom:6px;}
    .subtitle{font-size:13px;color:#64748b;margin-bottom:24px;}
    .stats{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:28px;}
    .stat{background:#f1f5f9;border-radius:8px;padding:14px;text-align:center;}
    .stat-n{font-size:26px;font-weight:700;color:#1e40af;}
    .stat-l{font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;margin-top:2px;}
    table{width:100%;border-collapse:collapse;font-size:12px;}
    thead tr{background:#1e40af;color:#fff;}
    th{padding:10px 12px;text-align:left;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;}
    td{padding:8px 12px;border-bottom:1px solid #e2e8f0;}
    tr:nth-child(even) td{background:#f8fafc;}
    .footer{margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;display:flex;justify-content:space-between;}
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">LBS <span>Banking System</span></div>
    <div class="meta"><div>Reporte: ${date}</div><div>Total: ${this.filtered().length}</div><div>Admin</div></div>
  </div>
  <div class="title">Reporte de Préstamos</div>
  <div class="subtitle">Detalle completo de préstamos registrados en el sistema</div>
  <div class="stats">
    <div class="stat"><div class="stat-n">${this.loans().length}</div><div class="stat-l">Total</div></div>
    <div class="stat"><div class="stat-n" style="color:#eab308">${this.countByStatus('PENDING')}</div><div class="stat-l">Pendientes</div></div>
    <div class="stat"><div class="stat-n" style="color:#22c55e">${this.countByStatus('APPROVED')}</div><div class="stat-l">Aprobados</div></div>
    <div class="stat"><div class="stat-n" style="color:#3b82f6">${this.countByStatus('ACTIVE')}</div><div class="stat-l">Activos</div></div>
    <div class="stat"><div class="stat-n" style="color:#ef4444">${this.countByStatus('REJECTED')}</div><div class="stat-l">Rechazados</div></div>
  </div>
  <table>
    <thead><tr><th>#ID</th><th>Cliente</th><th>Monto</th><th>Aprobado</th><th>Plazo</th><th>Tipo</th><th>TEA</th><th>Estado</th><th>Solicitud</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">
    <span>LBS — Loan Banking System</span>
    <span>${date} — CONFIDENCIAL</span>
  </div>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); win.print(); }
  }
}
