// ── Enums ───────────────────────────────────────────────────────────────────

export type PaymentMethod =
  | 'BANK_TRANSFER'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'CASH'
  | 'ONLINE_PAYMENT';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export type PaymentScheduleStatus =
  | 'PENDING'
  | 'PAID'
  | 'OVERDUE'
  | 'PARTIAL'
  | 'CANCELLED';

// ── Requests ─────────────────────────────────────────────────────────────────

export interface PaymentRequest {
  loanId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  processedBy?: string;
}

// ── Responses ────────────────────────────────────────────────────────────────

export interface PaymentResponse {
  id: number;
  loanId: number;
  scheduleId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionId: string;
  principalPaid: number;
  interestPaid: number;
  lateFee: number;
  paymentDate: string;     // LocalDateTime → ISO string
  dueDate: string;         // LocalDate → ISO string
  status: PaymentStatus;
  referenceNumber?: string;
}

export interface PaymentScheduleResponse {
  id: number;
  loanId: number;
  installmentNumber: number;
  amount: number;
  principal: number;
  interest: number;
  remainingBalance: number;
  dueDate: string;         // LocalDate → ISO string
  status: PaymentScheduleStatus;
  daysUntilDue: number;    // negative = overdue
  isOverdue: boolean;
}