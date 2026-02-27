import { Component, inject, signal, OnInit } from '@angular/core';
import { DecimalPipe, DatePipe, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SidebarComponent, NavItem } from '../../shared/components/sidebar.component';
import { LoanService } from '../../core/services/loan.service';
import { AuthService } from '../../core/services/auth.service';
import { LoanResponse, LoanStatus } from '../../core/models/loan.models';

@Component({
  selector: 'app-loans-page',
  standalone: true,
  imports: [SidebarComponent, DecimalPipe, DatePipe, ReactiveFormsModule],
  template: `
    <div class="dashboard-layout">
      <app-sidebar [navItems]="navItems" [roleLabel]="roleLabel()" />

      <main class="dashboard-content">

        <!-- Header -->
        <div class="page-header anim-fade-up">
          <div>
            <div class="page-eyebrow mono">GESTIÓN DE PRÉSTAMOS</div>
            <h1 class="page-title">Préstamos</h1>
          </div>
          <div class="header-right">
            @if (loading()) { <div class="spinner-sm"></div> }
            <span class="badge" [class]="'badge-' + auth.user()?.roles?.[0]?.toLowerCase()">
              {{ auth.user()?.roles?.[0] }}
            </span>
          </div>
        </div>

        <!-- Stats -->
        <div class="stats-row anim-fade-up" style="animation-delay:60ms">
          @for (stat of computedStats(); track stat.label) {
            <div class="stat-card">
              <div class="stat-val mono">{{ stat.value }}</div>
              <div class="stat-lbl">{{ stat.label }}</div>
              <div class="stat-dot" [class]="stat.cls"></div>
            </div>
          }
        </div>

        <!-- Filters -->
        <div class="filter-bar anim-fade-up" style="animation-delay:100ms">
          @for (f of filterOptions; track f.value) {
            <button
              class="filter-tab"
              [class.active]="activeFilter() === f.value"
              (click)="setFilter(f.value)"
            >{{ f.label }}</button>
          }
          <div class="filter-spacer"></div>
          <button class="refresh-btn" (click)="loadLoans()">↺</button>
        </div>

        <!-- Table -->
        <div class="card anim-fade-up" style="animation-delay:140ms">
          @if (loading()) {
            <div class="loading-rows">
              @for (i of [1,2,3,4,5]; track i) {
                <div class="sk-row">
                  <div class="sk sk-sm"></div>
                  <div class="sk sk-lg"></div>
                  <div class="sk sk-md"></div>
                  <div class="sk sk-md"></div>
                  <div class="sk sk-sm"></div>
                </div>
              }
            </div>
          } @else if (filteredLoans().length === 0) {
            <div class="empty-state">
              <div class="empty-icon">◎</div>
              <p class="text-muted">Sin préstamos{{ activeFilter() !== 'ALL' ? ' con este estado' : '' }}</p>
            </div>
          } @else {
            <div class="table-wrap">
              <table class="loans-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Monto</th>
                    <th>Plazo / Tasa</th>
                    <th>Cuota</th>
                    <th>Tipo</th>
                    <th>Solicitud</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (loan of filteredLoans(); track loan.id) {
                    <tr (click)="openDetail(loan)" style="cursor:pointer">
                      <td class="mono text-muted">#{{ loan.id }}</td>
                      <td>
                        <div class="client-cell">
                          <div class="client-avatar mono">{{ loan.customerName[0].toUpperCase() }}</div>
                          <div>
                            <div class="client-name">{{ loan.customerName }}</div>
                            <div class="client-id mono text-muted">ID {{ loan.customerId }}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div class="amount-cell">
                          <div class="amount-main mono">S/ {{ loan.amount | number:'1.0-0' }}</div>
                          @if (loan.approvedAmount && loan.approvedAmount !== loan.amount) {
                            <div class="amount-approved mono text-success">
                              ✓ S/ {{ loan.approvedAmount | number:'1.0-0' }}
                            </div>
                          }
                        </div>
                      </td>
                      <td class="mono">
                        <div>{{ loan.termMonths }}m</div>
                        <div class="text-muted" style="font-size:11px;">{{ loan.interestRate }}% TEA</div>
                      </td>
                      <td class="mono">
                        @if (loan.monthlyPayment) {
                          S/ {{ loan.monthlyPayment | number:'1.0-0' }}
                        } @else { — }
                      </td>
                      <td>
                        <span class="type-chip">{{ loan.loanTypeName }}</span>
                      </td>
                      <td class="mono text-muted" style="font-size:11px;">
                        {{ loan.applicationDate | date:'dd/MM/yy' }}
                      </td>
                      <td>
                        <span class="status-chip" [class]="statusClass(loan.status)">
                          {{ statusLabel(loan.status) }}
                        </span>
                      </td>
                      <td (click)="$event.stopPropagation()">
                        <div class="row-actions">
                          @if (loan.status === 'PENDING') {
                            <button class="act-btn approve" (click)="openApprove(loan)">✓</button>
                            <button class="act-btn reject" (click)="openReject(loan)">✗</button>
                          }
                          @if (loan.status === 'APPROVED' && auth.isAdmin()) {
                            <button class="act-btn disburse" (click)="confirmDisburse(loan)">
                              💰
                            </button>
                          }
                          <button class="act-btn view" (click)="openDetail(loan)">◎</button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

      </main>
    </div>

    <!-- Approve Modal -->
    @if (showApproveModal()) {
      <div class="modal-backdrop" (click)="closeModals()">
        <div class="modal-panel sm" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <div class="modal-eyebrow mono">APROBAR PRÉSTAMO</div>
              <h2 class="modal-title">#{{ selectedLoan()?.id }} · {{ selectedLoan()?.customerName }}</h2>
            </div>
            <button class="close-btn" (click)="closeModals()">✕</button>
          </div>
          <div class="modal-body">
            <div class="loan-summary">
              <div class="ls-row">
                <span class="text-muted">Solicitado</span>
                <span class="mono">S/ {{ selectedLoan()?.amount | number:'1.2-2' }}</span>
              </div>
              <div class="ls-row">
                <span class="text-muted">Plazo</span>
                <span class="mono">{{ selectedLoan()?.termMonths }} meses</span>
              </div>
              <div class="ls-row">
                <span class="text-muted">Tasa</span>
                <span class="mono">{{ selectedLoan()?.interestRate }}% TEA</span>
              </div>
            </div>
            <form [formGroup]="approveForm" (ngSubmit)="submitApprove()" novalidate>
              <div class="field" style="margin-top:16px;">
                <label>Monto aprobado (S/)</label>
                <input formControlName="approvedAmount" type="number" [placeholder]="selectedLoan()?.amount" />
                @if (af['approvedAmount'].invalid && af['approvedAmount'].touched) {
                  <span class="error-msg">Monto inválido</span>
                }
              </div>
              <div class="field">
                <label>Evaluado por</label>
                <input formControlName="evaluatedBy" type="text" placeholder="Nombre del analista" />
                @if (af['evaluatedBy'].invalid && af['evaluatedBy'].touched) {
                  <span class="error-msg">Requerido</span>
                }
              </div>
              @if (modalError()) {
                <div class="alert alert-error">{{ modalError() }}</div>
              }
              <div class="modal-footer">
                <button type="button" class="btn btn-ghost" (click)="closeModals()">Cancelar</button>
                <button type="submit" class="btn btn-success" [disabled]="submitting()">
                  @if (submitting()) { <span class="spinner-sm"></span> } Aprobar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }

    <!-- Reject Modal -->
    @if (showRejectModal()) {
      <div class="modal-backdrop" (click)="closeModals()">
        <div class="modal-panel sm" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <div class="modal-eyebrow mono" style="color:var(--danger)">RECHAZAR PRÉSTAMO</div>
              <h2 class="modal-title">#{{ selectedLoan()?.id }} · {{ selectedLoan()?.customerName }}</h2>
            </div>
            <button class="close-btn" (click)="closeModals()">✕</button>
          </div>
          <div class="modal-body">
            <form [formGroup]="rejectForm" (ngSubmit)="submitReject()" novalidate>
              <div class="field">
                <label>Motivo de rechazo</label>
                <textarea formControlName="rejectionReason" rows="3"
                  placeholder="Explique el motivo del rechazo (mínimo 10 caracteres)..."></textarea>
                @if (rf['rejectionReason'].invalid && rf['rejectionReason'].touched) {
                  <span class="error-msg">Mínimo 10 caracteres</span>
                }
              </div>
              <div class="field">
                <label>Evaluado por</label>
                <input formControlName="evaluatedBy" type="text" placeholder="Nombre del analista" />
                @if (rf['evaluatedBy'].invalid && rf['evaluatedBy'].touched) {
                  <span class="error-msg">Requerido</span>
                }
              </div>
              @if (modalError()) {
                <div class="alert alert-error">{{ modalError() }}</div>
              }
              <div class="modal-footer">
                <button type="button" class="btn btn-ghost" (click)="closeModals()">Cancelar</button>
                <button type="submit" class="btn btn-danger" [disabled]="submitting()">
                  @if (submitting()) { <span class="spinner-sm"></span> } Rechazar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }

    <!-- Detail Side Panel -->
    @if (showDetailPanel() && selectedLoan()) {
      <div class="modal-backdrop" (click)="showDetailPanel.set(false)">
        <div class="detail-panel" (click)="$event.stopPropagation()">
          <div class="detail-header">
            <div>
              <div class="detail-eyebrow mono">PRÉSTAMO #{{ selectedLoan()!.id }}</div>
              <h2 class="detail-title">{{ selectedLoan()!.loanTypeName }}</h2>
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
              <span class="status-chip" [class]="statusClass(selectedLoan()!.status)">
                {{ statusLabel(selectedLoan()!.status) }}
              </span>
              <button class="close-btn" (click)="showDetailPanel.set(false)">✕</button>
            </div>
          </div>
          <div class="detail-body">
            <div class="detail-amounts">
              <div class="da-item">
                <div class="da-label mono">MONTO</div>
                <div class="da-val mono">S/ {{ selectedLoan()!.amount | number:'1.2-2' }}</div>
              </div>
              @if (selectedLoan()!.monthlyPayment) {
                <div class="da-item">
                  <div class="da-label mono">CUOTA/MES</div>
                  <div class="da-val mono accent">S/ {{ selectedLoan()!.monthlyPayment | number:'1.2-2' }}</div>
                </div>
              }
              @if (selectedLoan()!.totalAmount) {
                <div class="da-item">
                  <div class="da-label mono">TOTAL</div>
                  <div class="da-val mono">S/ {{ selectedLoan()!.totalAmount | number:'1.2-2' }}</div>
                </div>
              }
            </div>

            <div class="detail-info-grid">
              <div class="dg-item"><div class="dg-lbl">Cliente</div><div class="dg-val">{{ selectedLoan()!.customerName }}</div></div>
              <div class="dg-item"><div class="dg-lbl">Tasa TEA</div><div class="dg-val mono">{{ selectedLoan()!.interestRate }}%</div></div>
              <div class="dg-item"><div class="dg-lbl">Plazo</div><div class="dg-val mono">{{ selectedLoan()!.termMonths }} meses</div></div>
              <div class="dg-item"><div class="dg-lbl">Solicitud</div><div class="dg-val mono">{{ selectedLoan()!.applicationDate | date:'dd/MM/yyyy' }}</div></div>
              @if (selectedLoan()!.approvalDate) {
                <div class="dg-item"><div class="dg-lbl">Aprobación</div><div class="dg-val mono">{{ selectedLoan()!.approvalDate | date:'dd/MM/yyyy' }}</div></div>
              }
              @if (selectedLoan()!.disbursementDate) {
                <div class="dg-item"><div class="dg-lbl">Desembolso</div><div class="dg-val mono">{{ selectedLoan()!.disbursementDate | date:'dd/MM/yyyy' }}</div></div>
              }
              <div class="dg-item" style="grid-column:1/-1">
                <div class="dg-lbl">Propósito</div>
                <div class="dg-val">{{ selectedLoan()!.purpose }}</div>
              </div>
              @if (selectedLoan()!.rejectionReason) {
                <div class="dg-item" style="grid-column:1/-1">
                  <div class="dg-lbl">Motivo rechazo</div>
                  <div class="dg-val text-danger">{{ selectedLoan()!.rejectionReason }}</div>
                </div>
              }
            </div>

            <!-- Actions in detail panel -->
            @if (selectedLoan()!.status === 'PENDING') {
              <div class="detail-actions">
                <button class="btn btn-success" (click)="openApprove(selectedLoan()!); showDetailPanel.set(false)">
                  ✓ Aprobar préstamo
                </button>
                <button class="btn btn-danger" (click)="openReject(selectedLoan()!); showDetailPanel.set(false)">
                  ✗ Rechazar préstamo
                </button>
              </div>
            }
            @if (selectedLoan()!.status === 'APPROVED' && auth.isAdmin()) {
              <div class="detail-actions">
                <button class="btn btn-primary" (click)="confirmDisburse(selectedLoan()!); showDetailPanel.set(false)">
                  💰 Desembolsar
                </button>
              </div>
            }
          </div>
        </div>
      </div>
    }

    <!-- Disburse confirm -->
    @if (showDisburseConfirm()) {
      <div class="modal-backdrop" (click)="showDisburseConfirm.set(false)">
        <div class="modal-panel sm" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <div class="modal-eyebrow mono">CONFIRMAR DESEMBOLSO</div>
              <h2 class="modal-title">Préstamo #{{ selectedLoan()?.id }}</h2>
            </div>
            <button class="close-btn" (click)="showDisburseConfirm.set(false)">✕</button>
          </div>
          <div class="modal-body">
            <p class="text-secondary" style="margin-bottom:20px;">
              ¿Confirma el desembolso de <strong>S/ {{ selectedLoan()?.approvedAmount | number:'1.2-2' }}</strong>
              a <strong>{{ selectedLoan()?.customerName }}</strong>?
            </p>
            <div class="modal-footer">
              <button class="btn btn-ghost" (click)="showDisburseConfirm.set(false)">Cancelar</button>
              <button class="btn btn-primary" [disabled]="submitting()" (click)="submitDisburse()">
                @if (submitting()) { <span class="spinner-sm"></span> } Confirmar desembolso
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-header {
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

    .header-right { display: flex; align-items: center; gap: 12px; margin-top: 6px; }

    /* Stats */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }

    .stat-card {
      background: var(--bg-card);
      border: 1px solid var(--border-dim);
      border-radius: var(--radius-xl);
      padding: 16px 18px;
      position: relative;
    }

    .stat-val { font-family: var(--font-mono); font-size: 28px; color: var(--text-primary); margin-bottom: 4px; }
    .stat-lbl { font-size: 11px; color: var(--text-muted); }

    .stat-dot {
      position: absolute;
      top: 16px; right: 16px;
      width: 8px; height: 8px;
      border-radius: 50%;
    }

    .stat-dot.pending  { background: var(--warning); }
    .stat-dot.approved { background: var(--success); }
    .stat-dot.active   { background: var(--accent-bright); }
    .stat-dot.rejected { background: var(--danger); }
    .stat-dot.total    { background: var(--text-muted); }

    /* Filter bar */
    .filter-bar {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .filter-tab {
      padding: 6px 14px;
      border-radius: 100px;
      background: transparent;
      border: 1px solid var(--border-dim);
      color: var(--text-muted);
      font-size: 12px;
      cursor: pointer;
      transition: all var(--t-fast);
    }

    .filter-tab.active {
      background: var(--accent-dim);
      border-color: rgba(59,130,246,0.3);
      color: var(--accent-bright);
    }

    .filter-spacer { flex: 1; }

    .refresh-btn {
      width: 32px; height: 32px;
      background: var(--bg-elevated);
      border: 1px solid var(--border-dim);
      border-radius: var(--radius-md);
      color: var(--text-muted);
      cursor: pointer;
      font-size: 16px;
      transition: all var(--t-fast);
    }

    .refresh-btn:hover { color: var(--accent-bright); border-color: var(--accent); }

    /* Table */
    .table-wrap { overflow-x: auto; }

    .loans-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    .loans-table th {
      padding: 10px 14px;
      text-align: left;
      font-family: var(--font-mono);
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border-dim);
      white-space: nowrap;
    }

    .loans-table td {
      padding: 12px 14px;
      border-bottom: 1px solid var(--border-dim);
      vertical-align: middle;
    }

    .loans-table tr:last-child td { border-bottom: none; }
    .loans-table tr:hover td { background: var(--bg-elevated); }

    /* Client cell */
    .client-cell { display: flex; align-items: center; gap: 10px; }

    .client-avatar {
      width: 30px; height: 30px;
      border-radius: 50%;
      background: var(--bg-elevated);
      border: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: var(--text-secondary);
      flex-shrink: 0;
    }

    .client-name { font-size: 13px; color: var(--text-primary); font-weight: 500; }
    .client-id   { font-size: 11px; }

    /* Amount */
    .amount-main { font-size: 14px; }
    .amount-approved { font-size: 11px; }
    .text-success { color: var(--success); }

    /* Type chip */
    .type-chip {
      display: inline-block;
      padding: 2px 8px;
      border-radius: var(--radius-sm);
      background: var(--bg-elevated);
      border: 1px solid var(--border-dim);
      font-size: 11px;
      color: var(--text-secondary);
      white-space: nowrap;
    }

    /* Status chips */
    .status-chip {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 100px;
      font-family: var(--font-mono);
      font-size: 10px;
      letter-spacing: 0.06em;
      white-space: nowrap;
    }

    .status-pending   { background: var(--warning-dim); color: var(--warning); }
    .status-approved  { background: var(--success-dim); color: var(--success); }
    .status-active    { background: var(--accent-dim);  color: var(--accent-bright); }
    .status-rejected  { background: var(--danger-dim);  color: var(--danger);  }
    .status-completed { background: rgba(148,163,184,0.1); color: #94a3b8; }
    .status-defaulted { background: var(--danger-dim);  color: var(--danger);  }
    .status-cancelled { background: var(--border-dim);  color: var(--text-muted); }

    /* Row actions */
    .row-actions { display: flex; gap: 6px; align-items: center; }

    .act-btn {
      width: 28px; height: 28px;
      border-radius: var(--radius-sm);
      border: 1px solid;
      cursor: pointer;
      font-size: 13px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--t-fast);
    }

    .act-btn.approve  { background: var(--success-dim); border-color: rgba(34,197,94,0.3); color: var(--success); }
    .act-btn.reject   { background: var(--danger-dim);  border-color: rgba(239,68,68,0.3); color: var(--danger);  }
    .act-btn.disburse { background: var(--accent-dim);  border-color: rgba(59,130,246,0.3); color: var(--accent-bright); font-size: 14px; }
    .act-btn.view     { background: transparent; border-color: var(--border-dim); color: var(--text-muted); }
    .act-btn:hover { opacity: 0.8; transform: scale(1.05); }

    /* Skeletons */
    .loading-rows { padding: 8px 0; }
    .sk-row { display: flex; gap: 16px; align-items: center; padding: 14px 16px; border-bottom: 1px solid var(--border-dim); }
    .sk { height: 14px; border-radius: 4px; background: var(--bg-elevated); animation: shimmer 1.2s infinite; }
    .sk-sm { width: 60px; } .sk-md { width: 100px; } .sk-lg { width: 160px; }
    @keyframes shimmer { 0%,100% { opacity:.4; } 50% { opacity:.8; } }

    /* Empty */
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 60px 20px; color: var(--text-muted); }
    .empty-icon { font-size: 32px; opacity: 0.25; }

    /* Modals */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(8,11,15,0.85);
      backdrop-filter: blur(4px);
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .modal-panel {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-xl);
      width: 100%;
      max-width: 560px;
      max-height: 90vh;
      overflow-y: auto;
      animation: slideUp 200ms cubic-bezier(0.4,0,0.2,1);
    }

    .modal-panel.sm { max-width: 440px; }

    @keyframes slideUp {
      from { opacity:0; transform: translateY(20px); }
      to   { opacity:1; transform: translateY(0); }
    }

    .modal-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 28px 28px 0;
    }

    .modal-eyebrow {
      font-size: 10px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--accent-bright);
      margin-bottom: 6px;
    }

    .modal-title { font-size: 18px; font-weight: 700; }

    .close-btn {
      background: none;
      border: 1px solid var(--border-dim);
      color: var(--text-muted);
      border-radius: var(--radius-sm);
      width: 32px; height: 32px;
      cursor: pointer;
      font-size: 14px;
      transition: all var(--t-fast);
    }

    .close-btn:hover { background: var(--bg-elevated); color: var(--text-primary); }

    .modal-body { padding: 20px 28px; }

    .loan-summary {
      background: var(--bg-card);
      border: 1px solid var(--border-dim);
      border-radius: var(--radius-lg);
      padding: 14px 16px;
      margin-bottom: 16px;
    }

    .ls-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13px;
      border-bottom: 1px solid var(--border-dim);
    }

    .ls-row:last-child { border-bottom: none; }

    textarea {
      width: 100%;
      padding: 10px 14px;
      background: var(--bg-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      color: var(--text-primary);
      font-family: var(--font-display);
      font-size: 14px;
      resize: vertical;
      outline: none;
      transition: border-color var(--t-fast);
      margin-top: 8px;
    }

    textarea:focus { border-color: var(--accent); }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 16px;
    }

    .btn-success {
      background: var(--success);
      border: none;
      color: #fff;
      padding: 10px 20px;
      border-radius: var(--radius-md);
      font-family: var(--font-mono);
      font-size: 13px;
      cursor: pointer;
      transition: opacity var(--t-fast);
    }

    .btn-danger {
      background: var(--danger);
      border: none;
      color: #fff;
      padding: 10px 20px;
      border-radius: var(--radius-md);
      font-family: var(--font-mono);
      font-size: 13px;
      cursor: pointer;
      transition: opacity var(--t-fast);
    }

    .btn-success:hover, .btn-danger:hover { opacity: 0.85; }

    /* Detail panel */
    .detail-panel {
      position: absolute;
      right: 0;
      top: 0;
      width: 100%;
      max-width: 480px;
      height: 100vh;
      background: var(--bg-surface);
      border-left: 1px solid var(--border-subtle);
      overflow-y: auto;
      animation: slideIn 250ms cubic-bezier(0.4,0,0.2,1);
    }

    @keyframes slideIn {
      from { opacity:0; transform: translateX(40px); }
      to   { opacity:1; transform: translateX(0); }
    }

    .detail-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 28px;
      border-bottom: 1px solid var(--border-dim);
      position: sticky;
      top: 0;
      background: var(--bg-surface);
      z-index: 10;
    }

    .detail-eyebrow {
      font-size: 10px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 6px;
    }

    .detail-title { font-size: 20px; font-weight: 700; }

    .detail-body { padding: 24px 28px; display: flex; flex-direction: column; gap: 20px; }

    .detail-amounts {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      background: var(--bg-card);
      border: 1px solid var(--border-dim);
      border-radius: var(--radius-xl);
      padding: 18px;
    }

    .da-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); margin-bottom: 6px; }
    .da-val   { font-family: var(--font-mono); font-size: 16px; color: var(--text-primary); }
    .da-val.accent { color: var(--accent-bright); }

    .detail-info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .dg-item {
      background: var(--bg-elevated);
      border: 1px solid var(--border-dim);
      border-radius: var(--radius-md);
      padding: 10px 12px;
    }

    .dg-lbl { font-size: 11px; color: var(--text-muted); margin-bottom: 3px; }
    .dg-val { font-size: 13px; color: var(--text-primary); }
    .text-danger { color: var(--danger); }

    .detail-actions {
      display: flex;
      gap: 10px;
    }

    .alert { padding: 10px 14px; border-radius: var(--radius-md); font-size: 13px; margin-top: 14px; }
    .alert-error { background: var(--danger-dim); border: 1px solid rgba(239,68,68,0.25); color: #fca5a5; }

    .spinner-sm {
      width: 14px; height: 14px;
      border: 2px solid rgba(255,255,255,0.2);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: inline-block;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 1200px) {
      .stats-row { grid-template-columns: repeat(3, 1fr); }
    }
  `],
})
export class LoansPageComponent implements OnInit {
  private readonly loanService = inject(LoanService);
  private readonly fb = inject(FormBuilder);
  readonly auth = inject(AuthService);

