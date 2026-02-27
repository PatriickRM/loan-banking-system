import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  EvaluationResponse,
  ManualEvaluationRequest,
  EvaluationStatus,
} from '../models/loan.models';

@Injectable({ providedIn: 'root' })
export class EvaluationService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/evaluations`;

  getEvaluationById(id: number): Observable<EvaluationResponse> {
    return this.http.get<EvaluationResponse>(`${this.base}/${id}`);
  }

  getEvaluationByLoanId(loanId: number): Observable<EvaluationResponse> {
    return this.http.get<EvaluationResponse>(`${this.base}/loan/${loanId}`);
  }

  getEvaluationsByStatus(status: EvaluationStatus): Observable<EvaluationResponse[]> {
    return this.http.get<EvaluationResponse[]>(`${this.base}/status/${status}`);
  }

  completeManualEvaluation(
    id: number,
    request: ManualEvaluationRequest
  ): Observable<EvaluationResponse> {
    return this.http.post<EvaluationResponse>(`${this.base}/${id}/complete`, request);
  }
}