import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent, NavItem } from '../../../shared/components/sidebar.component';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../environments/environment';

interface CustomerResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  dni: string;
  phone: string;
  city: string;
  country: string;
  address: string;
  occupation: string;
  employerName: string;
  monthlyIncome: number;
  dateOfBirth: string;
  createdAt: string;
}

@Component({
  selector: 'app-admin-customers',
  standalone: true,
  imports: [SidebarComponent, CommonModule, FormsModule],
  template: `
    <div class="dashboard-layout">
      <app-sidebar [navItems]="navItems" roleLabel="ADMINISTRADOR" />

      <main class="dashboard-content">

        <!-- Header -->
        <div class="page-header anim-fade-up">
          <div>
            <div class="page-eyebrow mono">ADMINISTRACIÓN</div>
            <h1 class="page-title">Clientes</h1>
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

        <!-- Stats rápidas -->
        <div class="quick-stats anim-fade-up" style="animation-delay:60ms">
          <div class="qs-card">
            <div class="qs-label mono">Total clientes</div>
            <div class="qs-value mono">{{ customers().length }}</div>
          </div>
          <div class="qs-card">
            <div class="qs-label mono">Ciudades</div>
            <div class="qs-value mono">{{ uniqueCities() }}</div>
          </div>
          <div class="qs-card">
            <div class="qs-label mono">Ingreso promedio</div>
            <div class="qs-value mono">S/ {{ avgIncome() | number:'1.0-0' }}</div>
          </div>
          <div class="qs-card">
            <div class="qs-label mono">Filtrados</div>
            <div class="qs-value mono">{{ filtered().length }}</div>
          </div>
        </div>

        <!-- Filtros -->
        <div class="filters-bar anim-fade-up card" style="animation-delay:100ms">
          <div class="filter-group">
            <label class="filter-label mono">Buscar</label>
            <input
              class="filter-input"
              [ngModel]="searchTerm()"
              (ngModelChange)="searchTerm.set($event)"
              placeholder="Nombre, DNI o email..."
            />
          </div>
          <div class="filter-group">
            <label class="filter-label mono">Ciudad</label>
            <select
              class="filter-input"
              [ngModel]="cityFilter()"
              (ngModelChange)="cityFilter.set($event)"
            >
              <option value="">Todas</option>
              @for (city of cities(); track city) {
                <option [value]="city">{{ city }}</option>
              }
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label mono">Ingreso mín.</label>
            <input
              class="filter-input"
              type="number"
              [ngModel]="minIncome()"
              (ngModelChange)="minIncome.set(+$event)"
              placeholder="S/ 0"
            />
          </div>
          <button class="btn-clear" (click)="clearFilters()">✕ Limpiar</button>
        </div>

        <!-- Tabla -->
        <div class="card anim-fade-up" style="animation-delay:160ms">
          <div class="card-header">
            <h3 class="section-title">Lista de clientes</h3>
            <div class="badge badge-admin">{{ filtered().length }} resultados</div>
          </div>

          @if (loading()) {
            <div class="skeleton-list">
              @for (i of [1,2,3,4,5,6,7]; track i) {
                <div class="skeleton-row"></div>
              }
            </div>
          } @else if (filtered().length === 0) {
            <div class="empty-state">
              <div style="font-size:32px;margin-bottom:12px;">○</div>
              Sin clientes que coincidan con los filtros
            </div>
          } @else {
            <div class="table-wrapper">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>DNI</th>
                    <th>Teléfono</th>
                    <th>Ciudad</th>
                    <th>Ocupación</th>
                    <th>Empleador</th>
                    <th>Ingreso</th>
                    <th>Registro</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (c of paginated(); track c.id) {
                    <tr (click)="selectCustomer(c)" [class.selected]="selected()?.id === c.id">
                      <td class="mono" style="font-size:11px;color:var(--text-muted);">{{ c.id }}</td>
                      <td>
                        <div class="user-cell">
                          <div class="mini-avatar">{{ c.firstName[0] }}{{ c.lastName[0] }}</div>
                          <div>
                            <div style="font-size:13px;color:var(--text-primary);">
                              {{ c.firstName }} {{ c.lastName }}
                            </div>
                            <div class="mono" style="font-size:11px;color:var(--text-muted);">{{ c.email }}</div>
                          </div>
                        </div>
                      </td>
                      <td class="mono" style="font-size:12px;">{{ c.dni }}</td>
                      <td style="font-size:12px;color:var(--text-secondary);">{{ c.phone }}</td>
                      <td style="font-size:12px;">{{ c.city }}</td>
                      <td style="font-size:12px;color:var(--text-secondary);">{{ c.occupation }}</td>
                      <td style="font-size:12px;color:var(--text-secondary);">{{ c.employerName || '—' }}</td>
                      <td class="mono" style="font-size:12px;color:var(--success);">
                        S/ {{ c.monthlyIncome | number:'1.0-0' }}
                      </td>
                      <td class="mono" style="font-size:11px;color:var(--text-muted);">
                        {{ c.createdAt | date:'dd/MM/yy' }}
                      </td>
                      <td>
                        <button class="btn-detail" (click)="$event.stopPropagation(); viewDetail(c)">
                          Ver
                        </button>
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

        <!-- Modal detalle -->
        @if (selected()) {
          <div class="modal-overlay" (click)="selected.set(null)">
            <div class="modal-card" (click)="$event.stopPropagation()">
              <div class="modal-header">
                <div class="modal-avatar">
                  {{ selected()!.firstName[0] }}{{ selected()!.lastName[0] }}
                </div>
                <div>
                  <div class="modal-name">{{ selected()!.firstName }} {{ selected()!.lastName }}</div>
                  <div class="mono" style="font-size:12px;color:var(--text-muted);">DNI: {{ selected()!.dni }}</div>
                </div>
                <button class="modal-close" (click)="selected.set(null)">✕</button>
              </div>
              <div class="modal-grid">
                <div class="modal-field"><span class="mono">Email</span><span>{{ selected()!.email }}</span></div>
                <div class="modal-field"><span class="mono">Teléfono</span><span>{{ selected()!.phone }}</span></div>
                <div class="modal-field"><span class="mono">Ciudad</span><span>{{ selected()!.city }}, {{ selected()!.country }}</span></div>
                <div class="modal-field"><span class="mono">Dirección</span><span>{{ selected()!.address }}</span></div>
                <div class="modal-field"><span class="mono">Ocupación</span><span>{{ selected()!.occupation }}</span></div>
                <div class="modal-field"><span class="mono">Empleador</span><span>{{ selected()!.employerName || '—' }}</span></div>
                <div class="modal-field"><span class="mono">Ingreso mensual</span><span style="color:var(--success);">S/ {{ selected()!.monthlyIncome | number:'1.2-2' }}</span></div>
                <div class="modal-field"><span class="mono">Fecha nac.</span><span>{{ selected()!.dateOfBirth | date:'dd/MM/yyyy' }}</span></div>
                <div class="modal-field"><span class="mono">Registrado</span><span>{{ selected()!.createdAt | date:'dd/MM/yyyy HH:mm' }}</span></div>
              </div>
            </div>
          </div>
        }

      </main>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex; align-items: center;
      justify-content: space-between; margin-bottom: 24px;
    }
    .page-eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--text-muted); margin-bottom: 6px; }
    .page-title   { font-size: 26px; font-weight: 800; }
    .header-actions { display: flex; gap: 10px; }

    .btn-report {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 16px; border-radius: var(--radius-md);
      background: var(--bg-elevated); border: 1px solid var(--border-subtle);
      color: var(--text-secondary); font-size: 12px; font-family: var(--font-mono);
      cursor: pointer; transition: all var(--t-fast);
    }
    .btn-report:hover { background: var(--accent-dim); border-color: rgba(59,130,246,0.3); color: var(--accent-bright); }
    .btn-report:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-excel:hover { background: rgba(34,197,94,0.1); border-color: rgba(34,197,94,0.3); color: #22c55e; }
    .btn-pdf:hover { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.3); color: var(--danger); }

    .quick-stats {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: 12px; margin-bottom: 16px;
    }
    .qs-card {
      background: var(--bg-card); border: 1px solid var(--border-dim);
      border-radius: var(--radius-xl); padding: 14px 18px;
    }
    .qs-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); margin-bottom: 4px; }
    .qs-value { font-size: 22px; color: var(--text-primary); }

    .filters-bar {
      display: flex; align-items: flex-end; gap: 16px;
      margin-bottom: 20px; padding: 16px 20px;
    }
    .filter-group { display: flex; flex-direction: column; gap: 4px; }
    .filter-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); }
    .filter-input {
      background: var(--bg-elevated); border: 1px solid var(--border-dim);
      border-radius: var(--radius-md); padding: 7px 12px;
      color: var(--text-primary); font-size: 13px;
      outline: none; transition: border-color var(--t-fast);
      min-width: 160px;
    }
    .filter-input:focus { border-color: var(--accent-bright); }
    .btn-clear {
      padding: 7px 14px; border-radius: var(--radius-md);
      background: transparent; border: 1px solid var(--border-dim);
      color: var(--text-muted); font-size: 12px; font-family: var(--font-mono);
      cursor: pointer; transition: all var(--t-fast); align-self: flex-end;
    }
    .btn-clear:hover { border-color: var(--danger); color: var(--danger); }

    .table-wrapper { overflow-x: auto; }

    tr.selected td { background: var(--accent-dim) !important; }
    tr:hover { cursor: pointer; }

    .btn-detail {
      padding: 3px 10px; border-radius: var(--radius-sm);
      background: var(--bg-elevated); border: 1px solid var(--border-dim);
      color: var(--text-muted); font-size: 11px; font-family: var(--font-mono);
      cursor: pointer; transition: all var(--t-fast);
    }
    .btn-detail:hover { background: var(--accent-dim); color: var(--accent-bright); border-color: rgba(59,130,246,0.3); }

    .pagination {
      display: flex; align-items: center; justify-content: center;
      gap: 16px; padding: 16px 0 4px;
    }
    .page-btn {
      width: 32px; height: 32px; border-radius: var(--radius-md);
      background: var(--bg-elevated); border: 1px solid var(--border-dim);
      color: var(--text-secondary); cursor: pointer; font-size: 14px;
      transition: all var(--t-fast);
    }
    .page-btn:hover:not(:disabled) { background: var(--accent-dim); color: var(--accent-bright); }
    .page-btn:disabled { opacity: 0.3; cursor: not-allowed; }

    /* Modal */
    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
      z-index: 1000; display: flex; align-items: center; justify-content: center;
    }
    .modal-card {
      background: var(--bg-surface); border: 1px solid var(--border-subtle);
      border-radius: var(--radius-xl); padding: 28px; width: 520px; max-width: 90vw;
      box-shadow: 0 24px 64px rgba(0,0,0,0.4);
    }
    .modal-header {
      display: flex; align-items: center; gap: 16px; margin-bottom: 24px;
      position: relative;
    }
    .modal-avatar {
      width: 48px; height: 48px; border-radius: 50%;
      background: var(--accent-dim); border: 1px solid rgba(59,130,246,0.3);
      color: var(--accent-bright); font-family: var(--font-mono);
      font-size: 16px; font-weight: 700;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .modal-name { font-size: 18px; font-weight: 700; color: var(--text-primary); }
    .modal-close {
      position: absolute; right: 0; top: 0;
      background: transparent; border: none; color: var(--text-muted);
      font-size: 16px; cursor: pointer; padding: 4px;
      transition: color var(--t-fast);
    }
    .modal-close:hover { color: var(--danger); }
    .modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .modal-field {
      display: flex; flex-direction: column; gap: 2px;
      padding: 10px 12px; background: var(--bg-elevated);
      border-radius: var(--radius-md); border: 1px solid var(--border-dim);
    }
    .modal-field span:first-child { font-family: var(--font-mono); font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); }
    .modal-field span:last-child  { font-size: 13px; color: var(--text-primary); }

    .user-cell { display: flex; align-items: center; gap: 10px; }
    .mini-avatar {
      width: 28px; height: 28px; border-radius: 50%;
      background: var(--bg-elevated); border: 1px solid var(--border-subtle);
      display: flex; align-items: center; justify-content: center;
      font-size: 10px; font-weight: 600; color: var(--text-secondary);
      flex-shrink: 0; font-family: var(--font-mono);
    }

    .skeleton-list { display: flex; flex-direction: column; gap: 8px; padding: 8px 0; }
    .skeleton-row {
      height: 44px;
      background: linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-hover) 50%, var(--bg-elevated) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: var(--radius-md);
    }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    .empty-state { padding: 48px; text-align: center; color: var(--text-muted); font-family: var(--font-mono); font-size: 13px; }
  `],
})
export class AdminCustomersComponent implements OnInit {
  private readonly http        = inject(HttpClient);
  private readonly authService = inject(AuthService);

