import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  LoanRequest,
  LoanResponse,
  LoanApprovalRequest,
  LoanRejectionRequest,
  LoanStatus,
  LoanType,
} from '../models/loan.models';

@Injectable({ providedIn: 'root' })
export class LoanService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/loans`;
  private readonly loanTypesBase = `${environment.apiUrl}/api/loan-types`;

  // ── Loan CRUD ────────────────────────────────────────────────────────────

  createLoan(request: LoanRequest): Observable<LoanResponse> {
    return this.http.post<LoanResponse>(this.base, request);
  }

  getLoanById(id: number): Observable<LoanResponse> {
    return this.http.get<LoanResponse>(`${this.base}/${id}`);
  }

  getLoansByCustomer(customerId: number): Observable<LoanResponse[]> {
    return this.http.get<LoanResponse[]>(`${this.base}/customer/${customerId}`);
  }

  getAllLoans(): Observable<LoanResponse[]> {
    return this.http.get<LoanResponse[]>(this.base);
  }

  getLoansByStatus(status: LoanStatus): Observable<LoanResponse[]> {
    return this.http.get<LoanResponse[]>(`${this.base}/status/${status}`);
  }

  // ── Loan Actions (ANALISTA/ADMIN) ─────────────────────────────────────

  approveLoan(id: number, request: LoanApprovalRequest): Observable<LoanResponse> {
    return this.http.post<LoanResponse>(`${this.base}/${id}/approve`, request);
  }

  rejectLoan(id: number, request: LoanRejectionRequest): Observable<LoanResponse> {
    return this.http.post<LoanResponse>(`${this.base}/${id}/reject`, request);
  }

  disburseLoan(id: number): Observable<LoanResponse> {
    return this.http.post<LoanResponse>(`${this.base}/${id}/disburse`, {});
  }

  // ── Loan Types ────────────────────────────────────────────────────────

  getLoanTypes(): Observable<LoanType[]> {
    return this.http.get<LoanType[]>(this.loanTypesBase);
  }
}