  readonly loading = signal(false);
  readonly loans = signal<LoanResponse[]>([]);
  readonly activeFilter = signal<string>('ALL');
  readonly selectedLoan = signal<LoanResponse | null>(null);
  readonly showApproveModal = signal(false);
  readonly showRejectModal = signal(false);
  readonly showDetailPanel = signal(false);
  readonly showDisburseConfirm = signal(false);
  readonly submitting = signal(false);
  readonly modalError = signal('');

  readonly navItems: NavItem[] = [
    { icon: '◈', label: 'Dashboard',    route: '/dashboard/analista' },
    { icon: '◉', label: 'Evaluaciones', route: '/evaluations' },
    { icon: '◇', label: 'Préstamos',    route: '/loans' },
    { icon: '◎', label: 'Clientes',     route: '/dashboard/analista' },
    { icon: '○', label: 'Informes',     route: '/dashboard/analista' },
  ];

  readonly filterOptions = [
    { label: 'Todos',      value: 'ALL'       },
    { label: 'Pendientes', value: 'PENDING'   },
    { label: 'Aprobados',  value: 'APPROVED'  },
    { label: 'Activos',    value: 'ACTIVE'    },
    { label: 'Rechazados', value: 'REJECTED'  },
    { label: 'Completados', value: 'COMPLETED' },
  ];

