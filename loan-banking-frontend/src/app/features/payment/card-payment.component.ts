import { DecimalPipe } from '@angular/common';
import {
  Component,
  inject,
  signal,
  computed,
  output,
  input,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';

export interface CardPaymentResult {
  cardHolder: string;
  lastFour: string;
  brand: 'visa' | 'mastercard' | 'amex' | 'unknown';
  amount: number;
}

// Luhn algorithm validator
function luhnValidator(control: AbstractControl) {
  const value = control.value?.replace(/\s/g, '');
  if (!value || value.length < 13) return null;
  let sum = 0;
  let shouldDouble = false;
  for (let i = value.length - 1; i >= 0; i--) {
    let digit = parseInt(value[i]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0 ? null : { invalidCard: true };
}

function expiryValidator(control: AbstractControl) {
  const value = control.value;
  if (!value || value.length < 5) return null;
  const [mm, yy] = value.split('/');
  const month = parseInt(mm);
  const year = parseInt('20' + yy);
  if (month < 1 || month > 12) return { invalidExpiry: true };
  const now = new Date();
  const expiry = new Date(year, month - 1, 1);
  if (expiry < new Date(now.getFullYear(), now.getMonth(), 1)) return { expired: true };
  return null;
}

@Component({
  selector: 'app-card-payment',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe],
  template: `
    <div class="card-payment-wrapper">

      <!-- ── Visual Card ───────────────────────── -->
      <div class="card-scene" [class.is-flipped]="showBack()">
        <!-- Front -->
        <div class="bank-card front">
          <div class="card-shimmer"></div>
          <div class="card-top">
            <div class="card-chip">
              <div class="chip-lines"></div>
            </div>
            <div class="card-brand-logo">{{ brandLogo() }}</div>
          </div>
          <div class="card-number-display mono">
            {{ formattedCardNumber() }}
          </div>
          <div class="card-bottom">
            <div>
              <div class="card-meta-label">TITULAR</div>
              <div class="card-meta-val mono">{{ cardholderDisplay() }}</div>
            </div>
            <div>
              <div class="card-meta-label">VENCE</div>
              <div class="card-meta-val mono">{{ expiryDisplay() }}</div>
            </div>
          </div>
        </div>
        <!-- Back -->
        <div class="bank-card back">
          <div class="card-stripe"></div>
          <div class="card-cvv-area">
            <div class="cvv-label mono">CVV</div>
            <div class="cvv-box mono">{{ cvvDisplay() }}</div>
          </div>
          <div class="card-brand-back">{{ brandLogo() }}</div>
        </div>
      </div>

      <!-- ── Amount display ───────────────────── -->
      <div class="amount-display">
        <span class="amount-label mono">TOTAL A PAGAR</span>
        <span class="amount-val mono">S/ {{ amount() | number:'1.2-2' }}</span>
      </div>

      <!-- ── Form ──────────────────────────────── -->
      <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate class="card-form">

        <!-- Card number -->
        <div class="cf-field" [class.has-error]="fc['cardNumber'].invalid && fc['cardNumber'].touched">
          <label class="cf-label">Número de tarjeta</label>
          <div class="cf-input-wrap">
            <input
              formControlName="cardNumber"
              type="text"
              inputmode="numeric"
              maxlength="19"
              placeholder="0000 0000 0000 0000"
              class="cf-input mono"
              (input)="formatCardNumber($event)"
              (focus)="showBack.set(false)"
            />
            <span class="cf-brand-icon">{{ brandLogo() }}</span>
          </div>
          @if (fc['cardNumber'].errors?.['invalidCard'] && fc['cardNumber'].touched) {
            <span class="cf-error">Número de tarjeta inválido</span>
          } @else if (fc['cardNumber'].errors?.['required'] && fc['cardNumber'].touched) {
            <span class="cf-error">Requerido</span>
          }
        </div>

        <!-- Cardholder -->
        <div class="cf-field" [class.has-error]="fc['cardHolder'].invalid && fc['cardHolder'].touched">
          <label class="cf-label">Nombre del titular</label>
          <input
            formControlName="cardHolder"
            type="text"
            placeholder="JUAN PEREZ"
            class="cf-input"
            style="text-transform:uppercase"
            (focus)="showBack.set(false)"
          />
          @if (fc['cardHolder'].invalid && fc['cardHolder'].touched) {
            <span class="cf-error">Requerido (solo letras)</span>
          }
        </div>

        <!-- Expiry + CVV -->
        <div class="cf-row">
          <div class="cf-field" [class.has-error]="fc['expiry'].invalid && fc['expiry'].touched">
            <label class="cf-label">Vencimiento</label>
            <input
              formControlName="expiry"
              type="text"
              inputmode="numeric"
              maxlength="5"
              placeholder="MM/AA"
              class="cf-input mono"
              (input)="formatExpiry($event)"
              (focus)="showBack.set(false)"
            />
            @if (fc['expiry'].errors?.['expired'] && fc['expiry'].touched) {
              <span class="cf-error">Tarjeta vencida</span>
            } @else if (fc['expiry'].errors?.['invalidExpiry'] && fc['expiry'].touched) {
              <span class="cf-error">Mes inválido</span>
            } @else if (fc['expiry'].invalid && fc['expiry'].touched) {
              <span class="cf-error">Requerido (MM/AA)</span>
            }
          </div>

          <div class="cf-field" [class.has-error]="fc['cvv'].invalid && fc['cvv'].touched">
            <label class="cf-label">CVV</label>
            <input
              formControlName="cvv"
              type="text"
              inputmode="numeric"
              [maxlength]="cvvLength()"
              placeholder="•••"
              class="cf-input mono"
              (focus)="showBack.set(true)"
              (blur)="showBack.set(false)"
            />
            @if (fc['cvv'].invalid && fc['cvv'].touched) {
              <span class="cf-error">{{ cvvLength() }} dígitos</span>
            }
          </div>
        </div>

        <!-- Installments selector (optional) -->
        <div class="cf-field">
          <label class="cf-label">Cuotas</label>
          <select formControlName="installments" class="cf-input">
            <option value="1">1 cuota sin interés — S/ {{ amount() | number:'1.2-2' }}</option>
            <option value="3">3 cuotas — S/ {{ (amount() / 3) | number:'1.2-2' }} c/u</option>
            <option value="6">6 cuotas — S/ {{ (amount() / 6) | number:'1.2-2' }} c/u</option>
          </select>
        </div>

        @if (error()) {
          <div class="cf-alert">{{ error() }}</div>
        }

        <!-- Actions -->
        <div class="cf-actions">
          <button type="button" class="btn-ghost-sm" (click)="cancelled.emit()">
            Cancelar
          </button>
          <button
            type="submit"
            class="btn-pay"
            [disabled]="processing() || form.invalid"
          >
            @if (processing()) {
              <span class="pay-spinner"></span> Procesando...
            } @else {
              <span>🔒</span> Pagar S/ {{ amount() | number:'1.2-2' }}
            }
          </button>
        </div>

        <div class="cf-security-note mono">
          🔒 Pago simulado — tus datos no se almacenan ni procesan realmente
        </div>

      </form>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .card-payment-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      padding: 8px 0 4px;
    }

    /* ── Card scene ── */
    .card-scene {
      width: 300px;
      height: 180px;
      perspective: 1000px;
      flex-shrink: 0;
    }

    .bank-card {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 16px;
      backface-visibility: hidden;
      transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .front {
      background: linear-gradient(135deg, #1a1f35 0%, #0f172a 40%, #1e3a5f 100%);
      border: 1px solid rgba(59,130,246,0.3);
      box-shadow:
        0 20px 60px rgba(0,0,0,0.5),
        0 0 0 1px rgba(255,255,255,0.05),
        inset 0 1px 0 rgba(255,255,255,0.1);
      padding: 20px 22px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
    }

    .back {
      background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
      border: 1px solid rgba(255,255,255,0.08);
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      transform: rotateY(180deg);
      display: flex;
      flex-direction: column;
      justify-content: center;
      overflow: hidden;
    }

    .card-scene.is-flipped .front { transform: rotateY(-180deg); }
    .card-scene.is-flipped .back  { transform: rotateY(0); }

    /* Shimmer overlay */
    .card-shimmer {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        105deg,
        transparent 40%,
        rgba(255,255,255,0.03) 50%,
        transparent 60%
      );
      border-radius: 16px;
      pointer-events: none;
    }

    /* Card internals */
    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .card-chip {
      width: 36px;
      height: 28px;
      background: linear-gradient(135deg, #d4a843 0%, #f0c060 50%, #c8972a 100%);
      border-radius: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .chip-lines {
      width: 22px;
      height: 16px;
      border: 1px solid rgba(0,0,0,0.3);
      border-radius: 2px;
      background: repeating-linear-gradient(
        0deg,
        rgba(0,0,0,0.15) 0px,
        rgba(0,0,0,0.15) 1px,
        transparent 1px,
        transparent 4px
      );
    }

    .card-brand-logo {
      font-size: 22px;
      letter-spacing: -0.05em;
      color: rgba(255,255,255,0.9);
      font-weight: 900;
      font-family: 'Georgia', serif;
    }

    .card-number-display {
      font-size: 17px;
      letter-spacing: 0.15em;
      color: rgba(255,255,255,0.9);
      text-shadow: 0 1px 3px rgba(0,0,0,0.5);
    }

    .card-bottom {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .card-meta-label {
      font-size: 8px;
      letter-spacing: 0.15em;
      color: rgba(255,255,255,0.4);
      margin-bottom: 3px;
    }

    .card-meta-val {
      font-size: 13px;
      color: rgba(255,255,255,0.9);
      letter-spacing: 0.05em;
      max-width: 160px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Card back */
    .card-stripe {
      height: 44px;
      background: #111;
      margin-bottom: 24px;
    }

    .card-cvv-area {
      padding: 0 24px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
    }

    .cvv-label {
      font-size: 10px;
      letter-spacing: 0.12em;
      color: rgba(255,255,255,0.4);
      text-transform: uppercase;
    }

    .cvv-box {
      background: #fff;
      color: #111;
      padding: 5px 14px;
      border-radius: 4px;
      font-size: 14px;
      min-width: 52px;
      text-align: center;
      letter-spacing: 0.2em;
    }

    .card-brand-back {
      text-align: right;
      padding: 12px 24px 0;
      font-size: 18px;
      color: rgba(255,255,255,0.6);
      font-weight: 900;
      font-family: 'Georgia', serif;
    }

    /* ── Amount ── */
    .amount-display {
      display: flex;
      align-items: baseline;
      gap: 12px;
    }

    .amount-label {
      font-size: 10px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--text-muted);
    }

    .amount-val {
      font-size: 22px;
      color: var(--accent-bright, #60a5fa);
    }

    /* ── Form ── */
    .card-form {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .cf-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .cf-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-muted, #64748b);
    }

    .cf-input-wrap {
      position: relative;
    }

    .cf-input-wrap input {
      width: 100%;
      padding: 10px 40px 10px 14px;
    }

    .cf-brand-icon {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 16px;
      pointer-events: none;
      color: var(--text-muted, #64748b);
    }

    .cf-input {
      padding: 10px 14px;
      background: var(--bg-elevated, #1e293b);
      border: 1px solid var(--border-subtle, #334155);
      border-radius: 8px;
      color: var(--text-primary, #f1f5f9);
      font-size: 14px;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
      width: 100%;
    }

    .cf-input:focus {
      border-color: var(--accent, #3b82f6);
      box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
    }

    .has-error .cf-input {
      border-color: var(--danger, #ef4444);
    }

    .cf-input option { background: var(--bg-elevated, #1e293b); }

    .cf-error {
      font-size: 11px;
      color: var(--danger, #ef4444);
      font-family: var(--font-mono, monospace);
    }

    .cf-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .cf-alert {
      padding: 10px 14px;
      background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.25);
      border-radius: 8px;
      color: #fca5a5;
      font-size: 12px;
    }

    /* ── Actions ── */
    .cf-actions {
      display: flex;
      gap: 10px;
      justify-content: space-between;
      align-items: center;
      margin-top: 4px;
    }

    .btn-ghost-sm {
      padding: 9px 16px;
      background: transparent;
      border: 1px solid var(--border-subtle, #334155);
      border-radius: 8px;
      color: var(--text-muted, #64748b);
      font-size: 13px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-ghost-sm:hover {
      background: var(--bg-elevated, #1e293b);
      color: var(--text-primary, #f1f5f9);
    }

    .btn-pay {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 11px 20px;
      background: var(--accent, #3b82f6);
      border: none;
      border-radius: 8px;
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-pay:hover:not(:disabled) {
      background: var(--accent-bright, #60a5fa);
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(59,130,246,0.35);
    }

    .btn-pay:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .pay-spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: inline-block;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .cf-security-note {
      font-size: 10px;
      letter-spacing: 0.08em;
      color: var(--text-muted, #64748b);
      text-align: center;
    }
  `],
})
export class CardPaymentComponent {
  private readonly fb = inject(FormBuilder);

  readonly amount = input.required<number>();
  readonly confirmed = output<CardPaymentResult>();
  readonly cancelled = output<void>();

  readonly showBack = signal(false);
  readonly processing = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    cardNumber:   ['', [Validators.required, luhnValidator]],
    cardHolder:   ['', [Validators.required, Validators.pattern(/^[A-Za-záéíóúÁÉÍÓÚñÑ ]+$/)]],
    expiry:       ['', [Validators.required, Validators.pattern(/^\d{2}\/\d{2}$/), expiryValidator]],
    cvv:          ['', [Validators.required]],
    installments: ['1'],
  });

  get fc() { return this.form.controls; }

  // ── Derived display values ──────────────────────────────────────────

  formattedCardNumber = computed(() => {
    const raw = this.form.value.cardNumber?.replace(/\s/g, '') ?? '';
    if (!raw) return '•••• •••• •••• ••••';
    return (raw.padEnd(16, '•').match(/.{1,4}/g) ?? []).join(' ');
  });

  cardholderDisplay = computed(() =>
    this.form.value.cardHolder?.toUpperCase() || 'NOMBRE TITULAR'
  );

  expiryDisplay = computed(() =>
    this.form.value.expiry || 'MM/AA'
  );

  cvvDisplay = computed(() =>
    this.form.value.cvv?.replace(/./g, '•') || '•••'
  );

  brandLogo = computed(() => {
    const num = this.form.value.cardNumber?.replace(/\s/g, '') ?? '';
    if (/^4/.test(num)) return 'VISA';
    if (/^5[1-5]/.test(num) || /^2[2-7]/.test(num)) return 'MC';
    if (/^3[47]/.test(num)) return 'AMEX';
    return '💳';
  });

  cardBrand = computed((): CardPaymentResult['brand'] => {
    const num = this.form.value.cardNumber?.replace(/\s/g, '') ?? '';
    if (/^4/.test(num)) return 'visa';
    if (/^5[1-5]/.test(num) || /^2[2-7]/.test(num)) return 'mastercard';
    if (/^3[47]/.test(num)) return 'amex';
    return 'unknown';
  });

  cvvLength = computed(() => this.cardBrand() === 'amex' ? 4 : 3);

  // ── Formatters ──────────────────────────────────────────────────────

  formatCardNumber(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    const maxLen = this.cardBrand() === 'amex' ? 15 : 16;
    value = value.substring(0, maxLen);
    const groups = this.cardBrand() === 'amex'
      ? [4, 6, 5]
      : [4, 4, 4, 4];
    let formatted = '';
    let idx = 0;
    for (const g of groups) {
      if (idx >= value.length) break;
      if (formatted) formatted += ' ';
      formatted += value.substring(idx, idx + g);
      idx += g;
    }
    input.value = formatted;
    this.fc['cardNumber'].setValue(formatted);
  }

  formatExpiry(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    if (value.length >= 3) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    input.value = value;
    this.fc['expiry'].setValue(value);
  }

  // ── Submit ──────────────────────────────────────────────────────────

  onSubmit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.processing.set(true);
    this.error.set('');

    // Simulate processing delay
    setTimeout(() => {
      const raw = this.form.getRawValue();
      const num = raw.cardNumber.replace(/\s/g, '');
      this.processing.set(false);
      this.confirmed.emit({
        cardHolder: raw.cardHolder.toUpperCase(),
        lastFour: num.slice(-4),
        brand: this.cardBrand(),
        amount: this.amount(),
      });
    }, 1800);
  }
}