  readonly loading   = signal(true);
  readonly customers = signal<CustomerResponse[]>([]);
  readonly selected  = signal<CustomerResponse | null>(null);

  // ── Filtros como signals ──────────────────────────────────────────────────
  readonly searchTerm = signal('');
  readonly cityFilter = signal('');
  readonly minIncome  = signal(0);
  readonly page       = signal(1);
  readonly pageSize   = 10;

  // ── Reset página al cambiar cualquier filtro ──────────────────────────────
  constructor() {
    effect(() => {
      this.searchTerm();
      this.cityFilter();
      this.minIncome();
      this.page.set(1);
    }, { allowSignalWrites: true });
  }

  // ── Computeds ─────────────────────────────────────────────────────────────
  readonly filtered = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.customers().filter(c => {
      const matchSearch = !term ||
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        c.dni.includes(term);
      const matchCity   = !this.cityFilter() || c.city === this.cityFilter();
      const matchIncome = !this.minIncome()  || c.monthlyIncome >= this.minIncome();
      return matchSearch && matchCity && matchIncome;
    });
  });

  readonly totalPages  = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));
  readonly paginated   = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });
  readonly cities       = computed(() => [...new Set(this.customers().map(c => c.city))].sort());
  readonly uniqueCities = computed(() => this.cities().length);
  readonly avgIncome    = computed(() => {
    const list = this.customers();
    return list.length ? list.reduce((s, c) => s + c.monthlyIncome, 0) / list.length : 0;
  });

  readonly navItems: NavItem[] = [
    { icon: '◈', label: 'Dashboard',    route: '/dashboard/admin'   },
    { icon: '○', label: 'Clientes',     route: '/admin/customers'   },
    { icon: '◇', label: 'Préstamos',    route: '/admin/loans'       },
    { icon: '◎', label: 'Evaluaciones', route: '/evaluations'       },
    { icon: '◦', label: 'Configuración', route: '/dashboard/admin'  },
  ];

  ngOnInit(): void {
    const headers = new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
    this.http.get<CustomerResponse[]>(`${environment.apiUrl}/api/customers`, { headers })
      .subscribe({
        next:  (data) => { this.customers.set(data); this.loading.set(false); },
        error: ()     => this.loading.set(false),
      });
  }

  selectCustomer(c: CustomerResponse) { this.selected.set(c); }
  viewDetail(c: CustomerResponse)     { this.selected.set(c); }
  prevPage() { if (this.page() > 1) this.page.update(p => p - 1); }
  nextPage() { if (this.page() < this.totalPages()) this.page.update(p => p + 1); }
  clearFilters() {
    this.searchTerm.set('');
    this.cityFilter.set('');
    this.minIncome.set(0);
    this.page.set(1);
  }

  // ── Exportar CSV ──────────────────────────────────────────────────────────
  exportCSV(): void {
    const headers = ['ID','Nombre','Apellido','Email','DNI','Teléfono','Ciudad','Ocupación','Empleador','Ingreso Mensual','Fecha Registro'];
    const rows = this.filtered().map(c => [
      c.id, c.firstName, c.lastName, c.email, c.dni,
      c.phone, c.city, c.occupation, c.employerName || '',
      c.monthlyIncome, c.createdAt
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    this.downloadFile(csv, 'reporte-clientes.csv', 'text/csv');
  }

  // ── Exportar Excel (.xlsx) ────────────────────────────────────────────────
  exportExcel(): void {
    // Importación dinámica de SheetJS (debe estar instalado: npm install xlsx)
    import('xlsx').then(XLSX => {
      const date = new Date().toLocaleDateString('es-PE');

      // ── Hoja 1: Datos ─────────────────────────────────────────────────────
      const dataRows = this.filtered().map(c => ({
        'ID':              c.id,
        'Nombre':          c.firstName,
        'Apellido':        c.lastName,
        'Email':           c.email,
        'DNI':             c.dni,
        'Teléfono':        c.phone,
        'Ciudad':          c.city,
        'País':            c.country,
        'Dirección':       c.address,
        'Ocupación':       c.occupation,
        'Empleador':       c.employerName || '',
        'Ingreso Mensual': c.monthlyIncome,
        'Fecha Nacimiento': c.dateOfBirth,
        'Fecha Registro':  c.createdAt,
      }));

      const wsData = XLSX.utils.json_to_sheet(dataRows);

      // Anchos de columna
      wsData['!cols'] = [
        { wch: 6  }, // ID
        { wch: 15 }, // Nombre
        { wch: 15 }, // Apellido
        { wch: 28 }, // Email
        { wch: 12 }, // DNI
        { wch: 14 }, // Teléfono
        { wch: 14 }, // Ciudad
        { wch: 10 }, // País
        { wch: 28 }, // Dirección
        { wch: 18 }, // Ocupación
        { wch: 20 }, // Empleador
        { wch: 16 }, // Ingreso Mensual
        { wch: 16 }, // Fecha Nacimiento
        { wch: 18 }, // Fecha Registro
      ];

      // ── Hoja 2: Resumen ───────────────────────────────────────────────────
      const totalIncome  = this.filtered().reduce((s, c) => s + c.monthlyIncome, 0);
      const avgIncome    = this.filtered().length ? totalIncome / this.filtered().length : 0;
      const maxIncome    = this.filtered().length ? Math.max(...this.filtered().map(c => c.monthlyIncome)) : 0;
      const minIncome    = this.filtered().length ? Math.min(...this.filtered().map(c => c.monthlyIncome)) : 0;
      const cityCount    = new Set(this.filtered().map(c => c.city)).size;

      const summaryData = [
        { 'Métrica': 'Total clientes (filtrados)', 'Valor': this.filtered().length },
        { 'Métrica': 'Total clientes (general)',   'Valor': this.customers().length },
        { 'Métrica': 'Ciudades únicas',            'Valor': cityCount },
        { 'Métrica': 'Ingreso promedio (S/)',       'Valor': Math.round(avgIncome) },
        { 'Métrica': 'Ingreso máximo (S/)',         'Valor': maxIncome },
        { 'Métrica': 'Ingreso mínimo (S/)',         'Valor': minIncome },
        { 'Métrica': 'Ingreso total (S/)',          'Valor': totalIncome },
        { 'Métrica': 'Fecha de reporte',            'Valor': date },
      ];

      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      wsSummary['!cols'] = [{ wch: 30 }, { wch: 20 }];

      // ── Hoja 3: Por ciudad ────────────────────────────────────────────────
      const byCityMap = new Map<string, { count: number; totalIncome: number }>();
      this.filtered().forEach(c => {
        const entry = byCityMap.get(c.city) ?? { count: 0, totalIncome: 0 };
        entry.count++;
        entry.totalIncome += c.monthlyIncome;
        byCityMap.set(c.city, entry);
      });

      const cityData = [...byCityMap.entries()]
        .sort((a, b) => b[1].count - a[1].count)
        .map(([city, { count, totalIncome }]) => ({
          'Ciudad':               city,
          'N° Clientes':          count,
          'Ingreso Total (S/)':   totalIncome,
          'Ingreso Promedio (S/)': Math.round(totalIncome / count),
        }));

      const wsCity = XLSX.utils.json_to_sheet(cityData);
      wsCity['!cols'] = [{ wch: 18 }, { wch: 14 }, { wch: 20 }, { wch: 22 }];

      // ── Armar libro ───────────────────────────────────────────────────────
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsData,    'Clientes');
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');
      XLSX.utils.book_append_sheet(wb, wsCity,    'Por Ciudad');

      XLSX.writeFile(wb, `reporte-clientes-${date.replace(/\//g, '-')}.xlsx`);
    });
  }

  // ── Exportar PDF ──────────────────────────────────────────────────────────
  exportPDF(): void {
    const date    = new Date().toLocaleDateString('es-PE');
    const rows    = this.filtered().map(c =>
      `<tr>
        <td>${c.id}</td>
        <td>${c.firstName} ${c.lastName}</td>
        <td>${c.dni}</td>
        <td>${c.email}</td>
        <td>${c.city}</td>
        <td>${c.occupation}</td>
        <td>S/ ${c.monthlyIncome.toLocaleString()}</td>
        <td>${new Date(c.createdAt).toLocaleDateString('es-PE')}</td>
      </tr>`
    ).join('');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reporte de Clientes — ${date}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Segoe UI', sans-serif; color: #1a1a2e; padding: 40px; background:#fff; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px; padding-bottom:20px; border-bottom:2px solid #1e40af; }
    .logo { font-size:28px; font-weight:900; color:#1e40af; letter-spacing:-0.02em; }
    .logo span { color:#64748b; font-weight:300; }
    .meta { text-align:right; font-size:12px; color:#64748b; line-height:1.8; }
    .title { font-size:22px; font-weight:700; color:#0f172a; margin-bottom:6px; }
    .subtitle { font-size:13px; color:#64748b; margin-bottom:24px; }
    .stats { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:28px; }
    .stat { background:#f1f5f9; border-radius:8px; padding:16px; text-align:center; }
    .stat-n { font-size:28px; font-weight:700; color:#1e40af; }
    .stat-l { font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:#64748b; margin-top:2px; }
    table { width:100%; border-collapse:collapse; font-size:12px; }
    thead tr { background:#1e40af; color:#fff; }
    th { padding:10px 12px; text-align:left; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.06em; }
    td { padding:9px 12px; border-bottom:1px solid #e2e8f0; }
    tr:nth-child(even) td { background:#f8fafc; }
    .footer { margin-top:32px; padding-top:16px; border-top:1px solid #e2e8f0; font-size:11px; color:#94a3b8; display:flex; justify-content:space-between; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">LBS <span>Banking System</span></div>
    <div class="meta">
      <div>Reporte generado: ${date}</div>
      <div>Total registros: ${this.filtered().length}</div>
      <div>Generado por: Administrador</div>
    </div>
  </div>
  <div class="title">Reporte de Clientes</div>
  <div class="subtitle">Lista completa de clientes registrados en el sistema</div>
  <div class="stats">
    <div class="stat"><div class="stat-n">${this.customers().length}</div><div class="stat-l">Total clientes</div></div>
    <div class="stat"><div class="stat-n">${this.uniqueCities()}</div><div class="stat-l">Ciudades</div></div>
    <div class="stat"><div class="stat-n">S/ ${Math.round(this.avgIncome()).toLocaleString()}</div><div class="stat-l">Ingreso prom.</div></div>
    <div class="stat"><div class="stat-n">${this.filtered().length}</div><div class="stat-l">Filtrados</div></div>
  </div>
  <table>
    <thead><tr><th>#</th><th>Nombre completo</th><th>DNI</th><th>Email</th><th>Ciudad</th><th>Ocupación</th><th>Ingreso</th><th>Registro</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">
    <span>LBS — Loan Banking System</span>
    <span>Reporte generado el ${date} — CONFIDENCIAL</span>
  </div>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); win.print(); }
  }

  private downloadFile(content: string, filename: string, type: string): void {
    const blob = new Blob([content], { type });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), { href: url, download: filename });
    a.click();
    URL.revokeObjectURL(url);
  }
}