  readonly approveForm = this.fb.nonNullable.group({
    approvedAmount: [0, [Validators.required, Validators.min(1)]],
    evaluatedBy:    ['', Validators.required],
  });

  readonly rejectForm = this.fb.nonNullable.group({
    rejectionReason: ['', [Validators.required, Validators.minLength(10)]],
    evaluatedBy:     ['', Validators.required],
  });

  get af() { return this.approveForm.controls; }
  get rf() { return this.rejectForm.controls; }

  roleLabel() {
    const role = this.auth.user()?.roles?.[0];
    return role === 'ADMIN' ? 'ADMINISTRADOR' : 'ANALISTA';
  }

  computedStats() {
    const ls = this.loans();
    return [
      { label: 'Total',      value: String(ls.length), cls: 'total'    },
      { label: 'Pendientes', value: String(ls.filter(l => l.status === 'PENDING').length),   cls: 'pending'  },
      { label: 'Aprobados',  value: String(ls.filter(l => l.status === 'APPROVED').length),  cls: 'approved' },
      { label: 'Activos',    value: String(ls.filter(l => l.status === 'ACTIVE').length),    cls: 'active'   },
      { label: 'Rechazados', value: String(ls.filter(l => l.status === 'REJECTED').length),  cls: 'rejected' },
    ];
  }

