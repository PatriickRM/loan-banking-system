import { Component, inject, signal, input, OnInit, output } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { LoanService } from '../../core/services/loan.service';
import { EvaluationService } from '../../core/services/evaluation.service';
import { LoanResponse, EvaluationResponse, LoanStatus } from '../../core/models/loan.models';

@Component({
  selector: 'app-loan-detail',
  imports: [DecimalPipe, DatePipe],
  template: `
    <div class="modal-backdrop" (click)="onClose.emit()">
      <div class="detail-panel" (click)="$event.stopPropagation()">

        <!-- Header -->
        <div class="detail-header">
          <div>
            <div class="detail-eyebrow mono">PRÉSTAMO #{{ loan().id }}</div>
            <h2 class="detail-title">{{ loan().loanTypeName }}</h2>
          </div>
          <div class="header-actions">
            <span class="status-badge" [class]="statusClass(loan().status)">
              {{ statusLabel(loan().status) }}
            </span>
            <button class="close-btn" (click)="onClose.emit()">✕</button>
          </div>
        </div>

        <div class="detail-body">

          <!-- Amount hero -->
          <div class="amount-hero">
            <div class="amount-main">
              <div class="amount-label mono">MONTO SOLICITADO</div>
              <div class="amount-value mono">S/ {{ loan().amount | number:'1.2-2' }}</div>
            </div>
            @if (loan().approvedAmount && loan().approvedAmount !== loan().amount) {
              <div class="amount-approved">
                <div class="amount-label mono">MONTO APROBADO</div>
                <div class="amount-value mono success">S/ {{ loan().approvedAmount | number:'1.2-2' }}</div>
              </div>
            }
            @if (loan().monthlyPayment) {
              <div class="amount-monthly">
                <div class="amount-label mono">CUOTA MENSUAL</div>
                <div class="amount-value mono accent">S/ {{ loan().monthlyPayment | number:'1.2-2' }}</div>
              </div>
            }
          </div>

          <!-- Timeline -->
          <div class="section">
            <div class="section-label mono">LÍNEA DE TIEMPO</div>
            <div class="timeline">
              @for (event of timeline(); track event.label) {
                <div class="timeline-item" [class.done]="event.done" [class.active]="event.active">
                  <div class="tl-dot"></div>
                  <div class="tl-content">
                    <div class="tl-label">{{ event.label }}</div>
                    @if (event.date) {
                      <div class="tl-date mono">{{ event.date | date:'dd MMM yyyy HH:mm' }}</div>
                    } @else if (event.active) {
                      <div class="tl-date mono text-muted">En proceso...</div>
                    } @else {
                      <div class="tl-date mono text-muted">Pendiente</div>
                    }
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Loan details grid -->
          <div class="section">
            <div class="section-label mono">DETALLES</div>
            <div class="details-grid">
              <div class="detail-item">
                <div class="di-label">Tasa anual</div>
                <div class="di-value mono">{{ loan().interestRate }}% TEA</div>
              </div>
              <div class="detail-item">
                <div class="di-label">Plazo</div>
                <div class="di-value mono">{{ loan().termMonths }} meses</div>
              </div>
              @if (loan().totalAmount) {
                <div class="detail-item">
                  <div class="di-label">Total a pagar</div>
                  <div class="di-value mono">S/ {{ loan().totalAmount | number:'1.2-2' }}</div>
                </div>
              }
              @if (loan().outstandingBalance) {
                <div class="detail-item">
                  <div class="di-label">Saldo pendiente</div>
                  <div class="di-value mono accent">S/ {{ loan().outstandingBalance | number:'1.2-2' }}</div>
                </div>
              }
              <div class="detail-item">
                <div class="di-label">Cliente</div>
                <div class="di-value">{{ loan().customerName }}</div>
              </div>
              <div class="detail-item">
                <div class="di-label">Propósito</div>
                <div class="di-value">{{ loan().purpose }}</div>
              </div>
            </div>
          </div>

          <!-- Credit Evaluation -->
          @if (loadingEval()) {
            <div class="section">
              <div class="section-label mono">EVALUACIÓN CREDITICIA</div>
              <div class="eval-loading">
                <div class="spinner"></div>
                <span class="text-muted">Cargando evaluación...</span>
              </div>
            </div>
          } @else if (evaluation()) {
            <div class="section">
              <div class="section-label mono">EVALUACIÓN CREDITICIA</div>
              <div class="eval-card">
                <!-- Score ring -->
                <div class="eval-score-section">
                  <div class="score-ring-lg" [class]="scoreClass(evaluation()!.finalScore ?? 0)">
                    <div class="score-num mono">{{ evaluation()!.finalScore ?? '—' }}</div>
                    <div class="score-sub mono">/ 100</div>
                  </div>
                  <div class="score-breakdown">
                    @if (evaluation()!.automaticScore !== null) {
                      <div class="score-row">
                        <span class="text-muted">Score automático</span>
                        <span class="mono">{{ evaluation()!.automaticScore }}</span>
                      </div>
                    }
                    @if (evaluation()!.manualScore !== null) {
                      <div class="score-row">
                        <span class="text-muted">Score manual</span>
                        <span class="mono">{{ evaluation()!.manualScore }}</span>
                      </div>
                    }
                    <div class="score-row">
                      <span class="text-muted">Estado</span>
                      <span class="eval-status-chip" [class]="evalStatusClass(evaluation()!.status)">
                        {{ evaluation()!.status }}
                      </span>
                    </div>
                    <div class="score-row">
                      <span class="text-muted">Recomendación</span>
                      <span class="rec-chip" [class]="recClass(evaluation()!.recommendation)">
                        {{ evaluation()!.recommendation ?? '—' }}
                      </span>
                    </div>
                    @if (evaluation()!.riskLevel) {
                      <div class="score-row">
                        <span class="text-muted">Nivel de riesgo</span>
                        <span class="risk-chip" [class]="'risk-' + (evaluation()!.riskLevel ?? '').toLowerCase()">
                          {{ evaluation()!.riskLevel }}
                        </span>
                      </div>
                    }
                  </div>
                </div>
                @if (evaluation()!.comments) {
                  <div class="eval-comments">
                    <div class="ec-label mono">Comentarios del analista</div>
                    <p class="ec-text">{{ evaluation()!.comments }}</p>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Rejection reason -->
          @if (loan().rejectionReason) {
            <div class="section">
              <div class="section-label mono">MOTIVO DE RECHAZO</div>
              <div class="rejection-box">
                <span class="rejection-icon">⚠</span>
                <p>{{ loan().rejectionReason }}</p>
              </div>
            </div>
          }

        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(8, 11, 15, 0.8);
      backdrop-filter: blur(4px);
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      animation: fadeIn 150ms ease;
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .detail-panel {
      background: var(--bg-surface);
      border-left: 1px solid var(--border-subtle);
      width: 100%;
      max-width: 520px;
      height: 100vh;
      overflow-y: auto;
      animation: slideIn 250ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateX(40px); }
      to   { opacity: 1; transform: translateX(0); }
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

    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .status-badge {
      padding: 4px 12px;
      border-radius: 100px;
      font-family: var(--font-mono);
      font-size: 11px;
      letter-spacing: 0.06em;
    }

    .status-pending  { background: var(--warning-dim); color: var(--warning); }
    .status-approved { background: var(--success-dim); color: var(--success); }
    .status-active   { background: var(--accent-dim);  color: var(--accent-bright); }
    .status-rejected { background: var(--danger-dim);  color: var(--danger); }
    .status-completed { background: rgba(148,163,184,0.15); color: #94a3b8; }
    .status-defaulted { background: var(--danger-dim); color: var(--danger); }
    .status-cancelled { background: var(--border-dim); color: var(--text-muted); }

    .close-btn {
      background: none;
      border: 1px solid var(--border-dim);
      color: var(--text-muted);
      border-radius: var(--radius-sm);
      width: 32px;
      height: 32px;
      cursor: pointer;
      font-size: 14px;
      transition: all var(--t-fast);
    }
    .close-btn:hover { background: var(--bg-elevated); color: var(--text-primary); }

    /* Body */
    .detail-body { padding: 24px 28px; display: flex; flex-direction: column; gap: 28px; }

    /* Amount hero */
    .amount-hero {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 16px;
      background: var(--bg-card);
      border: 1px solid var(--border-dim);
      border-radius: var(--radius-xl);
      padding: 20px;
    }

    .amount-label {
      font-size: 10px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 6px;
    }

    .amount-value {
      font-size: 22px;
      color: var(--text-primary);
    }

    .amount-value.success { color: var(--success); }
    .amount-value.accent  { color: var(--accent-bright); }

    /* Section */
    .section { display: flex; flex-direction: column; gap: 12px; }

    .section-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--text-muted);
    }

    /* Timeline */
    .timeline { display: flex; flex-direction: column; gap: 0; }

    .timeline-item {
      display: flex;
      gap: 14px;
      align-items: flex-start;
      padding-bottom: 16px;
      position: relative;
    }

    .timeline-item:not(:last-child) .tl-dot::after {
      content: '';
      position: absolute;
      left: 5px;
      top: 16px;
      bottom: 0;
      width: 1px;
      background: var(--border-dim);
    }

    .tl-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid var(--border-subtle);
      background: var(--bg-elevated);
      flex-shrink: 0;
      margin-top: 4px;
      position: relative;
      z-index: 1;
    }

    .timeline-item.done .tl-dot {
      border-color: var(--success);
      background: var(--success);
    }

    .timeline-item.active .tl-dot {
      border-color: var(--accent);
      background: var(--accent-dim);
      box-shadow: 0 0 0 3px var(--accent-dim);
    }

    .tl-label { font-size: 13px; color: var(--text-secondary); font-weight: 500; }
    .tl-date  { font-size: 11px; margin-top: 2px; }

    /* Details grid */
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .detail-item {
      background: var(--bg-elevated);
      border: 1px solid var(--border-dim);
      border-radius: var(--radius-md);
      padding: 12px 14px;
    }

    .di-label { font-size: 11px; color: var(--text-muted); margin-bottom: 4px; }
    .di-value { font-size: 14px; color: var(--text-primary); }
    .di-value.mono { font-family: var(--font-mono); }
    .di-value.accent { color: var(--accent-bright); }

    /* Eval card */
    .eval-card {
      background: var(--bg-card);
      border: 1px solid var(--border-dim);
      border-radius: var(--radius-xl);
      padding: 20px;
    }

    .eval-score-section {
      display: flex;
      gap: 24px;
      align-items: center;
      margin-bottom: 16px;
    }

    .score-ring-lg {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      border: 3px solid;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .score-ring-lg.good   { border-color: var(--success); }
    .score-ring-lg.medium { border-color: var(--warning); }
    .score-ring-lg.low    { border-color: var(--danger); }
    .score-ring-lg.none   { border-color: var(--border-subtle); }

    .score-num { font-size: 24px; line-height: 1; }
    .score-sub { font-size: 11px; color: var(--text-muted); }

    .score-breakdown { flex: 1; display: flex; flex-direction: column; gap: 8px; }

    .score-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
    }

    .eval-status-chip, .rec-chip, .risk-chip {
      padding: 2px 8px;
      border-radius: 100px;
      font-family: var(--font-mono);
      font-size: 10px;
      letter-spacing: 0.06em;
    }

    .eval-status-chip { background: var(--accent-dim); color: var(--accent-bright); }
    .rec-chip { background: var(--success-dim); color: var(--success); }
    .risk-low    { background: var(--success-dim); color: var(--success); }
    .risk-medium { background: var(--warning-dim); color: var(--warning); }
    .risk-high   { background: var(--danger-dim);  color: var(--danger); }

    .eval-comments {
      border-top: 1px solid var(--border-dim);
      padding-top: 14px;
    }

    .ec-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); margin-bottom: 6px; }
    .ec-text  { font-size: 13px; color: var(--text-secondary); line-height: 1.6; }

    /* Rejection */
    .rejection-box {
      display: flex;
      gap: 12px;
      background: var(--danger-dim);
      border: 1px solid rgba(239,68,68,0.2);
      border-radius: var(--radius-lg);
      padding: 16px;
      font-size: 13px;
      color: var(--text-secondary);
    }

    .rejection-icon { color: var(--danger); font-size: 16px; flex-shrink: 0; }

    /* Loading */
    .eval-loading {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      color: var(--text-muted);
      font-size: 13px;
    }

    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid var(--border-subtle);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class LoanDetailComponent implements OnInit {
  private readonly evaluationService = inject(EvaluationService);

  readonly loan = input.required<LoanResponse>();
  readonly onClose = output<void>();

  readonly evaluation = signal<EvaluationResponse | null>(null);
  readonly loadingEval = signal(false);

  ngOnInit(): void {
    this.loadingEval.set(true);
    this.evaluationService.getEvaluationByLoanId(this.loan().id).subscribe({
      next: (ev) => {
        this.evaluation.set(ev);
        this.loadingEval.set(false);
      },
      error: () => this.loadingEval.set(false),
    });
  }

  timeline() {
    const loan = this.loan();
    return [
      { label: 'Solicitud recibida', done: true, active: false, date: loan.applicationDate },
      { label: 'En evaluación crediticia', done: !!loan.approvalDate || loan.status === 'REJECTED', active: loan.status === 'PENDING', date: null },
      { label: 'Aprobación', done: ['APPROVED', 'ACTIVE', 'COMPLETED'].includes(loan.status), active: false, date: loan.approvalDate },
      { label: 'Desembolso', done: ['ACTIVE', 'COMPLETED'].includes(loan.status), active: loan.status === 'APPROVED', date: loan.disbursementDate },
      { label: 'Activo', done: loan.status === 'COMPLETED', active: loan.status === 'ACTIVE', date: loan.disbursementDate },
    ];
  }

  statusLabel(status: LoanStatus): string {
    const labels: Record<LoanStatus, string> = {
      PENDING: 'EN EVALUACIÓN', APPROVED: 'APROBADO', REJECTED: 'RECHAZADO',
      ACTIVE: 'ACTIVO', COMPLETED: 'COMPLETADO', DEFAULTED: 'EN MORA', CANCELLED: 'CANCELADO',
    };
    return labels[status] ?? status;
  }

  statusClass(status: LoanStatus): string {
    return `status-${status.toLowerCase()}`;
  }

  scoreClass(score: number): string {
    if (!score) return 'none';
    if (score >= 75) return 'good';
    if (score >= 50) return 'medium';
    return 'low';
  }

  evalStatusClass(_: string): string { return ''; }
  recClass(_: string | undefined): string { return ''; }
}