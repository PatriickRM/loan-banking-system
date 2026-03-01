import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DecimalPipe, DatePipe, SlicePipe, UpperCasePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SidebarComponent, NavItem } from '../../shared/components/sidebar.component';
import { AuthService } from '../../core/services/auth.service';
import { LoanService } from '../../core/services/loan.service';
import { PaymentService } from '../../core/services/payment.service';
import { LoanResponse } from '../../core/models/loan.models';
import {
  PaymentScheduleResponse,
  PaymentResponse,
  PaymentMethod,
} from '../../core/models/payment.models';
import { CardPaymentComponent, CardPaymentResult } from './card-payment.component';

@Component({
  selector: 'app-payment-page',
  imports: [SidebarComponent, DecimalPipe, DatePipe, SlicePipe, ReactiveFormsModule, CardPaymentComponent, UpperCasePipe],
  template: `
    <div class="dashboard-layout">
      <app-sidebar [navItems]="navItems" roleLabel="CLIENTE" />

      <main class="dashboard-content">

        <!-- Header -->
        <div class="page-header anim-fade-up">
          <div>
            <div class="page-eyebrow mono">MI CUENTA</div>
            <h1 class="page-title">Pagos</h1>
          </div>
          @if (selectedLoan()) {
            <div class="loan-selector-display" (click)="selectedLoan.set(null)">
              <span class="mono text-muted" style="font-size:12px;">PRÉSTAMO</span>
              <span class="mono accent-text">#{{ selectedLoan()!.id }} — {{ selectedLoan()!.loanTypeName }}</span>
              <span class="change-link mono">cambiar ↓</span>
            </div>
          }
        </div>

        <!-- Loan selector -->
        @if (!selectedLoan()) {
          <div class="loan-select-section anim-fade-up">
            <div class="select-label mono">SELECCIONÁ UN PRÉSTAMO</div>

            @if (loadingLoans()) {
              <div class="skeleton-list">
                @for (i of [1,2,3]; track i) {
                  <div class="loan-skeleton">
                    <div class="sk sk-lg"></div>
                    <div class="sk sk-md"></div>
                    <div class="sk sk-sm"></div>
                  </div>
                }
              </div>
            } @else if (activeLoans().length === 0) {
              <div class="empty-state">
                <div class="empty-icon">◎</div>
                <p class="text-muted">No tenés préstamos activos</p>
              </div>
            } @else {
              <div class="loan-cards">
                @for (loan of activeLoans(); track loan.id) {
                  <div class="loan-select-card" (click)="selectLoan(loan)">
                    <div class="lsc-left">
                      <div class="lsc-id mono text-muted">#{{ loan.id }}</div>
                      <div class="lsc-type">{{ loan.loanTypeName }}</div>
                      <div class="lsc-amount mono">S/ {{ loan.amount | number:'1.0-0' }}</div>
                    </div>
                    <div class="lsc-right">
                      @if (loan.monthlyPayment) {
                        <div class="lsc-quota">
                          <div class="lq-label mono">cuota</div>
                          <div class="lq-amount mono">S/ {{ loan.monthlyPayment | number:'1.0-0' }}</div>
                        </div>
                      }
                      <div class="lsc-arrow">→</div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- Payment dashboard -->
        @if (selectedLoan()) {

          <!-- Summary cards -->
          <div class="summary-grid anim-fade-up" style="animation-delay:60ms">

            <div class="summary-card">
              <div class="sc-label mono">PRÓXIMO VENCIMIENTO</div>
              @if (nextInstallment()) {
                <div class="sc-value mono" [class.overdue]="nextInstallment()!.isOverdue">
                  {{ nextInstallment()!.dueDate | date:'dd MMM yyyy' }}
                </div>
                <div class="sc-sub">
                  @if (nextInstallment()!.isOverdue) {
                    <span class="text-danger">{{ abs(nextInstallment()!.daysUntilDue) }} días de atraso</span>
                  } @else if (nextInstallment()!.daysUntilDue <= 7) {
                    <span class="text-warning">Vence en {{ nextInstallment()!.daysUntilDue }} días</span>
                  } @else {
                    <span class="text-muted">En {{ nextInstallment()!.daysUntilDue }} días</span>
                  }
                </div>
              } @else {
                <div class="sc-value mono text-muted">—</div>
                <div class="sc-sub text-muted">Sin cuotas pendientes</div>
              }
            </div>

            <div class="summary-card accent-border">
              <div class="sc-label mono">MONTO DE CUOTA</div>
              <div class="sc-value mono accent-text">
                S/ {{ nextInstallment()?.amount | number:'1.2-2' }}
              </div>
              @if (nextInstallment()?.isOverdue) {
                <div class="sc-sub text-danger">
                  + mora S/ {{ (nextInstallment()!.amount * 0.05) | number:'1.2-2' }}
                </div>
              } @else {
                <div class="sc-sub text-muted">Cuota #{{ nextInstallment()?.installmentNumber }}</div>
              }
            </div>

            <div class="summary-card">
              <div class="sc-label mono">SALDO PENDIENTE</div>
              <div class="sc-value mono">
                S/ {{ selectedLoan()!.outstandingBalance | number:'1.0-0' }}
              </div>
              <div class="sc-sub text-muted">
                {{ completedCount() }} de {{ schedule().length }} cuotas pagadas
              </div>
            </div>

            <div class="summary-card">
              <div class="sc-label mono">PROGRESO</div>
              <div class="progress-ring-wrap">
                <svg class="progress-ring" viewBox="0 0 60 60">
                  <circle cx="30" cy="30" r="24" fill="none" stroke="var(--bg-elevated)" stroke-width="4"/>
                  <circle
                    cx="30" cy="30" r="24"
                    fill="none"
                    stroke="var(--accent)"
                    stroke-width="4"
                    stroke-linecap="round"
                    stroke-dasharray="150.8"
                    [attr.stroke-dashoffset]="ringOffset()"
                    transform="rotate(-90 30 30)"
                  />
                </svg>
                <div class="ring-label mono">{{ progressPct() }}%</div>
              </div>
              <div class="sc-sub text-muted">completado</div>
            </div>

          </div>

          <!-- Content grid -->
          <div class="content-grid anim-fade-up" style="animation-delay:120ms">

            <!-- Schedule -->
            <div class="card">
              <div class="card-header">
                <h3 class="section-title">Cronograma de cuotas</h3>
                <div class="header-right">
                  @if (loadingSchedule()) { <div class="spinner-sm"></div> }
                  <span class="badge badge-cliente">{{ schedule().length }} cuotas</span>
                </div>
              </div>

              <div class="schedule-list">
                @for (item of schedule(); track item.id) {
                  <div
                    class="schedule-row"
                    [class.is-next]="item.id === nextInstallment()?.id"
                    [class.is-overdue]="item.isOverdue"
                    [class.is-paid]="item.status === 'PAID'"
                  >
                    <div class="sr-num mono">#{{ item.installmentNumber }}</div>
                    <div class="sr-date">
                      <div class="sr-date-main">{{ item.dueDate | date:'dd MMM' }}</div>
                      <div class="sr-date-year mono">{{ item.dueDate | date:'yyyy' }}</div>
                    </div>
                    <div class="sr-breakdown">
                      <div class="srb-row">
                        <span class="text-muted">Capital</span>
                        <span class="mono">S/ {{ item.principal | number:'1.2-2' }}</span>
                      </div>
                      <div class="srb-row">
                        <span class="text-muted">Interés</span>
                        <span class="mono">S/ {{ item.interest | number:'1.2-2' }}</span>
                      </div>
                    </div>
                    <div class="sr-amount mono">S/ {{ item.amount | number:'1.2-2' }}</div>
                    <div class="sr-status">
                      @if (item.status === 'PAID') {
                        <span class="sched-chip chip-paid">✓ PAGADO</span>
                      } @else if (item.isOverdue) {
                        <button class="pay-btn overdue-btn" (click)="openPayModal(item)">
                          Pagar mora
                        </button>
                      } @else if (item.id === nextInstallment()?.id) {
                        <button class="pay-btn" (click)="openPayModal(item)">
                          Pagar
                        </button>
                      } @else {
                        <span class="sched-chip chip-pending">PENDIENTE</span>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Payment history -->
            <div class="card">
              <div class="card-header">
                <h3 class="section-title">Historial de pagos</h3>
                @if (loadingHistory()) { <div class="spinner-sm"></div> }
              </div>

              @if (paymentHistory().length === 0 && !loadingHistory()) {
                <div class="empty-state" style="padding:40px 20px;">
                  <div class="empty-icon">◎</div>
                  <p class="text-muted">Sin pagos registrados</p>
                </div>
              } @else {
                <div class="history-list">
                  @for (pay of paymentHistory(); track pay.id) {
                    <div class="history-item">
                      <div class="hi-icon" [class]="methodIconClass(pay.paymentMethod)">
                        {{ methodIcon(pay.paymentMethod) }}
                      </div>
                      <div class="hi-info">
                        <div class="hi-title">Cuota pagada</div>
                        <div class="hi-meta mono">
                          {{ pay.paymentDate | date:'dd/MM/yyyy HH:mm' }}
                          · {{ methodLabel(pay.paymentMethod) }}
                        </div>
                        @if (pay.transactionId) {
                          <div class="hi-tx mono text-muted">{{ pay.transactionId | slice:0:18 }}...</div>
                        }
                      </div>
                      <div class="hi-amount">
                        <div class="ha-value mono">S/ {{ pay.amount | number:'1.2-2' }}</div>
                        @if (pay.lateFee > 0) {
                          <div class="ha-fee text-danger mono">+S/ {{ pay.lateFee | number:'1.2-2' }} mora</div>
                        }
                        <span class="pay-status-chip" [class]="'psc-' + pay.status.toLowerCase()">
                          {{ pay.status }}
                        </span>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

          </div>
        }

      </main>
    </div>

    <!-- ── Pay modal ── -->
    @if (showPayModal() && payingInstallment()) {
      <div class="modal-backdrop" (click)="closePayModal()">
        <div class="modal-panel wide" (click)="$event.stopPropagation()">

          <div class="modal-header">
            <div>
              <div class="modal-eyebrow mono">PAGAR CUOTA #{{ payingInstallment()!.installmentNumber }}</div>
              <h2 class="modal-title">Seleccioná el método de pago</h2>
            </div>
            <button class="close-btn" (click)="closePayModal()">✕</button>
          </div>

          @if (paySuccess()) {
            <!-- Success screen -->
            <div class="pay-success">
              <div class="success-ring">
                <span class="success-check">✓</span>
              </div>
              <h3>¡Pago exitoso!</h3>
              <p class="text-secondary">Tu pago fue procesado correctamente.</p>
              <div class="success-detail mono">
                <div class="sd-row">
                  <span class="text-muted">Monto</span>
                  <span>S/ {{ lastPayment()?.amount | number:'1.2-2' }}</span>
                </div>
                @if (lastCardResult()) {
                  <div class="sd-row">
                    <span class="text-muted">Tarjeta</span>
                    <span>{{ lastCardResult()!.brand | uppercase }} •••• {{ lastCardResult()!.lastFour }}</span>
                  </div>
                  <div class="sd-row">
                    <span class="text-muted">Titular</span>
                    <span>{{ lastCardResult()!.cardHolder }}</span>
                  </div>
                }
                <div class="sd-row">
                  <span class="text-muted">Transaction ID</span>
                  <span style="font-size:11px;">{{ lastPayment()?.transactionId }}</span>
                </div>
                <div class="sd-row">
                  <span class="text-muted">Estado</span>
                  <span class="chip-paid-sm">COMPLETADO</span>
                </div>
              </div>
              <button class="btn btn-primary" style="margin-top:8px;" (click)="closePayModal()">Listo</button>
            </div>

          } @else if (selectedMethod() === null) {
            <!-- Method picker -->
            <div class="method-picker">
              <div class="mp-breakdown">
                <div class="mpb-row">
                  <span>Capital</span>
                  <span class="mono">S/ {{ payingInstallment()!.principal | number:'1.2-2' }}</span>
                </div>
                <div class="mpb-row">
                  <span>Interés</span>
                  <span class="mono">S/ {{ payingInstallment()!.interest | number:'1.2-2' }}</span>
                </div>
                @if (payingInstallment()!.isOverdue) {
                  <div class="mpb-row danger">
                    <span>Mora (5%)</span>
                    <span class="mono">S/ {{ (payingInstallment()!.amount * 0.05) | number:'1.2-2' }}</span>
                  </div>
                }
                <div class="mpb-total">
                  <span class="mono">TOTAL</span>
                  <span class="mono total-val">S/ {{ totalToPay() | number:'1.2-2' }}</span>
                </div>
              </div>

              <div class="mp-label mono">ELEGIR MÉTODO</div>
              <div class="method-grid">
                @for (method of paymentMethods; track method.value) {
                  <div
                    class="method-card"
                    (click)="selectedMethod.set(method.value)"
                  >
                    <div class="mc-icon">{{ method.icon }}</div>
                    <div class="mc-label">{{ method.label }}</div>
                    <div class="mc-arrow">→</div>
                  </div>
                }
              </div>

              <div class="mp-footer">
                <button class="btn-ghost-sm" (click)="closePayModal()">Cancelar</button>
              </div>
            </div>

          } @else if (selectedMethod() === 'CREDIT_CARD' || selectedMethod() === 'DEBIT_CARD') {
            <!-- Card form -->
            <div class="modal-body">
              <app-card-payment
                [amount]="totalToPay()"
                (confirmed)="onCardConfirmed($event)"
                (cancelled)="selectedMethod.set(null)"
              />
            </div>

          } @else {
            <!-- Other methods (transfer, cash, online) -->
            <div class="modal-body other-method">

              <div class="om-icon">{{ methodIcon(selectedMethod()!) }}</div>
              <div class="om-method-name">{{ methodLabel(selectedMethod()!) }}</div>

              @if (selectedMethod() === 'BANK_TRANSFER') {
                <div class="transfer-info mono">
                  <div class="ti-row"><span>Banco</span><span>BCP Banco</span></div>
                  <div class="ti-row"><span>Cuenta</span><span>194-123456789-0-12</span></div>
                  <div class="ti-row"><span>CCI</span><span>00219400123456789012</span></div>
                  <div class="ti-row"><span>Referencia</span><span>#LOAN-{{ selectedLoan()?.id }}</span></div>
                  <div class="ti-row">
                    <span>Monto</span>
                    <span class="accent-text">S/ {{ totalToPay() | number:'1.2-2' }}</span>
                  </div>
                </div>
              }

              @if (payError()) {
                <div class="cf-alert">{{ payError() }}</div>
              }

              <div class="om-actions">
                <button class="btn-ghost-sm" (click)="selectedMethod.set(null)">← Volver</button>
                <button
                  class="btn-pay-confirm"
                  [disabled]="payLoading()"
                  (click)="submitOtherPayment()"
                >
                  @if (payLoading()) {
                    <span class="pay-spinner-sm"></span> Procesando...
                  } @else {
                    Confirmar pago S/ {{ totalToPay() | number:'1.2-2' }}
                  }
                </button>
              </div>
            </div>
          }

        </div>
      </div>
    }
  `,
  styles: [`
    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 28px;
    }
    .page-eyebrow { font-size:11px; text-transform:uppercase; letter-spacing:0.12em; color:var(--text-muted); margin-bottom:6px; }
    .page-title { font-size:26px; font-weight:800; }
    .loan-selector-display { display:flex; flex-direction:column; align-items:flex-end; cursor:pointer; padding:10px 14px; border:1px solid var(--border-dim); border-radius:var(--radius-lg); background:var(--bg-card); gap:2px; transition:all var(--t-fast); }
    .loan-selector-display:hover { border-color:var(--border-subtle); background:var(--bg-hover); }
    .accent-text { color:var(--accent-bright); }
    .change-link { font-size:11px; color:var(--text-muted); }

    /* Loan selector */
    .loan-select-section { margin-bottom:28px; }
    .select-label { font-size:11px; text-transform:uppercase; letter-spacing:0.12em; color:var(--text-muted); margin-bottom:14px; }
    .loan-cards { display:flex; flex-direction:column; gap:8px; }
    .loan-select-card { display:flex; align-items:center; justify-content:space-between; padding:18px 20px; background:var(--bg-card); border:1px solid var(--border-dim); border-radius:var(--radius-xl); cursor:pointer; transition:all var(--t-fast); }
    .loan-select-card:hover { border-color:var(--accent); background:var(--bg-hover); transform:translateX(4px); }
    .lsc-id { font-size:11px; margin-bottom:4px; }
    .lsc-type { font-size:13px; color:var(--text-secondary); margin-bottom:4px; }
    .lsc-amount { font-size:22px; }
    .lsc-right { display:flex; align-items:center; gap:16px; }
    .lq-label { font-size:10px; letter-spacing:0.1em; text-transform:uppercase; color:var(--text-muted); margin-bottom:2px; }
    .lq-amount { font-size:18px; color:var(--accent-bright); }
    .lsc-arrow { font-size:18px; color:var(--text-muted); }

    /* Summary */
    .summary-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:24px; }
    .summary-card { background:var(--bg-card); border:1px solid var(--border-dim); border-radius:var(--radius-xl); padding:20px; transition:all var(--t-fast); }
    .summary-card:hover { border-color:var(--border-subtle); }
    .summary-card.accent-border { border-color:rgba(59,130,246,0.3); }
    .sc-label { font-size:10px; text-transform:uppercase; letter-spacing:0.12em; color:var(--text-muted); margin-bottom:10px; }
    .sc-value { font-size:24px; color:var(--text-primary); margin-bottom:4px; }
    .sc-value.overdue { color:var(--danger); }
    .sc-value.accent-text { color:var(--accent-bright); }
    .sc-sub { font-size:12px; }
    .progress-ring-wrap { position:relative; width:60px; height:60px; margin:4px 0; }
    .progress-ring { width:100%; height:100%; }
    .ring-label { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:13px; color:var(--accent-bright); }

    /* Content grid */
    .content-grid { display:grid; grid-template-columns:1.5fr 1fr; gap:20px; }
    .section-title { font-size:14px; font-weight:600; }
    .header-right { display:flex; align-items:center; gap:10px; }

    /* Schedule */
    .schedule-list { display:flex; flex-direction:column; }
    .schedule-row { display:grid; grid-template-columns:36px 60px 1fr auto auto; align-items:center; gap:12px; padding:12px 16px; border-bottom:1px solid var(--border-dim); transition:background var(--t-fast); }
    .schedule-row:last-child { border-bottom:none; }
    .schedule-row.is-next { background:var(--accent-dim); border-radius:var(--radius-md); border-color:transparent; }
    .schedule-row.is-overdue { background:var(--danger-dim); border-radius:var(--radius-md); }
    .schedule-row.is-paid { opacity:0.5; }
    .sr-num { font-size:12px; color:var(--text-muted); text-align:center; }
    .sr-date-main { font-size:13px; font-weight:600; }
    .sr-date-year { font-size:11px; color:var(--text-muted); }
    .sr-breakdown { font-size:11px; }
    .srb-row { display:flex; justify-content:space-between; gap:12px; }
    .srb-row .mono { font-size:11px; }
    .sr-amount { font-family:var(--font-mono); font-size:14px; text-align:right; }
    .sched-chip { padding:3px 10px; border-radius:100px; font-family:var(--font-mono); font-size:10px; letter-spacing:0.06em; white-space:nowrap; }
    .chip-paid { background:var(--success-dim); color:var(--success); }
    .chip-pending { background:var(--bg-elevated); color:var(--text-muted); }
    .pay-btn { padding:5px 14px; border-radius:var(--radius-sm); background:var(--accent); border:none; color:#fff; font-family:var(--font-mono); font-size:11px; cursor:pointer; transition:all var(--t-fast); white-space:nowrap; }
    .pay-btn:hover { background:var(--accent-bright); }
    .overdue-btn { background:var(--danger); }
    .overdue-btn:hover { background:#dc2626; }

    /* History */
    .history-list { display:flex; flex-direction:column; }
    .history-item { display:flex; align-items:center; gap:12px; padding:14px 20px; border-bottom:1px solid var(--border-dim); transition:background var(--t-fast); }
    .history-item:last-child { border-bottom:none; }
    .history-item:hover { background:var(--bg-elevated); }
    .hi-icon { width:36px; height:36px; border-radius:var(--radius-md); display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0; }
    .icon-transfer { background:var(--accent-dim); }
    .icon-card { background:rgba(168,85,247,0.1); }
    .icon-cash { background:var(--success-dim); }
    .icon-online { background:rgba(234,179,8,0.1); }
    .hi-info { flex:1; min-width:0; }
    .hi-title { font-size:13px; font-weight:600; margin-bottom:3px; }
    .hi-meta { font-size:11px; color:var(--text-muted); margin-bottom:2px; }
    .hi-tx { font-size:10px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .hi-amount { text-align:right; flex-shrink:0; }
    .ha-value { font-size:14px; margin-bottom:3px; }
    .ha-fee { font-size:11px; }
    .pay-status-chip { font-family:var(--font-mono); font-size:10px; padding:2px 7px; border-radius:100px; }
    .psc-completed { background:var(--success-dim); color:var(--success); }
    .psc-pending { background:var(--warning-dim); color:var(--warning); }
    .psc-failed { background:var(--danger-dim); color:var(--danger); }

    /* Skeleton */
    .skeleton-list { display:flex; flex-direction:column; gap:10px; }
    .loan-skeleton { display:flex; align-items:center; gap:14px; padding:18px 20px; background:var(--bg-card); border:1px solid var(--border-dim); border-radius:var(--radius-xl); }
    .sk { height:14px; border-radius:4px; background:var(--bg-elevated); animation:shimmer 1.2s infinite; }
    .sk-sm { width:60px; } .sk-md { width:100px; } .sk-lg { width:160px; }
    @keyframes shimmer { 0%,100% { opacity:0.4; } 50% { opacity:0.8; } }

    /* Empty */
    .empty-state { display:flex; flex-direction:column; align-items:center; gap:10px; padding:48px 20px; color:var(--text-muted); }
    .empty-icon { font-size:28px; opacity:0.25; }

    /* Modal */
    .modal-backdrop { position:fixed; inset:0; background:rgba(8,11,15,0.85); backdrop-filter:blur(4px); z-index:100; display:flex; align-items:center; justify-content:center; padding:24px; animation:fadeIn 150ms ease; }
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
    .modal-panel { background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:var(--radius-xl); width:100%; max-width:440px; max-height:90vh; overflow-y:auto; animation:slideUp 200ms cubic-bezier(0.4,0,0.2,1); }
    .modal-panel.wide { max-width:520px; }
    @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
    .modal-header { display:flex; align-items:flex-start; justify-content:space-between; padding:28px 28px 0; }
    .modal-eyebrow { font-size:10px; letter-spacing:0.14em; text-transform:uppercase; color:var(--accent-bright); margin-bottom:6px; }
    .modal-title { font-size:20px; font-weight:800; }
    .close-btn { background:none; border:1px solid var(--border-dim); color:var(--text-muted); border-radius:var(--radius-sm); width:32px; height:32px; cursor:pointer; font-size:14px; transition:all var(--t-fast); flex-shrink:0; }
    .close-btn:hover { background:var(--bg-elevated); color:var(--text-primary); }
    .modal-body { padding:20px 28px 28px; }

    /* Method picker */
    .method-picker { padding:20px 28px 28px; }
    .mp-breakdown { background:var(--bg-card); border:1px solid var(--border-dim); border-radius:var(--radius-lg); padding:16px 20px; margin-bottom:20px; }
    .mpb-row { display:flex; justify-content:space-between; font-size:13px; padding:6px 0; border-bottom:1px solid var(--border-dim); color:var(--text-secondary); }
    .mpb-row.danger { color:var(--danger); }
    .mpb-row:last-of-type { border-bottom:none; }
    .mpb-total { display:flex; justify-content:space-between; align-items:center; padding-top:12px; margin-top:8px; border-top:1px solid var(--border-subtle); font-size:13px; color:var(--text-muted); }
    .total-val { font-size:20px; color:var(--accent-bright); }
    .mp-label { font-size:10px; text-transform:uppercase; letter-spacing:0.12em; color:var(--text-muted); margin-bottom:12px; }
    .method-grid { display:flex; flex-direction:column; gap:8px; margin-bottom:16px; }
    .method-card { display:flex; align-items:center; gap:14px; padding:14px 16px; background:var(--bg-elevated); border:1px solid var(--border-dim); border-radius:var(--radius-lg); cursor:pointer; transition:all var(--t-fast); }
    .method-card:hover { border-color:var(--accent); background:var(--accent-dim); }
    .mc-icon { font-size:22px; }
    .mc-label { flex:1; font-size:13px; color:var(--text-primary); font-weight:500; }
    .mc-arrow { color:var(--text-muted); }
    .mp-footer { text-align:center; }

    /* Other method */
    .other-method { display:flex; flex-direction:column; align-items:center; gap:14px; text-align:center; }
    .om-icon { font-size:40px; }
    .om-method-name { font-size:16px; font-weight:700; }
    .transfer-info { width:100%; background:var(--bg-card); border:1px solid var(--border-dim); border-radius:var(--radius-lg); padding:16px; }
    .ti-row { display:flex; justify-content:space-between; font-size:12px; padding:6px 0; border-bottom:1px solid var(--border-dim); letter-spacing:0.04em; }
    .ti-row:last-child { border-bottom:none; }
    .om-actions { display:flex; gap:10px; width:100%; justify-content:space-between; margin-top:4px; }
    .btn-pay-confirm { flex:1; padding:11px 20px; background:var(--accent); border:none; border-radius:8px; color:#fff; font-size:14px; font-weight:600; cursor:pointer; transition:all var(--t-fast); display:flex; align-items:center; justify-content:center; gap:8px; }
    .btn-pay-confirm:hover:not(:disabled) { background:var(--accent-bright); }
    .btn-pay-confirm:disabled { opacity:0.5; cursor:not-allowed; }
    .btn-ghost-sm { padding:9px 16px; background:transparent; border:1px solid var(--border-subtle); border-radius:8px; color:var(--text-muted); font-size:13px; cursor:pointer; transition:all var(--t-fast); }
    .btn-ghost-sm:hover { background:var(--bg-elevated); color:var(--text-primary); }
    .cf-alert { padding:10px 14px; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.25); border-radius:8px; color:#fca5a5; font-size:12px; width:100%; }
    .pay-spinner-sm { width:12px; height:12px; border:2px solid rgba(255,255,255,0.2); border-top-color:white; border-radius:50%; animation:spin 0.7s linear infinite; display:inline-block; }
    @keyframes spin { to { transform:rotate(360deg); } }

    /* Success */
    .pay-success { display:flex; flex-direction:column; align-items:center; text-align:center; padding:28px 28px; gap:14px; }
    .success-ring { width:64px; height:64px; border-radius:50%; background:var(--success-dim); border:2px solid rgba(34,197,94,0.4); display:flex; align-items:center; justify-content:center; }
    .success-check { font-size:24px; color:var(--success); }
    .pay-success h3 { font-size:20px; }
    .success-detail { width:100%; background:var(--bg-elevated); border:1px solid var(--border-dim); border-radius:var(--radius-lg); padding:14px 16px; }
    .sd-row { display:flex; justify-content:space-between; font-size:13px; padding:6px 0; border-bottom:1px solid var(--border-dim); }
    .sd-row:last-child { border-bottom:none; }
    .chip-paid-sm { background:var(--success-dim); color:var(--success); padding:2px 8px; border-radius:100px; font-size:11px; }

    /* Shared */
    .spinner-sm { width:14px; height:14px; border:2px solid var(--border-subtle); border-top-color:var(--accent); border-radius:50%; animation:spin2 0.7s linear infinite; }
    @keyframes spin2 { to { transform:rotate(360deg); } }

    @media (max-width:1200px) {
      .summary-grid { grid-template-columns:repeat(2,1fr); }
      .content-grid { grid-template-columns:1fr; }
    }
    @media (max-width:768px) {
      .schedule-row { grid-template-columns:36px 1fr auto auto; }
      .sr-breakdown { display:none; }
    }
  `],
})
export class PaymentPageComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly loanService = inject(LoanService);
  private readonly paymentService = inject(PaymentService);

  readonly navItems: NavItem[] = [
    { icon: '◈', label: 'Mi cuenta',     route: '/dashboard/cliente' },
    { icon: '◎', label: 'Mis préstamos', route: '/dashboard/cliente' },
    { icon: '◇', label: 'Pagos',         route: '/payments'          },
    { icon: '○', label: 'Documentos',    route: '/dashboard/cliente' },
    { icon: '◦', label: 'Perfil',        route: '/profile'           },
  ];

  readonly paymentMethods = [
    { value: 'CREDIT_CARD'    as PaymentMethod, label: 'Tarjeta de crédito',   icon: '💳' },
    { value: 'DEBIT_CARD'     as PaymentMethod, label: 'Tarjeta de débito',    icon: '🪙' },
    { value: 'BANK_TRANSFER'  as PaymentMethod, label: 'Transferencia bancaria', icon: '🏦' },
    { value: 'ONLINE_PAYMENT' as PaymentMethod, label: 'Pago online (Yape/Plin)', icon: '🌐' },
    { value: 'CASH'           as PaymentMethod, label: 'Efectivo (agencia)',   icon: '💵' },
  ];

  readonly loans            = signal<LoanResponse[]>([]);
  readonly selectedLoan     = signal<LoanResponse | null>(null);
  readonly schedule         = signal<PaymentScheduleResponse[]>([]);
  readonly paymentHistory   = signal<PaymentResponse[]>([]);
  readonly loadingLoans     = signal(false);
  readonly loadingSchedule  = signal(false);
  readonly loadingHistory   = signal(false);

  readonly showPayModal       = signal(false);
  readonly payingInstallment  = signal<PaymentScheduleResponse | null>(null);
  readonly selectedMethod     = signal<PaymentMethod | null>(null);
  readonly payLoading         = signal(false);
  readonly payError           = signal('');
  readonly paySuccess         = signal(false);
  readonly lastPayment        = signal<PaymentResponse | null>(null);
  readonly lastCardResult     = signal<CardPaymentResult | null>(null);

  readonly activeLoans = computed(() =>
    this.loans().filter((l) => l.status === 'ACTIVE')
  );

  readonly nextInstallment = computed(() =>
    this.schedule().find((s) => s.status === 'PENDING' || s.status === 'OVERDUE') ?? null
  );

  readonly completedCount = computed(() =>
    this.schedule().filter((s) => s.status === 'PAID').length
  );

  readonly progressPct = computed(() => {
    const total = this.schedule().length;
    if (!total) return 0;
    return Math.round((this.completedCount() / total) * 100);
  });

  readonly ringOffset = computed(() => {
    const circumference = 150.8;
    return circumference - (this.progressPct() / 100) * circumference;
  });

  totalToPay(): number {
    const item = this.payingInstallment();
    if (!item) return 0;
    return item.isOverdue ? item.amount * 1.05 : item.amount;
  }

  abs(n: number): number { return Math.abs(n); }

  ngOnInit(): void {
    const user = this.authService.user();
    if (!user?.customerId) return;

    this.loadingLoans.set(true);
    this.loanService.getLoansByCustomer(user.customerId).subscribe({
      next: (loans) => {
        this.loans.set(loans);
        this.loadingLoans.set(false);
        const active = loans.filter((l) => l.status === 'ACTIVE');
        if (active.length === 1) this.selectLoan(active[0]);
      },
      error: () => this.loadingLoans.set(false),
    });
  }

  selectLoan(loan: LoanResponse): void {
    this.selectedLoan.set(loan);
    this.loadScheduleAndHistory(loan.id);
  }

  private loadScheduleAndHistory(loanId: number): void {
    this.loadingSchedule.set(true);
    this.loadingHistory.set(true);

    this.paymentService.getScheduleByLoan(loanId).subscribe({
      next: (schedule) => { this.schedule.set(schedule); this.loadingSchedule.set(false); },
      error: () => this.loadingSchedule.set(false),
    });

    this.paymentService.getPaymentsByLoan(loanId).subscribe({
      next: (history) => { this.paymentHistory.set(history); this.loadingHistory.set(false); },
      error: () => this.loadingHistory.set(false),
    });
  }

  openPayModal(item: PaymentScheduleResponse): void {
    this.payingInstallment.set(item);
    this.selectedMethod.set(null);
    this.payError.set('');
    this.paySuccess.set(false);
    this.lastCardResult.set(null);
    this.showPayModal.set(true);
  }

  closePayModal(): void {
    this.showPayModal.set(false);
    this.payingInstallment.set(null);
    this.selectedMethod.set(null);
    if (this.paySuccess() && this.selectedLoan()) {
      this.loadScheduleAndHistory(this.selectedLoan()!.id);
      const user = this.authService.user();
      if (user?.customerId) {
        this.loanService.getLoansByCustomer(user.customerId).subscribe({
          next: (loans) => {
            this.loans.set(loans);
            const updated = loans.find((l) => l.id === this.selectedLoan()!.id);
            if (updated) this.selectedLoan.set(updated);
          },
        });
      }
    }
    this.paySuccess.set(false);
  }

  /** Called when card form confirms */
  onCardConfirmed(result: CardPaymentResult): void {
    this.lastCardResult.set(result);
    this.processBackendPayment(this.selectedMethod()!);
  }

  /** For non-card methods */
  submitOtherPayment(): void {
    if (!this.selectedMethod()) return;
    this.processBackendPayment(this.selectedMethod()!);
  }

  private processBackendPayment(method: PaymentMethod): void {
    this.payLoading.set(true);
    this.payError.set('');

    const request = {
      loanId:        this.selectedLoan()!.id,
      amount:        this.totalToPay(),
      paymentMethod: method,
      referenceNumber: this.lastCardResult()
        ? `CARD-${this.lastCardResult()!.lastFour}`
        : undefined,
      processedBy: this.authService.user()?.username,
    };

    this.paymentService.processPayment(request).subscribe({
      next: (payment) => {
        this.payLoading.set(false);
        this.lastPayment.set(payment);
        this.paySuccess.set(true);
      },
      error: (err) => {
        this.payLoading.set(false);
        this.payError.set(err.error?.message || 'Error al procesar el pago');
      },
    });
  }

  // Display helpers
  methodLabel(method: PaymentMethod): string {
    return this.paymentMethods.find((m) => m.value === method)?.label ?? method;
  }

  methodIcon(method: PaymentMethod | null): string {
    if (!method) return '💰';
    return this.paymentMethods.find((m) => m.value === method)?.icon ?? '💰';
  }

  methodIconClass(method: PaymentMethod): string {
    const map: Record<PaymentMethod, string> = {
      BANK_TRANSFER:  'hi-icon icon-transfer',
      CREDIT_CARD:    'hi-icon icon-card',
      DEBIT_CARD:     'hi-icon icon-card',
      CASH:           'hi-icon icon-cash',
      ONLINE_PAYMENT: 'hi-icon icon-online',
    };
    return map[method] ?? 'hi-icon icon-transfer';
  }
}