  filteredLoans() {
    const f = this.activeFilter();
    const ls = this.loans();
    if (f === 'ALL') return ls;
    return ls.filter(l => l.status === f);
  }

  ngOnInit(): void { this.loadLoans(); }

  loadLoans(): void {
    this.loading.set(true);
    this.loanService.getAllLoans().subscribe({
      next: (ls) => {
        this.loans.set(ls.sort((a, b) => b.id - a.id));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setFilter(f: string): void { this.activeFilter.set(f); }

  openApprove(loan: LoanResponse): void {
    this.selectedLoan.set(loan);
    this.modalError.set('');
    this.approveForm.reset({ approvedAmount: loan.amount, evaluatedBy: '' });
    this.af['approvedAmount'].setValue(loan.amount as any);
    this.showApproveModal.set(true);
  }

  openReject(loan: LoanResponse): void {
    this.selectedLoan.set(loan);
    this.modalError.set('');
    this.rejectForm.reset({ rejectionReason: '', evaluatedBy: '' });
    this.showRejectModal.set(true);
  }

  openDetail(loan: LoanResponse): void {
    this.selectedLoan.set(loan);
    this.showDetailPanel.set(true);
  }

  confirmDisburse(loan: LoanResponse): void {
    this.selectedLoan.set(loan);
    this.showDisburseConfirm.set(true);
  }

  closeModals(): void {
    this.showApproveModal.set(false);
    this.showRejectModal.set(false);
    this.selectedLoan.set(null);
  }

  submitApprove(): void {
    this.approveForm.markAllAsTouched();
    if (this.approveForm.invalid || !this.selectedLoan()) return;

    this.submitting.set(true);
    this.modalError.set('');

    const { approvedAmount, evaluatedBy } = this.approveForm.getRawValue();

    this.loanService.approveLoan(this.selectedLoan()!.id, {
      approvedAmount: approvedAmount as any,
      evaluatedBy,
    }).subscribe({
      next: (updated) => {
        this.loans.update(ls => ls.map(l => l.id === updated.id ? updated : l));
        this.submitting.set(false);
        this.closeModals();
      },
      error: (err) => {
        this.submitting.set(false);
        this.modalError.set(err.error?.message || 'Error al aprobar préstamo');
      },
    });
  }

  submitReject(): void {
    this.rejectForm.markAllAsTouched();
    if (this.rejectForm.invalid || !this.selectedLoan()) return;

    this.submitting.set(true);
    this.modalError.set('');

    this.loanService.rejectLoan(this.selectedLoan()!.id, this.rejectForm.getRawValue() as any).subscribe({
      next: (updated) => {
        this.loans.update(ls => ls.map(l => l.id === updated.id ? updated : l));
        this.submitting.set(false);
        this.closeModals();
      },
      error: (err) => {
        this.submitting.set(false);
        this.modalError.set(err.error?.message || 'Error al rechazar préstamo');
      },
    });
  }

  submitDisburse(): void {
    if (!this.selectedLoan()) return;
    this.submitting.set(true);

    this.loanService.disburseLoan(this.selectedLoan()!.id).subscribe({
      next: (updated) => {
        this.loans.update(ls => ls.map(l => l.id === updated.id ? updated : l));
        this.submitting.set(false);
        this.showDisburseConfirm.set(false);
        this.selectedLoan.set(null);
      },
      error: () => this.submitting.set(false),
    });
  }

  statusLabel(status: LoanStatus): string {
    const labels: Record<string, string> = {
      PENDING: 'PENDIENTE', APPROVED: 'APROBADO', ACTIVE: 'ACTIVO',
      REJECTED: 'RECHAZADO', COMPLETED: 'COMPLETADO', DEFAULTED: 'EN MORA', CANCELLED: 'CANCELADO',
    };
    return labels[status] ?? status;
  }

  statusClass(status: LoanStatus): string {
    return `status-chip status-${status.toLowerCase()}`;
  }
}