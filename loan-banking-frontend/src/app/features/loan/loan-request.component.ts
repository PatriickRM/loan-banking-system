import { Component, inject, signal, output, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { LoanService } from '../../core/services/loan.service';
import { AuthService } from '../../core/services/auth.service';
import { LoanType, LoanRequest } from '../../core/models/loan.models';

@Component({
  selector: 'app-loan-request',
  imports: [ReactiveFormsModule, DecimalPipe],
  template: `
    <div class="modal-backdrop" (click)="onClose()">
      <div class="modal-panel" (click)="$event.stopPropagation()">

        <!-- Header -->
        <div class="modal-header">
          <div>
            <div class="modal-eyebrow mono">NUEVA SOLICITUD</div>
            <h2 class="modal-title">Solicitar préstamo</h2>
          </div>
          <button class="close-btn" (click)="onClose()">✕</button>
        </div>

        @if (success()) {
          <!-- Success state -->
          <div class="success-state">
            <div class="success-ring">
              <span class="success-check">✓</span>
            </div>
            <h3>¡Solicitud enviada!</h3>
            <p class="text-secondary">
              Tu solicitud #{{ createdLoanId() }} fue recibida y está en evaluación.<br>
              Te notificaremos por email sobre el resultado.
            </p>
            <div class="success-meta mono">
              <div class="meta-row">
                <span class="text-muted">Monto</span>
                <span>S/ {{ form.value.amount | number }}</span>
              </div>
              <div class="meta-row">
                <span class="text-muted">Plazo</span>
                <span>{{ form.value.termMonths }} meses</span>
              </div>
              <div class="meta-row">
                <span class="text-muted">Estado</span>
                <span class="chip chip-pending">EN EVALUACIÓN</span>
              </div>
            </div>
            <button class="btn btn-primary" (click)="onClose()">Entendido</button>
          </div>
        } @else {

          <!-- Step indicators -->
          <div class="steps-bar">
            @for (s of [1, 2]; track s) {
              <div class="step" [class.active]="step() === s" [class.done]="step() > s">
                <div class="step-dot mono">{{ step() > s ? '✓' : s }}</div>
                <span>{{ s === 1 ? 'Tipo y monto' : 'Detalles' }}</span>
              </div>
            }
            <div class="step-line"></div>
          </div>

          @if (errorMessage()) {
            <div class="alert alert-error">{{ errorMessage() }}</div>
          }

          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>

            <!-- STEP 1: Loan type + amount -->
            @if (step() === 1) {
              <div class="form-section">

                <!-- Loan type cards -->
                <div class="field-label mono">TIPO DE PRÉSTAMO</div>
                @if (loadingTypes()) {
                  <div class="loading-row">
                    <div class="spinner"></div>
                    <span class="text-muted">Cargando tipos...</span>
                  </div>
                } @else {
                  <div class="loan-type-grid">
                    @for (lt of loanTypes(); track lt.id) {
                      <div
                        class="loan-type-card"
                        [class.selected]="form.value.loanTypeId === lt.id"
                        (click)="selectLoanType(lt)"
                      >
                        <div class="lt-name">{{ lt.name }}</div>
                        <div class="lt-rate mono">{{ lt.interestRate }}% TEA</div>
                        <div class="lt-range mono text-muted">
                          S/ {{ lt.minAmount | number:'1.0-0' }} – {{ lt.maxAmount | number:'1.0-0' }}
                        </div>
                        <div class="lt-term text-muted">
                          {{ lt.minTermMonths }}–{{ lt.maxTermMonths }} meses
                        </div>
                      </div>
                    }
                  </div>
                  @if (fc['loanTypeId'].invalid && fc['loanTypeId'].touched) {
                    <span class="error-msg">Seleccioná un tipo de préstamo</span>
                  }
                }

                <!-- Amount + term -->
                <div class="field-row">
                  <div class="field">
                    <label>Monto (S/)</label>
                    <input
                      formControlName="amount"
                      type="number"
                      [min]="selectedType()?.minAmount ?? 1000"
                      [max]="selectedType()?.maxAmount ?? 999999"
                      placeholder="15000"
                    />
                    @if (selectedType()) {
                      <span class="field-hint mono">
                        Rango: S/ {{ selectedType()!.minAmount | number:'1.0-0' }} – {{ selectedType()!.maxAmount | number:'1.0-0' }}
                      </span>
                    }
                    @if (fc['amount'].invalid && fc['amount'].touched) {
                      <span class="error-msg">Monto inválido</span>
                    }
                  </div>

                  <div class="field">
                    <label>Plazo (meses)</label>
                    <input
                      formControlName="termMonths"
                      type="number"
                      [min]="selectedType()?.minTermMonths ?? 6"
                      [max]="selectedType()?.maxTermMonths ?? 360"
                      placeholder="24"
                    />
                    @if (selectedType()) {
                      <span class="field-hint mono">
                        Rango: {{ selectedType()!.minTermMonths }}–{{ selectedType()!.maxTermMonths }} meses
                      </span>
                    }
                    @if (fc['termMonths'].invalid && fc['termMonths'].touched) {
                      <span class="error-msg">Plazo inválido</span>
                    }
                  </div>
                </div>

                <!-- Live preview -->
                @if (monthlyPreview() > 0) {
                  <div class="preview-card">
                    <div class="preview-label mono">ESTIMADO MENSUAL</div>
                    <div class="preview-value mono">S/ {{ monthlyPreview() | number:'1.2-2' }}</div>
                    <div class="preview-sub text-muted">
                      Total aprox: S/ {{ totalPreview() | number:'1.2-2' }} · Tasa: {{ selectedType()?.interestRate }}% TEA
                    </div>
                  </div>
                }

              </div>
            }

            <!-- STEP 2: Purpose -->
            @if (step() === 2) {
              <div class="form-section">
                <div class="field">
                  <label>Propósito del préstamo</label>
                  <div class="purpose-chips">
                    @for (p of purposeOptions; track p) {
                      <button
                        type="button"
                        class="purpose-chip"
                        [class.selected]="fc['purpose'].value === p"
                        (click)="fc['purpose'].setValue(p)"
                      >{{ p }}</button>
                    }
                  </div>
                  <textarea
                    formControlName="purpose"
                    placeholder="Describa el propósito del préstamo..."
                    rows="4"
                  ></textarea>
                  @if (fc['purpose'].invalid && fc['purpose'].touched) {
                    <span class="error-msg">Propósito requerido (mín. 10 caracteres)</span>
                  }
                </div>

                <!-- Summary -->
                <div class="summary-box">
                  <div class="summary-title mono">RESUMEN DE SOLICITUD</div>
                  <div class="summary-row">
                    <span class="text-muted">Tipo</span>
                    <span>{{ selectedType()?.name ?? '—' }}</span>
                  </div>
                  <div class="summary-row">
                    <span class="text-muted">Monto</span>
                    <span class="mono">S/ {{ form.value.amount | number:'1.2-2' }}</span>
                  </div>
                  <div class="summary-row">
                    <span class="text-muted">Plazo</span>
                    <span class="mono">{{ form.value.termMonths }} meses</span>
                  </div>
                  <div class="summary-row">
                    <span class="text-muted">Cuota est.</span>
                    <span class="mono accent">S/ {{ monthlyPreview() | number:'1.2-2' }}</span>
                  </div>
                  <div class="summary-row">
                    <span class="text-muted">Tasa</span>
                    <span class="mono">{{ selectedType()?.interestRate }}% TEA</span>
                  </div>
                </div>
              </div>
            }

            <!-- Nav -->
            <div class="modal-footer">
              @if (step() === 1) {
                <button type="button" class="btn btn-ghost" (click)="onClose()">Cancelar</button>
                <button type="button" class="btn btn-primary" (click)="nextStep()">
                  Continuar →
                </button>
              } @else {
                <button type="button" class="btn btn-ghost" (click)="step.set(1)">← Atrás</button>
                <button
                  type="submit"
                  class="btn btn-primary"
                  [disabled]="loading() || form.invalid"
                >
                  @if (loading()) {
                    <span class="spinner-sm"></span> Enviando...
                  } @else {
                    Enviar solicitud
                  }
                </button>
              }
            </div>

          </form>
        }

      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(8, 11, 15, 0.85);
      backdrop-filter: blur(4px);
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      animation: fadeIn 150ms ease;
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .modal-panel {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-xl);
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      animation: slideUp 200ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
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

    .modal-title {
      font-size: 22px;
      font-weight: 800;
    }

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
      flex-shrink: 0;
    }
    .close-btn:hover { background: var(--bg-elevated); color: var(--text-primary); }

    /* Steps */
    .steps-bar {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 24px 28px 0;
      position: relative;
    }

    .step {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      color: var(--text-muted);
      transition: color var(--t-fast);
      z-index: 1;
    }

    .step.active { color: var(--text-primary); }
    .step.done   { color: var(--success); }

    .step-dot {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      border: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      transition: all var(--t-fast);
      background: var(--bg-elevated);
    }

    .step.active .step-dot {
      border-color: var(--accent);
      background: var(--accent-dim);
      color: var(--accent-bright);
    }

    .step.done .step-dot {
      border-color: var(--success);
      background: var(--success-dim);
      color: var(--success);
    }

    .step-line {
      flex: 1;
      height: 1px;
      background: var(--border-dim);
    }

    /* Form section */
    .form-section {
      padding: 24px 28px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .field-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--text-muted);
      margin-bottom: -12px;
    }

    /* Loan type grid */
    .loan-type-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }

    .loan-type-card {
      background: var(--bg-elevated);
      border: 1px solid var(--border-dim);
      border-radius: var(--radius-lg);
      padding: 14px 16px;
      cursor: pointer;
      transition: all var(--t-fast);
    }

    .loan-type-card:hover { border-color: var(--border-subtle); background: var(--bg-hover); }
    .loan-type-card.selected {
      border-color: var(--accent);
      background: var(--accent-dim);
    }

    .lt-name { font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px; }
    .lt-rate  { font-size: 14px; color: var(--accent-bright); margin-bottom: 4px; }
    .lt-range { font-size: 11px; margin-bottom: 2px; }
    .lt-term  { font-size: 11px; }

    .field-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .field-hint {
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 4px;
    }

    /* Preview card */
    .preview-card {
      background: var(--bg-card);
      border: 1px solid var(--border-dim);
      border-left: 3px solid var(--accent);
      border-radius: var(--radius-lg);
      padding: 16px 20px;
    }

    .preview-label {
      font-size: 10px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 6px;
    }

    .preview-value {
      font-size: 28px;
      color: var(--accent-bright);
      margin-bottom: 4px;
    }

    .preview-sub { font-size: 12px; }

    /* Purpose chips */
    .purpose-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 12px;
    }

    .purpose-chip {
      padding: 5px 14px;
      border-radius: 100px;
      background: var(--bg-elevated);
      border: 1px solid var(--border-dim);
      color: var(--text-muted);
      font-size: 12px;
      cursor: pointer;
      transition: all var(--t-fast);
    }

    .purpose-chip:hover, .purpose-chip.selected {
      background: var(--accent-dim);
      border-color: rgba(59,130,246,0.3);
      color: var(--accent-bright);
    }

    textarea {
      width: 100%;
      padding: 12px 14px;
      background: var(--bg-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      color: var(--text-primary);
      font-family: var(--font-display);
      font-size: 14px;
      resize: vertical;
      outline: none;
      transition: border-color var(--t-fast);
    }

    textarea:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-dim);
    }

    /* Summary */
    .summary-box {
      background: var(--bg-card);
      border: 1px solid var(--border-dim);
      border-radius: var(--radius-lg);
      padding: 16px 20px;
    }

    .summary-title {
      font-size: 10px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 12px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid var(--border-dim);
      font-size: 13px;
    }

    .summary-row:last-child { border-bottom: none; }
    .accent { color: var(--accent-bright); }

    /* Modal footer */
    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 28px 28px;
      margin-top: 8px;
    }

    /* Success */
    .success-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 32px 28px 28px;
      gap: 16px;
    }

    .success-ring {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      border: 2px solid var(--success);
      background: var(--success-dim);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .success-check { font-size: 28px; color: var(--success); }

    .success-state h3 { font-size: 22px; }

    .success-meta {
      width: 100%;
      max-width: 320px;
      background: var(--bg-elevated);
      border: 1px solid var(--border-dim);
      border-radius: var(--radius-lg);
      padding: 16px;
    }

    .meta-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      padding: 6px 0;
      border-bottom: 1px solid var(--border-dim);
    }

    .meta-row:last-child { border-bottom: none; }

    .chip { padding: 2px 10px; border-radius: 100px; font-size: 11px; }
    .chip-pending { background: var(--warning-dim); color: var(--warning); }

    /* Loading */
    .loading-row {
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

    .spinner-sm {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255,255,255,0.2);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: inline-block;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .alert {
      margin: 16px 28px 0;
      padding: 10px 14px;
      border-radius: var(--radius-md);
      font-size: 13px;
      font-family: var(--font-mono);
    }

    .alert-error {
      background: var(--danger-dim);
      border: 1px solid rgba(239,68,68,0.25);
      color: #fca5a5;
    }
  `],
})
export class LoanRequestComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly loanService = inject(LoanService);
  private readonly authService = inject(AuthService);

  readonly closed = output<void>();
  readonly loanCreated = output<void>();

  readonly loading = signal(false);
  readonly loadingTypes = signal(false);
  readonly errorMessage = signal('');
  readonly success = signal(false);
  readonly step = signal<1 | 2>(1);
  readonly loanTypes = signal<LoanType[]>([]);
  readonly selectedType = signal<LoanType | null>(null);
  readonly createdLoanId = signal<number | null>(null);

  readonly purposeOptions = [
    'Capital de trabajo',
    'Mejora del hogar',
    'Educación',
    'Salud',
    'Vehículo',
    'Viaje',
    'Consolidación de deudas',
    'Otro',
  ];

  readonly form = this.fb.nonNullable.group({
    loanTypeId: [0, [Validators.required, Validators.min(1)]],
    amount:     [0, [Validators.required, Validators.min(1000)]],
    termMonths: [12, [Validators.required, Validators.min(6), Validators.max(360)]],
    purpose:    ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
  });

  get fc() { return this.form.controls; }

  get monthlyPreview(): () => number {
    return () => {
      const lt = this.selectedType();
      const amount = this.form.value.amount ?? 0;
      const months = this.form.value.termMonths ?? 12;
      if (!lt || amount <= 0 || months <= 0) return 0;

      const monthlyRate = lt.interestRate / 100 / 12;
      const power = Math.pow(1 + monthlyRate, months);
      return (amount * monthlyRate * power) / (power - 1);
    };
  }

  get totalPreview(): () => number {
    return () => this.monthlyPreview() * (this.form.value.termMonths ?? 0);
  }

  ngOnInit(): void {
    this.loadingTypes.set(true);
    this.loanService.getLoanTypes().subscribe({
      next: (types) => {
        this.loanTypes.set(types);
        this.loadingTypes.set(false);
      },
      error: () => {
        // Fallback with mock data if endpoint doesn't exist yet
        this.loanTypes.set([
          { id: 1, name: 'Préstamo Personal', description: '', minAmount: 1000, maxAmount: 50000, minTermMonths: 6, maxTermMonths: 60, interestRate: 18.5, requiresCollateral: false },
          { id: 2, name: 'Préstamo Hipotecario', description: '', minAmount: 50000, maxAmount: 500000, minTermMonths: 60, maxTermMonths: 360, interestRate: 9.5, requiresCollateral: true },
          { id: 3, name: 'Préstamo Vehicular', description: '', minAmount: 10000, maxAmount: 150000, minTermMonths: 12, maxTermMonths: 84, interestRate: 12.5, requiresCollateral: true },
          { id: 4, name: 'Préstamo Empresarial', description: '', minAmount: 5000, maxAmount: 200000, minTermMonths: 6, maxTermMonths: 120, interestRate: 15.0, requiresCollateral: false },
        ]);
        this.loadingTypes.set(false);
      },
    });
  }

  selectLoanType(lt: LoanType): void {
    this.selectedType.set(lt);
    this.fc.loanTypeId.setValue(lt.id);
    // Update validators based on selected type
    this.fc.amount.setValidators([
      Validators.required,
      Validators.min(lt.minAmount),
      Validators.max(lt.maxAmount),
    ]);
    this.fc.termMonths.setValidators([
      Validators.required,
      Validators.min(lt.minTermMonths),
      Validators.max(lt.maxTermMonths),
    ]);
    this.fc.amount.updateValueAndValidity();
    this.fc.termMonths.updateValueAndValidity();
  }

  nextStep(): void {
    this.fc.loanTypeId.markAsTouched();
    this.fc.amount.markAsTouched();
    this.fc.termMonths.markAsTouched();

    if (this.fc.loanTypeId.invalid || this.fc.amount.invalid || this.fc.termMonths.invalid) return;
    this.step.set(2);
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    this.errorMessage.set('');

    const user = this.authService.user();
    const raw = this.form.getRawValue();

    const request: LoanRequest = {
      customerId: user?.customerId ?? undefined,
      loanTypeId: raw.loanTypeId,
      amount: raw.amount,
      termMonths: raw.termMonths,
      purpose: raw.purpose,
    };

    this.loanService.createLoan(request).subscribe({
      next: (loan) => {
        this.loading.set(false);
        this.createdLoanId.set(loan.id);
        this.success.set(true);
        this.loanCreated.emit();
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Error al enviar la solicitud');
      },
    });
  }

  onClose(): void {
    this.closed.emit();
  }
}