import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  PaymentRequest,
  PaymentResponse,
  PaymentScheduleResponse,
} from '../models/payment.models';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/payments`;

  /** POST /api/payments — procesar pago de la próxima cuota pendiente */
  processPayment(request: PaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(this.base, request);
  }

  /** GET /api/payments/{id} */
  getPaymentById(id: number): Observable<PaymentResponse> {
    return this.http.get<PaymentResponse>(`${this.base}/${id}`);
  }

  /** GET /api/payments/loan/{loanId} — historial de pagos de un préstamo */
  getPaymentsByLoan(loanId: number): Observable<PaymentResponse[]> {
    return this.http.get<PaymentResponse[]>(`${this.base}/loan/${loanId}`);
  }

  /** GET /api/payments/schedule/loan/{loanId} — cronograma de cuotas */
  getScheduleByLoan(loanId: number): Observable<PaymentScheduleResponse[]> {
    return this.http.get<PaymentScheduleResponse[]>(`${this.base}/schedule/loan/${loanId}`);
  }

  /** GET /api/payments/schedule/upcoming?daysAhead=N */
  getUpcomingPayments(daysAhead = 7): Observable<PaymentScheduleResponse[]> {
    const params = new HttpParams().set('daysAhead', daysAhead);
    return this.http.get<PaymentScheduleResponse[]>(`${this.base}/schedule/upcoming`, { params });
  }

  /** GET /api/payments/schedule/overdue */
  getOverduePayments(): Observable<PaymentScheduleResponse[]> {
    return this.http.get<PaymentScheduleResponse[]>(`${this.base}/schedule/overdue`);
  }
}