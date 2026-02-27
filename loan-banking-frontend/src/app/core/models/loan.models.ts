export type LoanStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'DEFAULTED'
  | 'CANCELLED';

export interface LoanRequest {
  customerId?: number;
  loanTypeId: number;
  amount: number;
  termMonths: number;
  purpose: string;
}

export interface LoanApprovalRequest {
  approvedAmount: number;
  evaluatedBy: string;
}

export interface LoanRejectionRequest {
  rejectionReason: string;
  evaluatedBy: string;
}

export interface LoanResponse {
  id: number;
  customerId: number;
  customerName: string;
  loanTypeId: number;
  loanTypeName: string;
  amount: number;
  approvedAmount?: number;
  interestRate: number;
  termMonths: number;
  status: LoanStatus;
  purpose: string;
  monthlyPayment?: number;
  totalAmount?: number;
  outstandingBalance?: number;
  applicationDate: string;
  approvalDate?: string;
  disbursementDate?: string;
  rejectionReason?: string;
  dueDate?: string;
}

export interface LoanType {
  id: number;
  name: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  minTermMonths: number;
  maxTermMonths: number;
  interestRate: number;
  requiresCollateral: boolean;
}

// ── Credit Evaluation Models ────────────────────────────────────────────────

export type EvaluationStatus = 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';
export type Recommendation = 'APPROVE' | 'REJECT' | 'MANUAL_REVIEW';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface EvaluationResponse {
  id: number;
  customerId: number;
  loanId: number;
  automaticScore?: number;
  manualScore?: number;
  finalScore?: number;
  creditScore?: number;
  status: EvaluationStatus;
  recommendation?: Recommendation;
  riskLevel?: RiskLevel;
  comments?: string;
  evaluationDate: string;
  completedDate?: string;
}

export interface ManualEvaluationRequest {
  manualScore: number;
  evaluatorId: string;
  evaluatorName: string;
  comments?: string;
}

// ── Notification Models ────────────────────────────────────────────────────

export type NotificationType =
  | 'LOAN_APPLICATION_RECEIVED'
  | 'LOAN_APPROVED'
  | 'LOAN_REJECTED'
  | 'LOAN_DISBURSED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_REMINDER'
  | 'PAYMENT_OVERDUE'
  | 'EVALUATION_COMPLETED';

export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'RETRY';
export type NotificationChannel = 'EMAIL' | 'SMS' | 'PUSH';

export interface Notification {
  id: number;
  userId: number;
  email?: string;
  phone?: string;
  type: NotificationType;
  channel: NotificationChannel;
  status: NotificationStatus;
  subject?: string;
  content?: string;
  metadata?: Record<string, unknown>;
  errorMessage?: string;
  sentDate?: string;
  createdAt: string;
  retryCount: number;
}